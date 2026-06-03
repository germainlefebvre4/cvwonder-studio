## Context

CVWonder Studio ships six raw Kubernetes manifests in `infra/k8s/` (Deployment, Service, Ingress, ConfigMap, PVC×2, NetworkPolicy). These are functional but require manual parameterization per environment (editing hostnames, image tags, storage sizes, secrets inline). There is no lifecycle management — upgrades, rollbacks, and pre-upgrade hooks (migrations) must be scripted by hand.

The chart is a pure packaging layer: it templatizes the existing manifests, adds optional sub-components (PostgreSQL, Gotenberg), and wires secrets and env vars according to the Prometheus chart formalism. No backend or frontend code changes.

## Goals / Non-Goals

**Goals:**
- Package CVWonder Studio as a standards-compliant Helm v3 chart (v4-forward-compatible)
- Follow Prometheus chart formalism: flat top-level values, `##`-commented, typed schema
- Support `existingSecret` (bring your own) and built-in Secret (chart manages)
- Enable `replicaCount > 1` via RWX PVC defaults and documented StorageClass requirements
- Bundle Gotenberg as an optional cluster-internal component (no Ingress)
- Wire PostgreSQL via Bitnami sub-chart dependency (conditional `DATABASE_URL` composition)
- Provide an opt-in pre-install/pre-upgrade migration Job
- Ship `values.schema.json` for value validation at `helm install` time

**Non-Goals:**
- Replacing the raw `infra/k8s/` manifests (chart is additive, raw manifests remain)
- Adding new application features or changing backend/frontend code
- Providing an official Helm repository (packaging/publishing is out of scope for this change)
- Supporting Helm v2 or Tiller

## Decisions

### D1 — Chart location: `infra/helm/cvwonder-studio/`
**Decision**: Place the chart at `infra/helm/cvwonder-studio/` (not a top-level `charts/`).  
**Rationale**: Keeps all deployment infrastructure co-located under `infra/`. Consistent with the existing `infra/k8s/` convention. A top-level `charts/` suggests this repo IS a chart library, which it is not.  
**Alternative considered**: Top-level `charts/cvwonder-studio/` — rejected because it implies this is a multi-chart monorepo.

### D2 — Flat top-level values (not component-scoped)
**Decision**: Main app values live at the root (`image.repository`, `service.type`). Optional components get their own namespaces (`gotenberg.*`, `postgresql.*`).  
**Rationale**: CVWonder Studio is a single-component app. Nesting everything under `server:` (Prometheus-style) adds indirection without benefit for a single-workload chart. Prometheus uses `server:` because it ships multiple named components (alertmanager, pushgateway) alongside the server.  
**Alternative considered**: `server:` sub-object — rejected; adds unnecessary nesting for a mono-workload chart.

### D3 — Secret management: dual-path (built-in + existingSecret)
**Decision**: The chart templates a Secret from `secrets.*` values when `existingSecret: ""`. When `existingSecret` is set, it references the external Secret and ignores `secrets.*`.  
**Rationale**: `--set secrets.databaseUrl=...` is convenient for GitOps demo/dev. `existingSecret` is required for production (External Secrets Operator, Vault, SOPS). Both patterns are common in operator-managed charts.  
**Implementation**: `_helpers.tpl` defines `cvwonder-studio.secretName` returning either `existingSecret` or `include "cvwonder-studio.fullname" .`. The Deployment always mounts from `secretName`, regardless of which path created it.  
**Secret keys** (fixed, documented in values.yaml):
- `database-url`, `user-token-secret`, `admin-username`, `admin-password-hash`, `admin-token-secret`, `google-client-id`, `google-client-secret`

### D4 — PVC accessModes: ReadWriteMany by default
**Decision**: Both PVCs (`sessions`, `themes`) default to `accessModes: [ReadWriteMany]` with `storageClass` commented out.  
**Rationale**: RWX enables `replicaCount > 1` without values changes. The operator must supply an RWX-capable StorageClass (NFS, CephFS, EFS, etc.) — this is documented prominently. Defaulting to RWO would silently prevent scaling.  
**Risk**: On clusters where the default StorageClass is RWO-only (e.g., standard EKS gp2), PVCs will pend. Mitigated by clear `# storageClass:` comment and NOTES.txt warning.  
**Alternative considered**: Default RWO, document RWX as opt-in — rejected because it makes the default broken for multi-replica.

### D5 — Gotenberg: built-in templates, no sub-chart
**Decision**: Gotenberg is implemented as templates within the chart (`gotenberg-deployment.yaml`, `gotenberg-service.yaml`) rather than an external sub-chart dependency.  
**Rationale**: No official Gotenberg Helm chart exists. An unofficial community chart would add an external dependency with uncertain maintenance. The Gotenberg deployment is simple (one container, one service, no PVC) — templating it directly is ~40 lines.  
**No Ingress for Gotenberg**: It is always cluster-internal. The main app reaches it via `http://{{ include "cvwonder-studio.fullname" . }}-gotenberg:3000`. This URL is auto-set as `GOTENBERG_URL` in the Deployment when `gotenberg.enabled: true`.

### D6 — PostgreSQL: Bitnami sub-chart dependency
**Decision**: `postgresql.enabled: false` by default. When enabled, the chart declares a dependency on `bitnami/postgresql` and auto-composes `DATABASE_URL` from `postgresql.auth.*` values.  
**Rationale**: Bitnami PostgreSQL is the de-facto standard for bundled Postgres in Helm charts (50M+ downloads). Saves operators from managing a separate PG deployment for small/dev installs. Production operators will disable it and supply their own `DATABASE_URL`.  
**URL composition** (in `_helpers.tpl`):
```
{{- if .Values.postgresql.enabled -}}
postgres://{{ .Values.postgresql.auth.username }}:{{ .Values.postgresql.auth.password }}@{{ include "cvwonder-studio.fullname" . }}-postgresql:5432/{{ .Values.postgresql.auth.database }}?sslmode=disable
{{- else -}}
{{ .Values.secrets.databaseUrl }}
{{- end -}}
```

### D7 — Migration Job: Option A (migrate CLI + init container copy)
**Decision**: The migration Job uses an init container from the app image to copy `/app/db/migrations` to a shared `emptyDir`, then the `migrate/migrate` CLI container runs the migrations.  
**Rationale**: The binary has no `--migrate-only` flag — it runs migrations inline at startup. Adding a subcommand would require a backend code change outside this change's scope. Option A achieves the Job pattern without code changes.  
**Defaults**: `migrations.enabled: false`. The app self-migrates on startup (existing behavior). The Job is opt-in for operators who want explicit pre-upgrade control.  
**Hook annotations**: `helm.sh/hook: pre-install,pre-upgrade` + `helm.sh/hook-delete-policy: before-hook-creation,hook-succeeded`.

### D8 — Helm v3/v4 compatibility
**Decision**: Use `apiVersion: v2` in Chart.yaml. No `requirements.yaml`. Dependencies in `Chart.yaml`. No deprecated features.  
**Forward compatibility**: Helm v4 (when released) maintains `apiVersion: v2` backward compat. OCI-first distribution is supported via `helm push` to OCI registries (v3.8+).

### D9 — values.schema.json
**Decision**: Ship a JSON Schema that validates key value constraints at install/upgrade time.  
**Scope**: Enum validation (`strategy.type`, `service.type`, `image.pullPolicy`, `podAntiAffinity`), size patterns (`^[0-9]+[KMGTPE]i$`), port patterns, and mutual exclusivity (`existingSecret` OR `secrets.databaseUrl` non-empty).

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| RWX default breaks on RWO-only clusters | `NOTES.txt` and inline `values.yaml` comment warn about StorageClass requirement |
| Bitnami sub-chart password in values (plaintext) | `⚠️ override in production` comment; `existingSecret` path avoids it |
| Migration Job requires matching migration files in image | Image tag in Job must match Deployment image tag; documented in NOTES.txt |
| `migrate/migrate` CLI version pinning | `migrations.image.tag: "v4"` — operator can override if needed |
| secrets in `values.yaml` leak via `helm get values` | Document use of `existingSecret` for production; `--set` values are also visible |
| Gotenberg resource usage (Chromium-based) | Default `resources: {}` with commented example; operators must size appropriately |

## Migration Plan

This change is purely additive — no existing manifests are removed or breaking-changed.

**Deploy steps:**
1. `helm dep update infra/helm/cvwonder-studio/`
2. `helm install cvwonder-studio infra/helm/cvwonder-studio/ -f my-values.yaml`

**Upgrade from raw manifests:**
1. Remove manually applied raw manifests (`kubectl delete -f infra/k8s/`)
2. Install via Helm (Helm will re-create all resources)

**Rollback:** `helm rollback cvwonder-studio`

**PVC accessModes change** (raw manifests): The `infra/k8s/pvc.yaml` change from RWO → RWX is documented; existing clusters must re-create PVCs to change accessModes (data migration required). This is a manual step for raw-manifest users, not a Helm concern.

## Open Questions

- Should the chart be published to a Helm repository (GitHub Pages OCI, Artifact Hub)? → Deferred to a follow-up change.
- Should a `migrate` subcommand be added to the Go binary to simplify the migration Job? → Tracked as a future improvement; Option A is sufficient for now.

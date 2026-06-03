## Why

Deploying CVWonder Studio to Kubernetes currently requires manually managing six separate raw manifests with no parameterization. A Helm chart packages those manifests with typed, documented values — enabling repeatable, environment-specific deployments, one-command installs, and upgrade lifecycle management (including pre-upgrade migration hooks).

## What Changes

- New `infra/helm/cvwonder-studio/` directory containing a complete Helm v3/v4-compatible chart
- `Chart.yaml` with PostgreSQL sub-chart dependency (Bitnami, optional)
- `values.yaml` following the Prometheus chart formalism (flat top-level, `##`-commented, Prometheus-style sub-objects for optional components)
- `values.schema.json` for compile-time value validation
- All template files: Deployment, Service, Ingress, ConfigMap, Secret, PVCs, ServiceAccount, NetworkPolicy, PodDisruptionBudget, HPA, migration Job, Gotenberg Deployment+Service
- Secret management supports both built-in Secret (from `secrets.*` values) and `existingSecret` reference (user-managed)
- PVC `accessModes` defaults to `ReadWriteMany` to support `replicaCount > 1`; requires an RWX-capable StorageClass
- Gotenberg bundled as an optional cluster-internal component (no Ingress exposed); when enabled, `GOTENBERG_URL` is auto-wired
- PostgreSQL bundled as an optional sub-chart dependency; when enabled, `DATABASE_URL` is auto-composed from sub-chart auth values
- Optional pre-install/pre-upgrade migration Job using the `migrate/migrate` CLI image with migration files copied from the app image via init container
- `Makefile` gains `helm-lint`, `helm-package`, and `helm-template` targets

## Capabilities

### New Capabilities

- `helm-chart`: Helm chart packaging CVWonder Studio for production Kubernetes deployments, covering values schema, templated manifests, optional sub-components (PostgreSQL, Gotenberg), lifecycle hooks (migrations), and upgrade safety

### Modified Capabilities

- `k8s-deployment`: PVC `accessModes` guidance changes from `ReadWriteOnce` (single-replica constraint) to `ReadWriteMany` as the recommended default for multi-replica support; raw manifests in `infra/k8s/` are updated to match

## Impact

- `infra/helm/cvwonder-studio/` — new chart directory (all new files)
- `infra/k8s/pvc.yaml` — `accessModes` updated from `ReadWriteOnce` to `ReadWriteMany`
- `Makefile` — new `helm-*` targets
- No changes to backend Go code, frontend, or database schema
- No breaking changes to existing raw k8s manifests (helm chart is additive)

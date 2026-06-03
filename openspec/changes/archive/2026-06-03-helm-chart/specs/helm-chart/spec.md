## ADDED Requirements

### Requirement: Helm chart is provided at infra/helm/cvwonder-studio/
A Helm v3-compatible chart SHALL be located at `infra/helm/cvwonder-studio/`. The chart SHALL contain:
- `Chart.yaml` with `apiVersion: v2`, a semantic version, and `appVersion` matching the studio image tag
- `values.yaml` following Prometheus chart formalism (flat top-level, `##`-commented, typed)
- `values.schema.json` for value validation at install/upgrade time
- `templates/` with all required Kubernetes resource templates
- A `postgresql` dependency declared in `Chart.yaml` with `condition: postgresql.enabled`

#### Scenario: Chart passes helm lint
- **WHEN** `helm lint infra/helm/cvwonder-studio/` is run
- **THEN** exit code is 0 with no errors

#### Scenario: Chart renders without error with default values
- **WHEN** `helm template cvwonder-studio infra/helm/cvwonder-studio/` is run with default values
- **THEN** exit code is 0 and valid Kubernetes YAML is produced

#### Scenario: Chart renders without error with all features enabled
- **WHEN** `helm template` is run with `postgresql.enabled=true`, `gotenberg.enabled=true`, `migrations.enabled=true`, `ingress.enabled=true`, `podDisruptionBudget.enabled=true`, `autoscaling.enabled=true`
- **THEN** exit code is 0 and all corresponding resources are present in the output

---

### Requirement: values.yaml follows Prometheus chart formalism
The `values.yaml` SHALL be structured with a flat top-level for the main app component and use `##`-prefixed comment blocks before every key or group. All optional flags SHALL have an `enabled:` boolean. Commented-out example values SHALL use `#` (not `##`).

#### Scenario: values.yaml is valid YAML
- **WHEN** `yq . infra/helm/cvwonder-studio/values.yaml` is run
- **THEN** exit code is 0

#### Scenario: Schema validates default values
- **WHEN** `helm install --dry-run` is run with default values
- **THEN** schema validation passes with no errors

---

### Requirement: Secret management supports both built-in and existingSecret
The chart SHALL support two secret management modes:

**Mode A (built-in)**: When `existingSecret: ""`, the chart creates a Secret from `secrets.*` values. The Secret SHALL contain keys: `database-url`, `user-token-secret`, `admin-username`, `admin-password-hash`, `admin-token-secret`, `google-client-id`, `google-client-secret`.

**Mode B (existing)**: When `existingSecret: "<name>"`, the chart references the named Secret and does NOT create its own. The `secrets.*` values are ignored.

In both modes, the Deployment SHALL mount the resolved Secret via `envFrom` or individual `env.valueFrom.secretKeyRef` entries.

#### Scenario: Built-in Secret is created when existingSecret is empty
- **WHEN** `helm template` is run with `existingSecret: ""` and `secrets.databaseUrl: "postgres://..."`
- **THEN** a Secret resource is present in the output containing key `database-url`

#### Scenario: No Secret is created when existingSecret is set
- **WHEN** `helm template` is run with `existingSecret: "my-secret"`
- **THEN** no Secret resource is present in the rendered output
- **AND** the Deployment references `my-secret` via `secretKeyRef`

---

### Requirement: PVCs support ReadWriteMany for horizontal scaling
The chart SHALL create two PVCs (`sessions` and `themes`) with configurable `accessModes`, defaulting to `[ReadWriteMany]`. Each PVC SHALL support:
- `storage.<component>.enabled`: skip PVC creation and use `emptyDir` when false
- `storage.<component>.existingClaim`: reference a pre-existing PVC
- `storage.<component>.size`: configurable storage size
- `storage.<component>.storageClass`: optional StorageClass name (commented out by default)
- `storage.<component>.accessModes`: defaults to `[ReadWriteMany]`

#### Scenario: PVCs are created with ReadWriteMany by default
- **WHEN** `helm template` is run with default values
- **THEN** both PVC resources have `accessModes: [ReadWriteMany]`

#### Scenario: Existing PVCs are referenced without creating new ones
- **WHEN** `storage.sessions.existingClaim: "my-sessions-pvc"` is set
- **THEN** no sessions PVC resource is present in the rendered output
- **AND** the Deployment volume references `my-sessions-pvc`

#### Scenario: emptyDir is used when storage is disabled
- **WHEN** `storage.sessions.enabled: false` is set
- **THEN** no sessions PVC resource is present
- **AND** the Deployment mounts an `emptyDir` volume for sessions

---

### Requirement: Gotenberg is an optional cluster-internal component
When `gotenberg.enabled: true`, the chart SHALL render a Gotenberg Deployment and ClusterIP Service. No Ingress SHALL be created for Gotenberg. The main app Deployment SHALL automatically receive `GOTENBERG_URL` pointing to the internal Gotenberg Service. When `gotenberg.enabled: false` (default), no Gotenberg resources SHALL be created and `GOTENBERG_URL` SHALL NOT be set.

#### Scenario: Gotenberg resources are created when enabled
- **WHEN** `helm template` is run with `gotenberg.enabled: true`
- **THEN** a Gotenberg Deployment and Service are present in the output
- **AND** the main app Deployment contains env var `GOTENBERG_URL` with the internal service URL

#### Scenario: No Gotenberg resources when disabled
- **WHEN** `helm template` is run with `gotenberg.enabled: false`
- **THEN** no Deployment or Service with a name containing "gotenberg" is present
- **AND** `GOTENBERG_URL` is not set in the main app Deployment

---

### Requirement: PostgreSQL sub-chart wires DATABASE_URL automatically
When `postgresql.enabled: true`, the chart SHALL declare a Bitnami PostgreSQL sub-chart dependency and auto-compose the `DATABASE_URL` from `postgresql.auth.*` values. The composed URL SHALL use the format: `postgres://<username>:<password>@<release-name>-postgresql:5432/<database>?sslmode=disable`. When `postgresql.enabled: false`, the `DATABASE_URL` SHALL come from `secrets.databaseUrl` or `existingSecret`.

#### Scenario: DATABASE_URL is auto-composed when postgresql is enabled
- **WHEN** `helm template` is run with `postgresql.enabled: true`, `postgresql.auth.username: user`, `postgresql.auth.password: pass`, `postgresql.auth.database: mydb`
- **THEN** the main app Deployment does not reference `secrets.databaseUrl`
- **AND** `DATABASE_URL` resolves to `postgres://user:pass@<release-name>-postgresql:5432/mydb?sslmode=disable`

---

### Requirement: Migration Job runs as a pre-install/pre-upgrade hook
When `migrations.enabled: true`, the chart SHALL render a Kubernetes Job with:
- Hook annotations: `helm.sh/hook: pre-install,pre-upgrade` and `helm.sh/hook-delete-policy: before-hook-creation,hook-succeeded`
- An init container using the app image that copies `/app/db/migrations` to a shared `emptyDir` volume
- A main container using `migrate/migrate` CLI that runs the copied migrations against the database
- `DATABASE_URL` injected from the resolved Secret
- Configurable `backoffLimit`, `ttlSecondsAfterFinished`, and `resources`

#### Scenario: Migration Job is created when enabled
- **WHEN** `helm template` is run with `migrations.enabled: true`
- **THEN** a Job resource is present with hook annotation `helm.sh/hook: pre-install,pre-upgrade`
- **AND** the Job has both an init container (app image) and a main container (migrate/migrate image)

#### Scenario: No migration Job when disabled
- **WHEN** `helm template` is run with `migrations.enabled: false` (default)
- **THEN** no Job resource is present in the rendered output

---

### Requirement: Ingress is configurable and disabled by default
When `ingress.enabled: true`, the chart SHALL render an Ingress resource. The Ingress SHALL support `ingressClassName`, `annotations`, `hosts`, `path`, `pathType`, and `tls`. When `ingress.enabled: false` (default), no Ingress resource SHALL be rendered.

#### Scenario: Ingress is created when enabled with a host
- **WHEN** `helm template` is run with `ingress.enabled: true` and `ingress.hosts: [studio.example.com]`
- **THEN** an Ingress resource is present with the specified host
- **AND** the backend service matches the chart's Service name

---

### Requirement: Makefile provides helm-* convenience targets
The `Makefile` SHALL provide the following targets:
- `helm-lint`: runs `helm lint` on the chart
- `helm-template`: renders the chart with default values to stdout
- `helm-package`: packages the chart into a `.tgz` archive

#### Scenario: make helm-lint passes with default values
- **WHEN** `make helm-lint` is run
- **THEN** exit code is 0

#### Scenario: make helm-template renders valid YAML
- **WHEN** `make helm-template` is run
- **THEN** exit code is 0 and output is valid YAML

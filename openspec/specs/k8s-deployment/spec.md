## ADDED Requirements

### Requirement: Multi-stage Dockerfile produces a minimal final image
The Dockerfile SHALL use at least three build stages:
1. **frontend-builder**: Node.js image running `pnpm build` to produce `dist/`
2. **backend-builder**: Go image that copies `dist/` into `pkg/embed/dist/` and runs `go build`
3. **final**: Alpine image containing only the studio binary and the cvwonder binary

The final image SHALL NOT contain Node.js, Go toolchain, or build tools. The cvwonder binary SHALL be copied from an official cvwonder image or downloaded at build time (not at container startup).

#### Scenario: Final image contains only runtime binaries
- **WHEN** the final Docker image is inspected
- **THEN** it does not contain `node`, `npm`, `go`, or `gcc` executables

#### Scenario: cvwonder binary is present in final image
- **WHEN** the container starts
- **THEN** `/usr/local/bin/cvwonder --version` exits 0

---

### Requirement: Container runs as a non-root user
The Dockerfile SHALL create a non-root user (UID 10001) and set it as the default user with `USER studio`. The K8s `securityContext` SHALL enforce `runAsNonRoot: true` and `runAsUser: 10001`.

#### Scenario: Container process is not root
- **WHEN** the container is running
- **THEN** `whoami` inside the container returns a non-root user

---

### Requirement: Kubernetes Deployment manifest is provided
The `infra/k8s/` directory SHALL contain a `deployment.yaml` for the studio workload with:
- `replicas: 1` (documented as single-replica constraint due to RWO PVC)
- `securityContext`: `runAsNonRoot: true`, `allowPrivilegeEscalation: false`, `capabilities.drop: ["ALL"]`
- Resource limits: CPU `500m`, memory `512Mi`; requests: CPU `100m`, memory `128Mi`
- Liveness probe: `GET /health/live`, initial delay 5s, period 10s
- Readiness probe: `GET /health/ready`, initial delay 5s, period 10s

#### Scenario: Deployment is valid YAML
- **WHEN** `kubectl apply --dry-run=client -f infra/k8s/deployment.yaml` is run
- **THEN** exit code is 0

#### Scenario: Liveness probe is configured
- **WHEN** the deployment is applied to a cluster
- **THEN** the pod has a liveness probe pointing to `/health/live`

---

### Requirement: PersistentVolumeClaims are defined for sessions and themes
The `infra/k8s/` directory SHALL contain a single `pvc.yaml` defining two PersistentVolumeClaims: `cvwonder-sessions-pvc` and `cvwonder-themes-pvc`. Both SHALL use `accessModes: [ReadWriteMany]` (changed from `ReadWriteOnce`) to support multi-replica deployments. Storage sizes SHALL remain configurable (default: 5Gi for sessions, 2Gi for themes). The Deployment SHALL mount:
- `cvwonder-sessions-pvc` at `/data/sessions/` (where generated CVs are stored)
- `cvwonder-themes-pvc` at `/data/themes/` (where runtime-installed themes are stored)
- `/app/themes/` SHALL remain read-only (bundled themes from image layer)

A prominent comment in `pvc.yaml` SHALL note that `ReadWriteMany` requires an RWX-capable StorageClass (e.g., NFS, CephFS, AWS EFS, Azure Files).

#### Scenario: Sessions are persisted across pod restarts
- **WHEN** the pod is restarted and the PVC is intact
- **THEN** previously generated session files at `/data/sessions/` are accessible

#### Scenario: PVCs use ReadWriteMany access mode
- **WHEN** `kubectl apply --dry-run=client -f infra/k8s/pvc.yaml` is run
- **THEN** exit code is 0 and both PVCs have `accessModes: [ReadWriteMany]`

#### Scenario: Multiple replicas can mount the same PVC
- **WHEN** `replicaCount` is set to 2 and an RWX StorageClass is configured
- **THEN** both pods mount the sessions and themes PVCs without errors

---

### Requirement: NetworkPolicy restricts external egress
A `NetworkPolicy` manifest SHALL be provided that:
- Allows ingress only from the ingress controller namespace
- Allows egress to PostgreSQL (port 5432)
- Allows egress to DNS (port 53 UDP/TCP)
- Allows egress to GitHub (port 443) only for runtime theme installation
- Denies all other egress by default

#### Scenario: NetworkPolicy is applied without breaking health probes
- **WHEN** the NetworkPolicy is applied
- **THEN** the Kubelet can still reach `/health/live` and `/health/ready`

---

### Requirement: docker-compose supports local development
A `docker-compose.yml` at the repo root SHALL define three services:
- `postgres`: `postgres:16-alpine`, with a named volume, seeded with the DB schema
- `backend`: Go binary (or `air` hot-reload), port `8080`, mounts source for development
- `frontend`: Vite dev server on port `5173`, proxying `/api/*` to `backend:8080`

A developer SHALL be able to run `docker-compose up` and have a fully functional local studio at `http://localhost:5173` within 60 seconds.

#### Scenario: Local dev stack starts cleanly
- **WHEN** `docker-compose up` is run from a clean checkout
- **THEN** all three services start and the studio is reachable at `http://localhost:5173`

#### Scenario: Go code changes are hot-reloaded
- **WHEN** a Go source file is modified
- **THEN** `air` recompiles and restarts the backend within 5 seconds without requiring manual intervention

---

### Requirement: Session file path is configurable via environment
The base path for session files SHALL be configurable via `SESSIONS_BASE_DIR` (default: `/data/sessions/` in K8s, `./sessions/` for local dev). The base path for runtime themes SHALL be configurable via `THEMES_RUNTIME_DIR` (default: `/data/themes/` in K8s, `./themes-runtime/` for local dev).

#### Scenario: Local dev uses relative paths
- **WHEN** `SESSIONS_BASE_DIR` is not set
- **THEN** session files are written to `./sessions/` relative to the working directory

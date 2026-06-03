## MODIFIED Requirements

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

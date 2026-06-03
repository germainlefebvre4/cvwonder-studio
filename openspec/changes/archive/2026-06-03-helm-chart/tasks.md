## 1. Chart scaffold

- [x] 1.1 Create `infra/helm/cvwonder-studio/` directory structure
- [x] 1.2 Create `Chart.yaml` with apiVersion v2, version, appVersion, and postgresql dependency
- [x] 1.3 Create `values.yaml` following Prometheus formalism (flat top-level, ##-commented)
- [x] 1.4 Create `values.schema.json` with type/enum/pattern validations
- [x] 1.5 Create `templates/NOTES.txt` with post-install instructions and RWX warning
- [x] 1.6 Create `templates/_helpers.tpl` with fullname, labels, selectorLabels, secretName, databaseUrl, and gotenbergUrl helpers

## 2. Core templates

- [x] 2.1 Create `templates/serviceaccount.yaml`
- [x] 2.2 Create `templates/configmap.yaml` (env vars from `config.*`)
- [x] 2.3 Create `templates/secret.yaml` (rendered only when `existingSecret` is empty)
- [x] 2.4 Create `templates/pvc-sessions.yaml` (with existingClaim and emptyDir support)
- [x] 2.5 Create `templates/pvc-themes.yaml` (with existingClaim and emptyDir support)
- [x] 2.6 Create `templates/deployment.yaml` (main app with all env wiring, probes, security contexts, extra* support)
- [x] 2.7 Create `templates/service.yaml`

## 3. Optional resource templates

- [x] 3.1 Create `templates/ingress.yaml` (rendered only when `ingress.enabled`)
- [x] 3.2 Create `templates/networkpolicy.yaml` (rendered only when `networkPolicy.enabled`)
- [x] 3.3 Create `templates/pdb.yaml` (rendered only when `podDisruptionBudget.enabled`)
- [x] 3.4 Create `templates/hpa.yaml` (rendered only when `autoscaling.enabled`)
- [x] 3.5 Create `templates/migrate-job.yaml` (hook Job, rendered only when `migrations.enabled`)
- [x] 3.6 Create `templates/gotenberg-deployment.yaml` (rendered only when `gotenberg.enabled`)
- [x] 3.7 Create `templates/gotenberg-service.yaml` (rendered only when `gotenberg.enabled`)

## 4. Raw manifest update

- [x] 4.1 Update `infra/k8s/pvc.yaml` to use `accessModes: [ReadWriteMany]` with RWX storage class comment

## 5. Makefile targets

- [x] 5.1 Add `helm-lint`, `helm-template`, and `helm-package` targets to `Makefile`

## 6. Validation

- [x] 6.1 Run `helm lint infra/helm/cvwonder-studio/` and fix any errors
- [x] 6.2 Run `helm template cvwonder-studio infra/helm/cvwonder-studio/` with default values and verify output
- [x] 6.3 Run `helm template` with all optional features enabled and verify all expected resources are rendered

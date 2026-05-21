## ADDED Requirements

### Requirement: Gotenberg Kubernetes Deployment
The system SHALL provide a Kubernetes `Deployment` manifest for Gotenberg at `infra/k8s/gotenberg.yaml` using the official `gotenberg/gotenberg:8` image. The Deployment SHALL run as non-root, with `readOnlyRootFilesystem: false` (required by Chromium), and SHALL have resource requests and limits defined.

#### Scenario: Gotenberg pod starts successfully
- **WHEN** the Gotenberg Deployment is applied to a cluster
- **THEN** pods SHALL reach `Running` state and pass the readiness probe at `/health`

#### Scenario: Gotenberg scales independently
- **WHEN** a HorizontalPodAutoscaler targets the Gotenberg Deployment on CPU utilization
- **THEN** the number of Gotenberg replicas SHALL scale independently of the studio Deployment

---

### Requirement: Gotenberg ClusterIP Service
The system SHALL provide a Kubernetes `Service` of type `ClusterIP` for Gotenberg, exposing port `3000`, resolvable within the cluster at `gotenberg.<namespace>.svc.cluster.local` (or `gotenberg` within the same namespace).

#### Scenario: Studio pod reaches Gotenberg via ClusterIP
- **WHEN** the studio pod sends an HTTP request to `http://gotenberg:3000`
- **THEN** the request SHALL be routed to a healthy Gotenberg pod

---

### Requirement: NetworkPolicy restricting Gotenberg ingress
The system SHALL provide a Kubernetes `NetworkPolicy` that allows ingress to Gotenberg pods exclusively from pods with the label `app: cvwonder-studio`. All other ingress to Gotenberg SHALL be denied by default.

#### Scenario: Studio pod can reach Gotenberg
- **WHEN** a pod labelled `app: cvwonder-studio` sends a request to Gotenberg on port 3000
- **THEN** the connection SHALL be permitted by the NetworkPolicy

#### Scenario: Unauthorized pod cannot reach Gotenberg
- **WHEN** a pod without the `app: cvwonder-studio` label attempts to connect to Gotenberg on port 3000
- **THEN** the connection SHALL be denied by the NetworkPolicy

---

### Requirement: Gotenberg in local dev docker-compose
The system SHALL include an optional `gotenberg` service in the local development `docker-compose.dev.yml` file, commented with instructions for enabling PDF export. The service SHALL expose Gotenberg on host port `3001` (to avoid conflict with the studio on port `3000` or Vite on `5173`).

#### Scenario: Developer opts in to PDF support
- **WHEN** a developer runs `docker compose -f docker-compose.dev.yml up gotenberg -d` and sets `GOTENBERG_URL=http://localhost:3001` in `.env.local`
- **THEN** the local backend SHALL use GotenbergClient and PDF export SHALL work end-to-end

#### Scenario: Developer does not run Gotenberg
- **WHEN** `GOTENBERG_URL` is absent from `.env.local`
- **THEN** the studio SHALL start normally with PDF export disabled (501); no errors SHALL appear in logs at startup

---

### Requirement: GOTENBERG_URL documentation
The system SHALL document `GOTENBERG_URL` in `.env.local.example` and in the deployment configuration reference. The documentation SHALL explain that PDF export is disabled when the variable is unset.

#### Scenario: New developer sets up local environment
- **WHEN** a developer copies `.env.local.example` to `.env.local`
- **THEN** the example file SHALL contain a commented-out `GOTENBERG_URL` line with a description and the local dev value `http://localhost:3001`

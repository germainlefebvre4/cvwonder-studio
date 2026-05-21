## Why

The current PDF export relies on the `cvwonder` binary starting a headless browser on a local port (`CVWONDER_PDF_GENERATION_PORT`), which is disabled in all environments by default because it is incompatible with Kubernetes: the binary is downloaded at boot from GitHub (fragile, slow), session files are pod-local (breaks multi-replica), and running Chromium inside Alpine conflicts with K8s `readOnlyRootFilesystem` and non-root security contexts. The `migrate-to-react-gin-stack` change explicitly deferred PDF export as a separate plan — this is that plan.

## What Changes

- Add Gotenberg (official Docker image) as a dedicated K8s Service for HTML → PDF conversion
- Add `ports.PDFRenderer` interface to the Go backend with a Gotenberg HTTP adapter
- Add a Null Object `DisabledRenderer` for when `GOTENBERG_URL` is not set (PDF gracefully unavailable, 501)
- Add `/api/v1/sessions/:id/export/pdf` endpoint to the Gin server that chains HTML generation → Gotenberg rendering → stream PDF bytes to client
- **BREAKING** Replace `CVWONDER_PDF_GENERATION_PORT` and `CVWONDER_PDF_GENERATION_ENABLED` with a single `GOTENBERG_URL` env var (presence = enabled)
- Add Gotenberg as an optional service in the local dev docker-compose (no config needed, starts in seconds)
- Add Gotenberg Kubernetes manifests: Deployment, ClusterIP Service, NetworkPolicy (studio → gotenberg only)

## Capabilities

### New Capabilities

- `pdf-renderer`: `ports.PDFRenderer` interface + `adapters/gotenberg/client.go` (HTTP push of HTML to Gotenberg `/forms/chromium/convert/html`) + `adapters/pdf/disabled.go` Null Object; injected at startup based on `GOTENBERG_URL`
- `pdf-export-api`: Gin endpoint `POST /api/v1/sessions/:id/export/pdf`; orchestrates HTML generation via existing `ports.Generator` then delegates to `ports.PDFRenderer`; streams PDF bytes with `Content-Disposition: attachment`
- `gotenberg-infra`: Gotenberg Kubernetes Deployment + ClusterIP Service + NetworkPolicy; Gotenberg optional entry in docker-compose.dev.yml; `GOTENBERG_URL` configuration documentation

### Modified Capabilities

<!-- No existing specs to modify -->

## Impact

- **Removes**: `CVWONDER_PDF_GENERATION_PORT`, `CVWONDER_PDF_GENERATION_ENABLED` env vars and all related code
- **Adds**: `GOTENBERG_URL` env var; `backend/internal/ports/pdf.go`; `backend/internal/adapters/gotenberg/`; `backend/internal/adapters/pdf/disabled.go`
- **Adds**: `infra/k8s/gotenberg.yaml`; Gotenberg entry in `docker-compose.dev.yml`; `.env.local` example update
- **Depends on**: `migrate-to-react-gin-stack` (Go/Gin backend, `ports.Generator` interface, K8s infra scaffolding)
- **Evolution path**: Gotenberg adapter implements `ports.PDFRenderer`; when cvwonder exposes Go packages, the `ports.Generator` adapter can embed chromedp directly if desired — Gotenberg remains independently scalable regardless

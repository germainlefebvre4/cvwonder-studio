## Context

cvwonder-studio currently generates PDFs by invoking the `cvwonder` binary with a `--port` flag, which makes the binary start a local HTTP server and drive a headless browser to render HTML and print to PDF. This works in a single-container Docker setup but fails in Kubernetes for multiple reasons: the binary is downloaded from GitHub at boot (violates immutable infrastructure), Chromium running in Alpine requires root-writable paths that conflict with `readOnlyRootFilesystem`, and session files written per-pod break multi-replica deployments.

This design is implemented on top of the `migrate-to-react-gin-stack` change, which establishes the Go (Gin) backend, `ports.Generator` interface, hexagonal adapter pattern, and K8s manifests scaffolding.

## Goals / Non-Goals

**Goals:**
- Enable PDF export that works correctly in Kubernetes with multiple replicas
- Isolate Chromium/headless browser concerns into a dedicated, officially maintained service (Gotenberg)
- Provide a clean Go port interface so the PDF renderer is swappable without touching business logic
- Make PDF optional in local dev: one docker-compose service opt-in, one env var
- Keep the generate-and-stream flow atomic (no persisted PDF files between request and response)

**Non-Goals:**
- Async PDF generation (fire-and-forget, poll for result) — the synchronous stream-back model is sufficient
- PDF storage / download links — PDF is generated and streamed per-request
- Custom PDF paper format configuration per-user — A4 default, configurable via env var if needed later
- Admin UI for PDF settings (separate plan)
- Replacing Gotenberg with chromedp embedded in Go (possible future phase, not in scope here)

## Decisions

### D1 — Gotenberg as a separate K8s Deployment (not sidecar)

**Decision**: Deploy Gotenberg as a standalone Kubernetes `Deployment` + `ClusterIP` `Service`, not as a sidecar container in the studio pod.

**Rationale**: Gotenberg is CPU-heavy during rendering. As a separate Deployment it scales independently (HPA on CPU). A single pool of Gotenberg replicas serves all studio pods, avoiding one Gotenberg instance per studio pod (wastes resources). Networking within the cluster (ClusterIP) is low-latency and sufficient.

**Alternative considered**: Sidecar per pod — simpler networking (localhost), but tightly couples lifecycle and wastes resources when studio pods scale horizontally.

### D2 — Push HTML to Gotenberg (not URL)

**Decision**: The backend generates HTML in memory, then POSTs it directly to Gotenberg's `/forms/chromium/convert/html` endpoint as a `multipart/form-data` upload (`index.html` part).

```
Studio pod:
  1. cvwonder (binary/library) → HTML bytes (in memory)
  2. POST http://gotenberg:3000/forms/chromium/convert/html
     Content-Type: multipart/form-data
     index.html: <html>…</html>
  3. ← PDF bytes
  4. Stream PDF to HTTP client
```

**Rationale**: The HTML is already in memory after the generator step. Pushing it avoids any need for Gotenberg to reach back to the studio service, eliminating bidirectional network dependency and simplifying NetworkPolicy (studio → gotenberg only, not bidirectional).

**Alternative considered**: Give Gotenberg a URL to fetch — requires studio to be reachable from Gotenberg, complicates NetworkPolicy, and adds a round-trip.

### D3 — `ports.PDFRenderer` interface + Null Object for disabled state

**Decision**: Define a `PDFRenderer` port interface. Wire a `GotenbergClient` adapter when `GOTENBERG_URL` is set, or a `DisabledRenderer` Null Object when it is not.

```go
// backend/internal/ports/pdf.go
type PDFRenderer interface {
    RenderPDF(ctx context.Context, html []byte) ([]byte, error)
}

// adapters/gotenberg/client.go  → implements PDFRenderer (HTTP POST)
// adapters/pdf/disabled.go      → implements PDFRenderer (returns ErrPDFDisabled)
```

Business logic and Gin handlers receive a `PDFRenderer` via dependency injection. No nil checks anywhere. The `DisabledRenderer` causes the export endpoint to return `501 Not Implemented` with a descriptive body.

**Alternative considered**: nil check in handler + `CVWONDER_PDF_GENERATION_ENABLED` bool flag — leads to nil pointer risk and scattered conditional logic.

### D4 — `GOTENBERG_URL` as the single configuration point

**Decision**: A single `GOTENBERG_URL` environment variable (e.g., `http://gotenberg:3000`) controls both the endpoint address and whether PDF is enabled. Unset = disabled.

**Rationale**: Collapses two env vars (`CVWONDER_PDF_GENERATION_PORT` + `CVWONDER_PDF_GENERATION_ENABLED`) into one. The URL is the source of truth. Presence implies enablement — consistent with how databases and external services are typically configured in 12-factor apps.

**Alternative considered**: Keep `CVWONDER_PDF_GENERATION_ENABLED` bool alongside a URL — redundant, prone to misconfiguration (enabled but no URL, or URL set but disabled).

### D5 — emptyDir for session temp files (no shared volume needed)

**Decision**: The PDF export flow is atomic: write `cv.yml` to a pod-local temp path → generate HTML → push to Gotenberg → stream PDF → done. No file persists beyond the request lifetime. `emptyDir` per pod is sufficient.

**Rationale**: The current code already returns the file in the same HTTP response (atomic). There is no separate "download" step. Multi-pod routing does not create stale-file issues because nothing is stored between requests.

**Alternative considered**: S3/Minio for generated files — unnecessary complexity; the atomic generate-and-stream pattern eliminates the need.

### D6 — NetworkPolicy: unidirectional studio → gotenberg

**Decision**: A `NetworkPolicy` restricts Gotenberg's ingress to only pods with the `app: cvwonder-studio` label. Gotenberg is not exposed via Ingress and has no egress to the internet by default (configurable via Gotenberg env var `CHROMIUM_ALLOW_LIST` if themes include external resources).

**Rationale**: Defense-in-depth. Gotenberg's Chromium instance could be misused if accessible without restriction. ClusterIP alone is insufficient; NetworkPolicy provides explicit allow-list semantics.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Gotenberg is a single point of failure | Deploy with ≥2 replicas + HPA; add readiness probe on `/health`; studio returns 503 on Gotenberg timeout with clear error |
| Gotenberg request timeout for large/complex CVs | Configure `GOTENBERG_URL` with context deadline (30s default); expose `PDF_RENDER_TIMEOUT` env var |
| Chromium in Gotenberg fetches external resources from theme HTML | Use Gotenberg's `CHROMIUM_ALLOW_LIST` env var to allowlist only theme asset domains; push-HTML approach means Gotenberg does not fetch the studio URL |
| `index.html` pushed to Gotenberg may reference relative CSS/JS paths | Studio inlines critical CSS or uses absolute URLs in generated HTML; themes must use self-contained HTML (already required by cvwonder template constraints) |
| emptyDir lost on pod restart mid-request | Request is synchronous; pod restart terminates the in-flight HTTP connection; client retries; no data loss |
| Migration: existing `CVWONDER_PDF_GENERATION_*` vars in deployed configs | Document deprecation; `CVWONDER_PDF_GENERATION_ENABLED: false` (current default) maps cleanly to `GOTENBERG_URL` unset; no behavior change for existing deployments that had PDF disabled |

## Migration Plan

1. Remove `CVWONDER_PDF_GENERATION_PORT` and `CVWONDER_PDF_GENERATION_ENABLED` handling from `lib/environment.ts` (Next.js, already replaced by Go backend)
2. Implement `ports.PDFRenderer` + `adapters/gotenberg/client.go` + `adapters/pdf/disabled.go` in Go backend
3. Add `/api/v1/sessions/:id/export/pdf` Gin route; wire via dependency injection in `main.go`
4. Add Gotenberg to `docker-compose.dev.yml` as an optional service with a comment
5. Add `infra/k8s/gotenberg.yaml` (Deployment + Service + NetworkPolicy)
6. Update `.env.local.example` with `GOTENBERG_URL` documentation
7. Validate end-to-end: local dev with Gotenberg running → PDF download works; without Gotenberg → 501 returned

**Rollback**: Remove `GOTENBERG_URL` from K8s ConfigMap/Secret → `DisabledRenderer` takes over → PDF export returns 501; Gotenberg Deployment can be scaled to 0 without affecting studio availability.

## Open Questions

- Should themes that reference external CSS/fonts be supported? If yes, Gotenberg's `CHROMIUM_ALLOW_LIST` needs to be configured per-deployment. Default: allowlist empty (local assets only).
- Should PDF paper format (A4 vs Letter) be configurable per-session or only globally via env var? Decision deferred to spec.

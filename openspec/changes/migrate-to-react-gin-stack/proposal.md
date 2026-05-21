## Why

The current cvwonder-studio is a Next.js monolith that invokes the `cvwonder` binary via subprocess. This architecture couples the frontend runtime (Node.js) with backend concerns, making it hard to harden for Kubernetes, scale independently, or eventually embed cvwonder as a native Go library. Moving to a Go (Gin) backend + React (Vite) SPA eliminates the Node.js server in production, enables a single-binary deployment, and establishes the adapter boundary needed to swap binary exec for direct Go package calls when cvwonder exposes public packages.

## What Changes

- **BREAKING** Replace Next.js with a Go (Gin) HTTP server as the sole server process
- **BREAKING** Replace Next.js pages with a Vite + React SPA, compiled and embedded in the Go binary via `go:embed`
- **BREAKING** Replace Prisma ORM with sqlc + pgx/v5 for database access
- Replace subprocess binary invocation with a structured `ports.Generator` interface backed by a `binary.go` adapter (future: `library.go` when cvwonder exposes `pkg/`)
- Replace shadcn/ui component wrappers with Radix UI primitives directly, using Radix Colors CSS variables (blue/navy palette matching current design)
- Replace Monaco Editor with CodeMirror 6 for the YAML editor
- Bundle default themes in the Docker image; maintain ability to install additional themes at runtime onto a PVC
- Ship the `cvwonder` binary inside the Docker image (no runtime download)
- Provide `docker-compose.yml` for local development (postgres + Go backend with hot-reload + Vite dev server)
- Provide Kubernetes manifests (Deployment, Service, Ingress, PVC, NetworkPolicy, SecurityContext)
- PDF export and Admin UI are **explicitly out of scope** — separate plans

## Capabilities

### New Capabilities

- `go-api-server`: Go (Gin) HTTP server exposing `/api/v1/*` routes for sessions, themes, generation, validation, and static preview serving; also serves the embedded SPA as a catch-all
- `react-spa`: Vite + React SPA with Radix UI primitives, Radix Colors (blue/navy), CodeMirror YAML editor, Zustand state, matching the current editor + landing page layout
- `cvwonder-adapter`: `ports.Generator` interface + `adapters/cvwonder/binary.go` implementation (exec cvwonder binary); architecture explicitly designed for a future `library.go` adapter when cvwonder exposes `pkg/`
- `theme-registry`: Docker image bundles default themes at build time; additional themes can be installed at runtime via GitHub URL onto a mounted PVC; DB tracks builtin vs runtime themes
- `k8s-deployment`: Multi-stage Dockerfile (frontend build → Go build → final alpine), Kubernetes manifests with SecurityContext (non-root, readOnlyRootFilesystem where feasible), PVC for sessions and themes, NetworkPolicy

### Modified Capabilities

<!-- No existing specs -->

## Impact

- **Removes**: `app/`, `components/`, `hooks/`, `lib/`, `prisma/`, `next.config.js`, `tailwind.config.ts`, `components.json`, `next-env.d.ts`, `postcss.config.js`, all Next.js API routes
- **New**: `backend/` (Go), `frontend/` (Vite+React), `infra/` (K8s + Dockerfile)
- **Database schema**: Preserved with minor adjustments (UUIDv7 sessions, token-hash auth, builtin theme flag)
- **API contract**: `/api/v1/*` (versioned, compatible with studio-03 contract); preview at `/preview/:token/*`
- **Dependencies removed**: `next`, `@prisma/client`, `@monaco-editor/react`, `monaco-yaml`, all shadcn/ui components
- **Dependencies added**: `gin-gonic/gin`, `pgx/v5`, `sqlc`, `@radix-ui/*`, `@uiw/react-codemirror`, `zustand`, `vite`

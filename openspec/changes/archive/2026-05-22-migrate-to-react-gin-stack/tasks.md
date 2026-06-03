## 1. Repo Scaffold & Tooling

- [x] 1.1 Create `backend/`, `frontend/`, `infra/k8s/` directory structure in the new repo
- [x] 1.2 Initialize Go module `github.com/germainlefebvre4/cvwonder-studio` in `backend/` (`go mod init`)
- [x] 1.3 Add Go dependencies: `gin-gonic/gin`, `pgx/v5`, `sqlc`, `golang.org/x/crypto`, `google/uuid`
- [x] 1.4 Initialize Vite + React + TypeScript project in `frontend/` (`pnpm create vite`)
- [x] 1.5 Add frontend dependencies: `@radix-ui/colors`, `@radix-ui/react-dialog`, `@radix-ui/react-select`, `@radix-ui/react-tooltip`, `@radix-ui/react-slot`, `@radix-ui/react-separator`, `zustand`, `@uiw/react-codemirror`, `@codemirror/lang-yaml`, `ajv`, `react-resizable-panels`, `clsx`, `tailwind-merge`
- [x] 1.6 Configure Tailwind v4 in `frontend/` with `@theme {}` semantic tokens (blue/slate Radix Colors)
- [x] 1.7 Configure Vite proxy (`/api`, `/preview` → `http://localhost:8080`) in `vite.config.ts`
- [x] 1.8 Set up `air` hot-reload config (`backend/.air.toml`) for Go development
- [x] 1.9 Create root `Makefile` with targets: `dev`, `build-frontend`, `build-backend`, `build`, `sqlc-gen`, `migrate`, `lint`

## 2. Database Schema & sqlc

- [x] 2.1 Write SQL migrations in `backend/db/migrations/` for `sessions` table (id UUID, token_hash, yaml_content, theme_id, expires_at, created_at, updated_at)
- [x] 2.2 Write SQL migration for `themes` table (id UUID, name, slug UNIQUE, github_url, local_path, is_builtin BOOL, deleted_at)
- [x] 2.3 Write SQL migration for `system_config` table (key, value)
- [x] 2.4 Write sqlc queries in `backend/db/queries/sessions.sql`: insert, get-by-token-hash, update, delete, delete-expired
- [x] 2.5 Write sqlc queries in `backend/db/queries/themes.sql`: upsert, list-active, get-by-slug, get-by-id
- [x] 2.6 Write sqlc queries in `backend/db/queries/config.sql`: get-by-key, upsert
- [x] 2.7 Configure `backend/sqlc.yaml` and run `sqlc generate` to produce typed Go code in `backend/db/`
- [x] 2.8 Write database migration runner in `backend/internal/adapters/repository/migrate.go` using `golang-migrate` or raw SQL execution

## 3. Go Backend — Domain & Ports

- [x] 3.1 Define `backend/internal/domain/session.go`: `Session` struct, `Token` type, `IsExpired()` method
- [x] 3.2 Define `backend/internal/domain/theme.go`: `Theme` struct with `IsBuiltin bool`, `LocalPath string`
- [x] 3.3 Define `backend/internal/domain/generation.go`: `GenerationResult`, `ValidationError` structs
- [x] 3.4 Define `backend/internal/ports/generator.go`: `Generator` interface (`GenerateHTML`, `Validate`)
- [x] 3.5 Define `backend/internal/ports/repository.go`: `SessionRepository`, `ThemeRepository`, `ConfigRepository` interfaces
- [x] 3.6 Define `backend/internal/config/config.go`: load env vars (`PORT`, `DATABASE_URL`, `CVWONDER_BINARY_PATH`, `SESSIONS_BASE_DIR`, `THEMES_RUNTIME_DIR`, `THEMES_BUILTIN_DIR`)

## 4. Go Backend — Repository Adapters

- [x] 4.1 Implement `backend/internal/adapters/repository/session.go` using sqlc-generated code + pgx/v5
- [x] 4.2 Implement `backend/internal/adapters/repository/theme.go` using sqlc-generated code
- [x] 4.3 Implement `backend/internal/adapters/repository/config.go` using sqlc-generated code
- [x] 4.4 Write pgx connection pool initialization with health-check in `backend/internal/adapters/repository/db.go`

## 5. Go Backend — cvwonder Adapter

- [x] 5.1 Implement `backend/internal/adapters/cvwonder/binary.go`: `BinaryAdapter` struct implementing `ports.Generator`
- [x] 5.2 Implement `GenerateHTML`: write YAML to temp file, exec `cvwonder generate --input --theme --format=html --output`, clean up temp file
- [x] 5.3 Implement `Validate`: write YAML to temp file, exec `cvwonder validate --input --output=json`, parse JSON into `[]domain.ValidationError`
- [x] 5.4 Add context cancellation: use `exec.CommandContext` and kill subprocess on ctx cancellation
- [x] 5.5 Add `CVWONDER_BINARY_PATH` env config to adapter (default `/usr/local/bin/cvwonder`)
- [x] 5.6 Create `backend/internal/adapters/cvwonder/library.go.future` stub documenting the intended Go package import paths for the future library adapter

## 6. Go Backend — Usecases

- [x] 6.1 Implement `backend/internal/usecases/session/create.go`: generate token (32 bytes), SHA-256 hash, set expiry from config, persist
- [x] 6.2 Implement `backend/internal/usecases/session/get.go`: lookup by token hash, delete-if-expired, return or 404
- [x] 6.3 Implement `backend/internal/usecases/session/update.go`: validate theme exists, update yaml_content and/or theme_id
- [x] 6.4 Implement `backend/internal/usecases/preview/generate.go`: resolve theme local_path, call `Generator.GenerateHTML`, return preview URL
- [x] 6.5 Implement `backend/internal/usecases/validation/validate.go`: call `Generator.Validate`, return results
- [x] 6.6 Implement `backend/internal/usecases/theme/list.go`: list active themes from repo
- [x] 6.7 Implement `backend/internal/usecases/theme/sync_builtin.go`: upsert bundled themes to DB at startup from `THEMES_BUILTIN_DIR`

## 7. Go Backend — Gin HTTP Handlers & Router

- [x] 7.1 Create `backend/cmd/api/main.go`: wire repositories → adapters → usecases → handlers → Gin router; run DB migrations; sync builtin themes; start server
- [x] 7.2 Implement Gin middleware: `RequestID`, `RateLimiter` (100 req/min/IP using token bucket), structured `slog` logger
- [x] 7.3 Implement `backend/internal/adapters/http/session.go`: handlers for `POST /api/v1/sessions`, `GET /api/v1/sessions/:token`, `PATCH /api/v1/sessions/:token`
- [x] 7.4 Implement `backend/internal/adapters/http/generation.go`: handlers for `POST /api/v1/sessions/:token/preview`, `POST /api/v1/sessions/:token/validate`
- [x] 7.5 Implement `backend/internal/adapters/http/theme.go`: handler for `GET /api/v1/themes`
- [x] 7.6 Implement `backend/internal/adapters/http/preview.go`: static file serving at `GET /preview/:token/*filepath` with path-traversal protection
- [x] 7.7 Implement `backend/internal/adapters/http/health.go`: `GET /health/live`, `GET /health/ready` (DB ping)
- [x] 7.8 Implement SPA catch-all: embed `frontend/dist/` via `go:embed`, serve `index.html` for all unmatched GET routes
- [x] 7.9 Add graceful shutdown (SIGINT/SIGTERM → drain connections with 30s timeout)

## 8. Theme Registry Setup

- [x] 8.1 Copy default theme files into `infra/themes/` (basic, default) to be bundled at Docker build time
- [x] 8.2 Update `sync_builtin.go` to enumerate `THEMES_BUILTIN_DIR` directory and upsert each into DB with `is_builtin=true`
- [x] 8.3 Verify theme `local_path` exists before generation; return HTTP 422 with clear message if missing

## 9. Frontend — Design System & Components

- [x] 9.1 Create `frontend/src/app/globals.css`: import Radix Colors (blue, blue-dark, slate, slate-dark, red, red-dark, green, green-dark) and define semantic `@theme {}` tokens
- [x] 9.2 Implement `frontend/src/components/ui/Button.tsx`: Radix `Slot` + variants (primary, secondary, ghost, danger) using Radix Colors tokens
- [x] 9.3 Implement `frontend/src/components/ui/Dialog.tsx`: `@radix-ui/react-dialog` with overlay + content animations via `data-[state]` selectors
- [x] 9.4 Implement `frontend/src/components/ui/Select.tsx`: `@radix-ui/react-select` with blue/slate styling
- [x] 9.5 Implement `frontend/src/components/ui/Tooltip.tsx`: `@radix-ui/react-tooltip` provider + content
- [x] 9.6 Implement `frontend/src/components/ui/Separator.tsx`: `@radix-ui/react-separator`
- [x] 9.7 Implement `cn()` utility (`clsx` + `tailwind-merge`) in `frontend/src/lib/utils.ts`

## 10. Frontend — Zustand Store & API Services

- [x] 10.1 Implement `frontend/src/store/studio.ts`: Zustand store with `yamlContent`, `selectedThemeId`, `validationErrors`, `previewUrl`, `isGenerating`, `isExporting` + setters + `reset()`
- [x] 10.2 Implement `frontend/src/services/sessions.ts`: `createSession`, `getSession`, `updateSession` fetch wrappers
- [x] 10.3 Implement `frontend/src/services/themes.ts`: `listThemes` fetch wrapper
- [x] 10.4 Implement `frontend/src/services/generation.ts`: `generatePreview`, `validateYaml` fetch wrappers
- [x] 10.5 Implement `frontend/src/hooks/useDebounce.ts`
- [x] 10.6 Implement `frontend/src/hooks/usePreview.ts`: debounced preview trigger (2000ms), sets `previewUrl` on success
- [x] 10.7 Implement `frontend/src/hooks/useValidation.ts`: debounced client-side AJV validation (500ms) + server-side validation call

## 11. Frontend — Pages

- [x] 11.1 Implement `frontend/src/app/layout.tsx`: Radix `TooltipProvider`, font setup (Geist or Inter), global error boundary
- [x] 11.2 Implement landing page `frontend/src/app/page.tsx`: glassmorphism header, hero section, 3-col feature grid, "How It Works", footer — using Radix Colors blue/slate tokens
- [x] 11.3 Implement `frontend/src/app/studio/[token]/page.tsx`: load session on mount, redirect to `/` on 404, render editor + preview layout
- [x] 11.4 Implement `frontend/src/components/features/editor/YamlEditor.tsx`: CodeMirror 6 + YAML lang + AJV diagnostics extension
- [x] 11.5 Implement `frontend/src/components/features/preview/PreviewFrame.tsx`: `<iframe sandbox="allow-same-origin allow-scripts">` pointing to `previewUrl`
- [x] 11.6 Implement `frontend/src/components/features/theme/ThemeSelector.tsx`: Radix Select populated from `GET /api/v1/themes`
- [x] 11.7 Implement studio header bar: title, `ThemeSelector`, share/copy-link button
- [x] 11.8 Implement resizable panels: `react-resizable-panels` PanelGroup (editor | preview)
- [x] 11.9 Bundle `schemas/cvwonder.schema.json` in `frontend/public/schemas/` for AJV client validation

## 12. Docker & Kubernetes

- [x] 12.1 Write multi-stage `Dockerfile`: stage 1 `node:24-alpine` (pnpm build → dist/), stage 2 `golang:1.25-alpine` (go build with embedded dist/), stage 3 `alpine:3.21` (copy binary + cvwonder binary + bundled themes)
- [x] 12.2 Add cvwonder binary to Docker image: `COPY --from=ghcr.io/germainlefebvre4/cvwonder:latest /usr/local/bin/cvwonder /usr/local/bin/cvwonder` or download at build time with pinned version
- [x] 12.3 Add bundled themes to Docker image: `COPY infra/themes/ /app/themes/`
- [x] 12.4 Create `infra/k8s/deployment.yaml`: studio Deployment with SecurityContext, resource limits, liveness/readiness probes, PVC volume mounts
- [x] 12.5 Create `infra/k8s/pvc-sessions.yaml` and `infra/k8s/pvc-themes.yaml`: ReadWriteOnce, configurable storage size
- [x] 12.6 Create `infra/k8s/service.yaml`: ClusterIP Service on port 8080
- [x] 12.7 Create `infra/k8s/ingress.yaml`: Ingress with TLS annotation placeholders
- [x] 12.8 Create `infra/k8s/networkpolicy.yaml`: deny external ingress except ingress-controller; allow egress to postgres:5432, DNS:53, github:443
- [x] 12.9 Create `infra/k8s/configmap.yaml`: non-secret env vars (`SESSIONS_BASE_DIR`, `THEMES_BUILTIN_DIR`, etc.)
- [x] 12.10 Create root `docker-compose.yml`: `postgres:16-alpine` + `backend` (air hot-reload) + `frontend` (vite dev) services

## 13. End-to-End Validation

- [x] 13.1 Run `docker-compose up` and verify studio is reachable at `http://localhost:5173`
- [x] 13.2 Create a session, write YAML, verify preview renders in iframe
- [x] 13.3 Switch themes, verify preview re-renders with new theme
- [x] 13.4 Trigger validation with invalid YAML, verify inline editor errors appear
- [x] 13.5 Run `kubectl apply --dry-run=client -f infra/k8s/` and verify all manifests are valid
- [x] 13.6 Build the final Docker image and verify `docker run` starts the studio on port 8080
- [x] 13.7 Verify bundled themes appear in theme selector without network access (air-gap test)

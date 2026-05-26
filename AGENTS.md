# CVWonder Studio — Agent Context

CVWonder Studio is a web application that lets users create and export CVs using YAML templates rendered by the [CVWonder](https://github.com/germainlefebvre4/cvwonder) binary. Users edit their CV in a Monaco YAML editor with live preview; authenticated users get persistent sessions, anonymous users get a 24h ephemeral session.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Go 1.25, Gin, PostgreSQL, sqlc, golang-migrate |
| Frontend | React 18, TypeScript, Vite, Radix UI, Tailwind v4 |
| Auth | Google OAuth 2.0, HttpOnly cookie (`user_session`) |
| Infra | Kubernetes (k3s), Docker Compose (dev), Gotenberg (PDF) |
| CV engine | `cvwonder` binary (Go, embedded in final binary) |

## Repository Structure

```
backend/               Go backend (Gin API server)
  cmd/api/             main entrypoint
  internal/
    adapters/          HTTP handlers, repository, external adapters
    domain/            domain models
    ports/             interfaces (Generator, PDFRenderer, …)
    usecases/          business logic
    userauth/          Google OAuth, session middleware
  db/
    migrations/        SQL migrations (golang-migrate)
    queries/           sqlc .sql files
    generated/         sqlc generated code (do not edit)

frontend/              React SPA (Vite)
  src/
    app/               page-level components (React Router)
    components/        shared UI components
    hooks/             custom React hooks
    services/          API client functions
    store/             Zustand stores

openspec/
  specs/               Capability specs — SOURCE OF TRUTH (see below)
  changes/             Active and archived change artifacts

infra/
  k8s/                 Kubernetes manifests
themes/                Built-in CV themes (basic/, default/)
```

## Development Commands

```bash
make dev              # Full stack (docker-compose)
make dev-backend      # Go backend with air hot-reload (port 8080)
make dev-frontend     # Vite dev server (port 5173, proxies /api/* to :8080)

make test             # Backend unit tests
make test-int         # Backend integration tests (requires Docker)
make test-frontend    # Frontend Vitest tests
make test-ci          # All non-integration tests

make build            # Production build (frontend embedded in Go binary)
make sqlc-gen         # Regenerate sqlc code after editing db/queries/*.sql
make migrate          # Run database migrations
make lint             # Lint backend and frontend
```

## Conventions

- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`)
- **API routes**: versioned under `/api/v1/`
- **Backend**: Hexagonal architecture — adapters call usecases via ports; domain models have no framework dependencies
- **Frontend**: Radix UI primitives (no shadcn), Tailwind v4 `@theme {}` with semantic CSS tokens, Zustand for global state
- **DB**: Never edit `backend/db/generated/` — always run `make sqlc-gen` after changing SQL queries
- **sqlc**: Query files in `backend/db/queries/`, config in `backend/sqlc.yaml`
- **Env vars**: See `backend/internal/config/` for all supported variables

## Specs are the Source of Truth

`openspec/specs/` contains 23 capability specs describing the **intended behavior** of the system. Each spec uses BDD-style scenarios (`WHEN / THEN`). **Before implementing any feature, read the relevant spec(s).**

Load the appropriate domain skill to get full spec context:

| Working on… | Invoke skill |
|---|---|
| Go backend, API routes, database | `backend-context` |
| React frontend, UI components, pages | `frontend-context` |
| Admin panel, admin API | `admin-context` |
| Kubernetes, Docker, PDF export, themes infra | `infra-context` |
| Unsure / cross-cutting | `project-context` |

## Active Changes

Check `openspec/changes/` for what is currently being built. Each active change has `proposal.md`, `design.md`, and `tasks.md`. When working on a change, always read these artifacts first.

```bash
ls openspec/changes/          # list active changes (non-archive dirs)
cat openspec/changes/<name>/proposal.md
cat openspec/changes/<name>/tasks.md
```

## Key Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials |
| `SESSION_SECRET` | HMAC key for signed cookies |
| `FRONTEND_BASE_URL` | SPA base URL (split-origin dev) |
| `APP_BASE_URL` | Public app URL (production) |
| `GOTENBERG_URL` | Gotenberg service URL (PDF enabled when set) |
| `PORT` | Backend port (default `8080`) |

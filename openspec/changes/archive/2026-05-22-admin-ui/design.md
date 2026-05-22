## Context

cvwonder-studio is migrating from a Next.js monolith to a Go (Gin) backend + Vite/React SPA (see `migrate-to-react-gin-stack` change). The backend uses sqlc + pgx/v5 for DB access, with migrations managed by golang-migrate. The frontend is a Vite + React SPA served as embedded static files from the Go binary.

Currently there is no admin interface. Theme management requires direct DB inserts and filesystem operations. The `themes` table exists but lacks versioning fields. Sessions accumulate without any management UI.

The Admin UI is built entirely on the new stack — no Next.js involvement.

## Goals / Non-Goals

**Goals:**
- Protected `/admin` SPA section behind session cookie auth
- Go/Gin admin API routes under `/api/admin/*`
- Theme install from GitHub by version (tag or branch)
- Theme catalog browser with preview images
- Session list with expire/delete actions
- System status dashboard
- Single-admin model via env var credentials

**Non-Goals:**
- Multi-admin or role-based access control
- GitHub OAuth / personal access token (anonymous API calls only, v1)
- Automated theme update checks (manual only)
- Theme upload via ZIP file (GitHub URL only)
- Audit log persistence in DB

## Decisions

### D1 — Stateless HMAC token for admin session (no DB table)

**Decision:** Sign a `{sub:"admin", exp:<unix>}` payload with HMAC-SHA256 using `ADMIN_TOKEN_SECRET` env var. Store in an HttpOnly, Secure, SameSite=Strict cookie named `admin_session`.

**Alternatives considered:**
- DB `admin_sessions` table: unnecessary complexity for a single-admin model; revocation is handled by rotating `ADMIN_TOKEN_SECRET`
- JWT library: overkill; a simple HMAC-SHA256 over a JSON payload is sufficient

**Rationale:** Keeps the admin auth entirely stateless and zero-migration. Cookie expiry + `ADMIN_TOKEN_SECRET` rotation covers the revocation use case.

### D2 — Admin credentials via env vars (not DB)

**Decision:** `ADMIN_USERNAME` + `ADMIN_PASSWORD_HASH` (bcrypt, cost 12) stored as env vars / K8s Secret. Verified at login with `bcrypt.CompareHashAndPassword`.

**Alternatives considered:**
- DB `admins` table: adds a migration and seeding step; overkill for one admin
- Plain text password env var: rejected for security

**Rationale:** K8s Secrets are the canonical way to inject credentials. No schema migration needed.

### D3 — Catalog as embedded YAML (go:embed)

**Decision:** `catalog.yaml` at `backend/catalog.yaml`, embedded via `//go:embed catalog.yaml`. Parsed at startup into an in-memory slice.

**Alternatives considered:**
- Remote manifest fetched at runtime: adds network dependency, complicates air-gapped deployments
- DB-backed catalog: catalog entries are curated/static; DB is for installed-state only

**Rationale:** Consistent with the "single binary" goal of the migration. Catalog updates ship with new binary releases.

### D4 — GitHub ZIP download via standard net/http (no token)

**Decision:** Download `https://api.github.com/repos/{owner}/{repo}/zipball/{ref}` using standard `net/http` with a `User-Agent: cvwonder-studio` header. No GitHub token.

**Alternatives considered:**
- go-github library: unnecessary for two API calls (releases list + ZIP download)
- GitHub token: 60 req/h anonymous is sufficient for a single admin

**Rationale:** Minimal dependencies, sufficient rate limits for the use case.

### D5 — Theme versioning as DB columns (not separate table)

**Decision:** Add `installed_ref TEXT`, `latest_ref TEXT`, `last_checked_at TIMESTAMPTZ`, `description TEXT`, `preview_url TEXT` columns to `themes` via migration `000004`.

**Alternatives considered:**
- Separate `theme_versions` table: premature normalization; one installed version per theme is the invariant

**Rationale:** Simple, direct; sqlc regenerates cleanly with added columns.

### D6 — Preview images served directly from raw.githubusercontent.com

**Decision:** Frontend `<img>` tags point to `https://raw.githubusercontent.com/{owner}/{repo}/{ref}/preview.png`. Backend does not proxy images.

**Alternatives considered:**
- Backend proxy: adds latency and complexity; not needed for an admin-only UI
- Cache locally on install: requires additional storage management

**Rationale:** Zero backend code for preview; works immediately for catalog themes before install. GitHub CDN is reliable.

### D7 — Admin routes as a sub-router group in Gin

**Decision:** All admin HTTP handlers live under a `adminGroup := r.Group("/api/admin")` with `requireAdmin` middleware applied to the group (except `/api/admin/login` and `/api/admin/logout`).

**Rationale:** Clean separation; middleware applies once to the group. Public API (`/api/v1/*`) is untouched.

## Risks / Trade-offs

- **GitHub rate limiting**: 60 unauthenticated req/h. A single admin performing many "check updates" calls in quick succession could hit the limit. → Mitigation: cache `latest_ref` in DB; only re-fetch if `last_checked_at` is older than 1 hour.
- **ADMIN_TOKEN_SECRET rotation**: Rotating the secret invalidates all active admin sessions. → Acceptable: only one admin, and login is frictionless.
- **catalog.yaml staleness**: New community themes require a binary release to appear in catalog. → Acceptable for v1; remote manifest is a planned future improvement.
- **ZIP extraction security**: Extracting untrusted ZIPs can lead to path traversal. → Mitigation: validate all extracted paths are within the target directory before writing.

## Migration Plan

1. Run DB migration `000004_add_theme_versioning` (additive columns, no data loss)
2. Re-run `sqlc generate` to regenerate `db/generated/`
3. Set env vars `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `ADMIN_TOKEN_SECRET` in deployment (K8s Secret or `.env`)
4. Deploy new binary — admin routes are immediately available at `/api/admin/*`
5. Frontend `/admin/*` routes are protected at the SPA level by `RequireAdmin` component

Rollback: Remove `000004` migration (drop added columns), remove admin env vars, redeploy previous binary.

## Open Questions

- Should the admin activity log (recent actions) be ephemeral (in-memory ring buffer) or persisted in `system_config`? Current design: in-memory (lost on restart), sufficient for v1.
- Should the session list in admin show the YAML content inline or require a click to expand? Deferred to UX implementation.

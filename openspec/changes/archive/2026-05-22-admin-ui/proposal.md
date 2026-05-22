## Why

There is no way to manage themes, sessions, or system health without direct database or filesystem access. As the theme catalog grows and the application hardens for Kubernetes deployment, operators need a UI to install new themes (from GitHub by version), clean up sessions, and monitor system status — without shell access to the server.

## What Changes

- Add a protected `/admin` section to the React SPA (Vite), accessible only after login
- Add Go/Gin admin API routes under `/api/admin/*` guarded by an HMAC-signed session cookie middleware
- Extend the `themes` DB table with versioning fields (`installed_ref`, `latest_ref`, `last_checked_at`, `description`, `preview_url`)
- Embed a `catalog.yaml` manifest in the Go binary listing curated themes with their GitHub repos
- Admin credentials stored as env vars (`ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`) — no DB table for admin users
- GitHub integration: list releases/tags per theme, download ZIP by ref, serve preview images from raw.githubusercontent.com

## Capabilities

### New Capabilities

- `admin-auth`: Protected admin session using HMAC-signed HttpOnly cookie; login form at `/admin/login`; bcrypt credential verification against env vars; stateless token (no DB table); logout clears cookie
- `admin-theme-management`: Installed themes list with version badges and "update available" indicator; catalog browser with preview images (from GitHub raw); version picker modal (select tag/release or default branch); one-click install (Go downloads ZIP from GitHub, extracts to PVC); manual "check for updates" per theme; soft-delete installed themes
- `admin-session-management`: Paginated list of all sessions with search; view YAML content; force-expire or delete individual sessions; bulk purge all expired sessions
- `admin-system-dashboard`: Overview cards (active session count, theme count builtin vs runtime, storage usage); CVWonder binary version and health; recent admin activity log

### Modified Capabilities

<!-- No existing specs to modify -->

## Impact

- **New backend**: `backend/internal/admin/` package (handler, middleware, auth, catalog, github installer)
- **New frontend**: `frontend/src/pages/admin/` (Login, Dashboard, Themes, Sessions, System)
- **DB migration**: `000004_add_theme_versioning.up.sql` adding versioning columns to `themes`
- **New queries**: sqlc queries for admin theme operations (list with version info, update refs), session admin list
- **New file**: `catalog.yaml` embedded in Go binary via `go:embed`
- **No new dependencies**: `golang.org/x/crypto` (bcrypt, already present via pgx), standard `net/http` for GitHub downloads
- **Env vars added**: `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `ADMIN_TOKEN_SECRET`

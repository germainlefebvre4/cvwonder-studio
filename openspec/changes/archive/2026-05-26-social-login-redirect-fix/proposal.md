## Why

After a successful Google OAuth login, the backend redirects to the relative path `/dashboard`, which resolves to `http://localhost:8080/dashboard` (the backend origin) in development. The frontend SPA runs on a separate origin (`http://localhost:5173`), so the user lands on a blank backend response instead of the React app. This bug breaks the entire social login flow in dev and any deployment where the API and frontend have different origins.

## What Changes

- Add a `FRONTEND_BASE_URL` environment variable to the backend config (defaults to `APP_BASE_URL` when unset).
- Replace the hardcoded relative redirect `/dashboard` in the OAuth callback handler with an absolute redirect using `FRONTEND_BASE_URL`.
- Update `.env.example` / documentation to document the new variable.

## Capabilities

### New Capabilities

<!-- none — this is a bug fix, no new capability is introduced -->

### Modified Capabilities

- `user-auth`: The post-login redirect target is now configurable via `FRONTEND_BASE_URL`, enabling frontend and backend to run on separate origins.

## Impact

- **Backend config**: `internal/config/config.go` — new field `FrontendBaseURL`.
- **OAuth callback handler**: `internal/adapters/http/auth.go` — redirect target changes from `"/dashboard"` to `cfg.FrontendBaseURL + "/dashboard"`.
- **main.go**: pass `cfg.FrontendBaseURL` to `AuthHandler`.
- **Deployment config**: `docker-compose.yml`, `.env.example` — document `FRONTEND_BASE_URL`.
- No database changes. No breaking API changes.

## 1. Backend Config

- [x] 1.1 Add `FrontendBaseURL` field to `Config` struct in `backend/internal/config/config.go`
- [x] 1.2 Load `FrontendBaseURL` from env var `FRONTEND_BASE_URL`, defaulting to `APP_BASE_URL` when unset

## 2. Auth Handler

- [x] 2.1 Add `frontendBaseURL` field to `AuthHandler` struct in `backend/internal/adapters/http/auth.go`
- [x] 2.2 Accept `frontendBaseURL` parameter in `NewAuthHandler` constructor
- [x] 2.3 Replace `c.Redirect(http.StatusFound, "/dashboard")` with `c.Redirect(http.StatusFound, h.frontendBaseURL+"/dashboard")` in `Callback`

## 3. Wiring

- [x] 3.1 Pass `cfg.FrontendBaseURL` to `NewAuthHandler` in `backend/cmd/api/main.go`

## 4. Deployment Config

- [x] 4.1 Add `FRONTEND_BASE_URL` to `docker-compose.yml` (commented out, with a note that it defaults to `APP_BASE_URL`)
- [x] 4.2 Document `FRONTEND_BASE_URL` in the local dev `.env.example` (set to `http://localhost:5173`)

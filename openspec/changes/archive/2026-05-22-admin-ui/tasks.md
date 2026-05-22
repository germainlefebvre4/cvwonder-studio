## 1. DB Migration & sqlc

- [x] 1.1 Create `backend/db/migrations/000004_add_theme_versioning.up.sql` adding columns `description TEXT`, `preview_url TEXT`, `installed_ref TEXT`, `latest_ref TEXT`, `last_checked_at TIMESTAMPTZ` to the `themes` table
- [x] 1.2 Create `backend/db/migrations/000004_add_theme_versioning.down.sql` dropping the added columns
- [x] 1.3 Add sqlc queries to `backend/db/queries/themes.sql`: `ListThemesAdmin` (all columns including versioning), `UpdateInstalledRef` (set `installed_ref`, update `updated_at`), `UpdateLatestRef` (set `latest_ref`, `last_checked_at`), `SoftDeleteTheme` (set `deleted_at = NOW()`)
- [x] 1.4 Add sqlc queries to `backend/db/queries/sessions.sql`: `ListSessionsAdmin` (paginated, with total count), `CountSessions`, `ForceExpireSession` (set `expires_at = NOW()`), `CountAndDeleteExpiredSessions` (returning count)
- [x] 1.5 Run `sqlc generate` to regenerate `backend/db/generated/`

## 2. Catalog Setup

- [x] 2.1 Create `backend/catalog.yaml` with entries for `cvwonder-theme-basic` (repo: `germainlefebvre4/cvwonder-theme-basic`) and `cvwonder-theme-default` (repo: `germainlefebvre4/cvwonder-theme-default`)
- [x] 2.2 Implement `backend/internal/admin/catalog.go`: embed `catalog.yaml` via `//go:embed`, define `CatalogEntry` struct, parse on startup, expose `GetCatalog()` and `GetCatalogEntry(slug)` functions

## 3. GitHub Client

- [x] 3.1 Implement `backend/internal/admin/github.go`: `ListVersions(owner, repo string)` fetching GitHub releases API, falling back to tags API if zero releases; returns `[]VersionInfo{Ref, Name, PublishedAt}`
- [x] 3.2 Implement `backend/internal/admin/github.go`: `DownloadAndExtract(owner, repo, ref, destDir string)` downloading the GitHub zipball, validating all ZIP entry paths stay within `destDir` (path traversal check), extracting to `destDir`

## 4. Admin Authentication

- [x] 4.1 Implement `backend/internal/admin/auth.go`: `SignToken(secret string, ttl time.Duration) (string, error)` and `VerifyToken(secret, token string) error` using HMAC-SHA256 over a JSON payload `{sub:"admin", exp:<unix>}`
- [x] 4.2 Implement `backend/internal/admin/auth.go`: `VerifyCredentials(username, password string) bool` comparing against `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` env vars using `bcrypt.CompareHashAndPassword`
- [x] 4.3 Implement `backend/internal/admin/middleware.go`: `RequireAdmin(tokenSecret string) gin.HandlerFunc` reading `admin_session` cookie, verifying token, returning 401 on failure
- [x] 4.4 Implement `POST /api/admin/login` handler: validate body, call `VerifyCredentials`, sign token, set `admin_session` cookie (HttpOnly, Secure, SameSite=Strict, 8h MaxAge)
- [x] 4.5 Implement `POST /api/admin/logout` handler: set `admin_session` cookie with `MaxAge=0`
- [x] 4.6 Validate at application startup that `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, and `ADMIN_TOKEN_SECRET` env vars are non-empty; panic with descriptive message if missing

## 5. Admin Theme Handlers

- [x] 5.1 Implement `GET /api/admin/themes`: query `ListThemesAdmin`, return JSON array with full versioning fields
- [x] 5.2 Implement `GET /api/admin/catalog`: return catalog entries merged with DB state (`installed`, `installed_ref` fields)
- [x] 5.3 Implement `GET /api/admin/catalog/:slug/versions`: call `ListVersions` for the catalog entry's repo; return 404 if slug not in catalog
- [x] 5.4 Implement `POST /api/admin/themes/install` (`{ slug, ref }`): validate slug in catalog, call `DownloadAndExtract` to `/data/themes/{slug}`, call `UpsertTheme` with `installed_ref = ref`; return 502 on GitHub failure, 422 on path traversal
- [x] 5.5 Implement `POST /api/admin/themes/:slug/check-updates`: fetch latest release via `ListVersions`, call `UpdateLatestRef`, return `{ installed_ref, latest_ref, update_available }`; return 404 if slug not in DB
- [x] 5.6 Implement `DELETE /api/admin/themes/:slug`: return 403 if `is_builtin = true`, call `SoftDeleteTheme`, return 204; return 404 if not found

## 6. Admin Session Handlers

- [x] 6.1 Implement `GET /api/admin/sessions`: accept `page`, `per_page`, `q` query params; call `ListSessionsAdmin` with offset/limit; add `is_expired` computed field; return paginated envelope
- [x] 6.2 Implement `POST /api/admin/sessions/:id/expire`: call `ForceExpireSession`; return 404 if not found
- [x] 6.3 Implement `DELETE /api/admin/sessions/:id`: call `DeleteSession`; return 404 if not found, 204 on success
- [x] 6.4 Implement `POST /api/admin/sessions/purge`: call `CountAndDeleteExpiredSessions`; return `{ deleted_count: N }`

## 7. Admin System Handlers

- [x] 7.1 Implement `GET /api/admin/dashboard`: query active session count, expiring-soon count, theme counts (total/builtin/runtime) via DB; compute themes directory size via `filepath.WalkDir`; retrieve binary version by executing `cvwonder --version`; return stats JSON
- [x] 7.2 Implement `GET /api/admin/system/health`: ping DB with `db.Ping()`, check binary path exists; return `{ status, db, binary }` — always HTTP 200

## 8. Gin Router Registration

- [x] 8.1 Create `backend/internal/admin/handler.go` with `RegisterRoutes(r *gin.Engine, deps AdminDeps)` registering `POST /api/admin/login` and `POST /api/admin/logout` without middleware
- [x] 8.2 Register the protected admin group: `r.Group("/api/admin", RequireAdmin(secret))` with all theme, session, and system routes

## 9. Frontend — Admin Auth & Shell

- [x] 9.1 Create `frontend/src/components/admin/RequireAdmin.tsx`: reads a session indicator (cookie presence check via API call to `GET /api/admin/dashboard`), redirects to `/admin/login` on 401
- [x] 9.2 Create `frontend/src/components/admin/AdminLayout.tsx`: sidebar with navigation links (Dashboard, Themes, Sessions, System) and logout button
- [x] 9.3 Create `frontend/src/pages/admin/Login.tsx`: username + password form, `POST /api/admin/login`, redirect on success, show error on 401
- [x] 9.4 Register `/admin/*` routes in the React router with `RequireAdmin` wrapping all routes except `/admin/login`

## 10. Frontend — Theme Management

- [x] 10.1 Create `frontend/src/pages/admin/themes/InstalledThemes.tsx`: list installed themes with name, `installed_ref` badge, "update available" indicator (when `latest_ref` differs), Check Updates button, Remove button (disabled for builtins)
- [x] 10.2 Create `frontend/src/pages/admin/themes/Catalog.tsx`: list catalog themes with preview images (`raw.githubusercontent.com/.../HEAD/preview.png`), "Installed" badge if already installed, "Install" button
- [x] 10.3 Create `frontend/src/pages/admin/themes/VersionPicker.tsx`: modal opened on "Install"; fetches version list from `GET /api/admin/catalog/:slug/versions`; dropdown to select ref; preview image updated to `raw.githubusercontent.com/.../:{ref}/preview.png`; Install button calls `POST /api/admin/themes/install`

## 11. Frontend — Session Management

- [x] 11.1 Create `frontend/src/pages/admin/Sessions.tsx`: paginated table showing session ID, theme, created/expires dates, `is_expired` badge; search box filtering by ID prefix
- [x] 11.2 Add per-row actions: Force Expire (POST expire), Delete (DELETE); with confirmation dialog before delete
- [x] 11.3 Add "Purge Expired" bulk action button calling `POST /api/admin/sessions/purge`, displaying `deleted_count` in a toast

## 12. Frontend — System Dashboard

- [x] 12.1 Create `frontend/src/pages/admin/Dashboard.tsx`: three stat cards (Sessions: active / expiring soon; Themes: builtin / runtime; Storage: bytes); CVWonder binary version display; fetches from `GET /api/admin/dashboard`
- [x] 12.2 Create `frontend/src/pages/admin/System.tsx`: health status display from `GET /api/admin/system/health`; color-coded indicators for DB and binary status

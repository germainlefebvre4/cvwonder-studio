## Context

The backend serves the OAuth callback at `/api/auth/callback`. After exchanging the code and creating the user session cookie, it redirects the browser to `/dashboard`. In production the backend also serves the compiled React SPA, so a relative redirect works. In development (and in any split-origin deployment), the frontend runs on a different port/host than the backend, causing the relative redirect to land on the backend instead of the SPA.

Currently there is no config variable to express the "public frontend URL" separately from `APP_BASE_URL` (which encodes the backend's public URL, used as the OAuth redirect URI base).

## Goals / Non-Goals

**Goals:**
- Fix the post-login redirect so it always points to the frontend SPA, regardless of deployment topology.
- Keep production behaviour unchanged (when frontend and backend share the same origin).
- Remain backward-compatible: no required config change for existing deployments.

**Non-Goals:**
- Supporting per-login dynamic return URLs (e.g. redirect back to the page that triggered login). Deferred.
- Changing any other redirect in the auth flow (logout, error pages).

## Decisions

### D1 — Introduce `FRONTEND_BASE_URL` config variable

**Decision**: Add `FRONTEND_BASE_URL` to `Config`. Default: empty string, falling back to `APP_BASE_URL`.

**Rationale**: Explicit is better than implicit. A dedicated variable makes split-origin deployments trivially configurable without touching code. Falling back to `APP_BASE_URL` preserves backward compatibility for single-origin deployments (Docker production image) and for all existing CI/CD configs.

**Alternatives considered**:
- Reuse `APP_BASE_URL` as the frontend URL: breaks the OAuth callback URI, which must point to the backend.
- Encode the return URL in the OAuth state JWT: more flexible but adds complexity and open-redirect risk. Deferred as a future improvement.
- Store return URL in a pre-login cookie: also works, but another cookie to manage and fragile across redirects.

### D2 — Redirect to `FrontendBaseURL + "/dashboard"`

**Decision**: In `AuthHandler.Callback`, replace `c.Redirect(http.StatusFound, "/dashboard")` with `c.Redirect(http.StatusFound, h.frontendBaseURL+"/dashboard")`.

**Rationale**: Minimal change, directly addresses the root cause, easy to test and verify.

**Alternatives considered**:
- Redirect to `/` and let the frontend router decide: would also work but loses specificity; `/dashboard` is the correct post-login landing page.

## Risks / Trade-offs

- **Open redirect risk** if `FRONTEND_BASE_URL` is set to an attacker-controlled value → Mitigation: document that this variable must be set to a trusted origin; the value is set at deploy time by the operator, not derived from user input.
- **Cookie domain**: `user_session` cookie is set with `Domain: ""` (current origin). If backend and frontend are on different subdomains this could be a separate issue. Out of scope here, but worth noting.
- **No validation of `FRONTEND_BASE_URL`**: At startup we could validate it is a well-formed absolute URL. Low priority for now since it's operator-configured.

## Migration Plan

1. Deploy new backend binary with `FRONTEND_BASE_URL` env var.
2. For split-origin dev: set `FRONTEND_BASE_URL=http://localhost:5173` in local `.env`.
3. For single-origin prod (Docker): leave `FRONTEND_BASE_URL` unset — falls back to `APP_BASE_URL`.
4. No database migration, no downtime.

Rollback: revert env var, redeploy previous binary.

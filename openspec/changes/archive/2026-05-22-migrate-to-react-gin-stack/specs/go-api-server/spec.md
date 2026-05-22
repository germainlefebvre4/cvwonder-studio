## ADDED Requirements

### Requirement: HTTP server uses Gin router
The system SHALL use `gin-gonic/gin` as the HTTP router. The server SHALL start on a configurable port (default `8080`, env `PORT`). The server SHALL include the following Gin middleware: `gin.Recovery()`, a request-ID injector, and a rate limiter (100 req/min per IP). Read timeout SHALL be 30s, write timeout 65s, idle timeout 120s.

#### Scenario: Server starts with default port
- **WHEN** the binary starts without `PORT` env variable
- **THEN** the server listens on `:8080`

#### Scenario: Rate limiting blocks excessive requests
- **WHEN** a single IP sends more than 100 requests within 60 seconds
- **THEN** the server responds with HTTP 429

#### Scenario: Panic recovery
- **WHEN** a handler panics at runtime
- **THEN** the server returns HTTP 500 without crashing and logs the stack trace

---

### Requirement: API routes are versioned under /api/v1
The system SHALL expose all API endpoints under the `/api/v1` prefix.

#### Scenario: API endpoint is reachable
- **WHEN** a client sends `POST /api/v1/sessions`
- **THEN** the server routes the request to the session creation handler

---

### Requirement: Session creation
The system SHALL accept `POST /api/v1/sessions` with optional `theme_id` in the JSON body. The system SHALL generate a random token (min 32 bytes entropy), store only its SHA-256 hash in the database, and return the raw token exactly once. The session SHALL have a default expiry of `session.default_duration_days` config value (max `session.max_duration_days`).

#### Scenario: Create session with default theme
- **WHEN** `POST /api/v1/sessions` is sent with an empty body
- **THEN** response is HTTP 201 with `{ token, session_id, expires_at }` and the raw token is included

#### Scenario: Token is not retrievable after creation
- **WHEN** `GET /api/v1/sessions/:token` is called with a valid token
- **THEN** the response does NOT include the raw token (only session metadata)

---

### Requirement: Session retrieval and update
The system SHALL accept `GET /api/v1/sessions/:token` to retrieve session metadata (yaml_content, theme_id, expires_at). The system SHALL accept `PATCH /api/v1/sessions/:token` to update `yaml_content` and/or `theme_id`.

#### Scenario: Retrieve existing session
- **WHEN** `GET /api/v1/sessions/:token` is called with a valid token
- **THEN** response is HTTP 200 with `{ session_id, yaml_content, theme_id, expires_at }`

#### Scenario: Session not found
- **WHEN** `GET /api/v1/sessions/:token` is called with an unknown token
- **THEN** response is HTTP 404

#### Scenario: Expired session is deleted on access
- **WHEN** `GET /api/v1/sessions/:token` is called and the session is past `expires_at`
- **THEN** the session is deleted and response is HTTP 404

#### Scenario: Update yaml content
- **WHEN** `PATCH /api/v1/sessions/:token` is sent with `{ "yaml_content": "..." }`
- **THEN** response is HTTP 200 and subsequent GET returns the updated yaml_content

---

### Requirement: Preview generation
The system SHALL accept `POST /api/v1/sessions/:token/preview`. It SHALL invoke the `ports.Generator.GenerateHTML` adapter with the session's YAML and resolved theme path, write output to `sessions/<token>/generated/`, and return `{ preview_url: "/preview/<token>/" }`.

#### Scenario: Successful HTML generation
- **WHEN** `POST /api/v1/sessions/:token/preview` is called with a valid session containing valid YAML
- **THEN** response is HTTP 200 with `{ preview_url: "/preview/<token>/" }`

#### Scenario: Generation with invalid YAML returns error
- **WHEN** `POST /api/v1/sessions/:token/preview` is called and the YAML is structurally invalid
- **THEN** response is HTTP 422 with a list of validation errors

---

### Requirement: YAML validation
The system SHALL accept `POST /api/v1/sessions/:token/validate`. It SHALL invoke the `ports.Generator.Validate` adapter and return `{ valid: bool, errors: [] }`.

#### Scenario: Valid YAML returns empty errors
- **WHEN** `POST /api/v1/sessions/:token/validate` is called with valid YAML
- **THEN** response is HTTP 200 with `{ "valid": true, "errors": [] }`

#### Scenario: Invalid YAML returns field-level errors
- **WHEN** `POST /api/v1/sessions/:token/validate` is called with YAML missing required fields
- **THEN** response is HTTP 200 with `{ "valid": false, "errors": [{ "field": "...", "message": "..." }] }`

---

### Requirement: Theme listing
The system SHALL accept `GET /api/v1/themes` and return all active themes from the database as a JSON array with `{ id, name, slug, github_url, is_builtin }`.

#### Scenario: Themes are returned
- **WHEN** `GET /api/v1/themes` is called
- **THEN** response is HTTP 200 with a JSON array of theme objects

---

### Requirement: Static preview serving
The system SHALL serve generated CV preview files at `GET /preview/:token/*filepath`. Files are read from `sessions/<token>/generated/`. The handler SHALL enforce path traversal protection (the resolved path MUST start with the sessions base directory).

#### Scenario: Preview HTML is served
- **WHEN** `GET /preview/<token>/cv.html` is called after a successful generation
- **THEN** response is HTTP 200 with `Content-Type: text/html`

#### Scenario: Path traversal is blocked
- **WHEN** `GET /preview/<token>/../../etc/passwd` is requested
- **THEN** response is HTTP 400 or HTTP 403

---

### Requirement: SPA catch-all
The system SHALL embed the compiled Vite+React SPA (`dist/`) using `go:embed`. Any `GET` request that does not match `/api/*` or `/preview/*` SHALL return `dist/index.html` so React Router handles client-side navigation.

#### Scenario: React route is served correctly
- **WHEN** `GET /studio/some-token` is requested (no matching server route)
- **THEN** response is HTTP 200 with the SPA `index.html`

---

### Requirement: Health endpoints
The system SHALL expose `GET /health/live` (always 200 if process is up) and `GET /health/ready` (200 if DB connection is healthy).

#### Scenario: Liveness probe succeeds
- **WHEN** `GET /health/live` is called
- **THEN** response is HTTP 200

#### Scenario: Readiness probe fails when DB is down
- **WHEN** `GET /health/ready` is called and PostgreSQL is unreachable
- **THEN** response is HTTP 503

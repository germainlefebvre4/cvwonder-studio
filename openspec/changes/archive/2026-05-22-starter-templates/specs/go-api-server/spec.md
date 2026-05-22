## ADDED Requirements

### Requirement: Template listing endpoint
The system SHALL expose `GET /api/v1/templates` as a public route (no authentication required). The response SHALL be a JSON array of template metadata objects: `{ slug, name, description }`. The YAML content of each template SHALL NOT be included in the response.

#### Scenario: Templates are returned
- **WHEN** `GET /api/v1/templates` is called
- **THEN** response is HTTP 200 with a JSON array containing at least one entry, each with `slug`, `name`, and `description`

#### Scenario: Template content is not leaked
- **WHEN** `GET /api/v1/templates` is called
- **THEN** the response objects do NOT contain a `yaml_content` or `file` field

---

## MODIFIED Requirements

### Requirement: Session creation
The system SHALL accept `POST /api/v1/sessions` with optional `theme_id` and optional `template_id` in the JSON body. The system SHALL generate a random token (min 32 bytes entropy), store only its SHA-256 hash in the database, and return the raw token exactly once. The session SHALL have a default expiry of `session.default_duration_days` config value (max `session.max_duration_days`). If `template_id` is provided and matches a known template slug, the session's `yaml_content` SHALL be initialized with the template's embedded YAML content. If `template_id` is provided but does not match any known slug, the system SHALL respond with HTTP 400.

#### Scenario: Create session with default theme
- **WHEN** `POST /api/v1/sessions` is sent with an empty body
- **THEN** response is HTTP 201 with `{ token, session_id, expires_at }` and the raw token is included

#### Scenario: Token is not retrievable after creation
- **WHEN** `GET /api/v1/sessions/:token` is called with a valid token
- **THEN** the response does NOT include the raw token (only session metadata)

#### Scenario: Create session with a valid template
- **WHEN** `POST /api/v1/sessions` is sent with `{ "template_id": "developer-fr" }`
- **THEN** response is HTTP 201 and `GET /api/v1/sessions/:token` returns a `yaml_content` matching the embedded developer-fr template

#### Scenario: Create session with unknown template returns 400
- **WHEN** `POST /api/v1/sessions` is sent with `{ "template_id": "nonexistent" }`
- **THEN** response is HTTP 400 with an error message

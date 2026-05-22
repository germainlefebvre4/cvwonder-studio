## ADDED Requirements

### Requirement: System dashboard overview
The system SHALL expose `GET /api/admin/dashboard` returning aggregate statistics: active session count (where `expires_at > NOW()`), expiring-soon session count (where `expires_at` is between now and 24 h from now), total theme count, builtin theme count, runtime theme count, CVWonder binary version string, and approximate storage usage in bytes for the themes directory.

#### Scenario: Returns dashboard stats
- **WHEN** authenticated admin sends `GET /api/admin/dashboard`
- **THEN** system returns HTTP 200 with a JSON object containing `sessions.active`, `sessions.expiring_soon`, `themes.total`, `themes.builtin`, `themes.runtime`, `system.binary_version`, and `system.themes_storage_bytes`

#### Scenario: Binary version unavailable
- **WHEN** the CVWonder binary cannot be found or executed to retrieve its version
- **THEN** system returns `system.binary_version: "unknown"` and does not fail the request

### Requirement: System health endpoint
The system SHALL expose `GET /api/admin/system/health` returning the operational status of the backend, including database connectivity and binary availability. Status SHALL be either `"ok"` or `"degraded"`.

#### Scenario: All systems healthy
- **WHEN** DB is reachable and binary is found
- **THEN** system returns HTTP 200 with `{ status: "ok", db: "ok", binary: "ok" }`

#### Scenario: Database unreachable
- **WHEN** DB connection check fails
- **THEN** system returns HTTP 200 with `{ status: "degraded", db: "error", binary: "ok" }` (200 so monitoring can parse the body; the `status` field signals degradation)

#### Scenario: Binary not found
- **WHEN** CVWonder binary is not present at the configured path
- **THEN** system returns HTTP 200 with `{ status: "degraded", db: "ok", binary: "not_found" }`

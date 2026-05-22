## ADDED Requirements

### Requirement: Default themes are bundled in the Docker image
The Docker image SHALL include pre-installed default themes copied into `/app/themes/` during the build stage. The set of bundled themes SHALL be defined at build time (e.g., `basic`, `default`). These themes SHALL be available immediately at startup without network access.

#### Scenario: Themes are available without internet
- **WHEN** the container starts in an air-gapped environment
- **THEN** bundled themes are listed by `GET /api/v1/themes` without any network requests

---

### Requirement: Builtin themes are registered in the DB at startup
At server startup, the system SHALL perform an idempotent upsert of all bundled themes into the `themes` table. Bundled themes SHALL be marked with `is_builtin = true` and `local_path = /app/themes/<slug>`.

#### Scenario: Repeated restarts do not duplicate themes
- **WHEN** the server is restarted multiple times
- **THEN** the DB contains exactly one row per bundled theme slug

#### Scenario: Builtin flag is set correctly
- **WHEN** `GET /api/v1/themes` is called
- **THEN** bundled themes have `"is_builtin": true` in the response

---

### Requirement: Runtime themes can be installed onto the PVC
The system SHALL support installing additional themes at runtime by cloning a GitHub repository URL via the `cvwonder theme install <url>` command. Installed themes SHALL be stored at `/data/themes/<slug>/` (PVC-mounted). The DB SHALL record runtime themes with `is_builtin = false` and `local_path = /data/themes/<slug>`.

#### Scenario: New theme is installed and immediately available
- **WHEN** a theme is installed at runtime
- **THEN** it appears in `GET /api/v1/themes` and can be selected for generation

#### Scenario: Runtime themes survive pod restart
- **WHEN** the pod restarts and the PVC is still mounted
- **THEN** previously installed runtime themes remain available

---

### Requirement: Theme resolution prefers local path over network
When a theme is required for generation, the system SHALL resolve its `local_path` from the DB. It SHALL verify the path exists on disk. If the path does not exist (e.g., runtime theme on a fresh PVC), the system SHALL return a clear error rather than silently falling back to another theme.

#### Scenario: Missing theme triggers a clear error
- **WHEN** a session references a theme whose `local_path` does not exist on disk
- **THEN** `POST /api/v1/sessions/:token/preview` returns HTTP 422 with `{ "error": "theme not found on disk: <slug>" }`

---

### Requirement: Theme DB schema has isBuiltin column
The `themes` table SHALL have an `is_builtin BOOLEAN NOT NULL DEFAULT FALSE` column. The migration SHALL add this column if it does not already exist.

#### Scenario: Schema migration runs successfully
- **WHEN** the DB migration is applied to an existing database
- **THEN** the `is_builtin` column is present and existing rows have `is_builtin = false`

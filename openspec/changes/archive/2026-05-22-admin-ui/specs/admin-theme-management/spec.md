## ADDED Requirements

### Requirement: List installed themes with version information
The system SHALL expose `GET /api/admin/themes` returning all non-deleted themes with their `installed_ref`, `latest_ref`, `last_checked_at`, `is_builtin`, `description`, and `preview_url` fields.

#### Scenario: Returns installed themes
- **WHEN** authenticated admin sends `GET /api/admin/themes`
- **THEN** system returns HTTP 200 with a JSON array of theme objects including versioning fields

#### Scenario: Empty theme list
- **WHEN** authenticated admin sends `GET /api/admin/themes` and no themes are installed
- **THEN** system returns HTTP 200 with an empty JSON array

### Requirement: Browse the theme catalog
The system SHALL expose `GET /api/admin/catalog` returning the list of curated themes from the embedded `catalog.yaml`, merged with installed-state from the DB (indicating which catalog themes are already installed and at what version).

#### Scenario: Returns catalog with install status
- **WHEN** authenticated admin sends `GET /api/admin/catalog`
- **THEN** system returns HTTP 200 with catalog entries, each including `installed: true/false` and `installed_ref` if installed

### Requirement: List available versions for a catalog theme
The system SHALL expose `GET /api/admin/catalog/:slug/versions` which fetches the GitHub releases list for the theme's repo. If no releases exist it SHALL fall back to the tags list. The response SHALL include each version's `ref` (tag name), `name`, and `published_at`.

#### Scenario: Returns release list from GitHub
- **WHEN** authenticated admin requests versions for a catalog theme that has GitHub releases
- **THEN** system returns HTTP 200 with a list of version objects

#### Scenario: Falls back to tags when no releases
- **WHEN** authenticated admin requests versions for a catalog theme with no GitHub releases but with tags
- **THEN** system returns HTTP 200 with a list of tag objects

#### Scenario: Unknown catalog slug
- **WHEN** authenticated admin requests versions for a slug not in the catalog
- **THEN** system returns HTTP 404

### Requirement: Install a theme from the catalog by version ref
The system SHALL expose `POST /api/admin/themes/install` accepting `{ slug, ref }`. The backend SHALL download the GitHub ZIP archive for the given repo and ref, extract it safely to `/data/themes/{slug}/` (validating no path traversal), and upsert the theme in the DB with `installed_ref` set to `ref`.

#### Scenario: Successful install
- **WHEN** authenticated admin posts `{ slug: "cvwonder-theme-basic", ref: "v1.2.0" }` to `/api/admin/themes/install`
- **THEN** system downloads and extracts the theme, upserts the DB record, and returns HTTP 201 with the theme object

#### Scenario: Install already-installed theme (update)
- **WHEN** authenticated admin installs a theme with a different ref than currently installed
- **THEN** system overwrites the existing files and updates `installed_ref` in DB, returning HTTP 201

#### Scenario: Invalid slug (not in catalog)
- **WHEN** authenticated admin posts a slug not present in the catalog
- **THEN** system returns HTTP 404

#### Scenario: GitHub download failure
- **WHEN** GitHub returns a non-2xx response during ZIP download
- **THEN** system returns HTTP 502 with an error message and does not modify the filesystem or DB

#### Scenario: Path traversal in ZIP
- **WHEN** downloaded ZIP contains an entry with a path that escapes the target directory (e.g., `../../etc/passwd`)
- **THEN** system returns HTTP 422 and discards the archive without extracting

### Requirement: Check for updates for an installed theme
The system SHALL expose `POST /api/admin/themes/:slug/check-updates` which fetches the latest release tag from GitHub for that theme's repo and updates `latest_ref` and `last_checked_at` in the DB. The response SHALL include `installed_ref`, `latest_ref`, and `update_available` (true if they differ).

#### Scenario: Update available
- **WHEN** authenticated admin checks updates for a theme where latest GitHub release differs from `installed_ref`
- **THEN** system updates `latest_ref` and `last_checked_at` in DB and returns `{ update_available: true, installed_ref, latest_ref }`

#### Scenario: Already up to date
- **WHEN** authenticated admin checks updates and latest release matches `installed_ref`
- **THEN** system returns `{ update_available: false, installed_ref, latest_ref }`

#### Scenario: Theme not found
- **WHEN** authenticated admin checks updates for a slug not in DB
- **THEN** system returns HTTP 404

### Requirement: Remove an installed runtime theme
The system SHALL expose `DELETE /api/admin/themes/:slug` which soft-deletes the theme by setting `deleted_at = NOW()`. Builtin themes (is_builtin = true) SHALL NOT be deletable and the endpoint SHALL return HTTP 403 if attempted.

#### Scenario: Successful soft delete of runtime theme
- **WHEN** authenticated admin sends `DELETE /api/admin/themes/cvwonder-theme-basic` for a non-builtin theme
- **THEN** system sets `deleted_at` in DB and returns HTTP 204

#### Scenario: Attempt to delete builtin theme
- **WHEN** authenticated admin sends `DELETE /api/admin/themes/default` for a builtin theme
- **THEN** system returns HTTP 403

#### Scenario: Theme not found
- **WHEN** authenticated admin sends `DELETE /api/admin/themes/nonexistent`
- **THEN** system returns HTTP 404

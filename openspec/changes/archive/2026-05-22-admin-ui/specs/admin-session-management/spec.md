## ADDED Requirements

### Requirement: List all sessions with pagination and search
The system SHALL expose `GET /api/admin/sessions` accepting optional query parameters `page` (default 1), `per_page` (default 25, max 100), and `q` (search by session ID prefix). The response SHALL include `items`, `page`, `per_page`, `total_items`, and `total_pages`.

#### Scenario: Returns paginated session list
- **WHEN** authenticated admin sends `GET /api/admin/sessions`
- **THEN** system returns HTTP 200 with paginated session objects including `id`, `theme_id`, `expires_at`, `created_at`, `updated_at`, and `is_expired`

#### Scenario: Search by session ID prefix
- **WHEN** authenticated admin sends `GET /api/admin/sessions?q=abc`
- **THEN** system returns only sessions whose ID starts with `abc`

#### Scenario: Empty result
- **WHEN** no sessions match the query
- **THEN** system returns HTTP 200 with `items: []` and correct pagination metadata

### Requirement: Force-expire a session
The system SHALL expose `POST /api/admin/sessions/:id/expire` which sets `expires_at = NOW()` on the session, effectively expiring it immediately without deleting it.

#### Scenario: Successful force-expire
- **WHEN** authenticated admin posts to `/api/admin/sessions/abc-123/expire`
- **THEN** system sets `expires_at = NOW()` on the session and returns HTTP 200

#### Scenario: Session not found
- **WHEN** authenticated admin posts to expire a non-existent session ID
- **THEN** system returns HTTP 404

### Requirement: Delete a session permanently
The system SHALL expose `DELETE /api/admin/sessions/:id` which permanently removes the session row from the DB.

#### Scenario: Successful delete
- **WHEN** authenticated admin sends `DELETE /api/admin/sessions/abc-123`
- **THEN** system permanently deletes the session and returns HTTP 204

#### Scenario: Session not found
- **WHEN** authenticated admin sends `DELETE` for a non-existent session ID
- **THEN** system returns HTTP 404

### Requirement: Bulk purge expired sessions
The system SHALL expose `POST /api/admin/sessions/purge` which deletes all sessions where `expires_at < NOW()`. The response SHALL include a `deleted_count` field.

#### Scenario: Purges expired sessions
- **WHEN** authenticated admin posts to `/api/admin/sessions/purge`
- **THEN** system deletes all expired sessions and returns HTTP 200 with `{ deleted_count: N }`

#### Scenario: No expired sessions
- **WHEN** authenticated admin posts to `/api/admin/sessions/purge` and no sessions are expired
- **THEN** system returns HTTP 200 with `{ deleted_count: 0 }`

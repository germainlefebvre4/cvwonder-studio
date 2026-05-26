-- name: InsertSession :one
INSERT INTO sessions (id, token_hash, yaml_content, theme_id, expires_at, user_id)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetSessionByTokenHash :one
SELECT * FROM sessions
WHERE token_hash = $1
LIMIT 1;

-- name: UpdateSession :one
UPDATE sessions
SET yaml_content = CASE WHEN $2::text = '' THEN yaml_content ELSE $2::text END,
    theme_id     = COALESCE($3, theme_id),
    updated_at   = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteSession :exec
DELETE FROM sessions WHERE id = $1;

-- name: DeleteExpiredSessions :exec
DELETE FROM sessions WHERE expires_at < NOW();

-- name: GetSessionByID :one
SELECT * FROM sessions WHERE id = $1 LIMIT 1;

-- name: ListSessionsAdmin :many
SELECT * FROM sessions
WHERE ($1::text = '' OR id::text ILIKE ($1::text || '%'))
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountSessions :one
SELECT count(*) FROM sessions
WHERE ($1::text = '' OR id::text ILIKE ($1::text || '%'));

-- name: ForceExpireSession :execrows
UPDATE sessions SET expires_at = NOW()
WHERE id = $1;

-- name: CountAndDeleteExpiredSessions :one
WITH deleted AS (
  DELETE FROM sessions WHERE expires_at < NOW() RETURNING id
)
SELECT count(*) FROM deleted;

-- name: CountActiveSessions :one
SELECT count(*) FROM sessions WHERE expires_at > NOW();

-- name: CountExpiringSoonSessions :one
SELECT count(*) FROM sessions
WHERE expires_at > NOW() AND expires_at < NOW() + INTERVAL '24 hours';

-- name: ListSessionsByUser :many
SELECT * FROM sessions
WHERE user_id = $1
  AND is_archived = FALSE
  AND expires_at > NOW()
ORDER BY created_at DESC;

-- name: ListArchivedSessionsByUser :many
SELECT * FROM sessions
WHERE user_id = $1
  AND is_archived = TRUE
  AND (archived_at IS NULL OR archived_at > NOW() - INTERVAL '30 days')
ORDER BY archived_at DESC;

-- name: ListAllSessionsByUser :many
SELECT * FROM sessions
WHERE user_id = $1
ORDER BY created_at DESC;

-- name: CountActiveSessionsByUser :one
SELECT count(*) FROM sessions
WHERE user_id = $1
  AND is_archived = FALSE
  AND expires_at > NOW();

-- name: UpdateSessionName :one
UPDATE sessions
SET name       = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateSessionTTL :one
UPDATE sessions
SET expires_at = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateSessionTheme :one
UPDATE sessions
SET theme_id   = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: ArchiveSession :one
UPDATE sessions
SET is_archived = TRUE,
    archived_at = NOW(),
    updated_at  = NOW()
WHERE id = $1
RETURNING *;

-- name: RestoreSession :one
UPDATE sessions
SET is_archived = FALSE,
    archived_at = NULL,
    updated_at  = NOW()
WHERE id = $1
RETURNING *;

-- name: DuplicateSession :one
INSERT INTO sessions (token_hash, yaml_content, theme_id, expires_at, user_id, name)
SELECT $2, s.yaml_content, s.theme_id, $3, s.user_id, s.name || ' (copie)'
FROM sessions s
WHERE s.id = $1
RETURNING *;

-- name: UpdateSessionTags :one
UPDATE sessions
SET tags       = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: IncrementViewCount :exec
UPDATE sessions
SET view_count    = view_count + 1,
    last_viewed_at = NOW()
WHERE id = $1;

-- name: UpdateLastGeneratedAt :one
UPDATE sessions
SET last_generated_at = NOW(),
    updated_at        = NOW()
WHERE id = $1
RETURNING *;

-- name: SetShareToken :one
UPDATE sessions
SET share_token_hash = $2,
    updated_at       = NOW()
WHERE id = $1
RETURNING *;

-- name: RevokeShareToken :one
UPDATE sessions
SET share_token_hash    = NULL,
    share_password_hash = NULL,
    updated_at          = NOW()
WHERE id = $1
RETURNING *;

-- name: SetSharePassword :one
UPDATE sessions
SET share_password_hash = $2,
    updated_at          = NOW()
WHERE id = $1
RETURNING *;

-- name: GetSessionByShareToken :one
SELECT * FROM sessions
WHERE share_token_hash = $1
LIMIT 1;

-- name: ClaimAnonymousSession :one
UPDATE sessions
SET user_id    = $2,
    updated_at = NOW()
WHERE id = $1
  AND user_id IS NULL
  AND expires_at > NOW()
RETURNING *;

-- name: PurgeExpiredAnonymousSessions :exec
DELETE FROM sessions
WHERE user_id IS NULL
  AND expires_at < NOW();

-- name: PurgeArchivedConnectedSessionsContent :execrows
UPDATE sessions
SET yaml_content = '',
    updated_at   = NOW()
WHERE is_archived = TRUE
  AND archived_at < NOW() - INTERVAL '30 days'
  AND user_id IS NOT NULL
  AND yaml_content != '';


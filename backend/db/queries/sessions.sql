-- name: InsertSession :one
INSERT INTO sessions (id, token_hash, yaml_content, theme_id, expires_at)
VALUES ($1, $2, $3, $4, $5)
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

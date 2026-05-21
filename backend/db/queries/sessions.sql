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
SET yaml_content = COALESCE($2, yaml_content),
    theme_id     = COALESCE($3, theme_id),
    updated_at   = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteSession :exec
DELETE FROM sessions WHERE id = $1;

-- name: DeleteExpiredSessions :exec
DELETE FROM sessions WHERE expires_at < NOW();

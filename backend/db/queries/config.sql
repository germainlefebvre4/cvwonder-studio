-- name: GetConfigByKey :one
SELECT * FROM system_config
WHERE key = $1
LIMIT 1;

-- name: UpsertConfig :one
INSERT INTO system_config (key, value)
VALUES ($1, $2)
ON CONFLICT (key) DO UPDATE
SET value      = EXCLUDED.value,
    updated_at = NOW()
RETURNING *;

-- name: InsertConfigIfAbsent :exec
INSERT INTO system_config (key, value)
VALUES ($1, $2)
ON CONFLICT (key) DO NOTHING;

-- name: ListConfig :many
SELECT * FROM system_config ORDER BY key;


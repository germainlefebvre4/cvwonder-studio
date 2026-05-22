-- name: CreateUser :one
INSERT INTO users (google_sub, email, name, avatar_url)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetUserByGoogleSub :one
SELECT * FROM users
WHERE google_sub = $1
LIMIT 1;

-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1
LIMIT 1;

-- name: UpdateUser :one
UPDATE users
SET email      = $2,
    name       = $3,
    avatar_url = $4
WHERE id = $1
RETURNING *;

-- name: UpdateUserDefaultTheme :one
UPDATE users
SET default_theme_id = $2
WHERE id = $1
RETURNING *;

-- name: DeleteUser :exec
DELETE FROM users WHERE id = $1;

-- name: GetUserTags :many
SELECT DISTINCT unnest(tags) AS tag
FROM sessions
WHERE user_id = $1
ORDER BY tag;

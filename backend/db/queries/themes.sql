-- name: UpsertTheme :one
INSERT INTO themes (id, name, slug, github_url, local_path, is_builtin)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (slug) DO UPDATE
SET name       = EXCLUDED.name,
    github_url = EXCLUDED.github_url,
    local_path = EXCLUDED.local_path,
    is_builtin = EXCLUDED.is_builtin,
    deleted_at = NULL,
    updated_at = NOW()
RETURNING *;

-- name: ListActiveThemes :many
SELECT * FROM themes
WHERE deleted_at IS NULL
ORDER BY name ASC;

-- name: GetThemeBySlug :one
SELECT * FROM themes
WHERE slug = $1 AND deleted_at IS NULL
LIMIT 1;

-- name: GetThemeByID :one
SELECT * FROM themes
WHERE id = $1 AND deleted_at IS NULL
LIMIT 1;

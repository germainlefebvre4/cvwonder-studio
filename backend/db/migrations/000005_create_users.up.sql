CREATE TABLE IF NOT EXISTS users (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    google_sub       TEXT        NOT NULL UNIQUE,
    email            TEXT        NOT NULL,
    name             TEXT        NOT NULL,
    avatar_url       TEXT        NOT NULL DEFAULT '',
    default_theme_id UUID        REFERENCES themes(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

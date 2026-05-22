ALTER TABLE sessions
    ADD COLUMN IF NOT EXISTS user_id              UUID        REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS name                TEXT,
    ADD COLUMN IF NOT EXISTS is_archived         BOOLEAN     NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS archived_at         TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS share_token_hash    TEXT,
    ADD COLUMN IF NOT EXISTS share_password_hash TEXT,
    ADD COLUMN IF NOT EXISTS last_generated_at   TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS tags                TEXT[]      NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS view_count          INTEGER     NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_viewed_at      TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_sessions_user_id     ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_is_archived ON sessions(is_archived);
CREATE INDEX IF NOT EXISTS idx_sessions_archived_at ON sessions(archived_at);
CREATE INDEX IF NOT EXISTS idx_sessions_tags        ON sessions USING GIN (tags);

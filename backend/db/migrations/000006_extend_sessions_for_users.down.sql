DROP INDEX IF EXISTS idx_sessions_tags;
DROP INDEX IF EXISTS idx_sessions_archived_at;
DROP INDEX IF EXISTS idx_sessions_is_archived;
DROP INDEX IF EXISTS idx_sessions_user_id;

ALTER TABLE sessions
    DROP COLUMN IF EXISTS last_viewed_at,
    DROP COLUMN IF EXISTS view_count,
    DROP COLUMN IF EXISTS tags,
    DROP COLUMN IF EXISTS last_generated_at,
    DROP COLUMN IF EXISTS share_password_hash,
    DROP COLUMN IF EXISTS share_token_hash,
    DROP COLUMN IF EXISTS archived_at,
    DROP COLUMN IF EXISTS is_archived,
    DROP COLUMN IF EXISTS name,
    DROP COLUMN IF EXISTS user_id;

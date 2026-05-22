ALTER TABLE themes
  ADD COLUMN IF NOT EXISTS description      TEXT,
  ADD COLUMN IF NOT EXISTS preview_url      TEXT,
  ADD COLUMN IF NOT EXISTS installed_ref    TEXT,
  ADD COLUMN IF NOT EXISTS latest_ref       TEXT,
  ADD COLUMN IF NOT EXISTS last_checked_at  TIMESTAMPTZ;

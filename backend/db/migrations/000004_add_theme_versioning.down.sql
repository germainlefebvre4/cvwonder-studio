ALTER TABLE themes
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS preview_url,
  DROP COLUMN IF EXISTS installed_ref,
  DROP COLUMN IF EXISTS latest_ref,
  DROP COLUMN IF EXISTS last_checked_at;

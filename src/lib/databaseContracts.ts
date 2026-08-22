export const DATABASE_SCHEMA_VERSION = 5;
export const BACKUP_FORMAT_VERSION = 2;

export const LITE_03A1_MIGRATION_SQL = `
  BEGIN;
  ALTER TABLE properties ADD COLUMN block_number INTEGER
    CHECK(block_number IS NULL OR (typeof(block_number) = 'integer' AND block_number BETWEEN 1 AND 12));
  PRAGMA user_version = 4;
  COMMIT;
`;

export const LITE_03A2_MIGRATION_SQL = `
  BEGIN;
  CREATE TABLE contact_phones (
    id TEXT PRIMARY KEY NOT NULL,
    contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    phone_normalized TEXT NOT NULL CHECK(
      length(phone_normalized) BETWEEN 2 AND 16
      AND substr(phone_normalized, 1, 1) = '+'
      AND substr(phone_normalized, 2) NOT GLOB '*[^0-9]*'
    ),
    phone_display TEXT NOT NULL,
    label TEXT NOT NULL DEFAULT '',
    is_primary INTEGER NOT NULL DEFAULT 0 CHECK(is_primary IN (0, 1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(contact_id, phone_normalized)
  );
  CREATE INDEX idx_contact_phones_contact ON contact_phones(contact_id);
  CREATE INDEX idx_contact_phones_normalized ON contact_phones(phone_normalized);
  CREATE UNIQUE INDEX idx_contact_phones_one_primary ON contact_phones(contact_id) WHERE is_primary = 1;
  INSERT INTO contact_phones(id,contact_id,phone_normalized,phone_display,label,is_primary,created_at,updated_at)
    SELECT 'legacy-phone:' || id,id,phone,phone,'',1,created_at,updated_at FROM contacts;
  PRAGMA user_version = 5;
  COMMIT;
`;

export function isSupportedBackup(snapshot: unknown): boolean {
  if (!snapshot || typeof snapshot !== 'object') return false;
  const value = snapshot as Record<string, unknown>;
  if (value.format !== 'viewstate-lite' || !value.data) return false;
  if ([1,BACKUP_FORMAT_VERSION].includes(Number(value.backupFormatVersion))) return true;
  return value.backupFormatVersion === undefined && [1, 2, 3].includes(Number(value.version));
}

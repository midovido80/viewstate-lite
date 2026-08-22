export const DATABASE_SCHEMA_VERSION = 4;
export const BACKUP_FORMAT_VERSION = 1;

export const LITE_03A1_MIGRATION_SQL = `
  BEGIN;
  ALTER TABLE properties ADD COLUMN block_number INTEGER
    CHECK(block_number IS NULL OR (typeof(block_number) = 'integer' AND block_number BETWEEN 1 AND 12));
  PRAGMA user_version = 4;
  COMMIT;
`;

export function isSupportedBackup(snapshot: unknown): boolean {
  if (!snapshot || typeof snapshot !== 'object') return false;
  const value = snapshot as Record<string, unknown>;
  if (value.format !== 'viewstate-lite' || !value.data) return false;
  if (value.backupFormatVersion === BACKUP_FORMAT_VERSION) return true;
  return value.backupFormatVersion === undefined && [1, 2, 3].includes(Number(value.version));
}

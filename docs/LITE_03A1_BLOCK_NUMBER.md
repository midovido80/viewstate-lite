# LITE-03A1 — Block Number

Date: 2026-08-22

## Frozen scope

This stage adds only an optional property Block Number. It does not implement international phones, multiple phones, batch role overrides, WhatsApp inbound sharing, ViewState Cards, near matches, embedded maps, or media-complete backup.

## Version contracts

- App version: 0.3.0
- Android versionCode: 6
- Database Schema Version: 4
- Backup Format Version: 1
- ViewState Card Schema Version: not created

Database Schema Version and Backup Format Version are independent constants. Legacy JSON backups identify their older coupled contract through `version` values 1–3. New backups use `backupFormatVersion` and separately record `databaseSchemaVersion`.

## Exact migration

```sql
BEGIN;
ALTER TABLE properties ADD COLUMN block_number INTEGER
  CHECK(block_number IS NULL OR (typeof(block_number) = 'integer' AND block_number BETWEEN 1 AND 12));
PRAGMA user_version = 4;
COMMIT;
```

No existing table, column, index, or record is removed or rewritten.

## Compatibility

- Existing properties receive SQLite `NULL` and remain valid.
- Fresh installs run the same additive migration after the existing v1–v3 migrations.
- Legacy backup versions 1–3 restore a missing `block_number` as `NULL`.
- Backup Format V1 exports `block_number` with each property row.
- Restore remains transactional; an invalid out-of-range Block Number fails instead of partially committing.

## Rollback limitation

V0.2.2 / Schema V3 does not understand Block Number. Downgrading cannot preserve or display the new field. No destructive downgrade migration is supplied.

## Business rules

- Block Number is optional.
- Allowed persisted values are integers 1–12.
- The database enforces the allowed range.
- Block Number is not PACI.
- Block Number is searchable and shared when available.
- Block Number is not a matching criterion in LITE-03A1.

## Verification target

- Upgrade Schema V3 → V4 without rewriting existing records.
- Accept `NULL`, 1, and 12.
- Reject 0 and 13.
- Preserve old backup compatibility.
- Include the field in new backups.
- Verify Arabic/English labels, RTL/LTR layout, property edit persistence, Global Search, details, and sharing.

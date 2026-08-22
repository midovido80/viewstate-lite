# LITE-03A3 — Batch Contact Import Controls

Status: Founder-approved implementation scope.

## Contracts

- App Version: 0.5.0
- Android versionCode: 8
- Database Schema: V5 (unchanged)
- Backup Format: V2 (unchanged)
- ViewState Card Schema: none

No database migration or persisted import-report data is introduced.

## Scope

- Default batch role plus an optional role override for each row.
- Applying the default role to selected rows is immediate unless it replaces an override, in which case the app confirms first.
- No rows are selected by default.
- Whole-row selection with immediate visual feedback; role controls, conflict links, and batch-number radio controls do not change row selection.
- Select visible, clear visible, and clear all. Search never discards hidden selections.
- Full Arabic and English role and action labels without truncation.
- Chunked, one-time phone preparation outside render.
- Compact import result with expandable issue details.

## Phone-level preflight

Preflight separates every selected row's phone numbers, rather than rejecting the complete row or batch:

- Valid non-conflicting numbers are executable.
- Invalid numbers and duplicates within the same person are excluded and counted.
- A number already stored for another person is excluded and linked to that existing person.
- A number shared by device rows has no default winner. A radio selection assigns it to exactly one row for this batch.
- A person with any executable phone remains importable. A person with none remains visible but disabled with the reason.

Only executable rows and executable phone numbers enter the write transaction. Expected conflicts do not block unrelated valid rows. An unexpected technical write failure rolls back the entire executable transaction.

## Reporting

The primary result shows imported people, saved phone numbers, and the total issue count. Details show invalid numbers, within-person duplicates, stored-person conflicts, and batch-conflict exclusions. Unselected rows are secondary information, not a warning. The report is transient and is not analytics or backup data.

## Performance evidence

The pure preparation path is covered with 5,000 synthetic contacts and yields between 100-contact chunks. This is not a claim of physical-device performance; Android device testing remains required for that claim.

## Excluded

No LITE-03B, role additions, analytics, persistent import history, CSV/PDF reports, database migration, or backup-format change.

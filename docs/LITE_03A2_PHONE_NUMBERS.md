# LITE-03A2 — International and Multiple Phone Numbers

Date: 2026-08-22

## Frozen scope target

- Kuwait, GCC and international numbers
- Multiple numbers per person
- Exactly one Primary when numbers exist
- Import all usable device numbers
- Search every stored number
- Normalized duplicate and conflict detection
- Explicit number choice for Call and WhatsApp
- Backup Format V2

LITE-03A3 role overrides and advanced import reporting are excluded.

## Version contracts

- App: 0.4.0
- Android versionCode: 7
- Database Schema: 5
- Backup Format: 2
- ViewState Card Schema: not created

## Schema V5 migration

Schema V5 creates `contact_phones` with:

- Foreign key to `contacts`
- Original `phone_display` and `label`
- Normalized E.164 `phone_normalized`
- Per-contact normalized uniqueness
- Non-unique normalized lookup index for conflict detection
- Partial unique index allowing at most one Primary per person

The database accepts only a leading `+` followed by 1–15 digits. Country-specific possibility validation is performed offline by the Phone Domain Service.

Every V4 `contacts.phone` is backfilled directly as the Primary phone. Malformed test data fails the migration transaction safely.

## Authority and compatibility mirror

`contact_phones` is authoritative. `contacts.phone` remains temporarily for compatibility and mirrors the normalized Primary number. Only the Contact/Phone Repository writes the mirror.

## Conflict policy

- Duplicate normalized numbers inside one person are rejected.
- A number already owned by another person produces a conflict.
- No automatic merge, overwrite or reassignment occurs.
- Manual entry offers open existing, skip number or cancel.
- Device import exposes the existing record and does not import the conflicting candidate automatically.
- No global database uniqueness is placed on `phone_normalized`.

## Normalization

- Eight-digit Kuwait local input defaults to `+965`.
- Explicit `+` and `00` country prefixes are preserved and normalized to E.164.
- Ambiguous non-Kuwait numbers without `+` or `00` are rejected with guidance.
- Acceptance uses E.164 parsing plus `isPossible`, not strict `isValid` alone.
- Display values, labels, imported names and notes are preserved exactly.

## Backup V2

Backup V2 includes `data.contactPhones`. Restore replaces phone rows for contacts contained in the backup within the existing database transaction. Backup V1 and simple legacy backups can rebuild a single Primary from `contacts.phone`. Advanced historical shared-number recovery is intentionally excluded before pilot.

## Rollback limitation

Older app versions see only the Primary compatibility mirror and cannot restore Backup V2. No destructive downgrade migration is provided.

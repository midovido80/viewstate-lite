# LITE-03A3.1 — Import Compliance Hardening

Status: Founder-approved implementation scope.

## Contracts

- App Version: 0.5.1
- Android versionCode: 9
- Database Schema: V5 (unchanged)
- Backup Format: V2 (unchanged)
- ViewState Card Schema: none
- Database migration: none

## Changes

- The Domain Import Plan is the single authority for executable rows, preserved contact data, roles, Primary assignment, and transient report totals.
- The final repository preflight excludes newly discovered stored conflicts at phone-number level. It imports remaining executable phone numbers and drops a row only when no number remains.
- Expected late conflicts do not enter the write transaction and do not block unrelated rows.
- The executable batch is written in one transaction. An unexpected SQLite write failure rolls back all contacts and phones in that executable batch.
- Default `libphonenumber-js` metadata replaces `/max`; this matches the approved `isPossible()` policy and removes unused strict-validation metadata.

## Verification requirements

- Domain-plan totals, role overrides, exact imported identity fields, mixed-phone conflicts, late conflicts, search selection persistence, and visible selection controls.
- Source-level UI contracts for whole-row selection, nested-action propagation isolation, concise result and expandable details.
- Real SQLite commit and injected-failure rollback using the production batch writer.
- 5,000-contact synthetic preparation and bounded SQLite preflight parameters.
- Full regression, TypeScript, Expo Android prebuild, and Android release build.

Synthetic and build verification do not claim physical-device responsiveness or visual certification. Those remain pilot smoke-test items when an Android device or emulator is available.

## Excluded

No persistent conflict-review history, onboarding, progress estimation, Set/Map redesign, WhatsApp inbound import, ViewState Card, Near Matches, location changes, media backup, cloud, authentication, or LITE-03B.

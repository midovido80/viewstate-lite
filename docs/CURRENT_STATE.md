# ViewState Lite — Current State

Date: 2026-08-22

## Implemented

- Isolated Expo 54 project with Android package `com.viewstate.lite`
- Arabic-first light V001 shell and native tab navigation
- LITE-03A1 / V0.3.0 with an optional property Block Number from 1 through 12
- Local SQLite v4 schema with an additive, versioned migration
- Contacts, five approved roles and Kuwait phone normalization
- Batched device-contact import with in-memory deduplication, full-row selection, and verbatim device names/notes
- LITE-02.1 complete Arabic/English UI localization with locally persisted language selection
- Complete approved contact-role and property-type labels without abbreviation
- Blocking backup confirmation that photo and video files are not included
- Rental-only property capture with drafts, media copy, PACI and location
- Multiple requested and offered records for every contact
- Explained bidirectional local matching with exact area/type gates, rent tolerance and a 70% threshold
- Safe-share preview with owner/source/private notes always excluded and explicit PACI/location toggles
- Text-record backup and transactional restore
- Global search across people and properties
- Block Number included in property create/edit, drafts, details, Global Search and normal property sharing
- Add-person choice between manual entry and device import
- Contact import starts with no contacts selected
- Searchable Kuwait area picker grouped by all six governorates
- Fast 1–10 room and bathroom selectors
- Conditional commercial fields for floors and offices
- Google Maps launch/link capture flow with current-location fallback
- Additive SQLite v2, v3 and v4 migrations preserving existing records
- Independent Database Schema V4 and Backup Format V1 contracts, with legacy backup v1–v3 restore compatibility
- Keyboard-aware forms and explicit Android text/cursor colors

## Verified

- Domain and migration tests: 34 passing locally
- Git whitespace validation: passing
- Current repository is independent from `viewstate-app`

## LITE-03A1 data safety

- Schema V4 adds only nullable `properties.block_number`
- Database `CHECK` enforcement permits only `NULL` or integers 1–12
- Existing properties are preserved and read with `blockNumber: null`
- Legacy backups restore missing Block Number as `null`
- New backups include Block Number in property rows
- Downgrading to V0.2.2 hides Block Number because Schema V3 does not understand the field

## Not frozen yet

- Device permissions and contacts import behavior
- SQLite behavior on Android
- Image/video persistence after real device reinstall
- WhatsApp and WhatsApp Business share-sheet behavior
- Complete media backup archive
- APK installation on Honor X9
- LITE-03A1 visual and physical-device verification in Arabic and English

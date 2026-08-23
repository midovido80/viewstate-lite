# ViewState Lite — Current State

Date: 2026-08-23

## Implemented

- Isolated Expo 54 project with Android package `com.viewstate.lite`
- Arabic-first light V001 shell and native tab navigation
- LITE-03 Property Draft Lifecycle Fix / V0.5.5 including all V0.5.4 simplicity and V0.5.3 interaction-reliability fixes
- Local SQLite v5 schema with additive, versioned migrations
- Multiple phone numbers per person with one Primary number
- `contact_phones` as the authoritative source and `contacts.phone` as a transitional Primary mirror
- Contacts, five approved roles and offline E.164 phone normalization
- Batched device-contact import with one classification for the whole batch, full-row selection, visible-result controls, and verbatim device names/notes
- Per-contact role overrides are removed from the import UI to restore the approved simple A2 interaction
- Phone import is reachable only from Add person; duplicate Home and Contacts-tab shortcuts are removed
- Import cards show only executable people and usable phones; technical conflicts stay enforced below the UI without card clutter
- Phone-level import preflight keeps valid numbers executable while excluding invalid, stored and unresolved intra-batch conflicts; same-number Android service aliases inside one contact are silently collapsed
- Atomic executable-row import with full rollback on an unexpected technical write failure
- Central Domain Import Plan for executable rows, roles, Primary assignment and report totals
- Final repository preflight excludes newly discovered stored conflicts per phone without blocking unrelated executable rows
- Minimal phone metadata aligned with the approved `isPossible()` policy
- Compact import success summary contains only saved people and phone totals
- Device-contact import preserves and imports every usable phone display value and available label
- LITE-02.1 complete Arabic/English UI localization with locally persisted language selection
- Complete approved contact-role and property-type labels without abbreviation
- Blocking backup confirmation that photo and video files are not included
- Rental-only property capture with drafts, media copy, PACI and location
- Multiple requested and offered records for every contact
- Explained bidirectional local matching with exact area/type gates, rent tolerance and a 70% threshold
- Safe-share preview with owner/source/private notes always excluded and explicit PACI/location toggles
- Text-record backup and transactional restore
- Global search across people and properties
- Contact and Global Search cover every stored normalized/display phone number
- Call actions are available for each explicit phone choice; WhatsApp actions explicitly choose standard WhatsApp or WhatsApp Business
- Block Number included in property create/edit, drafts, details, Global Search and normal property sharing
- Add-person choice between manual entry and device import
- Contact import starts with no contacts selected
- Searchable Kuwait area picker grouped by all six governorates
- Fast 1–10 room and bathroom selectors
- Conditional commercial fields for floors and offices
- Google Maps launch/link capture flow with current-location fallback
- Additive SQLite v2 through v5 migrations
- Independent Database Schema V5 and Backup Format V2 contracts
- Backup V2 saves and restores `contactPhones`; simple Backup V1/legacy restore compatibility remains
- Keyboard-aware forms and modals keep focused fields visible, deliver the first tap while the keyboard is open, and retain extra bottom clearance
- Property create/edit has deterministic next-section scrolling, immediate save progress, a save lock, failure feedback, serialized draft preservation, media-isolated failure reporting, and original creation-time preservation
- Device-contact local search has a pale-blue background, strong red border, search icon and explicit Arabic/English local-search label
- WhatsApp and WhatsApp Business use separate explicit Android package intents
- Property, activity, block and Kuwait-area pickers open without transition delay and allow full wrapped Arabic/English labels

## Verified

- Domain and migration suite expanded for international numbers, multiple numbers, Primary rules, search, actions, import and Backup V2
- Import-control suite covers mixed valid/invalid rows, phone-level conflicts, safe selection and 5,000-contact synthetic preparation
- Compliance suite injects a real SQLite write failure to verify full atomic rollback and covers late conflicts, report totals and UI interaction contracts
- Git whitespace validation: passing
- Current repository is independent from `viewstate-app`

## LITE-03A2 data policy

- Schema V5 adds `contact_phones` and backfills each V4 `contacts.phone` as Primary
- The database enforces E.164 structure, per-contact uniqueness and at most one Primary
- The Phone Repository enforces exactly one Primary and reports cross-contact conflicts
- Cross-contact conflicts are never merged, overwritten or reassigned automatically
- Imported names, notes, phone display values and labels remain unchanged
- Country possibility validation stays in the offline Phone Domain Service

## Not frozen yet

- Device permissions and contacts import behavior
- SQLite behavior on Android
- Image/video persistence after real device reinstall
- WhatsApp and WhatsApp Business share-sheet behavior
- Complete media backup archive
- APK installation on Honor X9
- LITE-03A1 visual and physical-device verification in Arabic and English
- LITE-03A2 physical-device verification for multi-number Call/WhatsApp and large contact import

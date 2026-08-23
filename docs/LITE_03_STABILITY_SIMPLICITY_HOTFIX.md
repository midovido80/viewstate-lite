# LITE-03 Stability & Simplicity Hotfix — V0.5.2

Date: 2026-08-23

## Frozen contracts

- App version: `0.5.2`
- Android versionCode: `10`
- Database Schema: `V5` (unchanged)
- Backup Format: `V2` (unchanged)
- ViewState Card Schema: not created

## Implemented scope

- Restored one simple classification for the entire contact-import batch and removed per-contact role controls from the UI.
- Retained empty initial selection, full-row selection, all usable phone numbers, verbatim device names/notes, chunked preparation, normalized conflict handling and atomic import.
- Added explicit property validation, keyboard dismissal, immediate double-tap lock, visible saving state, safe error feedback and draft retention on failure.
- Preserved the original `createdAt` during property edits and isolated media-copy failures from the saved property record.
- Removed picker transition animation and any pre-open persistence work; block, activity, generic choice and Kuwait-area labels can wrap without clipping.
- Increased keyboard bottom clearance on shared form containers and made picker/import result lists keyboard-aware.
- Added an in-app choice between standard WhatsApp and WhatsApp Business using the explicit Android package targets `com.whatsapp` and `com.whatsapp.w4b`.
- Kept the existing Safe Share message and its privacy exclusions. ViewState Card remains outside this hotfix.

## Functional matrix

| Journey | Automated or source-level evidence | Physical-device evidence |
| --- | --- | --- |
| Manual person create/edit/reopen | Existing repository/regression suite | Not available in this environment |
| Device import | Empty selection, one batch role, row tap, phone/conflict/import contracts | Not available in this environment |
| Property create/edit/reopen | Save/draft/version contracts plus repository/regression suite | Not available in this environment |
| Block and area pickers | Immediate modal and full-label UI contracts | Not available in this environment |
| Notes and keyboard | Shared keyboard-aware container and modal/list contracts | Not available in this environment |
| Requirements and matching | Existing domain/regression suite | Not available in this environment |
| WhatsApp apps | Two explicit package-target contracts and Android release build | Requires a device with both apps installed |
| Arabic/English | Translation-key type contract and label layout contracts | Not available in this environment |

No physical Honor X9, Android emulator, WhatsApp installation or WhatsApp Business installation was available in the implementation environment. No claim of such testing is made. The CI run and APK artifact are recorded on the pull request before freeze.

## Impact review

- No database migration and no backup-format change.
- No deletion or rewriting of existing people, phones, properties, requirements or media.
- `viewstate-app` is untouched.
- LITE-03B and ViewState Card are not started.

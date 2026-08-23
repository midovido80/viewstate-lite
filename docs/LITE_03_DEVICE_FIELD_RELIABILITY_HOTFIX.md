# LITE-03 Device Field Reliability Hotfix — V0.5.4

Date: 2026-08-23

## Contracts

- App version: `0.5.4`
- Android versionCode: `12`
- Database Schema: `V5` (unchanged)
- Backup Format: `V2` (unchanged)
- ViewState Card Schema: not created

This is a UI/lifecycle reliability hotfix. It requires no persisted-data migration and does not touch `viewstate-app`, LITE-03B, cloud services, authentication or ViewState Card.

## Root-cause corrections

1. The successful property-save path now permanently stops its autosave generation before clearing the draft. Component cleanup can no longer recreate `property:new` with the saved property's values.
2. Forced timed scrolling and focus jumps were removed from the property form. Pickers and location open without competing keyboard/scroll animations, while the shared keyboard-aware container keeps focused inputs reachable.
3. Bedroom and bathroom selection uses a light-blue selected surface, strong blue border and dark-blue number so selection cannot visually disappear.
4. Contact preparation is cancelled when the import screen unmounts. Thousands of contacts can no longer continue normalizing in a stale background screen and overlap later interaction.
5. Unambiguous Android provider shadow rows whose display name is the phone number are folded into the real named phone-book contact. Two genuinely named contacts are never merged. The real contact's name and notes remain verbatim.
6. Device import remains reachable through Add person; redundant Home and People-tab import shortcuts are removed.
7. Saved videos are shown in property details and delegated to the installed Android system video player. No embedded video framework or continuous decoding was added.
8. Media extensions are determined at selection time from the device filename/MIME type, avoiding an unreliable URI suffix assumption during save.

## Verification contract

- Regression tests cover the frozen Schema V5/Backup V2 contracts, permanent draft cancellation, selected-number visibility, the single import entry point, cancellable contact preparation, Android shadow-row collapse, genuine shared-number conflicts and system video playback wiring.
- The complete test suite, TypeScript, Expo Android prebuild and Gradle release APK run once in GitHub Actions on the pull request.
- No physical Honor X9, installed WhatsApp pair or Android emulator is available in the build environment. Physical-device behavior is therefore not claimed until Founder pilot verification.

## Freeze rule

Merge and freeze only after CI succeeds and the CTO review records the exact commit and APK artifact. Then WAIT. LITE-03B must not start.

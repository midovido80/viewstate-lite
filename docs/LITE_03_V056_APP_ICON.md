# LITE-03 App Icon Update — V0.5.6

## Scope

- Replace the generic Android launcher icon with the Founder-approved ViewState house and VA mark.
- Use a square master icon and a separate transparent adaptive foreground over a deep navy background.
- Remove all small wording from the launcher icon so the brand mark remains legible at phone-icon sizes.
- Do not change splash screen, application UI, business logic, persisted data, matching, sharing, contacts, or properties.

## Contracts

- App version: `0.5.6`
- Android versionCode: `14`
- Database schema: `V5` unchanged
- Backup format: `V2` unchanged
- No migration

## Verification

- Both icon assets are lossless 1024×1024 PNG files.
- The adaptive foreground contains transparency and stays inside circular and rounded-square safe masks.
- Expo prebuild must materialize Android launcher resources before the release APK is accepted.

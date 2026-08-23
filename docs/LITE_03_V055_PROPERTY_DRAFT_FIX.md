# LITE-03 Property Draft Lifecycle Fix — V0.5.5

## Scope

- A new Add Property journey always starts with the approved blank defaults.
- A previously unsaved draft is not injected into the new form. It remains recoverable through an explicit Restore previous draft action.
- Successful property save permanently cancels pending autosave work before clearing the draft, so screen cleanup cannot recreate the saved form as a new draft.
- Failed saves continue to retain the user's current input.
- Editing an existing property continues to load that property's persisted values.

## Contracts

- App version: `0.5.5`
- Android versionCode: `13`
- Database schema: `V5` unchanged
- Backup format: `V2` unchanged
- No migration and no persisted-data deletion

## Acceptance checks

- Save property A, return to Add Property, and see a blank form.
- An interrupted unsaved draft is offered for explicit recovery and is never restored silently.
- Autosave cleanup after a successful save cannot recreate `property:new`.
- Create, edit, draft failure handling, Arabic/English labels, TypeScript, domain tests, prebuild, and release APK remain in the build gate.

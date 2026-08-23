# LITE-03 Interaction Reliability Hotfix — V0.5.3

Date: 2026-08-23

## Frozen contracts

- App version: `0.5.3`
- Android versionCode: `11`
- Database Schema: `V5` (unchanged)
- Backup Format: `V2` (unchanged)
- ViewState Card Schema: not created

No persisted-data migration is required. This hotfix does not touch `viewstate-app`, LITE-03B, cloud services, authentication or ViewState Card.

## User-reported failures addressed

1. Android service aliases (Message, Voice call, Video call and voicemail) that expose the same normalized number inside one phone contact are silently collapsed into one real number. Genuinely different numbers remain available, and cross-contact conflicts remain protected.
2. Standard WhatsApp and WhatsApp Business now use explicit Android package intents through the supported Expo native intent API. The two targets remain separate choices.
3. Device-contact search is visibly local: pale-blue background, strong red border, search icon and an explicit Arabic/English label. It still searches by name or number.
4. Shared keyboard-aware forms deliver taps while the keyboard is open, preserve the focused field above the keyboard and keep extra bottom clearance.
5. Property capture scrolls deterministically through area, block, rent, bedrooms, bathrooms, commercial details, size and description.
6. Number chips dismiss the keyboard and receive the first tap with visible pressed feedback.
7. Property Save is locked against double taps, renders its saving state before SQLite/media work, preserves the draft on failure and cancels queued autosaves before clearing a successful draft.
8. Draft writes for person, requirement and property forms are debounced and serialized instead of writing SQLite on every keystroke.

## Acceptance verification

- Regression contracts cover V0.5.3 identity while keeping Schema V5 and Backup V2.
- Device-contact tests cover multiple Android service aliases for one normalized number.
- Static interaction contracts cover explicit WhatsApp packages, local-search colors/icon/label, first-tap keyboard behavior, save locking and serialized draft clearing.
- Full domain tests, TypeScript, Expo Android prebuild and Gradle release APK are executed once in GitHub Actions for the PR.

## Physical-device limitation

The reported failures were reproduced by the Founder on a real phone and informed this patch. The build environment has no Honor X9 or Android device containing both WhatsApp applications, so it must not claim that the corrected APK completed a real send or a complete visual-device pass. Those two checks remain Founder pilot acceptance after installing the generated APK.

## Freeze rule

Merge and freeze only after the single full CI run succeeds and the CTO review records the exact commit and artifact. Then WAIT. LITE-03B must not start.

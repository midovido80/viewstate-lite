# ViewState Lite

Personal offline real-estate organizer for Android. This repository is fully
independent from `midovido80/viewstate-app`.

## LITE-02 / V0.2 scope

- Local contacts with five approved roles
- Rental properties with photos, video, PACI and map link
- Multiple requested and offered records per contact
- Explained bidirectional matching with a 70% threshold
- Safe WhatsApp / WhatsApp Business preview with private-by-default location and PACI
- Local SQLite persistence, drafts, export and restore
- Fast bulk contact import with duplicate detection
- Arabic-first RTL UI with English support

## Safety boundary

No server, authentication, marketplace, broker network, commission management,
sales workflow, analytics or cloud synchronization is included.

## Development

```bash
pnpm install
pnpm start
pnpm typecheck
pnpm test
```

Android APK builds use EAS preview profile:

```bash
pnpm exec eas build --platform android --profile preview
```

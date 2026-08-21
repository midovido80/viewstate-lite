# ViewState Lite

Personal offline real-estate organizer for Android. This repository is fully
independent from `midovido80/viewstate-app`.

## V0.1 scope

- Local contacts with five approved roles
- Rental properties with photos, video, PACI and map link
- Tenant requirements and simple bidirectional matching
- WhatsApp / WhatsApp Business-ready property sharing
- Local SQLite persistence, drafts, export and restore
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


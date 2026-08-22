# ViewState Lite LITE-03 — Scope Lock

## Workflow

Founder → CTO Review → Impact Analysis → Approval → Implementation → Testing →
CTO Review → Freeze → WAIT.

## Invariants

1. Simplicity and speed.
2. Capture first, enrich later.
3. No silent data loss.
4. Private by default and explicit sharing.
5. Business rules live outside UI components.
6. Persisted-data changes require versioned migrations.
7. No changes to `viewstate-app` or ViewState Platform.
8. Rental-only in LITE-03.
9. UI-language changes must never translate or mutate user-entered/imported data.

## LITE-02 approved additions

- Explained match cards with a 70% eligibility threshold.
- Safe share preview: private notes and owner/source identities are never shared; PACI and exact location require explicit toggles.
- Duplicate prevention during manual entry and device import, with a direct path to the existing record.
- Every contact can contain multiple requested and offered records; a role controls ordering only and never blocks either section.

## LITE-03 approved additions

- LITE-03A: import a rental request or offered rental property from pasted WhatsApp/WhatsApp Business text, review before saving, and preserve the original source text.
- LITE-03C: capture arbitrary text immediately as a local draft and enrich it later.
- Contact import resilience, distinct local search, complete interface translation and simple visual polish.
- Phone contact names and notes remain byte-for-byte application values from the Android contact provider; UI translation applies only to interface labels.

## Approved contact roles

Tenant, Owner, Broker, Real Estate Company, Building Guard.

## Deferred

Sales, login, cloud sync, network, marketplace, commissions, tasks, AI and analytics.

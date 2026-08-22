# LITE-03 Persisted Data Impact Analysis

Date: 2026-08-22

## Approved scope

- LITE-03A: WhatsApp text → review → rental request/property → matches.
- LITE-03C: quick local capture → saved draft → later completion.
- Approved LITE-02 quality corrections for contacts import, translation and UX.

## Schema impact

Schema version increases from 3 to 4 through one additive migration:

```sql
CREATE TABLE quick_captures (
  id TEXT PRIMARY KEY NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

No table, column, index or existing record is removed or rewritten. Contact storage is unchanged because `contacts.name` and `contacts.notes` already support the required imported values.

## Compatibility and data safety

- Existing schema versions 1–3 migrate forward without changing stored contacts, requirements, properties, media or working drafts.
- Backup version 4 adds `captures`; restore still accepts versions 1, 2 and 3 with an empty capture list.
- Quick-capture restore merges by ID and keeps the newest `updated_at` value.
- The WhatsApp source text is kept in the saved requirement notes or property shared description.
- A working WhatsApp draft is cleared only after its final record is successfully persisted.
- Imported phone contact names and notes are stored without translation, normalization or trimming. Only the Kuwait phone number is normalized for duplicate safety and matching.

## Explicit non-impact

No cloud sync, server, login, sales, marketplace, commission, tasks, analytics or changes to `viewstate-app` are included.

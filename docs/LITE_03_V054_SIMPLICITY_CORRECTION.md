# LITE-03 Simplicity Correction — V0.5.4

Founder-approved correction after physical review rejected the import UX in the previous APK.

- App: `0.5.4`; Android versionCode: `12`.
- Includes all V0.5.3 Interaction Reliability fixes already merged into `main`.
- Database remains `V5`; Backup remains `V2`; no migration.
- Import from phone exists only inside Add person.
- Duplicate import shortcuts are removed from Home and Contacts.
- Import cards display only executable contacts and usable phone numbers.
- Technical invalid/duplicate/stored/batch conflict messages are removed from cards and from the success dialog.
- Duplicate/conflict prevention remains enforced in the domain and repository layers; no automatic merge or overwrite is introduced.
- Names, notes, phone display values and labels remain verbatim.
- LITE-03B and ViewState Card remain excluded; `viewstate-app` is untouched.

Physical-device confirmation remains required after installing the CI APK.

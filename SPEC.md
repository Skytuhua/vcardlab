# SPEC — vcardlab v1

> Phase 2 product spec. The binding definition of what v1 is and is not.

## Product

A privacy-first, 100% in-browser vCard (`.vcf`) contacts workbench. All processing happens
locally in the browser; no contact data is ever uploaded or transmitted.

## v1 feature set

### 1. Import
- Drag-and-drop or file-picker; accept **one or many** `.vcf` files at once.
- Parse vCard **2.1, 3.0, and 4.0** correctly:
  - line unfolding (continuation lines), property grouping (`item1.TEL`),
    parameters (`TYPE=`, `CHARSET=`, `ENCODING=`), multi-value fields,
    escaped characters (`\,` `\;` `\n`), structured `N` / `ADR`.
  - **Quoted-Printable** decoding (common in 2.1 Android exports) and charset handling.
- Robust to malformed cards: a bad card is skipped and reported, never crashes the app.
- Importing multiple files **merges** them into one working set (implicit merge).

### 2. View & search
- Contact table: Name, Organization, Phone(s), Email(s), with total count.
- Full-text **search/filter** across all fields; **sort** by name.
- Click a contact to open a detail panel showing **every** parsed field.
- Real empty / loading / result-count states.

### 3. Edit
- Edit a contact's fields (name, phones, emails, org, title, address, note, etc.).
- Add a new contact; delete one or many selected contacts.

### 4. De-duplicate
- Detect duplicate groups using configurable matching: normalized **phone**,
  lowercased **email**, and/or **full name**.
- Review duplicate groups; **merge** a group into a single contact (field union,
  value de-duplication). "Merge all groups" one-click action.

### 5. Clean / fix
- Decode quoted-printable / fix mojibake to clean UTF-8.
- Trim whitespace; drop empty/blank contacts.
- **Strip embedded photos** (privacy + file-size) as a toggle.
- Optional phone-number normalization (consistent formatting).

### 6. Export / split / convert
- Export the working set as:
  - **vCard** — choose output version (2.1 / 3.0 / 4.0); output as
    **one combined file**, **N contacts per file**, or **one card per file** (ZIP).
  - **CSV** — spreadsheet/CRM-friendly columns (Google/Outlook-style headers).
  - **JSON** — structured, machine-readable.
- All exports are generated client-side and downloaded via Blob URLs.

## Primary user flows
1. **Convert privately:** drop `contacts.vcf` → review table → Export → CSV → download.
2. **Merge + dedupe:** drop several `.vcf` files → Find duplicates → Merge all → Export vCard.
3. **Split for import:** drop one big `.vcf` → Export → "one card per file" → download ZIP.
4. **Clean broken export:** drop a mojibake 2.1 file → Fix encoding + strip photos → Export 3.0.

## Non-goals (explicitly out of scope for v1)
- No accounts, cloud sync, or CardDAV.
- No CSV/JSON **import** (export only); vCard is the only input format in v1.
- No in-app photo editing (photos are preserved or stripped, not edited).
- No server component of any kind.

## Definition of "done"
- Every feature above works on **real** vCard exports (Google, iCloud, Android 2.1).
- Unit tests cover the parser, serializer, dedupe, and converters, and all pass.
- Malformed/empty/huge input handled gracefully (no unhandled crash).
- All UI states present (empty, loading, error, success) and responsive (375–1440px).
- Ships as a static site; builds clean; deploys to GitHub Pages.
- Verifiable privacy: no network requests are made with contact data.

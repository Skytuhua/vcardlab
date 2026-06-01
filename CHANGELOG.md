# Changelog

All notable changes to vcardlab are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — 2026-06-01

Usability polish and safe bug-fixes to make vcardlab easier for a non-technical first-time user.
No new features, no behavior changes to your data — just clearer help and cleaner output.

### Added
- A **"Don't have a `.vcf` file yet?"** help section on the landing page (and in the README)
  with short steps to export your contacts from iPhone / iCloud, Google / Android and Outlook —
  the missing first step for anyone switching phones.

### Changed
- The drop zone now points newcomers to the export help, the sample-data link explains it's
  safe fake contacts (no export needed), and a wrong-file error now tells you how to recover
  (e.g. convert a CSV via Google/iCloud first).
- The Clean dialog reads "0 affected" instead of a bare "none".
- Decorative icons are hidden from screen readers so assistive tech is less noisy.

### Fixed
- **Exports no longer contain a "(no name)" placeholder.** A contact with no name (e.g. a note-
  only card) is now exported with an empty name instead of the on-screen placeholder text.
- **Blank contact fields are no longer written out** — an empty "Add email/phone/website" row no
  longer produces an empty line in your exported `.vcf`.
- The import warning banner now reports the number of *issues* accurately instead of mislabeling
  per-line warnings as "cards".

## [1.0.0] — 2026-06-01

First public release. A privacy-first, 100% in-browser vCard (`.vcf`) contacts workbench.

### Added
- **Import** of one or many `.vcf` files (drag-and-drop or picker), parsing vCard **2.1 / 3.0 /
  4.0** — including line folding, quoted-printable decoding (Android exports), grouped
  properties, structured names/addresses, and lossless preservation of unmodeled properties.
  Malformed cards are reported in a non-fatal warning banner.
- **View & search** in a virtualized table (stacked cards on mobile) with full-text search and
  match highlighting; a detail panel showing every parsed field.
- **Edit** names, organizations, titles, typed emails/phones/websites, postal addresses,
  birthdays and notes; add and delete contacts; multi-level undo (capped).
- **De-duplicate** by email, phone (format/country-code-aware) and/or name, with per-group and
  one-click "merge all". Merging takes the union of all fields.
- **Clean & fix**: repair mojibake, strip embedded photos, trim whitespace, normalize phone
  formatting, drop empty cards.
- **Export / convert / split** to vCard (2.1 / 3.0 / 4.0), CSV (Excel-safe, BOM) or JSON — as
  one combined file, one file per contact (ZIP), or batches of N (ZIP).
- Light + full dark theme (follows system preference).

### Security & privacy
- 100% client-side: no backend, no telemetry, self-hosted font — **no network request carries
  contact data** (verified by automated tests across every screen).
- CSV export neutralizes spreadsheet formula injection.
- Remote photo URLs embedded in a vCard are never auto-loaded (no IP beacon).

[1.1.0]: https://github.com/Skytuhua/vcardlab/releases/tag/v1.1.0
[1.0.0]: https://github.com/Skytuhua/vcardlab/releases/tag/v1.0.0

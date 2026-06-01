# Changelog

All notable changes to vcardlab are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.0.0]: https://github.com/Skytuhua/vcardlab/releases/tag/v1.0.0

# RESEARCH — vcardlab

> Phase 1 artifact. Evidence-backed selection of the product to build.

## One-paragraph pitch

**vcardlab** is a privacy-first, 100% in-browser workbench for `.vcf` (vCard) contact
files. Drop in one or many vCard files exported from your phone, Google Contacts, iCloud,
or Outlook and **view, search, edit, de-duplicate, merge, split, clean, and convert** your
address book — to vCard (2.1 / 3.0 / 4.0), CSV, or JSON — **without a single byte ever
leaving your device**. It replaces a fragmented landscape of sketchy paid `.exe`
converters and server-side uploaders that swallow your entire contact list, with one
trustworthy, free, open-source tool that does the whole job locally.

## Target user & core problem

**Who:** Anyone migrating or consolidating contacts — switching phones (Android ↔ iPhone),
merging address books across Google/iCloud/Outlook, cleaning up years of duplicates,
preparing a contact list for a CRM/mail-merge import, or splitting a giant export so a
phone that imports "only the first card" will accept all of them.

**The pain (observed, recurring):**
- "Convert VCF to CSV **without uploading**" — contacts are deeply personal (names, phone
  numbers, home addresses, emails, birthdays). Users explicitly don't want them on a
  random website, yet most online converters are server-side uploads.
- "**Merge** multiple VCF files" / "**split** a large VCF into individual contacts"
  (some phones/services import only one card per file).
- "**Remove duplicate** contacts" after a messy multi-source import.
- "VCF won't import / **encoding is broken** / photos corrupt it" (quoted-printable,
  charset, version mismatches).

## Market scan — what exists and why it falls short

| Tool / class | Local? | Free? | Unified? | Gap |
|---|---|---|---|---|
| SysInfo / SysTools / Turgs / Vovsoft / GainTools / MacSonik converters | Desktop `.exe` | Freemium/paid, Windows-mostly | Partial | Paywalled, Windows-only, install required, dated UX |
| aconvert / generic online "VCF→CSV" | **No (uploads)** | Yes | No | Sends your whole address book to a server |
| merge-json-files / freefileviewers splitters | In-browser | Yes, ad-heavy | **No** (one only splits, one only merges) | Single-purpose, fragmented, no editing/dedupe |
| correctvcf | In-browser | Yes | Partial | Narrow (duplicate-fix focus) |
| Native Google/iCloud/Outlook | n/a | Yes | No | Requires uploading to that cloud + an account; no offline/local round-trip; weak bulk control |

**Conclusion:** demand is large, monetized (many paid tools), and persistent — but there is
**no single, polished, free, open-source, 100%-client-side vCard workbench**. The space is
fragmented and privacy-hostile. That is the gap vcardlab fills.

## Why this was chosen (and others rejected)

Shortlist scored against the rubric (Niche / Demand / Doable / Demonstrable / Scope /
Legal-gate). Higher is better; legal is pass/fail.

| Idea | Niche | Demand | Doable | Demo | Scope | Legal | Verdict |
|---|---|---|---|---|---|---|---|
| **vCard contacts workbench** | High | High | High | High | High | Pass | **CHOSEN** |
| In-browser GPX/GPS-track editor | Med | High | High | High | Med | Pass | Rejected — **crowded**: gpx.studio, GpxFix, GPX Edit Pro, The Ride Atlas, Dawarich, Komoot all do privacy-first browser GPX merge/trim already |
| HAR file redactor/viewer | Med | Med | High | Med | High | Pass | Rejected — **already solved** by Google har-sanitizer (OSS) and Cloudflare HAR Sanitizer (client-side) |
| FIT file viewer/converter | High | Med | Med | High | Med | Pass | Rejected — heavier binary-format scope; overlaps crowded GPX-viz space |

The vCard idea wins on the same axes the others lose: real demand **plus** a genuinely
underserved, privacy-sensitive, finishable niche.

### Anti-duplication check (required before building)

Reviewed all existing repos on the target GitHub account (`Skytuhua`): cueforge, subtune,
subsmith (subtitles), metascrub (image metadata), cronanchor (cron), cookpit (cooking),
id-lens (identifiers), stitch-forge (cross-stitch), Inkspect (fiction editing), Portfolio,
SIGINT, parameter-golf, swing-trader. **None handles contacts/vCard.** No overlap.

## Feasibility vs. toolchain

- vCard is line-based UTF-8 text (RFC 6350 / 2426 / 2425). Parsing, folding/unfolding,
  quoted-printable & charset handling, and serialization are all pure client-side TS.
- CSV/JSON export and download via Blob/`URL.createObjectURL` — no server.
- All processing in-browser ⇒ the privacy promise is literally true and verifiable
  (no network calls; ships as a static site to GitHub Pages).
- Stack available: Node 22, Vite, React, TypeScript, Tailwind, Vitest — all installed.

## Legal / ethical

Pass. The tool processes the **user's own** contact data **locally**; nothing is uploaded,
transmitted, or stored remotely. No scraping, no third-party data, no access-control
bypass. Open-source under MIT. Safe to publish publicly.

## Sources

- https://gotoes.org/strava/Combine_GPX_TCX_FIT_Files.php
- https://gpx.studio/
- https://www.gpxfix.eu/crop-and-cut
- https://github.com/google/har-sanitizer
- https://blog.cloudflare.com/introducing-har-sanitizer-secure-har-sharing/
- https://www.sysinfotools.com/blog/convert-vcf-to-csv/
- https://4sysops.com/archives/convert-vcf-to-csv-without-third-party-service/
- https://www.merge-json-files.com/blog/how-to-merge-vcf-files
- https://correctvcf.com/help/fix-duplicate-contacts-vcf-import/
- https://vovsoft.com/software/vcf-splitter/
- https://www.systoolsgroup.com/vcf/splitter/
- https://univik.com/blog/vcf-file-to-csv/

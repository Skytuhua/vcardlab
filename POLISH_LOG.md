# Polish log

This file tracks usability polish and safe bug-fixes made to vcardlab — small, low-risk
improvements that make the app easier for a non-technical person to use, without changing what
the product fundamentally is. Each entry says what changed, why, and what's left for next time.

## 2026-06-01 — onboarding help + safe export bug-fixes (→ v1.1.0)

Audited the app as a non-technical first-time user (someone switching phones who wants to clean
up their contacts but can't code). Drove every screen in a real browser and reviewed the code
through several lenses (onboarding, accessibility/states, and an adversarial bug + risk hunt).
Baseline was already strong — clear copy, honest empty/error/success states, accessible modals
(focus trap, Escape, focus restore), self-hosted font, verifiable privacy. The improvements
below were the highest-value, lowest-risk ones.

### Usability polish (additive copy/help only — no behavior change)
- **New "Don't have a `.vcf` file yet?" help on the landing page.** The single biggest gap: the
  app assumed you already had a `.vcf` file and never told a non-technical user *how to export
  their contacts* from iPhone/iCloud, Google/Android or Outlook. Added a native, collapsed-by-
  default `<details>` disclosure on the empty-state hero with short per-platform steps. No new
  state, no dependencies, only shown before any contacts are loaded.
- **Dropzone subtext** now points first-timers to that help ("New to this? See 'How to export
  your contacts' just below").
- **Sample button** clarified: "or try it with a sample address book (fake contacts — no export
  needed)" so a hesitant user knows it's a safe, zero-setup preview.
- **File-type error toast** now gives a recovery path: if you drop a CSV, it tells you to import
  it to Google/iCloud first and export as vCard.
- **Clean dialog** shows "0 affected" instead of a bare "none", to read consistently as a count.
- **README** gained a matching "Don't have a `.vcf` file yet?" section.

### Accessibility
- Decorative SVG icons are now `aria-hidden` + `focusable={false}` (their meaning already comes
  from adjacent text or the parent button's label), so screen readers stop announcing ~18
  unlabeled graphics. (Existing modal focus-trap / focus-restore logic was already solid and was
  intentionally left untouched.)

### Safe bug-fixes (clear bugs that confused a normal user)
- **The `(no name)` UI placeholder no longer leaks into exported files.** A nameless-but-non-
  empty contact (e.g. a note-only or photo-only card) was being exported as `FN:(no name)` in
  vCard and `(no name)` in the CSV Name column / JSON `name`. Added `outputName()` in the core,
  used at the three serializer call sites, which returns an empty string instead of the
  placeholder. The on-screen UI is unchanged. (Locked in by a new unit test.)
- **Blank email/phone/URL rows are no longer written out.** An "Add email" field left empty
  produced an empty `EMAIL;TYPE=HOME:` line in the exported `.vcf` that some contact apps show
  as a blank entry. The vCard serializer now skips rows with an empty value. (New unit test.)
- **Import warning banner wording fixed.** It said "{N} cards had issues" but counted per-line
  warnings, so one bad card with two bad lines reported "2 cards". Reworded to "{N} issues while
  importing — some cards were skipped or partially read."

### Verification
- `npm run build`, `npm run lint`, and `npm run test:run` (55 tests, +2 new) all pass.
- Drove the rebuilt app in a real browser: landing/help/sample/clean all work; zero console
  errors; every previously-working feature still works.

### Left for a future run
- Optional plain-language pass on the README first line (currently "privacy-first, 100% in-
  browser vCard (`.vcf`) contacts workbench" — clear but slightly jargon-y for a non-coder).
- A friendlier dialog heading than "(no name)" when adding a brand-new blank contact (would need
  a small prop, so deferred to stay strictly low-risk this run).
- Consider an on-screen note that CSV/JSON are export-only (already in README "Limitations").

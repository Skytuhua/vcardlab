# REVIEW — vcardlab

Phase 5 self-review. Multiple passes were run: functional, visual, privacy, and three
parallel **adversarial audit subagents** (security/code-quality, accessibility/design-fidelity,
edge-case/UX), each reading the source independently. Findings, fixes, and re-verification
evidence below. Final state: **all material findings fixed, tests green, clean lint.**

## Evidence captured
- 11 full-state screenshots (light/dark/mobile, all dialogs) — `/review` workflow + `docs/screenshots/`.
- In-browser functional run (Playwright): load → merge-all (6→4) → export vCard/CSV/ZIP all
  produce valid files; UTF-8 "José" preserved; **zero console errors, zero external network
  requests in every state** (privacy verified).
- Large-list stress test: **5,000 contacts load in ~108ms; only ~23 DOM rows rendered**
  (virtualization), search responsive, no errors.

## Findings & fixes

### Security
| Sev | Finding | Fix | Evidence |
|---|---|---|---|
| High | **CSV formula injection** — cells starting with `= + - @` executed as formulas in Excel/Sheets (`serialize.ts`) | `csvCell` now prefixes a `'` guard to formula-leading cells | new test `neutralizes spreadsheet formula injection` |
| Medium | **Auto-loaded remote PHOTO URIs** could beacon the user's IP (`ContactDetail.tsx`) | `PhotoPreview` refuses to load `http(s):` photo URLs (shows a "remote" placeholder); only inline/`data:` images render; large-blob guard added | code review |
| Medium | **`extra`-property serialization** wrote values/params unescaped → possible line injection | `extra` values have CR/LF escaped and param values stripped of structural chars | new test `does not let an unmodeled property inject extra vCard lines` |
| — | XSS, prototype pollution, ReDoS, secret/network leakage | **None found** (React-escaped rendering, Map-based parser into fixed fields, linear regexes, self-hosted font, no backend) | audit |

### Correctness / robustness
| Sev | Finding | Fix | Evidence |
|---|---|---|---|
| Medium | **QP soft-break** was detected by a whole-line substring match — a value containing "quoted-printable" could be miscorrupted | detect QP from the property **header params** only | new test `does not treat a value containing "quoted-printable" as QP` |
| Medium | **`sameAddress`** ignored poBox/ext/region → addresses dropped on merge | compares all 7 ADR components | new test `preserves addresses that differ only by region or PO box` |
| Medium | **Multiple PHOTO/LOGO** silently dropped all but the last | keep the first photo; preserve extras in `extra` | new test `keeps the first photo and preserves extra photos` |
| Low | **Photo-only cards** were dropped as "empty" | `hasAny` now counts `photo` | new test `keeps a photo-only card` |
| Low | **Line folding** counted UTF-16 units, could exceed 75 octets / split chars | octet-aware fold that never splits a character | new test `folds multi-byte UTF-8 without splitting a character` |
| Low | Dead `warnings`/`cardIdx` params in `applyProperty` | removed | lint |

### Accessibility
| Sev | Finding | Fix |
|---|---|---|
| High | **Desktop rows were mouse-only** — keyboard users couldn't open a contact | each row's name is a real focusable `<button>` with `aria-label` |
| Low | `text-muted` on `bg-muted-surface` was 4.34:1 (<4.5) | darkened `--muted` to `#586474` (now ≥4.5:1) |
| Low | Responsive grids in the detail editor | `grid-cols-1 sm:grid-cols-2` |
| — | Modal focus-trap/Esc/restore, labelled icon buttons, real inputs, no emoji icons, reduced-motion | **verified good** |

### Design-system fidelity
| Sev | Finding | Fix |
|---|---|---|
| Medium | Warning banner hard-coded `amber-*` utilities (only token bypass) | added `--warning`/`--warning-soft`/`--warning-border` tokens (light+dark); banner uses them |
| Low | Danger button `text-white`, modal `bg-black/50` literals | added `--destructive-fg` and `--overlay` tokens |
| — | Single indigo accent, emerald only for privacy/success, Inter, 8px rhythm, restrained shadows, no gradients | **verified faithful** |

### UX / product
| Sev | Finding | Fix |
|---|---|---|
| High | **No virtualization** → jank on large address books (the target user) | virtualized list (`@tanstack/react-virtual`) + deferred search; verified 5k contacts smooth |
| High | **Bulk delete had no confirmation** | confirmation dialog for "Delete selected" (merge-all is already previewed + undoable) |
| Medium | **Unbounded undo history** retained every snapshot (memory) | capped to 25 snapshots; corrected the docstring |
| Medium | **Non-vCard import** showed the same "no contacts" message as an empty vCard | distinct "doesn't look like a vCard" error |
| Medium | **Addresses were read-only** in the editor (spec §3 gap) | full address editor (street/city/region/postal/country, add/remove) |

## Pre-delivery checklist (graded)
- [x] No emojis as icons (inline SVG only)
- [x] `cursor-pointer` + hover/focus/disabled on all clickable elements
- [x] Text contrast ≥ 4.5:1 (light & dark) after `--muted` fix
- [x] Visible keyboard focus ring; rows/dialogs fully keyboard-operable
- [x] `prefers-reduced-motion` respected
- [x] Responsive at 375 / 768 / 1024 / 1440 px (table↔cards switch verified)
- [x] Loading / empty / error / success states all real
- [x] No external network requests with user data (verified in every state)

## Test status
`vitest run` → **53 tests pass** (parser, serializer incl. CSV-injection & octet-fold, dedupe,
clean, split/zip). `eslint .` → clean. `tsc -b && vite build` → green.

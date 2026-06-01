# ARCHITECTURE — vcardlab

> Phase 2 architecture note. Tech choices, components, data flow, dependencies.

## Tech stack & rationale

| Concern | Choice | Why |
|---|---|---|
| Language | **TypeScript** | Type-safe modeling of the vCard data structures; matches the rest of the portfolio. |
| Build/dev | **Vite 7** | Fast dev server + optimized static build; trivial GitHub Pages output. |
| UI | **React 19** | Component model fits a table + panels + dialogs UI; large ecosystem. |
| Styling | **Tailwind CSS v4** (`@tailwindcss/vite`) | Design-token-driven styling that maps directly to the Phase 3.5 design system. |
| Tests | **Vitest 3** | First-class Vite integration; fast unit tests for the pure-logic core. |
| ZIP export | **fflate** (MIT) | Tiny, dependency-free ZIP writer for "one card per file" export. |
| Hosting | **GitHub Pages** | Static, free, no server — reinforces the "nothing leaves your device" guarantee. |

**No backend. No network calls with user data.** This is an architectural invariant, not
just a feature — the privacy promise depends on it. The only network the app makes is
loading its own static assets/fonts.

## Layering

```
┌──────────────────────────────────────────────────────────┐
│  UI (React + Tailwind)  — components/, App.tsx            │
│  dropzone · contact table · detail panel · dedupe ·       │
│  export dialog · toolbar · toasts                          │
├──────────────────────────────────────────────────────────┤
│  State (React hooks/context) — useContacts                │
│  working set, selection, derived stats, undo of last op   │
├──────────────────────────────────────────────────────────┤
│  Core (pure TypeScript, framework-free) — src/core/       │
│  parse · model · serialize(vcard/csv/json) · dedupe ·     │
│  clean · quoted-printable · phone-normalize · zip          │
└──────────────────────────────────────────────────────────┘
```

The **core is pure and framework-free** — no React, no DOM. That makes it unit-testable in
isolation (Vitest, node env) and keeps the privacy-critical logic auditable.

## Core data model

```ts
interface Contact {
  id: string;                 // stable local id
  fn?: string;                // formatted name (FN)
  n?: StructuredName;         // family/given/additional/prefix/suffix (N)
  org?: string[];             // organization units (ORG)
  title?: string;
  emails: TypedValue[];       // {value, types[]}
  phones: TypedValue[];
  addresses: Address[];
  urls: TypedValue[];
  birthday?: string;          // BDAY (ISO where possible)
  note?: string;
  photo?: Photo | null;       // kept as data URI or external URI; strippable
  categories: string[];
  extra: RawProperty[];       // any property we don't model — preserved verbatim
  sourceVersion: '2.1'|'3.0'|'4.0'|'unknown';
}
```

**Lossless principle:** properties we don't explicitly model are preserved in `extra` so a
parse → serialize round-trip never silently drops data.

## Data flow

1. File(s) read with the `File` API (`text()`), fully in memory — never uploaded.
2. `parseVcf(text)` → `Contact[]` (+ a list of warnings for malformed cards).
3. Working set held in React state; all transforms (dedupe, clean, edit) operate on it.
4. Export: `serializeVcards / toCsv / toJson` → `Blob` → `URL.createObjectURL` → download.
   "One card per file" zips many blobs with fflate.

## Key algorithms
- **Unfolding & QP decoding:** RFC-compliant line unfolding; quoted-printable soft-break
  joining + byte decode, charset-aware.
- **Dedupe:** build match keys (normalized E.164-ish phone, lowercased email, normalized
  name); union-find groups; merge = field union with per-field value de-duplication.
- **Phone normalization:** strip separators, keep leading `+`, collapse to canonical form
  for comparison while preserving the display value unless the user opts to rewrite.

## Dependencies & licenses
- react, react-dom — MIT
- vite, @vitejs/plugin-react — MIT
- tailwindcss, @tailwindcss/vite — MIT
- vitest, @vitest/coverage-v8, jsdom — MIT
- fflate — MIT
- gh-pages (dev, deploy) — MIT

All permissively (MIT) licensed; safe to publish. Project license: MIT.

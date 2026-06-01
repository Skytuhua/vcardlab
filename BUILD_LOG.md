# BUILD LOG — vcardlab

A running, chronological record of decisions, dead ends, and fixes. Newest entries appended.

## Phase 0 — Environment & capability setup
- Environment: Ubuntu 24.04, Node v22.22.2, npm 10.9.7, Python 3.11.15, git 2.43.0.
  Playwright present (for screenshots); no system Chrome yet (install on demand).
- `gh` CLI not preinstalled → installed `gh` 2.45.0 via apt.
- No `GH_TOKEN`/`GITHUB_TOKEN` env var was set; a token was supplied directly. Stored it in
  a `chmod 600` file outside any repo and sourced it only into `gh`/git — **never echoed,
  logged, or committed**. `gh auth status` → logged in as **Skytuhua** (repo, workflow scopes).
- Ran `gh auth setup-git`; set global git identity to `Skytuhua <Skytuhua@users.noreply.github.com>`.
- **Anti-duplication check:** listed all repos on the account — none handle contacts/vCard,
  so no overlap with the chosen product (see RESEARCH.md).
- Network: direct unauthenticated GitHub API hit returned 403 (egress policy); authenticated
  `gh`/git operations work fine.

### Dynamic-workflow runtime note
- No dedicated `Workflow` tool is exposed in this session's toolset. Per Directive 9's
  fallback, scale-out work (research fan-out, the Phase 5 review with adversarial
  verification) is run via parallel **subagents** (the `Agent` tool) instead, with my own
  multi-pass review. The underlying work is not skipped.

## Phase 1 — Discovery & research
- Fanned parallel web searches across candidates. Found the GPX/GPS-track-editor niche is
  **crowded** (gpx.studio, GpxFix, GPX Edit Pro, The Ride Atlas, Dawarich, Komoot) and HAR
  redaction **already solved** (Google har-sanitizer, Cloudflare HAR Sanitizer). Both rejected.
- **vCard contacts workbench** chosen: large, monetized, persistent demand; fragmented +
  privacy-hostile incumbents (paid `.exe` converters, server-side uploaders, single-purpose
  splitters); no good unified free client-side tool exists. Full writeup in RESEARCH.md.
- Product name: **vcardlab** — instantly signals a workbench of tools for vCard files to the
  target audience, without needing the README.

## Phase 2 — Scaffolding
- Scaffolded Vite + React + TypeScript (`npm create vite … react-ts`).
- Installed dev deps: tailwindcss v4 + @tailwindcss/vite, vitest v3, jsdom, coverage-v8,
  gh-pages. Runtime dep: fflate (MIT) for ZIP export.
- Wrote SPEC.md (bounded v1 scope + non-goals) and ARCHITECTURE.md (pure framework-free core
  + React UI; no backend; privacy as an architectural invariant).

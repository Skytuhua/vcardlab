# DESIGN NOTES — vcardlab

> Phase 3.5 synthesis, in my own words. This is the contract Phase 4 implements to.
> Per-page overrides live in `design-system/pages/*`; `design-system/MASTER.md` governs
> everything else.

## The feeling
A calm, trustworthy, precise utility. It should read as "a serious tool that respects your
data," not a flashy SaaS landing page. Swiss-minimal: lots of whitespace, a strict grid,
one accent colour, sharp hierarchy, no decoration for decoration's sake.

## Pattern
- **Landing / empty state:** minimal single column — a confident headline, one-line promise,
  three benefit bullets, and one big drop-zone CTA. The privacy promise ("Nothing is
  uploaded — everything runs in your browser") is front and centre.
- **Workbench:** a focused app shell — top toolbar (search, actions, export), a dense
  contact table as the primary surface, and a slide-in detail panel. Dashboard density, not
  marketing whitespace.

## Style
Swiss Modernism 2.0 / Minimalism. 12-column mental grid, 8px base spacing unit, mathematical
rhythm, high contrast, minimal shadows (use borders + subtle elevation, not heavy drop
shadows), no gradients except at most one restrained hero treatment.

## Colour (light default + full dark mode)
One dominant accent — **indigo** — for primary actions, links, focus rings, selection.
A functional **emerald** is reserved *only* for privacy/trust/success signals (the "local /
nothing uploaded" badge, success toasts). Red for destructive (delete). Everything else is a
neutral slate scale.

| Role | Light | Dark |
|---|---|---|
| Accent/primary | `#4F46E5` | `#6366F1` |
| Privacy/success | `#16A34A` | `#22C55E` |
| Destructive | `#DC2626` | `#EF4444` |
| Background | `#F8FAFC` | `#0F172A` |
| Surface/card | `#FFFFFF` | `#192134` |
| Text | `#0F172A` | `#F8FAFC` |
| Muted text | `#64748B` | `#94A3B8` |
| Border | `#E2E8F0` | `rgba(255,255,255,.10)` |
| Muted surface | `#F1F5F9` | `#10192E` |

All text/background pairings verified ≥ 4.5:1.

## Typography
**Inter** only, weights 400/500/600/700 (Minimal Swiss pairing). Headings 600–700, body 400,
labels/UI 500. Tabular-nums for counts and the contact total. Generous line-height for body,
tight for dense table rows.

## Spacing & shape
8px base unit; scale 4/8/12/16/24/32/48. Card/button radius 8px, input radius 6px. Consistent
gutters; align everything to the grid.

## Key effects
- Hover transitions 150–250ms, ease-out; never instant, never sluggish.
- Subtle elevation on the detail panel and modals (1px border + soft shadow), not heavy.
- Drag-over state on the dropzone: accent border + tint.
- `prefers-reduced-motion`: disable non-essential transitions/animation.

## States (must all exist)
- **Empty:** dropzone hero with guidance + sample-file affordance.
- **Loading:** spinner/skeleton while parsing/zipping; counts update live.
- **Error:** malformed-card warnings surfaced non-fatally (a dismissible banner listing how
  many cards were skipped and why); destructive actions confirmed.
- **Success:** toast on export/merge/clean with what happened.

## Anti-patterns to avoid (from the engine + my read)
- Cluttered data / poor credibility — keep the table scannable; show the privacy proof.
- Emojis as icons → use inline SVG icons.
- Wide tables breaking mobile → `overflow-x-auto` + stacked card layout < 768px.
- Blank empty/loading screens → always guide or give feedback.
- Multiple competing accent colours → indigo is the only brand accent.

## Pre-delivery checklist (graded in Phase 5)
- [ ] No emojis as icons (inline SVG only)
- [ ] `cursor-pointer` on all clickable elements; hover/focus/disabled states present
- [ ] Text contrast ≥ 4.5:1 (light and dark)
- [ ] Visible keyboard focus ring (indigo); full keyboard nav
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive at 375 / 768 / 1024 / 1440px
- [ ] Loading + empty + error + success states all real

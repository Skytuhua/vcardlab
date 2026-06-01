## Design System: vcardlab

### Pattern
- **Name:** Minimal Single Column
- **Conversion Focus:** Single CTA focus. Large typography. Lots of whitespace. No nav clutter. Mobile-first.
- **CTA Placement:** Center, large CTA button
- **Color Strategy:** Minimalist: Brand + white #FFFFFF + accent. Buttons: High contrast 7:1+. Text: Black/Dark grey
- **Sections:** 1. Hero headline, 2. Short description, 3. Benefit bullets (3 max), 4. CTA, 5. Footer

### Style
- **Name:** Swiss Modernism 2.0
- **Mode Support:** Light ✓ Full | Dark ✓ Full
- **Keywords:** Grid system, Helvetica, modular, asymmetric, international style, rational, clean, mathematical spacing
- **Best For:** Corporate sites, architecture, editorial, SaaS, museums, professional services, documentation
- **Performance:** ⚡ Excellent | **Accessibility:** ✓ WCAG AAA

### Colors
| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#1E3A5F` | `--color-primary` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| Secondary | `#334155` | `--color-secondary` |
| Accent/CTA | `#22C55E` | `--color-accent` |
| Background | `#0F172A` | `--color-background` |
| Foreground | `#FFFFFF` | `--color-foreground` |
| Muted | `#10192E` | `--color-muted` |
| Border | `rgba(255,255,255,0.08)` | `--color-border` |
| Destructive | `#DC2626` | `--color-destructive` |
| Ring | `#1E3A5F` | `--color-ring` |

*Notes: Shield dark + connected green*

### Typography
- **Heading:** Inter
- **Body:** Inter
- **Mood:** minimal, clean, swiss, functional, neutral, professional
- **Best For:** Dashboards, admin panels, documentation, enterprise apps, design systems
- **Google Fonts:** https://fonts.google.com/share?selection.family=Inter:wght@300;400;500;600;700
- **CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
```

### Key Effects
display: grid, grid-template-columns: repeat(12 1fr), gap: 1rem, mathematical ratios, clear hierarchy

### Avoid (Anti-patterns)
- Cluttered data
- Poor credibility

### Pre-Delivery Checklist
- [ ] No emojis as icons (use SVG: Heroicons/Lucide)
- [ ] cursor-pointer on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard nav
- [ ] prefers-reduced-motion respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px


---

## Enrichment (Step 3–4: domain + stack deep-dives, folded in)

### UX guidelines (domain: ux) — binding
- **Loading states (High):** every async op (parse, dedupe, zip) shows a spinner/skeleton — never a frozen UI.
- **Empty states (Medium):** no blank screens — show a helpful message + a clear next action.
- **Responsive tables (Medium):** wrap the contact table in `overflow-x-auto`; collapse to a card/stacked layout on narrow viewports.

### Typography (domain: typography) — chosen
- **Minimal Swiss**: a single family — **Inter** — with weight variation (400/500/600/700). Ultimate simplicity, ideal for dashboards/admin.
- Tabular numerals for counts/IDs where alignment matters.

### Style (domain: style) — chosen
- **Swiss Modernism 2.0 / Minimalism**: strict grid, 8px base unit, mathematical spacing, high contrast, a single accent, minimal decoration, no gratuitous shadows/gradients.

### Stack guidelines (react) — binding
- Local UI state via `useState`/`useReducer`; lift the working set into one `useContacts` hook/reducer. No class components.
- Let React batch related updates; avoid `flushSync`. Memoize derived/filtered lists (`useMemo`) and heavy row renders where it matters.
- Profile before optimizing.

## Final palette decision (vcardlab) — light-default, full dark mode

Grounded in the engine's "VPN & Privacy Tool" / "Developer Tool" recommendations (single
accent + functional privacy-green) but set **light as the default** for a readable,
trustworthy data tool, with a complete dark theme. One dominant accent (**indigo**) plus a
functional **emerald** reserved for the "100% local / nothing uploaded" trust signals.

| Role | Light | Dark |
|------|-------|------|
| Accent / Primary | `#4F46E5` | `#6366F1` |
| On accent | `#FFFFFF` | `#FFFFFF` |
| Privacy/success (functional) | `#16A34A` | `#22C55E` |
| Destructive | `#DC2626` | `#EF4444` |
| Background | `#F8FAFC` | `#0F172A` |
| Surface / Card | `#FFFFFF` | `#192134` |
| Foreground (text) | `#0F172A` | `#F8FAFC` |
| Muted text | `#64748B` | `#94A3B8` |
| Border | `#E2E8F0` | `rgba(255,255,255,0.10)` |
| Muted surface | `#F1F5F9` | `#10192E` |

Spacing scale: 8px base (4/8/12/16/24/32/48). Radius: 8px (cards/buttons), 6px (inputs).
Single accent rule: indigo is the only brand accent; emerald is strictly functional.

# Graph Report - .  (2026-06-01)

## Corpus Check
- Corpus is ~42,028 words - fits in a single context window. You may not need a graph.

## Summary
- 570 nodes · 906 edges · 28 communities (23 shown, 5 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 72 edges (avg confidence: 0.82)
- Token cost: 0 input · 405,087 output

## Community Hubs (Navigation)
- [[_COMMUNITY_UI Components & Icons|UI Components & Icons]]
- [[_COMMUNITY_Dedupe & Contact Model|Dedupe & Contact Model]]
- [[_COMMUNITY_Dialogs & Modal Shell|Dialogs & Modal Shell]]
- [[_COMMUNITY_App Shell & Clean Pipeline|App Shell & Clean Pipeline]]
- [[_COMMUNITY_TypeScript Compiler Config|TypeScript Compiler Config]]
- [[_COMMUNITY_Export & Serialization|Export & Serialization]]
- [[_COMMUNITY_Architecture & Design Rationale|Architecture & Design Rationale]]
- [[_COMMUNITY_vCard ParseSerialize Core|vCard Parse/Serialize Core]]
- [[_COMMUNITY_Workbench UI — Dark (shot)|Workbench UI — Dark (shot)]]
- [[_COMMUNITY_Package Manifest & Deps|Package Manifest & Deps]]
- [[_COMMUNITY_Workbench UI — Light (shot)|Workbench UI — Light (shot)]]
- [[_COMMUNITY_Contact Edit Modal (shot)|Contact Edit Modal (shot)]]
- [[_COMMUNITY_Export Dialog (shot)|Export Dialog (shot)]]
- [[_COMMUNITY_Mobile Responsive View (shot)|Mobile Responsive View (shot)]]
- [[_COMMUNITY_Duplicates View (shot)|Duplicates View (shot)]]
- [[_COMMUNITY_Landing Page (shot)|Landing Page (shot)]]
- [[_COMMUNITY_Dev Dependencies & Tooling|Dev Dependencies & Tooling]]
- [[_COMMUNITY_Favicon  Brand Icon|Favicon / Brand Icon]]
- [[_COMMUNITY_TSConfig Root References|TSConfig Root References]]
- [[_COMMUNITY_App Entry & Hooks|App Entry & Hooks]]
- [[_COMMUNITY_Header  Privacy Badge|Header / Privacy Badge]]
- [[_COMMUNITY_ESLint Config (concept)|ESLint Config (concept)]]
- [[_COMMUNITY_Sample-Load Toast|Sample-Load Toast]]

## God Nodes (most connected - your core abstractions)
1. `Contact` - 23 edges
2. `base()` - 19 edges
3. `compilerOptions` - 17 edges
4. `compilerOptions` - 16 edges
5. `Contact Edit Modal` - 16 edges
6. `displayName()` - 15 edges
7. `parseVcf()` - 15 edges
8. `App (root component)` - 12 edges
9. `parseVcf()` - 11 edges
10. `scripts` - 10 edges

## Surprising Connections (you probably didn't know these)
- `vcardlab package` --rationale_for--> `Local-first / nothing-uploaded privacy guarantee`  [INFERRED]
  package.json → src/App.tsx
- `Privacy-hostile fragmented market gap` --conceptually_related_to--> `Privacy as architectural invariant`  [INFERRED]
  RESEARCH.md → ARCHITECTURE.md
- `Refuse auto-loading remote PHOTO URLs` --conceptually_related_to--> `Privacy as architectural invariant`  [INFERRED]
  REVIEW.md → ARCHITECTURE.md
- `Self-hosted Inter font (no CDN)` --conceptually_related_to--> `Privacy as architectural invariant`  [INFERRED]
  BUILD_LOG.md → ARCHITECTURE.md
- `design-system/MASTER.md` --rationale_for--> `Inter / Minimal Swiss typography`  [EXTRACTED]
  design-system/MASTER.md → DESIGN_NOTES.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Modal-based dialog family** — modal_Modal, cleandialog_CleanDialog, duplicatesdialog_DuplicatesDialog, exportdialog_ExportDialog, contactdetail_ContactDetail, confirmdialog_ConfirmDialog [INFERRED 0.85]
- **Duplicate detect-and-merge pipeline** — dedupe_keysFor, dedupe_findDuplicates, dedupe_mergeContacts, dedupe_mergeAllDuplicates [INFERRED 0.85]
- **Clean-operation registry wiring** — cleandialog_OPS, clean_stripPhotos, clean_repairMojibake, clean_trimWhitespace, clean_normalizePhoneFormatting, clean_dropEmpty [INFERRED 0.85]
- **vCard round-trip (parse <-> serialize) with QP charset handling** — parse_parseVcf, serialize_serializeContact, qp_decode, qp_encode, model_Contact [INFERRED 0.85]
- **Split-export pipeline: chunk + slug + dedupe-names + zip** — split_chunk, split_contactSlug, split_uniqueNames, zip_buildZip, download_downloadBytes [INFERRED 0.75]
- **Multi-format export honoring outputName placeholder suppression** — serialize_serializeVcards, serialize_toCsv, serialize_toJson, model_outputName [INFERRED 0.85]
- **Privacy is verifiable & architectural (no backend, self-hosted font, no remote photo load)** — concept_privacy_invariant, concept_self_hosted_font, concept_no_remote_photo, concept_pure_core [INFERRED 0.85]
- **Swiss-minimal design contract: style + single accent + Inter typography + required states** — concept_swiss_minimalism, concept_single_accent, concept_inter_typography, concept_ui_states [INFERRED 0.85]
- **v1.1.0 usability polish: onboarding help + placeholder-leak fix documented across changelog/readme** — concept_onboarding_help, concept_output_name, changelog_doc, readme_doc [INFERRED 0.75]

## Communities (28 total, 5 thin omitted)

### Community 0 - "UI Components & Icons"
Cohesion: 0.06
Nodes (40): ContactDetail(), ContactTable(), DesktopRow(), mark(), MobileCard(), Props, RowProps, Dropzone() (+32 more)

### Community 1 - "Dedupe & Contact Model"
Cohesion: 0.07
Nodes (48): build(), defaultMatchOptions, DuplicateGroup, findDuplicates(), keysFor(), MatchOptions, mergeAllDuplicates(), mergeContacts() (+40 more)

### Community 2 - "Dialogs & Modal Shell"
Cohesion: 0.07
Nodes (33): CleanDialog(), Op, OPS, Props, ConfirmDialog(), ConfirmState, EMAIL_TYPES, EMPTY_ADDRESS (+25 more)

### Community 3 - "App Shell & Clean Pipeline"
Cohesion: 0.09
Nodes (40): App (root component), ExportHelp, Hero, Toolbar, handleLoad, matches (search filter), mergeAll handler, dropEmpty (+32 more)

### Community 4 - "TypeScript Compiler Config"
Cohesion: 0.05
Nodes (35): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+27 more)

### Community 5 - "Export & Serialization"
Cohesion: 0.10
Nodes (26): ExportDialog(), Format, SplitMode, outputName(), encodeQuotedPrintable(), esc(), fold(), hasNonAscii() (+18 more)

### Community 6 - "Architecture & Design Rationale"
Cohesion: 0.10
Nodes (24): Contact data model, CSV formula-injection guard, Union-find dedupe + field-union merge, Inter / Minimal Swiss typography, Lossless round-trip principle (extra), Privacy-hostile fragmented market gap, Refuse auto-loading remote PHOTO URLs, Export-your-contacts onboarding help (+16 more)

### Community 7 - "vCard Parse/Serialize Core"
Cohesion: 0.09
Nodes (26): downloadBytes(), core/index (barrel), Contact, NO_NAME placeholder, ParseResult, displayName(), outputName(), applyProperty() (+18 more)

### Community 8 - "Workbench UI — Dark (shot)"
Cohesion: 0.09
Nodes (27): Indigo/Violet Accent Color, Action Toolbar, Add files Button, vcardlab Brand Logo & Wordmark, Clean Button, '6 contacts' Count Label, Contact Row (avatar + fields), Contacts Table (+19 more)

### Community 9 - "Package Manifest & Deps"
Cohesion: 0.08
Nodes (24): author, dependencies, fflate, @fontsource-variable/inter, react, react-dom, @tanstack/react-virtual, description (+16 more)

### Community 10 - "Workbench UI — Light (shot)"
Cohesion: 0.09
Nodes (25): Add Files Button, vcardlab Brand / Logo, Clean Button, Contact Row (avatar + fields), Contacts Table, Contact Count ('6 contacts'), Near-Duplicate Contacts (Jane Public, Bob Stone), Duplicates Button (+17 more)

### Community 11 - "Contact Edit Modal (shot)"
Cohesion: 0.09
Nodes (24): Add Email Button, Add Phone Button, Add Website Button, Birthday Field, Cancel Button, Close (X) Button, Contact Edit Modal, Contacts List (background) (+16 more)

### Community 12 - "Export Dialog (shot)"
Cohesion: 0.10
Nodes (22): App header: vcardlab contacts workbench, 100% local, Batch size input (100), Close (X) button, Export confirm button, Contact count footer: 6 contacts, Export contacts dialog, CSV format option, Format helper text: Standard contact file for phones, Google, iCloud and Outlook (+14 more)

### Community 13 - "Mobile Responsive View (shot)"
Cohesion: 0.10
Nodes (22): Add Files Button, Clean Button, Contact Card, Contact Selection Checkbox, Contact Count (6 contacts), Contact Email (with icon), Contact List (Single Column), Contact Name Field (+14 more)

### Community 14 - "Duplicates View (shot)"
Cohesion: 0.11
Nodes (20): Fuzzy Matching Concept (Jane Public vs Jane Q. Public), Bob Stone Duplicate Group, Duplicate Group Card, Jane Public Duplicate Group, 100% Local Privacy Badge, Match by Email Checkbox (checked), Match by Name Checkbox (unchecked), Match by Phone Checkbox (checked) (+12 more)

### Community 15 - "Landing Page (shot)"
Cohesion: 0.12
Nodes (20): '100% local' Badge, Dark Mode Toggle (moon icon), Dropzone Instructions Text, Export Formats (vCard/CSV/JSON), Feature Cards Row, Feature Card: Convert & split, Feature Card: De-duplicate, Feature Card: Fix & clean (+12 more)

### Community 16 - "Dev Dependencies & Tooling"
Cohesion: 0.11
Nodes (19): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, gh-pages, globals, jsdom (+11 more)

### Community 17 - "Favicon / Brand Icon"
Cohesion: 0.50
Nodes (5): Avatar Circle (Person), vcardlab Favicon: Contact Card Icon, Indigo Rounded-Square Background (#4f46e5), Contact Detail Text Lines, White Contact Card

## Knowledge Gaps
- **197 isolated node(s):** `name`, `private`, `version`, `type`, `description` (+192 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Contact` connect `Dialogs & Modal Shell` to `UI Components & Icons`, `Dedupe & Contact Model`, `Export & Serialization`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `displayName()` connect `UI Components & Icons` to `Dedupe & Contact Model`, `Dialogs & Modal Shell`, `Export & Serialization`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `emptyName()` connect `Dedupe & Contact Model` to `UI Components & Icons`, `Dialogs & Modal Shell`, `Export & Serialization`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _201 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components & Icons` be split into smaller, more focused modules?**
  _Cohesion score 0.06093189964157706 - nodes in this community are weakly interconnected._
- **Should `Dedupe & Contact Model` be split into smaller, more focused modules?**
  _Cohesion score 0.0734006734006734 - nodes in this community are weakly interconnected._
- **Should `Dialogs & Modal Shell` be split into smaller, more focused modules?**
  _Cohesion score 0.07400555041628122 - nodes in this community are weakly interconnected._
# harness-content: improvement plan

Created 2026-10-30-14-16-50 UTC. Nothing here is implemented. It reviews the working tree, including uncommitted work. Other work was changing `apps/harness-content` and `apps/harness-content-api` during the review (new design-template and theme files, `src/index.css`, a new `dist` build), so line numbers may have drifted and those changes aren't covered. Recheck each item against current code before starting it.

## Summary

The studio has a sound base: a real token system, a tested contrast check, ARIA tabs, keyboard drag, and autosave with conflict detection. Three things hold it back:

1. **Text and targets are too small.** 54% of explicit font-size classes are under 11px, going down to 7.5px.
2. **Navigation doesn't scale.** The library tree pushes every other section off screen.
3. **Screens don't explain themselves.** Loading, empty and saving states are weak or missing, and some controls don't do what they appear to do.

The highest-risk code issue is that edits can be lost on navigation (A1). Fix that first.

| Dimension | Score /4 | Key finding |
|---|---|---|
| Accessibility | 2 | Undersized text and targets, incomplete tab semantics |
| Performance | 3 | Route splitting is on and heavy editors load as separate chunks; not profiled |
| Theming | 3 | Tokens are used well; the player and overlays hard-code hex values |
| Responsive | 0 | No breakpoints outside `components/ui`; broken at 390px |
| Implementation integrity | 3 | Consistent system; detector found 1 source issue plus the size findings |
| **Total** | **11/20** | **Acceptable: significant work needed** |

These scores are my judgment, not measurements.

## How this was reviewed

- **Detector:** Impeccable 4.8.0 ran over the source and 7 rendered routes.
- **Screenshots:** search, configuration, slide editor, document editor and trail builder at 1440×900, plus search at 390×844.
- **Code:** I read the shell, routes, inspector and autosave. Other files were only searched by pattern.
- **Evidence labels:** **[rendered]** means seen in the running app or a detector scan. **[code]** means found by reading the code and not reproduced.

Limits of this review:

- It ran in a single context, not Impeccable's two independent sub-agent assessments, so it isn't a formal `critique` and no snapshot was saved.
- `PRODUCT.md` and `DESIGN.md` don't exist, so the existing code was treated as the design authority.
- Not checked: light theme, a screen reader, real keyboard walkthroughs, dialogs, the review inbox in depth, and the trail player when rendered.
- Local data is mostly E2E fixtures (35 boxes), which exaggerates the sidebar problem but doesn't cause it.

### Detector results

| Route | `undersized-ui-text` | Other |
|---|---|---|
| `/` | 294 | none |
| `/reviews` | 113 | none |
| `/configuration` | 118 | 1 `cramped-padding`, 1 `tiny-text` |
| `/artifacts-design` | 108 | none |
| `/artifacts/<slide>` | 125 | 1 `low-contrast` |
| `/artifacts/<doc>` | 124 | 1 `low-contrast` |
| `/artifacts/<animation>` | 126 | 2 `low-contrast` |
| `/trails/<flow>` | 140 | 2 `tiny-text` |

Counts repeat shared chrome on every route, so they can't be summed. The source scan had one finding: `side-tab` at `src/artifacts/plugins/doc/blocks.tsx:29`.

## Decisions to confirm

These are the defaults this plan assumes. Changing one changes the phases that depend on it.

| # | Decision | Default | Affects |
|---|---|---|---|
| D1 | Minimum text size | 11px for all text, 12–13px for body and inputs | Phase B, and `harness-sigmma.pen` must change too, because the small sizes come from that design |
| D2 | Supported screens | Authoring at 1024px and up, with a clear message below that. The player works on any screen | Phase D |
| D3 | Placeholder features | Remove unbuilt controls from the UI until they exist | C4 |
| D4 | Dev user picker | Show it only in dev builds | C6 |

## Phase A: stop losing work and show state (P0–P1)

### A1. Pending edits are dropped on navigation [code] — P0

- **Where:** `src/hooks/use-autosave.ts:87-92`.
- **Problem:** The debounce timer is cleared on unmount and nothing saves what was pending. There is no `beforeunload` or `useBlocker` anywhere in `src`. Leaving within 800ms of an edit, or closing the tab, should lose it.
- **Change:** Flush on unmount, and warn on `beforeunload` while the state is dirty, saving or failed.
- **Done when:** A test edits, unmounts immediately and sees the save go out. A manual check confirms the warning appears.

### A2. Trail save states are unclear and conflicts can't be resolved there [code] — P1

- **Where:** `src/routes/trails.$flowId.tsx:218-230`, compared with `SaveMeta` at `src/routes/artifacts.$artifactId.tsx:450`.
- **Problem:** Trails show unsaved edits as "SAVING…". A conflict tells the user to reload but gives no button. A failed save has no retry. The artifact screen handles this better.
- **Change:** Extract one shared save indicator from `SaveMeta` and use it on both screens. Add retry for failed saves.
- **Done when:** Both screens show the same text for each autosave state, and each failure state offers a way out.

### A3. Blank and misleading loading states [code] — P1

- **Where:** `src/routes/artifacts.$artifactId.tsx:81`, `src/routes/index.tsx:66,190`.
- **Problem:** The artifact screen renders nothing while loading, and stays blank if the versions or version query fails. Search shows "0 reusable artifacts" and "Showing 0–0 of 0" until data arrives.
- **Change:** Add layout-matching skeletons (there are none today) and explicit error states with a retry. Show counts only once they're known.
- **Done when:** With the API slowed or stopped, every route shows a skeleton or a recoverable error.

### A4. No route error boundary [code] — P1

- **Where:** `src/routes/__root.tsx:7`. No `errorComponent` exists in `src`.
- **Change:** Add a default error component that stays inside the studio chrome and offers retry and a way home.
- **Done when:** A thrown render error leaves navigation usable.

### A5. Trail items are deleted with no confirmation or undo [code] — P1

- **Where:** `src/components/trail/outline-list.tsx:297,395`.
- **Problem:** One click on a small × removes a step and autosave persists it. Undo exists only in the slide editor.
- **Change:** Show a toast with Undo after removal, restoring the previous outline. This is lighter than a confirmation dialog.
- **Done when:** Removing a step, pill or unit can be undone, including by keyboard.

## Phase B: legibility and accessibility (P1)

### B1. Set a type scale and meet the floor [rendered] — P1

- **Where:** Across `src`, with shared labels in `src/components/labels.tsx`.
- **Evidence:** 127 of 235 explicit size classes are under 11px: 9px (34), 8.5px (32), 10.5px (26), 8px (16), 9.5px (8), 7.5px (6), 10px (5). Important information sits at these sizes, including status chips, save state, locale and version labels, and "changes affect every flow using this artifact". There are 557 arbitrary-pixel classes in total.
- **Change:** Add named type tokens to `@theme`, update `harness-sigmma.pen` to match, and migrate shared components first so most of the app changes at once. Keep mono uppercase for true labels only, and use it less.
- **Done when:** `undersized-ui-text` and `tiny-text` are zero on all 7 routes, and layouts still hold at 1280px and at 200% zoom.

### B2. Enlarge targets [rendered] — P1

- **Where:** `src/components/shell/sidebar.tsx`: rows `h-[23px]` (line 173), add button `size-4` (line 239), chevrons `size-2.5` (line 133). Checkboxes `size-3.5` at `src/components/search/results-table.tsx:148`.
- **Standard:** WCAG 2.5.8 AA asks for 24×24 CSS px unless spacing or another exception applies.
- **Change:** Use 28px rows and at least 24px hit areas, growing the hit area without necessarily growing the icon.
- **Done when:** All interactive sidebar and table controls measure at least 24×24.

### B3. Complete the inspector tabs [code] — P1

- **Where:** `src/components/workspace/inspector.tsx:85-110`.
- **Problem:** The tablist has no label, tabs have no `id` or `aria-controls`, and arrow keys don't work. The panel has no `aria-labelledby`. `AreaTabs` already does this correctly, while the trail view has its own hand-written copy (`src/routes/trails.$flowId.tsx:237`).
- **Change:** Use one tabs implementation for all three.
- **Done when:** Arrow keys move between tabs everywhere and an accessibility scan reports no tab violations.

### B4. Make the results table a real table [code] — P1

- **Where:** `src/components/search/results-table.tsx:23-44`.
- **Problem:** `block` and `grid` on table elements can remove table semantics for screen readers. The "Updated" sort arrow looks functional but does nothing, and there is no `aria-sort`.
- **Change:** Restore semantics with explicit roles or native table layout. Build sorting, or remove the arrow until it exists.
- **Done when:** A screen reader announces rows and columns, and the arrow reflects real behaviour.

### B5. Fix contrast failures [rendered] — P1

- **Evidence:** The "+ tag" placeholder is 2.7:1 (`src/components/workspace/inspector.tsx:287`). On the animation screen, `#6d5bd0` on `#3b3657` is 2.2:1; I didn't locate this element, and it may be artifact content rather than chrome.
- **Change:** Give placeholders a passing token and extend `src/lib/contrast.test.ts` to cover them. Trace the animation finding before changing it.
- **Done when:** `low-contrast` is zero on chrome in all six themes, including the unscanned light theme.

### B6. Sweep focus states and motion [code] — P2

- **Where:** 32 `outline-none` uses, with `focus-visible` styles in only 9 files. Sidebar rows, inspector tabs and theme cards have no explicit focus style. `prefers-reduced-motion` is handled only in the animation player.
- **Change:** Define one global focus-ring treatment that meets 3:1, and a reduced-motion alternative for dialogs and transitions.
- **Done when:** Keyboard focus is clearly visible on every control in every theme.

## Phase C: navigation and clarity (P1–P2)

### C1. Separate navigation from the library tree [rendered] — P1

- **Where:** `src/components/shell/sidebar.tsx:44-102`.
- **Evidence:** At 1440×900, Reviews, Trails, Design and Configuration are all below the fold. The sidebar's rows fit about 36 lines, which a modest library exceeds. The pending-review count is therefore hidden too.
- **Change:** Pin a compact global nav (Artifacts, Reviews with count, Trails, Design, Configuration) above an independently scrolling tree. Start boxes collapsed and persist their state. Add a tree filter.
- **Done when:** Every top-level destination and the review count are visible at any library size.

### C2. Clean up the trail builder's actions [rendered] — P1

- **Where:** `src/routes/trails.$flowId.tsx:194-205,288-297,58-63`.
- **Problems:**
  - "Preview" and "Present" do the same thing, and neither plays the draft being edited. A user editing a draft sees older content.
  - "Save flow" and "Present" are both primary, and Save is redundant next to autosave.
  - Step settings (placement, pinned version, label, timing, notes, theme) sit under the "Preview" tab.
  - The "Trails" breadcrumb links to artifact search (line 179).
- **Change:** Keep one play action and label clearly what it plays. Make Save secondary or remove it. Split out a "Step" tab. Give trails a real index and link the breadcrumb to it.
- **Done when:** A new user can predict what each button plays and find step settings on the first try.

### C3. Make multi-select do something [code] — P1

- **Where:** `src/routes/index.tsx:27,52-58,191`.
- **Problem:** Checkboxes only update a "N selected" count, with no bulk action. Selection also survives page changes without saying so.
- **Change:** Add a bulk action bar (move, tag, archive, as the API allows), or remove the checkboxes.
- **Done when:** Selecting rows leads to an action, or the checkboxes are gone.

### C4. Remove controls that lead nowhere [rendered] — P2

- **Where:** `src/routes/index.tsx:70,125`, `src/routes/configuration.tsx:37,143`, `src/lib/design-search.ts`.
- **Problem:** "Save search", "More" and "New theme" are disabled, explained only by tooltips. Three of the four Configuration tabs say "Coming later" but take up sidebar rows.
- **Change:** Remove them per D3. The Configuration page then becomes "Appearance" until more exists.
- **Done when:** Every visible control works.

### C5. Fix empty states and dead columns [rendered/code] — P2

- **Problems:**
  - The "no artifacts" message renders under a `flex-1` table, so it lands at the bottom of the page (`src/routes/index.tsx:182`) [code].
  - The Tags column is empty in the local data while its space stays reserved [rendered].
  - Repeated green PUBLISHED chips on every row add noise, and most location lines just repeat "Box level" [rendered].
- **Change:** Center a teaching empty state with a clear-filters action. Make published the quiet default and emphasise only exceptions.
- **Done when:** A zero-result search shows the message in view with a one-click way out.

### C6. Tidy the top bar [rendered] — P2

- **Where:** `src/components/shell/top-bar.tsx:42-66`.
- **Problem:** The dot beside "DARK" actually shows API health (`users.length`), but it reads as a theme indicator. The theme label isn't useful there. On artifact screens the bar carries back, breadcrumb, type, version, status, actions and save state, which leaves titles squeezed.
- **Change:** Show connection status only on failure, with words. Drop the theme label. Apply D4.
- **Done when:** The bar has room for long titles at 1280px, and the status has one clear meaning.

### C7. Improve wording and page titles [rendered/code] — P2

- **Problems:**
  - Every tab has the same title, because no route sets one [code].
  - "1 STEPS" isn't pluralised correctly [rendered].
  - Errors expose raw messages, such as "Is harness-content-api running?" [code].
  - Icon-only "P+" and checklist buttons in the outline have no visible meaning [rendered].
- **Change:** Set per-route titles. Rewrite errors as what happened and what to do next. Add tooltips or labels to the outline buttons.
- **Done when:** Tabs are distinguishable and no user-facing error names an internal service.

### C8. Show keyboard shortcuts in the player [code] — P2

- **Where:** `src/routes/play.$flowId.$revisionId.$step.tsx:93-108`.
- **Problem:** Shortcuts are mostly undiscoverable; only O and Esc appear, in button labels.
- **Change:** Add a `?` overlay listing them, also reachable from the controls.
- **Done when:** All shortcuts can be discovered from inside the player.

## Phase D: small screens (P1, scope from D2)

**D1. Handle narrow windows [rendered] — P1**

- **Evidence:** At 390px the 224px sidebar takes 57% of the width, the search header wraps and clips, table headers overlap, and all columns except the checkbox and type icon are cut off. No component outside `components/ui` uses a breakpoint.
- **Change:**
  - Make the sidebar a drawer below 1280px.
  - Collapse the inspector by default below 1280px.
  - Reduce table columns by priority.
  - Below 1024px, show browsing plus a clear "editing needs a larger screen" message.
  - Make the player work at all sizes.
- **Done when:** No horizontal scroll or clipped controls at 1024, 1280 and 1440, and the player works at 390.

## Phase E: system upkeep (P2–P3)

| ID | Item | Where | Priority |
|---|---|---|---|
| E1 | Run `/impeccable init` and `/impeccable document` to capture `PRODUCT.md` and `DESIGN.md`, so later work has a product brief and written rules | App root | P2 |
| E2 | Replace the player's hard-coded hex values with overlay tokens | `presentation-stage.tsx` (11), `play.$flowId...tsx` (10) | P2 |
| E3 | Replace literal theme-card colours with values derived from the tokens, so previews can't drift | `routes/configuration.tsx:60-109` | P3 |
| E4 | Add the detector to CI after B1, using `--github`, to prevent regressions | CI | P2 |
| E5 | Load Cormorant Garamond only where needed; it's global today but used only for note headings in chrome | `index.css:6`, `resources.tsx:542` | P3 |
| E6 | Review the `side-tab` finding; it's likely a false positive if it's a document blockquote style | `doc/blocks.tsx:29` | P3 |
| E7 | Measure load and interaction on the editors; the largest chunks are 972 KB and 429 KB uncompressed in a local build that may be stale | `dist/assets` | P3 |
| E8 | Use a clean seed so reviews use realistic data, not E2E leftovers | Local data | P3 |

## Recommended order

1. **Phase A** — small changes that protect user work. A1 can ship on its own.
2. **B1 and B2** — after confirming D1 and updating the `.pen` file. These touch the most files, so do them before layout work.
3. **C1 and C2** — the largest usability gains.
4. **Rest of B and C.**
5. **Phase D**, then **Phase E**. Do E1 earlier if larger design changes are planned.

Rough size: A is small, B1 is large, C1 and D are medium to large, and the rest are small.

## Worth keeping

- Token system with multiple themes and a contrast test (`src/lib/contrast.test.ts`).
- `useAutosave`, with its optimistic concurrency and conflict stop.
- `AreaTabs` and the keyboard-sortable outline, as models for other components.
- Search state in the URL, plus ⌘K.
- The full-screen player with deep links per step.
- The dense, tool-like character. These fixes should make it readable without turning it into a spacious consumer app.

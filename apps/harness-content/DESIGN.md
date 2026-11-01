---
name: Graphite Console
description: Dense, themeable studio chrome for authoring reusable learning artifacts.
colors:
  page: "#121214"
  raised: "#171719"
  sunken: "#1c1c20"
  border: "#2a2a2f"
  divider: "#232327"
  text: "#fafafa"
  ink2: "#a1a1aa"
  ink3: "#8a8a94"
  nav-bg: "#4a3c7d"
  nav-ink: "#ffffff"
  row-bg: "#241f38"
  primary: "#6d5bd0"
  primary-ink: "#8b7be0"
  on-solid: "#ffffff"
  fail-base: "#d97a66"
  warn-base: "#bfa33a"
  risk-base: "#d4793f"
  pass-base: "#4ca050"
  done-base: "#4c8fd6"
typography:
  title:
    fontFamily: "Inter Variable, Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
  body:
    fontFamily: "Inter Variable, Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
  ui:
    fontFamily: "Inter Variable, Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "11px"
    letterSpacing: "0.5px"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-solid}"
    typography: "{typography.ui}"
    rounded: "{rounded.md}"
    padding: "0 11px"
    height: "28px"
  button-quiet:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink2}"
    typography: "{typography.ui}"
    rounded: "{rounded.md}"
    padding: "0 11px"
    height: "28px"
---

# Design System: Graphite Console

## Overview

**Creative North Star: "Graphite Console"**

A dense working console for long authoring sessions. The chrome stays neutral and quiet so the artifact on the canvas carries the colour. Density is deliberate, but never at the cost of legibility.

Values above are the default `graphite-dark` theme. `src/index.css` is the source of truth for all six themes (graphite dark, violet, mint, cobalt, ivory, and light). Artifact content has its own separate set of six content themes.

**Key Characteristics:**

- Neutral surfaces with one accent per theme.
- Small, firm type scale with an 11px floor.
- Status shown through a fixed set of semantic hues.
- Depth from tone and hairlines, rarely shadow.

## Colors

Near-black neutrals with a single accent, plus semantic hues that stay constant across the dark themes.

### Primary

- **Graphite Violet** (`primary`): solid actions and the focus ring. `primary-ink` is the lighter form used for accent text.

### Neutral

- **Page, Raised, Sunken** (`page`, `raised`, `sunken`): the three surface tones: canvas, panels, and wells or controls.
- **Border, Divider** (`border`, `divider`): hairlines for controls and for separating sections.
- **Text, Ink 2, Ink 3** (`text`, `ink2`, `ink3`): primary text, secondary text, and metadata.

### Semantic

- **Fail, Warn, Risk, Pass, Done** (`*-base`): each also has a `-tint` background and an `-ink` foreground, defined per theme.

**The Tested Contrast Rule.** Text tokens must pass WCAG AA in every theme; `src/lib/contrast.test.ts` enforces this. Change a token only with that test green.

**The Chrome Is Not Content Rule.** Chrome uses `gc-*` tokens and artifact renderers use `ct-*`. Neither reads the other's.

## Typography

**Body Font:** Inter Variable (with system sans fallback)
**Label/Mono Font:** IBM Plex Mono (with system mono fallback)

**Character:** A neutral grotesque for reading and working, with mono uppercase reserved for true labels.

### Hierarchy

- **Title** (15px): panel and page headings.
- **Body** (13px): running text and form content.
- **UI** (12px): controls, rows and table cells.
- **Label** (11px, mono, uppercase, 0.5px tracking): field captions and section labels.

**The Floor Rule.** Nothing in the chrome renders below 11px, and new sizes come from the named tokens, not arbitrary pixel values. Artifact content sets its own sizes.

## Layout

A fixed left sidebar (224px) with pinned global navigation above an independently scrolling library tree, a top bar, a main workspace, and a collapsible inspector. Below 1280px the sidebar becomes a drawer and the inspector starts collapsed. Below 1024px authoring gives way to a message asking for a larger screen, while browsing and the player keep working.

Interactive targets are at least 24×24px; grow the hit area rather than the icon.

## Elevation & Depth

Flat by default. Depth comes from the three surface tones and hairline borders. Shadow is reserved for floating overlays such as dialogs.

## Shapes

Gently rounded and consistent: 6px (`md`) for controls, 8px (`lg`) for cards and dialogs, 3–5px for small chips and indicators.

## Components

### Buttons

- **Shape:** gently curved (`md`), 28px high.
- **Primary:** solid `primary` with `on-solid` semibold text; brightens on hover.
- **Quiet:** `sunken` with a hairline border and `ink2` text, moving to `text` on hover.
- **Focus:** a global 2px `primary` outline with 1px offset, on every interactive element.

### Inputs / Fields

- **Style:** built on the shared control style in `components/shell/form-controls.tsx`; placeholders use `ink3`.
- **Labels:** field captions use the Label style.

### Tabs

- **Style:** `AreaTabs` is the only tab implementation, with full ARIA semantics and arrow-key movement.

### Presentation Overlays

- **Style:** `ov-*` tokens, because the player's stage is dark in every studio theme.

## Do's and Don'ts

### Do:

- **Do** take every colour from a `gc-*`, `ct-*` or `ov-*` token.
- **Do** use the named type tokens (`text-label`, `text-ui`, `text-body`, `text-title`).
- **Do** keep motion within the global `prefers-reduced-motion` handling.

### Don't:

- **Don't** set chrome text below 11px.
- **Don't** hard-code hex values in components.
- **Don't** show a control for a feature that isn't built.
- **Don't** write a second tab implementation.

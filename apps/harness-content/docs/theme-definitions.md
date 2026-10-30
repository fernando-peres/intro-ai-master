# Themes and Flow Structure — Definitions

**Status:** Draft. Extends `reusable-artifacts-prd-v0.1.md` (§5 domain model, §11 UI surfaces).
**Scope:** How themes are defined and resolved, how a flow (learning trail) groups its steps, and the flow page preview sidebar.

In this document, *trail* and *flow* mean the same thing: an **Artifact Flow**.

## 1. Vocabulary

| Term | Meaning |
|---|---|
| **Theme** | A named set of design tokens. Themes are library entities, assigned by reference. |
| **Theme Version** | An immutable snapshot of a theme's tokens. Editing a theme creates a new version. |
| **Box theme** | The theme assigned to a library Box. Units, Sections and RAs in that Box inherit it. Units and Sections cannot set their own. |
| **Flow theme** | The theme assigned to a flow. The flow defines the look of everything played inside it. |
| **Theme override** | An RA flag. It means the RA carries its own theme, which can replace the Box or flow theme. |
| **Flow group** | A Unit or Section node that the flow owns. It structures and collapses steps. It is **not** a library Box/Unit/Section and **not** an RA. |
| **Theme source** | A per-step choice, `flow` or `artifact`, that applies only to steps whose RA has a theme override. |

## 2. Theme contents

A theme holds tokens only. Layouts and master templates are out of scope.

- **Color:** semantic roles (`background`, `surface`, `text`, `textMuted`, `primary`, `accent`, `border`, `success`/`warning`/`danger`).
- **Chart palette:** an ordered categorical series used by chart and animation components.
- **Typography:** heading and body font families (managed font assets) and a type scale (`display`, `h1`–`h3`, `body`, `caption`), with weights and line heights.
- **Spacing and shape:** a spacing scale, corner radii and stroke widths.
- **Slide background:** a color, gradient, or image asset used as the default canvas background.

Every Theme Version must define every token. This is schema-validated, so resolving a theme never falls back to another theme for a missing token.

Meta-components (PRD §7.3) consume tokens by role, never by literal value. When a style property on a content element is explicitly set, it overrides the token for that element only (see §8, Q2).

## 3. Theme resolution

The renderer resolves exactly one theme for each rendered item:

| Context | RA without override | RA with override | Flow group divider |
|---|---|---|---|
| **Design mode** (artifact workspace, standalone RA preview/link) | Box theme of the RA's location | Artifact theme | — |
| **Flow** (flow builder preview, flow player) | Flow theme | Step's theme source: `flow` (**default**) → flow theme; `artifact` → artifact theme | Flow theme |

Rules:

1. The RA's location Box determines its design-mode theme, whether the RA sits at Box, Unit or Section level. Moving an RA to another Box changes its design-mode theme. It does not change the RA's content.
2. The override flag and the artifact theme reference are part of the **Artifact Version** content. Publishing a version freezes both.
3. The theme source is stored on the **flow step**, not on the RA. The same RA can follow the flow theme in one flow and its own theme in another.
4. The theme source control appears only on steps whose RA version has the override flag. For any other step, the stored value is ignored and the step always follows the flow theme.

## 4. Flow structure: groups and hierarchy

A flow is a tree with a depth-first play order:

```
Flow
├── Unit (group)            ← optional divider slide, flow theme
│   ├── Section (group)     ← optional divider slide, flow theme
│   │   ├── Step → RA v3
│   │   └── Step → RA v1
│   └── Step → RA v2
└── Step → RA v5
```

- **Nesting:** the flow root contains Units and steps. A Unit contains Sections and steps. A Section contains steps only.
- **Groups are flow-owned.** A group has a title, an optional description and an optional **divider slide**. The divider slide uses a fixed set of structured slide elements, and the renderer always renders it with the flow theme. Groups are versioned with the FlowRevision. They are not reusable and are not searchable in the library.
- **Group hierarchy is independent of library location.** A flow Unit may hold RAs from any Box, Unit or Section.
- **Collapse is view state.** Collapsing a group in the builder or player outline is a per-viewer preference, not flow content. Collapsing a group never removes its steps from the play order.
- **Navigation:** Previous/Next follows the depth-first order. When a group has a divider slide, playback shows it as an item. When it has none, playback goes straight to its first child.
- **Reordering:** dragging a step or group moves its whole subtree. A move that breaks the nesting rules is rejected.

## 5. Theme pinning

The published-flow guarantee (PRD §5.5) covers appearance as well as content:

- A published **FlowRevision** pins the flow's `themeVersionId`.
- An RA version that has a theme override pins its artifact `themeVersionId` at publish time.
- So a published flow renders identically forever. Theme edits reach it only through a new FlowRevision.
- A draft flow resolves the current default version of its themes. As with RA versions, an authoring action can "update to latest theme version".

## 6. Flow page: preview sidebar

The flow page (flow builder) has a collapsible **right sidebar** that previews the selected tree item:

- **Step selected:** the pinned or selected RA version in the step's locale, rendered with the **resolved flow-context theme** (§3). It also shows the theme in use (`Flow theme` / `Artifact theme`), the theme source toggle when the RA has an override, the version and locale, and a link that opens the RA in design mode.
- **Group selected:** its divider slide (or a title placeholder) rendered with the flow theme.
- Slides render scaled to fit the sidebar. Animations render with play/pause/restart. Documents render as a scrollable page.
- The preview uses the same renderer as the flow player, so what the sidebar shows is what learners see.

## 7. Domain model additions

| Entity | New / changed fields |
|---|---|
| `Theme` | `id`, `name`, `description`, `defaultVersionId`, creator, timestamps. |
| `ThemeVersion` | `id`, `themeId`, `versionNumber`, `state` (`draft`/`published`/`archived`), `tokens` (schema-validated), `changeComment`, timestamps. |
| `Box` | `+ themeId` (required). |
| `ArtifactVersion` | `+ themeOverride: boolean`, `+ themeVersionId` (required when `themeOverride`, else null). |
| `Flow` | `+ themeId` (required). |
| `FlowRevision` | `+ themeVersionId` (required when published); `steps[]` becomes `items[]`, a tree of groups and steps. |
| `FlowGroup` | `id`, `kind` (`unit`/`section`), `position`, `parentGroupId`, `title`, `description`, `dividerSlide` (nullable structured slide content). |
| `FlowStep` | `+ parentGroupId` (nullable), `+ themeSource` (`flow`/`artifact`, default `flow`). |

Invariants:

- A FlowGroup of kind `section` may have only a `unit` parent or no parent.
- A published FlowRevision references only published ThemeVersions.
- Archiving a ThemeVersion follows the same rule as archiving an RA version (PRD §14.1, B4): pinned references stay renderable, and permanent deletion is blocked while the version is referenced.

## 8. Open questions

| # | Question | Proposal |
|---|---|---|
| Q1 | Standalone and design-mode views use the Box theme. Should a published RA version also pin the Box ThemeVersion, or follow the Box's current theme? | Follow the current default Box ThemeVersion. Only flows guarantee frozen appearance. |
| Q2 | Explicit element styles, such as a hard-coded `color: #ffffff`, make an RA ignore theme changes. Should AI generation and the editor restrict content to token references? | Generation emits token references only. The editor allows explicit overrides, with a "reset to theme" action. |
| Q3 | Can a flow theme be any library theme, or only the theme of a Box the flow draws from? | Any published theme. A new flow defaults to the Box theme of its first RA. |
| Q4 | Should the flow player show learners which theme source is in use, or is that only for authors? | Authors only. |

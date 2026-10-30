# harness-content — implementation plan

Walking skeleton for the Reusable Artifacts Studio described in [reusable-artifacts-prd-v0.1.md](reusable-artifacts-prd-v0.1.md). Designs live in `harness-sigmma.pen` at the repo root (node IDs per phase below).

Run one phase at a time with `/harness-next-phase` (or "next phase"). Each phase moves `Status: todo` → `in-progress` → `done` and gets a `Log:` line when it finishes.

Print a phase's design nodes:

```bash
python3 -I apps/harness-content/scripts/pen-nodes.py harness-sigmma.pen X3XV2 lKDrF
```

## Decisions

- Backend: new FastAPI app `apps/harness-content-api` + Postgres. Slide canvas: react-konva. AI generation deferred; structured JSON import first (P11).
- One slide RA = exactly one slide.
- Reviewers cannot approve their own submissions; admins can override.
- Archived versions cannot be chosen for new uses; pinned flows still read them; a version cannot be deleted while referenced.
- Domain/API name `flow`; UI label "Trail".
- Docker compose project name: `harness-sigma`.
- Slide themes use the Format panel swatches (Dark = #14131C/#6D5BD0/#F4F2FB); the `.pen` six-mode content variables differ for dark/light and are not used by slides.
- Two token systems from the `.pen` file: Graphite Console (`gc-d-*`/`gc-l-*`) is the studio chrome, switched with `data-theme="graphite-dark|graphite-light"`; the six content themes (dark, light, violet, mint, cobalt, ivory) are `--ct-*` variables under `data-content-theme`, for artifact renderers.
- API types are generated (`pnpm gen:api`); openapi-typescript runs on a `typescript5` alias because TypeScript 7 has no JS compiler API.
- `docs/theme-definitions.md` (draft) adds Theme/ThemeVersion entities, box/flow themes and flow groups; it is not yet in any phase and changes P2/P3 data (Box.themeId, Flow.themeId, FlowGroup, FlowStep.themeSource).
- API timestamps are UTC `YYYY-MM-DD-HH-mm-ss` strings.
- Artifact themes are saved rows with 16 colour slots; built-ins (`dark`, `light`, `violet`, `mint`, `cobalt`, `ivory`) are read-only. Themes are not versioned yet, so editing a custom theme changes published content that uses it. Animations keep their own built-in `scheme`.
- Templates are slide content copied into new artifacts; starter layouts live in the frontend and are not stored.

## Phases

### P1 — API foundation
Status: done

- New app `apps/harness-content-api` (uv, Python 3.14, package `harness_content_api`): FastAPI, SQLAlchemy 2, Alembic, psycopg 3, pydantic-settings. The layout follows `apps/algo-server` (`src/<pkg>/main.py`, routers per module, `/health`).
- `docker-compose.yml` with Postgres 17. `HARNESS_DATABASE_URL` env var. A UTC timestamp helper `utc_stamp()` for rule 6.
- Add it to the root `pyproject.toml`: workspace members, pytest testpaths, importlinter `root_packages`, ruff known-first-party.
- pytest fixtures: a test database with a transaction rolled back after each test.
- Ask the user whether "Postgres + separate FastAPI content service" should be recorded as an ADR (rule 3). Do not create one without asking.
- Done when: `uv run pytest apps/harness-content-api`, `uv run lint-imports` and `alembic upgrade head` all pass.

Log: 2026-10-29-21-33-45 — harness-content-api scaffold (FastAPI, SQLAlchemy 2, Alembic baseline 0001, psycopg 3), compose project `harness-sigma` (Postgres 17 on :5433), rolled-back test fixtures, `utc_stamp()`, root workspace wiring; ADR recorded. 8 tests pass.

### P2 — Artifact domain, versions, review
Status: done

- Tables: `box/unit/section` (one `location` table with a `kind` column and a parent), `artifact`, `artifact_version`, `review_request`, `audit_event`, `user` (role ∈ admin/author/reviewer/viewer).
- Invariants (PRD §5.3) live in a service layer, not in routes:
  - creating an artifact also creates its first draft;
  - editing a published version forks a new draft (`parent_version_id`);
  - `PATCH` is rejected on published/archived versions;
  - publishing needs an approved review whose `content_hash` matches the current content, plus a non-empty comment. It allocates `MAX+1` per `(artifact_id, locale)` inside the transaction; a unique constraint backs this up;
  - one default version per locale (partial unique index);
  - the artifact's status is derived from its versions.
- Dev auth: `X-User-Id` header with seeded users. Permission checks follow the matrix in PRD §6.1. Optimistic concurrency uses `ETag`/`If-Match` on the version revision.
- Endpoints: the artifact, version and review routes from PRD §10, plus location CRUD and move.
- Done when: pytest scenarios cover PRD definition-of-done items 1, 2, 3 and 6, plus a race test showing two concurrent publishes never get the same number.

Log: 2026-10-29-21-58-37 — migration 0002 (users, locations, artifacts, artifact_versions, review_requests, audit_events with DB-level version invariants); services for locations/artifacts/versions/reviews; dev `X-User-Id` auth + seed CLI; ETag/If-Match on drafts; `/resolve` with explicit locale_unavailable. 31 tests incl. DoD 1/2/3/6 and a publish race test (fails when the lock is removed). Authors edit only their own drafts; archived versions stay readable by id.

### P3 — Flows, search, usages
Status: done

- Tables `flow`, `flow_revision`, `flow_step` (position, artifact_id, locale, artifact_version_id, label, theme_override).
- Draft revision editing. Publishing freezes the draft and rejects drafts or missing versions. "Behind" report: for each pinned step, its version vs the current default (the O4eW8o publish panel). "Use current defaults" action. `GET /artifacts/{id}/usages`.
- Search: `GET /artifacts?query&tag&type&locale&status&locationId` using Postgres `tsvector` on title/description/tags plus filters.
- Done when: pytest covers definition-of-done items 7 and 8 and search vs tree navigation agreeing.

Log: 2026-10-29-22-04-25 — migration 0003 (flows, flow_revisions with one draft per flow, flow_steps; trigger-maintained `search_vector` + GIN indexes); flow draft/publish/behind/use-current-defaults/play; usages, reuse count; prefix FTS search with tag/type/locale/status/subtree filters and pagination; `/tags`. 44 tests incl. DoD 7/8 and search vs tree. Trail grouping (units/sections inside a trail) still deferred to after P10.

### P4 — Frontend shell + tokens + library (designs: wx1xG, l9RVX, ApENL)
Status: done

- Port the `.pen` variables (75 tokens × 6 themes) into `src/index.css` as CSS variables per `[data-theme]`, mapped onto the shadcn tokens. Fonts: Cormorant Garamond and IBM Plex Mono (already installed).
- App shell: top bar (breadcrumb, type chip, Preview/Save, saved-at), left sidebar (Artifacts tree, Trails, Themes, Configuration), main area, collapsible inspector.
- API client: `openapi-typescript` types generated from the FastAPI OpenAPI schema (a `pnpm gen:api` script), TanStack Query hooks, Vite proxy `/api` → `:8000`.
- Routes: `/` (artifact search: filters, tag chips, results table), the new-artifact type picker dialog (Slide/Document/Animation enabled, Diagram/Dataset/Audio shown as "coming later"), `/artifacts/$id` placeholder.
- Done when: `pnpm --filter harness-content test lint typecheck` passes; against the running API you can create a location and an artifact and find it in search (checked in the browser).

Log: 2026-10-29-22-20-09 — tokens generated from the .pen (Graphite chrome dark/light + six `--ct-*` content themes); shell (top bar with dev-user picker, library tree, trails, themes); artifact search with URL-state filters, tag chips, semantic table, pagination; type-picker and location dialogs; artifact placeholder page; typed client via `pnpm gen:api`. next-themes replaced by a small studio-theme hook (React 19 script warning). Browser check run in headless Chrome via playwright-core (Claude in Chrome extension not connected): create box → create document → found by search, light theme, no console errors. 16 Vitest tests.

### P5 — Artifact workspace + plugin contract (designs: X3XV2, S5V319, rwqcK, mkHdH)
Status: done

- `src/artifacts/plugin.ts`: the `ArtifactPlugin` contract from PRD §7.2, plus a registry. Content schemas use Zod v4.
- Workspace shell: Content/Resources tabs, inspector tabs Metadata | Format | Script | Insert, metadata panel (title, ID, duration, owner, status, tags, checklist with progress), version switcher grouped by locale.
- Draft autosave with `If-Match`, with unsaved and error states. Submit-for-review and review/publish dialog (mandatory comment). Review inbox list.
- Script tab: narration text saved on the version. Audio is deferred.
- "Editing from trail" banner when opened from a flow step.
- Done when: a stub plugin round-trips through autosave, review and publish in the browser; Vitest covers the plugin registry and the autosave hook.

Log: 2026-10-29-22-29-08 — API: migration 0004 `artifact_versions.script` (in the approval hash, copied on fork), review list items carry artifact title/type/locale. UI: `ArtifactPlugin` contract + registry with Zod validation/migration and a JSON stub for all three types; workspace with top-bar crumbs/version switcher/status, Preview, review actions (submit → decide → publish → edit as new draft), autosave with If-Match and conflict reload; inspector Metadata (title, duration, tags, checklist on artifact root) / Format / Script / Insert, collapsible rail; trail banner (`?trail=&step=`); review inbox. Browser round trip via playwright-core passes. 46 API + 33 Vitest tests. Deferred: Resources tab (P12), audio.

### P6 — Doc plugin (designs: Fam8J, u1UbS, E2wz2e, Gbinq)
Status: done

- BlockNote (already a dependency) with custom blocks: callout, embedded RA reference (pinned to a version ID; the chip shows locale/version/usage count), table, code, toggle.
- Insert palette (Text / Blocks / Media & Reuse) plus the `/` menu. Outline panel built from headings, with word count and read time. A read-only renderer.
- Done when: a Vitest round trip (JSON → editor → JSON) shows no loss; the doc renders in preview.

Log: 2026-10-29-22-35-35 — doc plugin on BlockNote 0.55 (shadcn view): persisted BlockNote block JSON restricted to an allowlist (Zod), custom `callout` (note/warning/rule) and `raEmbed` (pins artifact + version id, snapshot title/type/number, live flow-usage count) blocks; built-in table, code, toggle, quote, divider, image. Insert palette (Text / Blocks / Media & reuse + published-artifact embed picker) and `/` menu with Callout; Format panel = outline (click to jump) + words/read time/blocks/headings; read-only Renderer for preview. Editor lazy-loaded (own ~970 kB chunk). Plugin contract gained `Provider`, `artifactId`, `locale`; workspace edits validated content; new artifacts start from `createEmpty()`. Round-trip Vitest (editor → JSON → editor, twice) is lossless; browser check passes. Deferred: Diagram block (later type), image upload (P12 assets).

### P7 — Slide plugin, canvas core (designs: X3XV2, lKDrF, GBr9d, i5WjYj)
Status: done

- react-konva stage at 1920×1080, scaled to fit, with a zoom readout. Element schema per PRD §7.4 (id, type, x/y/w/h/rotation, z, visible, locked, style).
- Element types: text (title/body/bullets), rect, ellipse, line, arrow, image (URL asset for now), diagram placeholder.
- Select and multi-select, move/resize/rotate with Konva `Transformer`, keyboard nudge and delete, undo/redo (a history reducer over the content).
- Insert palette: click drops an element at the centre, or drag it onto the canvas. Format inspector: theme override, typography, flat/gradient background, reset to theme.
- Done when: a Vitest JSON round trip passes, and the move/rotate/save/reload cycle works in the browser.

Log: 2026-10-29-22-47-38 — slide plugin on react-konva 19 / konva 10: Zod model in 1920×1080 canvas units (text eyebrow/title/body/bullets, rect, ellipse, line, arrow, image URL, diagram placeholder; paint order = array order; style overrides over theme defaults); five slide themes taken from the Format design's swatches (dark/light/violet/mint/cobalt); one SlideScene renders editor and preview. Select/shift-multiselect, drag, Transformer resize/rotate, double-click text editing overlay, arrow nudge (2 / shift 20), delete, ⌘D duplicate, ⌘Z/⇧⌘Z undo with burst merging, T/B/L/D/I inserts, zoom fit/steps. Insert palette (click or drag onto canvas); Format: theme picker, arrange X/Y/W/H/rotate + lock, typography, shape/stroke, diagram steps, image URL/alt/fit, background theme/flat/gradient, reset to theme. Editor and panels lazy-loaded (341 kB chunk). Fixed during the check: Konva `#id` selectors fail for UUIDs starting with a digit (now a predicate lookup, regression-tested). 14 slide Vitest tests incl. JSON round trip; browser check (insert → drag → rotate → edit title → theme → reload/preview) passes. Deferred to P8 as planned: charts, groups, layers panel, alignment/snapping; theme OVERRIDE toggle waits on theme-definitions.md.

### P8 — Slide plugin, charts + structure
Status: done

- `slide.chart` (line/bar/pie): the persisted data+style model is rendered as Konva shapes. An inspector data grid edits series and labels, and the chart re-renders.
- Groups, a layers panel (z-order, lock, hide), alignment and snapping guides.
- Done when: definition-of-done item 4 works end to end with a hand-written slide JSON; Vitest checks that chart data survives a round trip.

Log: 2026-10-30-07-47-31 — `chart` element (line/bar/pie) persisting labels + numeric series (+ per-series colour) and options (title, legend, grid, values, y range); drawn from a pure `layoutChart` into Konva shapes, so data edits re-render; chart editor with type switch, options and an editable data grid (add/remove rows and series). Groups as a shared `groupId` (click selects the group; layers list can pick one member; ⌘G / ⇧⌘G), layers panel (top-first, nested groups, show/hide, lock, select), z-order front/forward/backward/back (⌘] ⌘[ ⌥⌘] ⌥⌘[), align six ways (to selection, or to slide for one element/group) and distribute; drag snapping to slide and sibling edges/centres via `dragBoundFunc` using rotated visual bounds (Alt = free), with guides. Fixed on the way: inspector items shrank instead of scrolling (`*:shrink-0`); slide text no longer drops lines past its box. Hand-written DoD 4 fixture (`fixtures/dod4-slide.json`) passes in Vitest and in the browser (title font/colour, move + rotate, snap to x=120, group, chart value edit, reload). 63 Vitest tests. Note: align/distribute still use unrotated boxes.

### P9 — Animation plugin
Status: done

- Motion for React. A registry of 2 templates (`animation.reveal`, `animation.stepsDiagram`), each with a Zod props schema. The inspector form is generated from the schema (text, color, number range, enum, data list).
- Player with play/pause/restart. The state resets when props change. Honors reduced motion.
- Done when: definition-of-done item 5 works; Vitest checks that the form edits match the props the player renders.
Log: 2026-10-30-09-09-28 — Motion 12 animation plugin replaces the JSON stub (stub removed). Content = `{template, props}`; templates `animation.reveal` and `animation.stepsDiagram` build props from `field.*` helpers (Zod + `.meta`), shared scheme/accent/transition/easing/loop. Inspector form generated from the props' JSON Schema (text, textarea, color, range, enum, toggle, data list; unmappable props throw); Insert lists templates, switching keeps shared props. Player: one Motion sequence over `data-anim` parts, play/pause/restart, progress, loop; any content change remounts and restarts; reduced motion shows the final frame and plays on request. Legacy stub content opens as Reveal. DoD 5 Vitest (`fixtures/dod5-animation.json`, form → saved props → player frame) + headless-Chrome check (edit labels, add step, scheme, accent, duration, transition → saved; pause holds; reduced-motion reload shows edits). 69 Vitest. Deferred: scrubbing, playback speed control, thumbnails, video/GIF export.

### P10 — Trail builder + player (designs: uZQNQ, O4eW8o, BJox0, VhdBV, UGout, rE5Bf, t3Hkh)
Status: done

- Flow editor: a library picker, a list of steps reorderable with dnd-kit, with locale/version chosen per step. Step settings: advance on (manual or after a duration) and theme (inherit or override). Total duration.
- Inspector tabs Metadata | Theme | Preview | Publish. The Publish panel shows the "N behind" list with update actions and republish.
- Player route `/play/$flowId/$revisionId/$step`: renders slide/doc/animation full screen through the plugins, with previous/next, outline, a progress bar, a deep link per step, and a playback bar for timed advance.
- Done when: in the browser you can build a 3-step trail, publish it, play it, then publish a new artifact version and see the trail still show the old one.
- Deferred to a later phase: grouping steps into units/sections inside a trail (shown in uZQNQ).
Log: 2026-10-30-10-02-41 — API: steps and playback carry the artifact's planned `durationSeconds`. UI: sidebar trails + New trail dialog (title, locale, theme); `/trails/$flowId` builder over the flow draft (autosave with If-Match; `useAutosave` now exposes `currentEtag`), dnd-kit sortable steps (pointer + keyboard), library picker (published artifacts, locale + pinned version, label), BEHIND/OVERRIDE/timer badges, total duration; inspector (now tab-generic) Metadata (title, description, locale, revisions) / Theme (trail theme, per-step Follow trail \| Use artifact) / Preview (themed renderer, edit artifact with trail banner, play from step, pinned version, label, advance manual\|after N s, note, theme) / Publish (pinned references with Update, use current defaults, change comment, publish/republish). Plugin contract gains `contentTheme`/`withTheme` (slide theme, animation scheme). Player `/play/$flowId/$revisionId/$step` renders outside the studio shell: trail badge, outline with presenter notes, prev/next + keys, timed auto-advance with pause, progress bar; doc steps get the reading header. Trail themes = the five slide themes (theme-definitions.md still pending). Browser check: 3-step trail built, reordered by keyboard, timed step, override, published, played (deep links, auto-advance), slide v2 published → revision 1 still plays v1 and the builder shows 1 behind. 75 Vitest, 46 API. Deferred: unit/section grouping in trails, "after audio" advance, presenter view.

### P11 — Registry export + JSON import (the deferred AI entry point)
Status: done

- `scripts/export-schemas.ts` in harness-content writes JSON Schema files (from Zod) and a component manifest into `harness_content_api/schemas/`. The API checks content against them on save and publish, and rejects unknown component types with clear errors.
- `GET /registry` manifest. `POST /artifacts/import` takes structured JSON: it is validated with readable errors and opens in the editor.
- Done when: importing valid JSON for each type gives an editable artifact, and importing an unknown component is rejected with a clear message.
Log: 2026-10-30-11-08-15 — `pnpm export:schemas` (tsx) writes `registry.json` (namespaced, versioned components; animation template props as JSON Schema; empty content per type) and `slide|doc|animation.v1.json` (Zod `toJSONSchema`, io input) into `harness_content_api/schemas/`; a Vitest drift test fails when they are stale. API: `services/content.py` (jsonschema 2020-12) checks create, import, draft save and publish; unknown or missing component types are named first (`unknown_component`, with the supported list), field errors come as `{path, message}` with union-branch noise removed; new drafts start from registry empty content; `GET /registry`, `POST /artifacts/import`. Slide elements and doc blocks now default rotation/visibility/lock/style and props/children so generated JSON stays terse; doc callout/raEmbed props are typed (a bad callout tone crashed the editor during the browser check — fixed in schema and renderer). UI: New artifact dialog Import JSON mode (paste or file, bare content or `{title, content}` envelope, issues by path). Browser: unknown `slide.video` rejected in the dialog; slide, doc and animation imported and edited (chart cell, doc text, animation title) and saved. 80 Vitest, 55 API. Deferred: chart series-length refine is not in the JSON Schema (checked in the editor only); unknown extra keys are tolerated, not stripped, server-side.

### P12 — Resources + hardening (designs: zTTl4)
Status: done

- Resources tab: markdown notes (write/preview) and file attachments through `POST /assets`, using local disk storage behind an interface that S3 can replace later.
- Accessibility pass (keyboard, labels, contrast in all 6 themes). Update the READMEs (root table, both apps). Add a `docs/` entry describing the harness architecture.
- Done when: all definition-of-done items 1–8 pass as pytest/Vitest scenarios, and lint/typecheck/tests are green across the workspace.

Log: 2026-10-30-11-07-59 — API: migration 0005 `assets` table; `AssetStorage` protocol with `LocalDiskStorage` (`HARNESS_ASSET_DIR`, atomic writes, the key changes with the content, the old file is deleted after commit). Endpoints: `POST /assets` (multipart, 20 MB, extension must match the bytes), list, metadata, sandboxed content, `PUT` text with If-Match, rename, and delete (blocked while any version's content mentions the asset). UI: a Resources tab with a notes list and files, search, drop zone or picker, a markdown note editor (Write/Preview with react-markdown, Save note / ⌘S, saves when you leave the note), image preview or download, inline rename, and a confirmed delete. Accessibility: a WCAG AA contrast test for the studio chrome, the content tokens and the slide themes. That moved gc-ink3 (both modes), light gc-warn-chip-ink and the dark slide accent off the .pen values, and added `gc-primary-ink`. Also: WAI-ARIA area tabs, h1 and landmarks on every page, a BlockNote editor label, and disabled sidebar rows without opacity. axe-core is clean on 10 screens × 2 themes, and every keyboard focus stop is visible. Docs: `docs/harness-content.md` (architecture, DoD → tests), plus updates to the root and both app READMEs. DoD 1 now pins a trail too. 60 API + 102 Vitest tests. Bug fixed: an empty new note showed the "OK" error. Deferred: S3, asset references in slide/doc images (an `<img>` cannot send X-User-Id), real auth. Pre-existing root `ruff check .` findings outside the harness apps (`.agents/skills/ui-ux-pro-max`, `scripts/generate_video.py`, a notebook) are untouched.

### P13 — Configuration page + system themes (designs: u0uyhS)
Status: done

- `/configuration` with settings tabs; system themes move there from the sidebar, with 6 chrome themes and a Match system / Light / Dark mode.
- Done when: every theme applies and survives reload with no flash, and Match system follows the OS.
Log: 2026-10-30-14-30-00 — `/configuration?tab=`, shared `AreaTabs`, `graphite-violet|mint|cobalt|ivory` chrome tokens (contrast test covers all 6), `harness.studioMode` applied by the inline script before paint. Browser: each theme, reload, OS scheme change. Selected card reads ACTIVE rather than the design's DEFAULT. Deferred: custom chrome themes (New theme disabled), the other 3 settings tabs. axe not run.

### P14 — Artifact themes (designs: dgK9B)
Status: done

- Saved themes with 16 slots through the API; `/artifacts-design` lists them and shows each slot; New, Duplicate and Edit. Slides, the Format panel and trail pickers resolve saved themes.
- Done when: a duplicated theme, edited and applied, changes a slide's canvas and chart colours, and existing slides look the same.
Log: 2026-10-30-14-30-00 — Migration 0007 (`artifact_themes`, seeded from `schemas/builtin-themes.json`; flow theme columns widened to 64). `/artifact-themes` endpoints with `usedBy`; `unknown_theme` on save and publish. `slide/themes.ts` holds the registry and the slot mapping, tested equal to `SLIDE_THEMES`. Browser: new theme edited, slide canvas and chart use it, trail created with it. Deferred: ThemeVersion pinning, animation restyling.

### P15 — Templates (designs: qkxEA)
Status: done

- Templates tab with 8 starter layouts per theme and saved templates; New template opens the slide editor; New artifact can start from a template.
- Done when: a template made from a starter is edited, saved and used for an artifact, and its count goes up.
Log: 2026-10-30-14-30-00 — Migration 0008 (`artifact_templates`), `/artifact-templates` CRUD, `templateId` on artifact create. `slide/starter-layouts.ts`, `/design-templates/$templateId` (explicit Save, two-step Delete), lazily mounted previews. Browser: full flow, count ×1. Data table is built from rects and text because slides have no table element.

### P16 — Diagram artifact type
Status: in-progress

- API: `ArtifactType.DIAGRAM`; migration 0009 recreates the `artifact_type` check constraint; `services/content.py` treats `engine` as the component field, like `template`; seed one published diagram per engine.
- Studio plugin `src/artifacts/plugins/diagram/`: content `{schemaVersion, type: "diagram", theme, engine}`, either `flow` (nodes `{id, label, x, y, shape, tone}`, edges `{id, source, target, label?, animated}`, direction) or `mermaid` (`source`).
  - Flow: `@xyflow/react` editor (drag, connect, rename, delete) and a read-only `fitView` renderer.
  - Mermaid: lazily imported `mermaid`, a source editor with a live preview and inline parse errors, and a `securityLevel: "strict"` SVG renderer that scales to its box.
  - `contentTheme`/`withTheme`; Format and Insert panels; the New artifact dialog enables Diagram and asks for the engine.
- `pnpm export:schemas` and `pnpm gen:api`.
- Done when: a flow diagram and a Mermaid diagram are created, edited, reviewed and published in the browser; importing an unknown engine is rejected by name; Vitest and pytest cover schema, search text and renderers (Mermaid mocked).

### P17 — Shared embed infrastructure
Status: todo

- `src/components/embed/`: an `EmbedPicker` (moved from `doc/panels.tsx`, with a type filter) and an `<EmbeddedArtifact>` that loads the pinned version, validates it, applies the host theme and renders the plugin's Renderer to fill its box, with `playback: "static" | "auto"`. Only diagram and animation render live; other types keep the chip.
- `src/lib/embeds.ts`: a shared `EmbedRef` and `embedsOf(content)` for docs and slides.
- API: on import, submit and publish, every embed must name an existing published version of its artifact, not archived when newly pinned; errors are `{path, message}`.
- "Update to current default" re-pins an embed.
- Done when: Vitest covers the loading, invalid and missing states and the re-pin; pytest rejects a draft or foreign version id.

### P18 — Doc embeds, live and resizable
Status: todo

- `raEmbed` accepts `diagram` and gains `width` (20–100 %), `aspect` (`16:9|4:3|1:1|3:4|auto`) and `align`. The block renders `EmbeddedArtifact` with a caption bar and a right-edge resize handle.
- Insert panel and slash menu: Diagram and Animation open the picker; the Format panel edits width, aspect, align and re-pin for the selected embed.
- Done when: a published diagram and animation are embedded, resized and read back in the reader view; the round-trip test covers the new props.

### P19 — Slide embeds; `slide.diagram` removed
Status: todo

- `slide.embed` element `{box, ref, lockAspect, playback}`: a transparent Konva hit box keeps selection, snapping, transform, rotation and lock; an HTML overlay over the Stage renders `EmbeddedArtifact` at the scaled box. Embeds paint above canvas shapes, and the layers panel says so. Editor plays nothing; preview and present follow `playback`.
- Insert panel gets an Embed section built on the picker; the `d` key opens it; the Format panel edits lock aspect, playback, fit to content and re-pin.
- `slide.diagram` is deleted. Migration 0010 rewrites every stored slide version that uses it into native rect, text and arrow elements at the same paint position, recomputes `content_hash` and writes an audit row per version. This is a one-time exception to immutability: rendering is unchanged.
- Done when: a diagram and an animation are embedded, moved, resized, rotated and locked, then previewed and presented with the theme applied; an old diagram slide renders as shapes after `alembic upgrade head`; fixtures and tests are updated.

## Critical files
- New: `apps/harness-content-api/**`, `apps/harness-content/docs/implementation-plan.md`, `apps/harness-content/scripts/pen-nodes.py`, `.agents/skills/harness-next-phase/SKILL.md` (+ `.claude/skills` symlink).
- Modified: root `pyproject.toml` (workspace, importlinter, pytest), `apps/harness-content/src/index.css`, `src/main.tsx`, `src/routes/**`, `package.json` (react-konva, konva, motion, @dnd-kit, zod, openapi-typescript), `vite.config.ts` (proxy).
- Reuse: the `apps/algo-server` structure for routers and tests; shadcn components already in `src/components/ui`; BlockNote, TanStack Router/Query/Form already installed.

## Verification (each phase repeats its own "Done when"; overall)
- `uv run pytest apps/harness-content-api && uv run lint-imports && uv run ruff check`
- `pnpm --filter harness-content test && pnpm --filter harness-content lint && pnpm --filter harness-content typecheck`
- Manual: `docker compose up -d` → `uv run fastapi dev` → `pnpm --filter harness-content dev`, then walk definition-of-done items 1–8 in the browser (claude-in-chrome screenshots compared against the `.pen` frames).

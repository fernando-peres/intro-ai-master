# harness-content

React 19 + Vite app: the Reusable Artifacts Studio. pnpm, TanStack Router (file-based), TanStack Query, shadcn/ui on Base UI, Tailwind v4, Biome and Vitest. Talks to [`harness-content-api`](../harness-content-api). Architecture: [docs/harness-content.md](../../docs/harness-content.md). Build progress: [docs/implementation-plan.md](docs/implementation-plan.md).

## Run

```bash
# from the repo root (installs every JS workspace project)
pnpm install

# start harness-content-api first (see its README); /api is proxied to localhost:8000
pnpm --filter harness-content dev        # http://localhost:5173
# or, inside apps/harness-content:
pnpm dev
```

## Scripts

| Command          | What it does                                    |
|------------------|-------------------------------------------------|
| `pnpm dev`       | Vite dev server                                  |
| `pnpm build`     | production build into `dist/`, then type-check  |
| `pnpm preview`   | serve the production build                       |
| `pnpm test`      | Vitest + Testing Library (jsdom)                 |
| `pnpm lint`      | Biome lint + format check (`pnpm format` fixes)  |
| `pnpm typecheck` | `tsc --noEmit`                                   |
| `pnpm gen:api`   | regenerate `src/api/schema.d.ts` from the API's OpenAPI schema (needs `uv`, not a running server) |

## Structure

```
src/
  main.tsx            providers: theme (data-theme), query client, router, toaster
  index.css           design tokens generated from harness-sigmma.pen (studio chrome + content themes)
  api/                typed client (openapi-fetch), generated schema.d.ts, TanStack Query hooks
  routes/             file-based routes; the plugin regenerates routeTree.gen.ts (committed)
  artifacts/          ArtifactPlugin contract, registry (Zod validation + migration), per-type plugins
  components/shell/   top bar (with page slots), library sidebar, create dialogs
  components/workspace/ artifact workspace: inspector panels, Resources tab, review/publish dialogs
  components/search/  artifact search table and filters
  components/trail/   trail builder: sortable steps, library picker, inspector panels, themed step renderer
  components/ui/      shadcn components (button, card, dialog, input, sonner)
  hooks/              useAutosave (debounced, If-Match, conflict stop)
  lib/                stamps (UTC YYYY-MM-DD-HH-mm-ss), library tree, URL search state, review workflow, trail steps/themes, resources, contrast
scripts/              gen-api.mjs, pen-nodes.py (read design nodes from the .pen file)
```

Trails: `/trails/$flowId` edits the flow's draft (autosaved with If-Match); `/play/$flowId/$revisionId/$step` plays a published revision full screen, one URL per step (← → to move, Space pauses a timed step, O opens the outline, Esc exits). A trail theme restyles slide and animation steps through the plugins' `withTheme`; a step can keep its artifact's own theme.

Resources: the workspace's **Resources** tab holds the artifact root's notes and files, shared by every locale and version.
- Markdown notes have Write and Preview modes and save with **Save note** or ⌘S; leaving a note also saves it.
- Previews are rendered by react-markdown, which ignores raw HTML.
- Files are added by dropping them or with the file picker. Images get an inline preview; other files download.
- Resources can be renamed inline and deleted after a confirmation step.

Requests carry `X-User-Id` from the **Dev user** picker in the top bar (stored in localStorage).

## Artifact plugins

Each artifact type registers an `ArtifactPlugin` (`src/artifacts/plugin.ts`): a Zod schema, `createEmpty`, `migrate`, an `Editor` and a `Renderer` over the same content, and optional `FormatPanel` / `InsertPanel` for the inspector. `src/artifacts/index.ts` registers them. Animation content is a registered template id plus its props (`src/artifacts/plugins/animation/templates/`); the inspector form is generated from each template's props schema, so a new template only needs props built from `field.*`, a `Scene` and a `sequence`.

`pnpm export:schemas` writes the component registry and per-type JSON Schemas (built by `src/artifacts/registry/export.ts`) into harness-content-api, which validates every save, import and publish against them. The New artifact dialog's **Import JSON** mode takes bare content or a `{title, content}` envelope and lists the API's issues by path.

## Accessibility

- `src/lib/contrast.test.ts` checks WCAG AA contrast from `index.css` and the slide themes: 4.5:1 for text and 3:1 for focus rings, accents and chart colours. It covers both studio modes, the six content-theme token sets and the rendered slide themes.
- Tokens that differ from `harness-sigmma.pen` because of this: `gc-ink3` (dark `#8a8a94`, light `#6b6b74`), light `gc-warn-chip-ink` `#3d330a`, and the dark slide accent `#8B7BE0`.
- Primary-coloured text uses `gc-primary-ink`; `gc-primary` stays the solid button fill.
- The workspace area tabs follow the WAI-ARIA tab pattern (←/→ to move). Every page has one `h1` and its content sits in landmarks.

## Adding a route

Create `src/routes/<name>.tsx` exporting `Route = createFileRoute("/<name>")(...)`. `pnpm dev` or `pnpm build` regenerates `src/routeTree.gen.ts`.

## shadcn components

`components.json` is set to the `base-nova` style (Base UI primitives).

```bash
pnpm dlx shadcn@latest add dialog
```

If the CLI fails while installing dependencies, `pnpm dlx shadcn@latest view <name>` prints the source. Save it to `src/components/ui/<name>.tsx` and change `import { cn } from "cn"` to `import { cn } from "@/lib/utils"`.

# harness-content

React 19 + Vite app: the Reusable Artifacts Studio. pnpm, TanStack Router (file-based), TanStack Query, shadcn/ui on Base UI, Tailwind v4, Biome and Vitest. Talks to [`harness-content-api`](../harness-content-api). Build progress: [docs/implementation-plan.md](docs/implementation-plan.md).

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
  components/workspace/ artifact workspace: inspector panels, review/publish dialogs
  components/search/  artifact search table and filters
  components/ui/      shadcn components (button, card, dialog, input, sonner)
  hooks/              useAutosave (debounced, If-Match, conflict stop)
  lib/                stamps (UTC YYYY-MM-DD-HH-mm-ss), library tree, URL search state, review workflow
scripts/              gen-api.mjs, pen-nodes.py (read design nodes from the .pen file)
```

Requests carry `X-User-Id` from the **Dev user** picker in the top bar (stored in localStorage).

## Artifact plugins

Each artifact type registers an `ArtifactPlugin` (`src/artifacts/plugin.ts`): a Zod schema, `createEmpty`, `migrate`, an `Editor` and a `Renderer` over the same content, and optional `FormatPanel` / `InsertPanel` for the inspector. `src/artifacts/index.ts` registers them; a type without its own editor uses the JSON stub.

## Adding a route

Create `src/routes/<name>.tsx` exporting `Route = createFileRoute("/<name>")(...)`. `pnpm dev` or `pnpm build` regenerates `src/routeTree.gen.ts`.

## shadcn components

`components.json` is set to the `base-nova` style (Base UI primitives).

```bash
pnpm dlx shadcn@latest add dialog
```

If the CLI fails while installing dependencies, `pnpm dlx shadcn@latest view <name>` prints the source. Save it to `src/components/ui/<name>.tsx` and change `import { cn } from "cn"` to `import { cn } from "@/lib/utils"`.

# harness-sigma

React 19 + Vite app. pnpm, TanStack Router (file-based), TanStack Query, shadcn/ui on Base UI, Tailwind v4, Biome and Vitest. Currently an empty skeleton with a single placeholder route.

## Run

```bash
# from the repo root (installs every JS workspace project)
pnpm install

pnpm --filter harness-sigma dev        # http://localhost:5173
# or, inside apps/harness-sigma:
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

## Structure

```
src/
  main.tsx            providers: theme, query client, router, toaster
  routes/             file-based routes; the plugin regenerates routeTree.gen.ts (committed)
  components/ui/      shadcn components (button, card, input, sonner)
  lib/utils.ts        cn() helper
```

## Adding a route

Create `src/routes/<name>.tsx` exporting `Route = createFileRoute("/<name>")(...)`. `pnpm dev` or `pnpm build` regenerates `src/routeTree.gen.ts`.

## shadcn components

`components.json` is set to the `base-nova` style (Base UI primitives).

```bash
pnpm dlx shadcn@latest add dialog
```

If the CLI fails while installing dependencies, `pnpm dlx shadcn@latest view <name>` prints the source. Save it to `src/components/ui/<name>.tsx` and change `import { cn } from "cn"` to `import { cn } from "@/lib/utils"`.

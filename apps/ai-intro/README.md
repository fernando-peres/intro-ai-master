# ai-intro

React 19 + Vite app. pnpm, TanStack Router (file-based), TanStack Query and Form, shadcn/ui on Base UI, Tailwind v4, React Flow, Biome and Vitest.

## Run

```bash
# from the repo root (installs every JS workspace project)
pnpm install

pnpm --filter ai-intro dev        # http://localhost:5173
# or, inside apps/ai-intro:
pnpm dev
```

Routes:

- `/` redirects to the course's first written lesson.
- `/learn/$chapter/$lesson` is a course lesson. The layout is the "AI Explained" design (`aiexplained.pen`, node `bi8Au`).
- `/flow` is a React Flow canvas. `/chat` is a chat UI with a local echo.

## Course

- `src/curriculum.ts` holds the chapters and lessons. Their order drives the sidebar, the `LESSON nn / NN` counter and the previous/next footer.
- `src/lessons/index.ts` maps `chapter/lesson` to a page component. A lesson that isn't listed there renders a placeholder.
- Each lesson has a `kind`. `content` explains a topic, and `simulation` (the default) is an interactive example that builds intuition.
- Only content lessons show the `LESSON nn / NN` counter and the previous/next footer. Simulations show neither. No lesson shows a chapter eyebrow; the breadcrumb names the chapter.

To write a lesson, create `src/lessons/<chapter>/<lesson>.tsx` using `LessonArticle`, `LessonHero`, `LessonLead` and `LessonFooter` from `components/course/lesson-layout.tsx`. Then register it in `src/lessons/index.ts`.

Themes: dark (default), light, violet, mint and cobalt. They're switched by the chip in the top bar and defined as `--ae-*` variables in `src/index.css`. Tailwind exposes them as `canvas`, `surface`, `elevated`, `fg`, `fg-secondary`, `fg-muted`, `brand`, `line` and `divider`, plus `font-display`, `font-ui` and the `label-ui` utility.

Chart and diagram colors follow one of four meanings — app brand, data class, misc, or semantic (success/error) — documented in `../../docs/branding.md`. Pick a color by what it means before adding one to a lesson.

Focus mode: the maximize icon at the right of the lesson header (after `EN-US` / `PT-BR`) hides the top bar and sidebar; in focus mode the header adds previous/next icons, and the same icon (or Escape) returns to the standard layout. Spec: `docs/26-10-11-focus-mode.md`.

Languages: the Programming vs ML and Machine Learning chapters, the Perceptron and Back-propagation lessons, and the Transformers group in Generative AI include English and Brazilian Portuguese. Use `EN-US` / `PT-BR` in the lesson header; the selection persists across visits. Copy maintenance is documented in `../../docs/localization.md`.

Generative AI: chapter 04 has a content lesson (Foundation Models), four labs (Next Token, Adaptation with Theory and Lab tabs, Assistant Lab, GPT → ChatGPT), the Training Intuition group (three content pages on the data behind pretraining, RLHF and DPO, no server needed) and the Transformers group (Architecture, with GPT-2's real attention; Pretraining, which trains a toy GPT live on the server; Post-training, which takes that toy GPT through SFT, a reward model and PPO). The labs call `algo-server` for real model output, and Vite proxies `/api` to `http://localhost:8000`. Start the server as its README describes; until it is up, each lab shows the start command. Specs: `docs/26-10-16-foundational model.md`, `docs/26-10-26-training-intuition.md` and `docs/26-10-25-transformers.md`.

Embeddings: chapter 05 has the Embeddings lesson with Theory, Intuition (GloVe word vectors), Text (MiniLM sentence vectors) and Applications (semantic against keyword search, and the RAG pipeline) tabs. The labs call `algo-server` (`/embeddings/*`) for real vectors; start the server as its README describes, and until it is up each lab shows the start command. Spec: `docs/26-10-25-embeddings.md`.

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
  curriculum.ts       chapters, lessons, ordering helpers (+ curriculum.test.ts)
  routes/             file-based routes; the plugin regenerates routeTree.gen.ts (committed)
  lessons/            written lesson pages + registry (index.ts)
  components/course/  top bar, theme chip, sidebar, lesson layout pieces
  components/         other app components (chat.tsx + chat.test.tsx)
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

## Chat

`/chat` is UI only. [Chat SDK](https://chat-sdk.dev) is a server-side bot SDK (Slack, Teams, Discord…), so it belongs in a separate Node app (for example `apps/chat-bot`), which this UI would call through the `reply` prop of `Chat`.

## Editable Generalization Summary

Open `/learn/machine-learning/summary` for an editable concept reference.
BlockNote loads only when this lesson opens. Type `/` for blocks, select text
for formatting, or use the Move block buttons to reorder with the keyboard.

English and Portuguese have independent browser-local copies. Autosave runs
after 500ms and flushes when leaving the page. Restore original confirms before
replacing only the current language. Clearing browser data removes saved notes;
there is no cross-device sync. If saving fails, keep the tab open until it can
save again. The authored reference is maintained in `summary/content.ts`.

Page titles flow inline and wrap naturally when their available width runs out;
accented title text retains its color and italics without forcing a second line.

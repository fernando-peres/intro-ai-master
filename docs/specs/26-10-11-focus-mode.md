# Focus mode: only the lesson on screen

**Status:** Implemented.
**App:** `apps/ai-intro`
**Scope:** Every lesson page (`/learn/$chapter/$lesson`)

## Purpose

Let a student read or run a lesson without the course chrome. The top bar and the topics sidebar give way to the page, which fills the viewport. The student can step to the previous or next lesson and return to the standard layout at any time.

## Behavior

| | Standard mode | Focus mode |
|---|---|---|
| Top bar (logo, theme chip) | Shown | Hidden |
| Topics sidebar | Shown (from `md` up) | Hidden |
| Lesson header (breadcrumb, counter, language selector) | Shown | Shown |
| Previous/next icons in the lesson header | Hidden | Shown |
| Lesson content and content-lesson footer | Shown | Shown |

- **Enter:** the focus toggle in the lesson header.
- **Exit:** the same toggle, in the same place, or **Escape**.
- **Not persisted:** every visit and page reload starts in standard mode, so nobody lands on a chrome-less page without knowing why.
- **Lesson state survives the switch.** The top bar and sidebar are removed in place, without remounting the routed page. Simulation progress, inputs and expanded panels stay as they are.
- **Navigation keeps the mode.** Moving to another lesson in focus mode keeps focus mode on.

## Lesson header controls

The right side of the lesson header, in order:

1. `LESSON nn / NN` counter. Content lessons only, from `lg` up. Unchanged.
2. **Previous / next**, in focus mode only. Square icon links with `ChevronLeft` and `ChevronRight`.
3. `EN-US` / `PT-BR` language selector. Unchanged.
4. **Focus toggle**, always shown. It is a square icon button: `Maximize2` enters focus mode and `Minimize2` exits it.

Previous/next follow the whole-course order, the same order as the sidebar and the content-lesson footer (`neighbours` in `src/curriculum.ts`). They cross chapter boundaries. On the first lesson, previous is a dimmed, inert placeholder. On the last lesson, next is too. The placeholder keeps the layout from shifting.

The focus toggle and the pager share one chip style (`iconChip` in `components/course/focus-mode.tsx`), matching the theme chip's border and hover colors.

## Accessibility and languages

| Control | en-US | pt-BR |
|---|---|---|
| Toggle, standard mode | Focus mode | Modo foco |
| Toggle, focus mode | Exit focus mode | Sair do modo foco |
| Pager group | Lesson navigation | Navegação entre aulas |
| Previous link | Previous: *lesson title* | Anterior: *lesson title* |
| Next link | Next: *lesson title* | Próxima: *lesson title* |

- The toggle exposes its state with `aria-pressed`.
- Every icon control has an `aria-label` and a matching `title` tooltip. Lesson titles in the labels are localized with `localizedEntry`.
- Edge placeholders are `aria-hidden`, so screen readers announce only links that work.
- All controls are reachable with the keyboard and show the brand focus outline.

## Out of scope

- Routes without a lesson header (`/flow`, `/chat`). They offer no toggle. If focus mode is on when one of them is reached, Escape still exits.
- Remembering focus mode across visits.
- Paging only within the current chapter.
- Keyboard shortcuts for previous/next.

## Verification

- `components/course/focus-mode.test.tsx` covers the toggle, Escape and the Portuguese labels.
- `components/course/focus-pager.test.tsx` renders the real route tree. It checks that focus mode hides the top bar and sidebar and that next navigates while staying in focus mode. It also checks the first and last lessons, which have no previous and no next link respectively.
- Manual: from `apps/ai-intro`, run `pnpm dev` and open a lesson. Toggle focus mode, page across a chapter boundary, then press Escape.

# PT-BR Language Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an `[EN-US] [PT-BR]` selector that lets learners read the Programming vs ML pages and the Machine Learning chapter in either English or Brazilian Portuguese, while preserving the current English version.

**Architecture:** Add a small app-level language module and a route-level selector that persists the selected language. Keep the current English lesson components as the canonical implementation, then add PT-BR lesson variants or localized copy modules only for the requested lessons. Shared datasets, charts, math engines, and simulations remain language-neutral.

**Tech Stack:** React 19, TanStack Router, TypeScript, Vite, Vitest, Testing Library, existing Tailwind/CSS tokens.

**Spec:** `apps/ai-intro/docs/26-10-10-prgramming-vs-ml.md` and `apps/ai-intro/docs/26-10-11-machine-learning.md`

## Global Constraints

- Do not read, write, modify, or delete anything under `.scratchpad/`.
- Keep `docs/` as the source of truth; this is a bounded UI/content change and does not need an ADR.
- Do not change shared ML/math engines unless localization exposes hard-coded user-facing text there.
- English remains the default and must render exactly as before unless the language selector is visible.
- All new user-facing Portuguese copy uses Brazilian Portuguese and the label `PT-BR`.
- The selector labels are exactly `EN-US` and `PT-BR`.
- The selected language persists in `localStorage` and applies across lesson navigation.

## Review Focus

- First visit with no saved language should show English and an active `EN-US` control.
- Switching to `PT-BR` should not reset simulation state on the current page unless unavoidable.
- Direct navigation to any localized lesson should respect the saved language.
- Placeholder or future lessons outside the requested pages should remain readable in English.
- Footer and sidebar navigation should continue using stable lesson slugs and not break routes.

---

## File Structure

- Create `apps/ai-intro/src/i18n/language.tsx`: language type, context provider, persistence, `useLanguage`.
- Create `apps/ai-intro/src/i18n/language.test.tsx`: provider and persistence tests.
- Modify `apps/ai-intro/src/routes/__root.tsx`: wrap the course shell in `LanguageProvider`.
- Modify `apps/ai-intro/src/components/course/lesson-layout.tsx`: add language selector support to `LessonBreadcrumb`.
- Modify `apps/ai-intro/src/routes/learn.$chapter.$lesson.tsx`: pass selected language into lesson page resolution.
- Modify `apps/ai-intro/src/lessons/index.ts`: support language-aware lesson registration.
- Modify `apps/ai-intro/src/curriculum.ts`: optionally add `titles` for localized chapter and lesson labels, without changing slugs.
- Create or modify localized lesson modules under:
  - `apps/ai-intro/src/lessons/programming-vs-ml/*.tsx`
  - `apps/ai-intro/src/lessons/machine-learning/*.tsx`
- Add focused tests in `apps/ai-intro/src/curriculum.test.ts` and route/component tests where the existing test setup supports them.

## Task 1: Language State And Selector

**Files:**
- Create: `apps/ai-intro/src/i18n/language.tsx`
- Create: `apps/ai-intro/src/i18n/language.test.tsx`
- Modify: `apps/ai-intro/src/routes/__root.tsx`
- Modify: `apps/ai-intro/src/components/course/lesson-layout.tsx`

**Interfaces:**
- Produces: `type Language = "en-US" | "pt-BR"`
- Produces: `function useLanguage(): { language: Language; setLanguage(language: Language): void }`
- Produces: `function LanguageProvider({ children }: { children: ReactNode }): JSX.Element`

- [ ] Write tests proving default language is `en-US`, changing to `pt-BR` updates context, and valid saved `localStorage` values are loaded.
- [ ] Implement `LanguageProvider` with a lazy `localStorage` read guarded for non-browser environments.
- [ ] Add a compact segmented selector to `LessonBreadcrumb` with two buttons labeled `EN-US` and `PT-BR`.
- [ ] Wrap the root layout in `LanguageProvider`.
- [ ] Run `pnpm --filter ai-intro test -- i18n/language.test.tsx`.
- [ ] Run `pnpm --filter ai-intro typecheck`.

## Task 2: Language-Aware Lesson Resolution

**Files:**
- Modify: `apps/ai-intro/src/lessons/index.ts`
- Modify: `apps/ai-intro/src/routes/learn.$chapter.$lesson.tsx`
- Modify: `apps/ai-intro/src/curriculum.ts`
- Modify: `apps/ai-intro/src/curriculum.test.ts`

**Interfaces:**
- Produces: `getLessonPage(key: string, language: Language): ComponentType<{ entry: LessonEntry }>`
- Produces: `localizedEntry(entry: LessonEntry, language: Language): LessonEntry`

- [ ] Add tests that `getLessonPage("programming-vs-ml/machine-learning", "en-US")` returns the existing English page and `pt-BR` falls back to English until a PT-BR page is registered.
- [ ] Add tests that localized chapter/lesson titles change display text but preserve `chapter.slug` and `lesson.slug`.
- [ ] Replace direct `lessonPages[key]` access with `getLessonPage(key, language)`.
- [ ] Use `localizedEntry(entry, language)` for breadcrumb/footer/sidebar display only; route params must keep canonical slugs.
- [ ] Run `pnpm --filter ai-intro test -- curriculum.test.ts`.
- [ ] Run `pnpm --filter ai-intro typecheck`.

## Task 3: PT-BR Programming Vs ML Pages

**Files:**
- Modify or create localized variants for:
  - `apps/ai-intro/src/lessons/programming-vs-ml/problem.tsx`
  - `apps/ai-intro/src/lessons/programming-vs-ml/programming.tsx`
  - `apps/ai-intro/src/lessons/programming-vs-ml/machine-learning.tsx`
  - `apps/ai-intro/src/lessons/programming-vs-ml/content.tsx`
- Modify: `apps/ai-intro/src/lessons/index.ts`

**Interfaces:**
- Consumes: `Language`, `getLessonPage`, existing chart/data/rule APIs.
- Produces: PT-BR lesson registrations for `programming-vs-ml/*`.

- [ ] Extract repeated visible copy into local `copy` objects only where it avoids duplicating large interactive code.
- [ ] Translate headings, lead text, section labels, status messages, button labels, chart notes, captions, and table labels into PT-BR.
- [ ] Keep code snippets, formulas, class codes, numeric values, dataset values, and route slugs unchanged.
- [ ] Register PT-BR variants in `lessonPages` or the new language-aware registry.
- [ ] Manually check that the Machine Learning simulation still trains, steps, resets, classifies, and shows math in both languages.
- [ ] Run `pnpm --filter ai-intro test -- lessons/programming-vs-ml`.
- [ ] Run `pnpm --filter ai-intro typecheck`.

## Task 4: PT-BR Machine Learning Chapter

**Files:**
- Modify or create localized variants for:
  - `apps/ai-intro/src/lessons/machine-learning/components.tsx`
  - `apps/ai-intro/src/lessons/machine-learning/bias-and-variance.tsx`
  - `apps/ai-intro/src/lessons/machine-learning/fairness.tsx`
  - `apps/ai-intro/src/lessons/machine-learning/classification-metrics.tsx`
  - `apps/ai-intro/src/lessons/machine-learning/clustering-metrics.tsx`
  - `apps/ai-intro/src/lessons/machine-learning/regression-metrics.tsx`
  - `apps/ai-intro/src/lessons/machine-learning/reinforcement-learning-metrics.tsx`
  - `apps/ai-intro/src/lessons/machine-learning/ranking-metrics.tsx`
- Review shared helpers:
  - `apps/ai-intro/src/lessons/machine-learning/metric-section.tsx`
  - `apps/ai-intro/src/lessons/machine-learning/algorithm-card.tsx`
  - `apps/ai-intro/src/lessons/machine-learning/metric-glossary.ts`

**Interfaces:**
- Consumes: existing metric/data/model helpers.
- Produces: PT-BR lesson registrations for `machine-learning/*`.

- [ ] Translate each lesson’s hero, lead, section headings, metric explanations, captions, toggles, table headers, and accessibility labels.
- [ ] For shared helpers, add explicit copy props or a small localized glossary rather than branching on global language inside math/data functions.
- [ ] Keep references, citations, formulas, dataset names, and metric abbreviations intact where they are standard terms.
- [ ] Register PT-BR variants for all eight chapter pages.
- [ ] Run the existing metric/library tests: `pnpm --filter ai-intro test -- src/lib`.
- [ ] Run `pnpm --filter ai-intro typecheck`.

## Task 5: Navigation, Polish, And Build Verification

**Files:**
- Modify: `apps/ai-intro/src/components/course/sidebar.tsx`
- Modify: `apps/ai-intro/src/components/course/lesson-layout.tsx`
- Modify: `apps/ai-intro/src/index.css` only if the selector needs a reusable style.

**Interfaces:**
- Consumes: `localizedEntry`, `useLanguage`.

- [ ] Localize sidebar chapter and lesson display names for the requested sections.
- [ ] Confirm previous/next footer labels reflect the selected language while links still navigate by canonical slug.
- [ ] Confirm selector focus states, active states, and mobile wrapping fit inside the 57px breadcrumb bar.
- [ ] Run `pnpm --filter ai-intro lint`.
- [ ] Run `pnpm --filter ai-intro build`.
- [ ] Start `pnpm --filter ai-intro dev` and manually verify:
  - `/learn/programming-vs-ml/machine-learning`
  - `/learn/machine-learning/components`
  - one metric lesson, such as `/learn/machine-learning/classification-metrics`
  - language persists after refresh and across next/previous navigation.

## Recommended Execution

Use the native path for implementation. The work is mostly one app, the shared interfaces are small, and the biggest risk is copy coverage rather than deep architectural coupling.

## Implementation Notes

- Tasks 1–4 implemented with one shared copy dictionary and the existing lesson components.
- Ruling: use language-aware copy instead of separate page registrations or `getLessonPage`. Keeping component identity stable preserves interactive state. The tradeoff is that English text is the dictionary key and copy changes must update both languages.
- Ruling: implement in the existing workspace because the app and its source files are user-owned untracked work. An isolated checkout would omit that working application; no commits or unrelated changes are included.
- The chart regression test caught localized series identifiers; identifiers now remain canonical and only displayed labels are translated.
- Durable behavior and maintenance guidance lives in `docs/localization.md`.
- Validation: 86 tests pass, app lint passes and production build/typecheck passes. Vite reports a lesson bundle over 500 kB; per-lesson loading remains a future optimization.
- Final review: an independent reviewer identified untranslated compound fairness/ranking labels and HTML entities in an English explanation. All three findings were reproduced with failing tests and fixed; the full suite passes.
- Visual verification limitation: no browser surface is available through the UI automation tools. The local preview serves successfully; desktop/mobile screenshots could not be checked.

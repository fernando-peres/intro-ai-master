import type { Schemas } from "@/api/client"
import {
  getSlideTheme,
  hasSlideTheme,
  listSlideThemes,
  type SlideTheme,
  useSlideThemes,
} from "@/artifacts/plugins/slide/themes"

/** A draft step as the builder holds it: the API's step plus a stable client key for dnd. */
export type TrailStep = Omit<Schemas["StepOut"], "id" | "position"> & { key: string }

/** `themeOverride` value meaning "keep the artifact's own theme instead of the trail's". */
export const USE_ARTIFACT_THEME = "artifact"

function swatches(theme: SlideTheme): string[] {
  const { background } = theme
  return [background.kind === "flat" ? background.color : background.to, theme.accent, theme.text]
}

/** The saved artifact themes a trail can use, kept current as they load or change. */
export function useTrailThemes() {
  return useSlideThemes().map((theme) => ({ id: theme.id, label: theme.label }))
}

export function themeSwatches(id: string | null | undefined): string[] | undefined {
  return id && hasSlideTheme(id) ? swatches(getSlideTheme(id)) : undefined
}

export function themeLabel(id: string | null | undefined): string {
  return listSlideThemes().find((theme) => theme.id === id)?.label ?? "Artifact's own"
}

let counter = 0
export function fromServer(steps: Schemas["StepOut"][]): TrailStep[] {
  return steps.map(({ id: _id, position: _position, ...step }) => ({
    ...step,
    key: `s${++counter}`,
  }))
}

export function toStepIn(step: TrailStep): Schemas["StepIn"] {
  return {
    artifactId: step.artifactId,
    locale: step.locale,
    artifactVersionId: step.artifactVersionId ?? null,
    label: step.label ?? null,
    presenterNote: step.presenterNote ?? null,
    advanceSeconds: step.advanceSeconds ?? null,
    themeOverride: step.themeOverride ?? null,
  }
}

export function newStep(fields: Omit<TrailStep, "key">): TrailStep {
  return { ...fields, key: `s${++counter}` }
}

/** Timed steps last `advanceSeconds`; manual steps count their artifact's planned duration. */
export function stepSeconds(step: Pick<TrailStep, "advanceSeconds" | "durationSeconds">): number {
  return step.advanceSeconds ?? step.durationSeconds ?? 0
}

export function totalSeconds(steps: Pick<TrailStep, "advanceSeconds" | "durationSeconds">[]) {
  return steps.reduce((sum, step) => sum + stepSeconds(step), 0)
}

/** 42 → "0:42", 3725 → "62:05". */
export function formatClock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds))
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

export type ThemeSource = "trail" | "artifact" | "step"

/**
 * The theme a step plays in. A step may name a theme, or keep the artifact's own; otherwise
 * the trail theme wins, and a trail without a theme leaves every artifact as authored.
 */
export function resolveTheme(
  override: string | null | undefined,
  trailTheme: string | null | undefined,
  ownTheme: string | undefined,
): { theme: string | undefined; source: ThemeSource } {
  if (override === USE_ARTIFACT_THEME) return { theme: ownTheme, source: "artifact" }
  if (override) return { theme: override, source: "step" }
  if (trailTheme) return { theme: trailTheme, source: "trail" }
  return { theme: ownTheme, source: "artifact" }
}

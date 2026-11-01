import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { SLIDE_THEMES } from "@/artifacts/plugins/slide/model"
import { contrastRatio, themeTokens } from "@/lib/contrast"
import { STUDIO_THEMES } from "@/lib/studio-theme"

// Vitest stubs CSS imports (even `?raw`), so read the stylesheet itself.
const themes = themeTokens(readFileSync(resolve(__dirname, "../index.css"), "utf8"))
const TEXT = 4.5
const GRAPHIC = 3

// Text tokens on every surface they are painted on, and the non-text accents (focus rings).
const STUDIO: [string, string, number][] = [
  ...["gc-text", "gc-ink2", "gc-ink3", "gc-primary-ink"].flatMap((ink) =>
    ["gc-page", "gc-raised", "gc-sunken", "gc-row-bg"].map(
      (surface) => [ink, surface, TEXT] as [string, string, number],
    ),
  ),
  ["gc-on-solid", "gc-primary", TEXT],
  ["gc-nav-ink", "gc-nav-bg", TEXT],
  ["gc-nav-ink", "gc-row-bg", TEXT],
  ["gc-warn-chip-ink", "gc-warn-base", TEXT],
  ...["fail", "warn", "risk", "pass", "done"].flatMap((tone) => [
    [`gc-${tone}-ink`, `gc-${tone}-tint`, TEXT] as [string, string, number],
    [`gc-${tone}-ink`, "gc-raised", TEXT] as [string, string, number],
  ]),
  ["gc-primary", "gc-page", GRAPHIC],
  ["gc-primary", "gc-raised", GRAPHIC],
  ["gc-primary", "gc-sunken", GRAPHIC],
]

const CONTENT: [string, string, number][] = [
  ...["ct-text-primary", "ct-text-secondary", "ct-text-muted"].flatMap((ink) =>
    ["ct-bg", "ct-bg-surface", "ct-bg-elevated"].map(
      (surface) => [ink, surface, TEXT] as [string, string, number],
    ),
  ),
  ["ct-accent", "ct-bg", GRAPHIC],
  ["ct-accent", "ct-bg-surface", GRAPHIC],
]

function failures(theme: string, pairs: [string, string, number][]) {
  const tokens = themes[theme]
  return pairs
    .map(([ink, surface, min]) => ({
      ink,
      surface,
      min,
      ratio: contrastRatio(tokens[ink], tokens[surface]),
    }))
    .filter((pair) => !(pair.ratio >= pair.min))
    .map((pair) => `${pair.ink} on ${pair.surface}: ${pair.ratio.toFixed(2)} < ${pair.min}`)
}

describe("WCAG AA contrast", () => {
  it("knows the reference ratios", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21)
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 2)
  })

  it.each(STUDIO_THEMES)("studio chrome: %s", (theme) => {
    expect(failures(theme, STUDIO)).toEqual([])
  })

  it.each(["dark", "light", "violet", "mint", "cobalt", "ivory"])("content tokens: %s", (theme) => {
    expect(failures(theme, CONTENT)).toEqual([])
  })

  // What slides, animations and trails actually paint, against each gradient stop.
  it.each(Object.entries(SLIDE_THEMES))("rendered theme: %s", (_, theme) => {
    const { background: bg } = theme
    const stops: string[] = bg.kind === "flat" ? [bg.color] : [bg.from, bg.to]
    const worst = (ink: string) => Math.min(...stops.map((stop) => contrastRatio(ink, stop)))
    expect({
      text: worst(theme.text) >= TEXT,
      body: worst(theme.body) >= TEXT,
      muted: worst(theme.muted) >= TEXT,
      accent: worst(theme.accent) >= GRAPHIC,
    }).toEqual({ text: true, body: true, muted: true, accent: true })
  })
})

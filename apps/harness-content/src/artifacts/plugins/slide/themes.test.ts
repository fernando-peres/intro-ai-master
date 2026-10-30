import { afterEach, describe, expect, it } from "vitest"
import {
  BUILTIN_TOKENS,
  getSlideTheme,
  hasSlideTheme,
  registerThemes,
  SLIDE_THEMES,
  type SlideThemeId,
  tokensToSlideTheme,
} from "@/artifacts/plugins/slide/themes"

describe("artifact themes", () => {
  afterEach(() => registerThemes([]))

  it.each(Object.keys(SLIDE_THEMES) as SlideThemeId[])("seed keeps rendering: %s", (id) => {
    const { label: _, ...expected } = SLIDE_THEMES[id]
    const { label: __, ...mapped } = tokensToSlideTheme("x", BUILTIN_TOKENS[id])
    expect(mapped).toEqual(expected)
  })

  it("uses saved themes and falls back to dark for unknown IDs", () => {
    expect(hasSlideTheme("thm_a")).toBe(false)
    expect(getSlideTheme("thm_a").accent).toBe(SLIDE_THEMES.dark.accent)
    const tokens = { ...BUILTIN_TOKENS.mint, accent1: "#123456" }
    registerThemes([{ id: "thm_a", name: "Mine", tokens }])
    expect(hasSlideTheme("thm_a")).toBe(true)
    expect(getSlideTheme("thm_a")).toMatchObject({ label: "Mine", accent: "#123456" })
    expect(hasSlideTheme("dark")).toBe(true)
  })
})

import { afterEach, describe, expect, it } from "vitest"
import { createElement, resolveText, type TextElement } from "@/artifacts/plugins/slide/model"
import {
  BUILTIN_TOKENS,
  getSlideTheme,
  hasSlideTheme,
  registerThemes,
  SLIDE_THEMES,
  type SlideThemeId,
  THEME_PALETTES,
  tokensToSlideTheme,
} from "@/artifacts/plugins/slide/themes"

describe("artifact themes", () => {
  afterEach(() => registerThemes([]))

  it("resolves text fonts from the Nova theme", () => {
    const theme = SLIDE_THEMES["nova-ims-green"]
    const font = (variant: TextElement["variant"]) =>
      resolveText({ ...createElement("title"), variant } as TextElement, theme)
    expect(font("title").fontFamily).toBe("Borna")
    expect(font("body").fontFamily).toBe("Prompt")
    expect(font("eyebrow")).toMatchObject({ fontFamily: "Prompt", fontWeight: 300 })
  })

  it("defines a four-step ramp per Nova activation colour", () => {
    const { colors, backgrounds } = THEME_PALETTES["nova-ims-green"]
    expect(colors).toHaveLength(12)
    expect(colors.slice(0, 2)).toEqual(["#86EFB8", "#79D7A6"])
    expect(backgrounds).toEqual(["#10FF80", "#0D0A06", "#101240", "#28352D"])
  })

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

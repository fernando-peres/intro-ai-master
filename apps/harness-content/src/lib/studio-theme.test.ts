import { describe, expect, it } from "vitest"
import { readPreferences, resolveStudioTheme } from "@/lib/studio-theme"

describe("studio theme", () => {
  it("resolves the mode to a theme", () => {
    expect(resolveStudioTheme("light", "graphite-mint", false)).toBe("graphite-light")
    expect(resolveStudioTheme("dark", "graphite-mint", true)).toBe("graphite-mint")
    expect(resolveStudioTheme("system", "graphite-mint", true)).toBe("graphite-light")
    expect(resolveStudioTheme("system", "graphite-mint", false)).toBe("graphite-mint")
  })

  it("reads stored choices, including the legacy light value", () => {
    expect(readPreferences(null, null)).toEqual({ dark: "graphite-dark", mode: "dark" })
    expect(readPreferences("graphite-light", null)).toEqual({
      dark: "graphite-dark",
      mode: "light",
    })
    expect(readPreferences("graphite-cobalt", "system")).toEqual({
      dark: "graphite-cobalt",
      mode: "system",
    })
    expect(readPreferences("nope", "nope")).toEqual({ dark: "graphite-dark", mode: "dark" })
  })
})

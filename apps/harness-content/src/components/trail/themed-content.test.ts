import { describe, expect, it } from "vitest"
import "@/artifacts"
import animationFixture from "@/artifacts/plugins/animation/fixtures/dod5-animation.json"
import slideFixture from "@/artifacts/plugins/slide/fixtures/dod4-slide.json"
import { themedContent } from "@/components/trail/themed-content"
import { USE_ARTIFACT_THEME } from "@/lib/trail"

describe("trail theming", () => {
  it("restyles slides and animations with the trail theme without touching the version", () => {
    const slide = themedContent("slide", slideFixture, null, "violet")
    expect(slide).toMatchObject({ theme: "violet", source: "trail", content: { theme: "violet" } })
    expect(slideFixture.theme).toBe("dark")

    const animation = themedContent("animation", animationFixture, null, "mint")
    expect(animation).toMatchObject({ content: { props: { scheme: "mint" } } })
  })

  it("keeps the artifact's own theme when the step asks, and leaves docs alone", () => {
    expect(themedContent("slide", slideFixture, USE_ARTIFACT_THEME, "violet")).toMatchObject({
      theme: "dark",
      source: "artifact",
      content: { theme: "dark" },
    })
    const doc = { schemaVersion: 1, type: "doc", blocks: [] }
    expect(themedContent("doc", doc, null, "violet")).toMatchObject({ content: doc })
    expect(themedContent("slide", { type: "slide" }, null, "violet")).toHaveProperty("error")
  })
})

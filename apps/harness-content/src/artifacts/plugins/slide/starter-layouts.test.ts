import { describe, expect, it } from "vitest"
import { slideSchema } from "@/artifacts/plugins/slide/model"
import { STARTER_LAYOUTS, starterLayout } from "@/artifacts/plugins/slide/starter-layouts"

describe("starter layouts", () => {
  it.each(STARTER_LAYOUTS.map((layout) => layout.id))("%s is valid slide content", (layout) => {
    const content = starterLayout(layout, "mint")
    expect(slideSchema.parse(content)).toEqual(content)
    expect(content.theme).toBe("mint")
    const ids = content.elements.map((element) => element.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("keeps elements inside the canvas", () => {
    for (const { id } of STARTER_LAYOUTS) {
      for (const el of starterLayout(id, "dark").elements) {
        expect(el.x + el.width).toBeLessThanOrEqual(1920)
        expect(el.y + el.height).toBeLessThanOrEqual(1080)
      }
    }
  })
})

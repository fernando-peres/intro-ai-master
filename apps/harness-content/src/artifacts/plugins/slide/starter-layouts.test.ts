import { describe, expect, it } from "vitest"
import { slideSchema } from "@/artifacts/plugins/slide/model"
import { NOVA_LAYOUTS } from "@/artifacts/plugins/slide/nova-layouts"
import { STARTER_LAYOUTS, starterLayout } from "@/artifacts/plugins/slide/starter-layouts"
import { buildLayout, layoutsFor } from "@/artifacts/plugins/slide/theme-layouts"

describe("starter layouts", () => {
  it.each(STARTER_LAYOUTS.map((layout) => layout.id))("%s is valid slide content", (layout) => {
    const content = starterLayout(layout, "mint")
    expect(slideSchema.parse(content)).toEqual(content)
    expect(content.theme).toBe("mint")
    const ids = content.elements.map((element) => element.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(NOVA_LAYOUTS.map((layout) => layout.id))("%s is valid, on canvas", (layout) => {
    const content = buildLayout(layout, "nova-ims-green")
    expect(slideSchema.parse(content)).toEqual(content)
    expect(content.background?.kind).toBe("flat")
    const ids = content.elements.map((element) => element.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const el of content.elements) {
      expect(el.x + el.width).toBeLessThanOrEqual(1920)
      expect(el.y + el.height).toBeLessThanOrEqual(1080)
    }
  })

  it("offers Nova layouts only on the Nova theme", () => {
    expect(layoutsFor("nova-ims-green")[0].id).toBe("nova-cover")
    expect(layoutsFor("dark").map((layout) => layout.id)).toEqual(
      STARTER_LAYOUTS.map((layout) => layout.id),
    )
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

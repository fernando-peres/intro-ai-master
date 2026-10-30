import { describe, expect, it } from "vitest"
import { emptyHistory, MERGE_WINDOW, record, redo, undo } from "@/artifacts/plugins/slide/history"
import {
  backgroundToCss,
  CANVAS,
  createElement,
  createEmptySlide,
  type InsertKind,
  resolveBackground,
  resolveShape,
  resolveText,
  SLIDE_THEMES,
  type SlideContent,
  slideSchema,
  slideSearchText,
  type TextElement,
} from "@/artifacts/plugins/slide/model"
import {
  addElement,
  applyTransforms,
  duplicateElements,
  moveBy,
  removeElements,
  resetToTheme,
  setBackground,
  setTheme,
  updateElement,
  updateStyle,
} from "@/artifacts/plugins/slide/ops"

const KINDS: InsertKind[] = [
  "eyebrow",
  "title",
  "body",
  "bullets",
  "rect",
  "ellipse",
  "line",
  "arrow",
  "image",
  "diagram",
]

/** What a save and reload does: JSON out, JSON in, schema parse. */
const reload = (content: SlideContent) => slideSchema.parse(JSON.parse(JSON.stringify(content)))

describe("slide schema", () => {
  it("accepts the empty slide and every insertable element", () => {
    const slide = KINDS.reduce(
      (acc, kind) => addElement(acc, createElement(kind)),
      createEmptySlide(),
    )
    expect(slideSchema.safeParse(slide).success).toBe(true)
    expect(slide.elements).toHaveLength(3 + KINDS.length)
  })

  it("fills canvas, theme and elements for content created before the editor existed", () => {
    expect(slideSchema.parse({ schemaVersion: 1, type: "slide" })).toEqual({
      schemaVersion: 1,
      type: "slide",
      canvas: CANVAS,
      theme: "dark",
      elements: [],
    })
  })

  it("rejects unknown element types and bad colors", () => {
    const slide = createEmptySlide()
    const bad = { ...slide, elements: [{ ...slide.elements[0], type: "video" }] }
    expect(slideSchema.safeParse(bad).success).toBe(false)
    const badColor = updateStyle(slide, [slide.elements[0].id], { color: "red" })
    expect(slideSchema.safeParse(badColor).success).toBe(false)
  })

  it("centres new elements and keeps them on the canvas", () => {
    const centred = createElement("rect")
    expect(centred.x + centred.width / 2).toBe(CANVAS.width / 2)
    const corner = createElement("rect", 1910, 1075)
    expect(corner.x + corner.width).toBeLessThanOrEqual(CANVAS.width)
    expect(corner.y + corner.height).toBeLessThanOrEqual(CANVAS.height)
  })
})

describe("slide edits survive save and reload", () => {
  it("move, resize, rotate, restyle, retheme and background", () => {
    let slide = createEmptySlide()
    const [, title, body] = slide.elements
    slide = moveBy(slide, [body.id], 12.5, -20)
    slide = applyTransforms(slide, [
      { id: title.id, x: 200, y: 260, width: 1000.004, height: 180, rotation: -15 },
    ])
    slide = updateStyle(slide, [title.id], { color: "#FF8800", fontSize: 120 })
    slide = updateElement(slide, body.id, { text: "Edited body" })
    slide = setTheme(slide, "mint")
    slide = setBackground(slide, { kind: "gradient", from: "#000000", to: "#2DD4A7", angle: 90 })
    slide = addElement(slide, createElement("arrow", 600, 700))

    const reloaded = reload(slide)
    expect(reloaded).toEqual(slide)
    const reloadedTitle = reloaded.elements[1] as TextElement
    expect(reloadedTitle).toMatchObject({ x: 200, y: 260, width: 1000, rotation: 345 })
    expect(reloadedTitle.style).toEqual({ color: "#FF8800", fontSize: 120 })
    expect(reloaded.elements[2]).toMatchObject({
      x: body.x + 12.5,
      y: body.y - 20,
      text: "Edited body",
    })
    expect(reloaded.theme).toBe("mint")
  })

  it("locked elements ignore move, transform and delete", () => {
    let slide = createEmptySlide()
    const target = slide.elements[1]
    slide = updateElement(slide, target.id, { locked: true })
    slide = moveBy(slide, [target.id], 100, 100)
    slide = applyTransforms(slide, [{ ...target, x: 0, y: 0, rotation: 90 }])
    slide = removeElements(slide, [target.id])
    expect(slide.elements.find((el) => el.id === target.id)).toMatchObject({
      x: target.x,
      y: target.y,
      rotation: 0,
    })
  })

  it("duplicates on top with fresh ids", () => {
    const slide = createEmptySlide()
    const [next, ids] = duplicateElements(slide, [slide.elements[1].id])
    expect(next.elements).toHaveLength(4)
    expect(next.elements[3]).toMatchObject({ id: ids[0], x: slide.elements[1].x + 40 })
  })
})

describe("theme resolution", () => {
  it("uses theme defaults until a style override is set, and reset clears overrides", () => {
    let slide = createEmptySlide()
    const title = slide.elements[1] as TextElement
    expect(resolveText(title, SLIDE_THEMES.dark)).toMatchObject({
      fontFamily: "Cormorant Garamond",
      color: SLIDE_THEMES.dark.text,
    })
    slide = updateStyle(slide, [title.id], { color: "#123456" })
    slide = setBackground(slide, { kind: "flat", color: "#000000" })
    expect(resolveText(slide.elements[1] as TextElement, SLIDE_THEMES.dark).color).toBe("#123456")

    const reset = resetToTheme(slide)
    expect((reset.elements[1] as TextElement).style).toEqual({})
    expect(resolveBackground(reset)).toEqual(SLIDE_THEMES.dark.background)
  })

  it("resolves shapes from the theme", () => {
    const rect = createElement("rect")
    expect(resolveShape(rect, SLIDE_THEMES.light)).toMatchObject({
      fill: SLIDE_THEMES.light.surface,
      cornerRadius: 17,
    })
  })

  it("indexes text, diagram labels and alt text for search", () => {
    const slide = addElement(createEmptySlide(), createElement("diagram"))
    expect(slideSearchText(slide)).toContain("Untitled slide")
    expect(slideSearchText(slide)).toContain("Rubric pass")
  })
})

describe("history", () => {
  it("undoes and redoes whole steps", () => {
    let history = emptyHistory<number>()
    history = record(history, 1, null, 0)
    history = record(history, 2, null, 10)
    const [afterUndo, value] = undo(history, 3) ?? []
    expect(value).toBe(2)
    const [afterRedo, again] = redo(afterUndo as typeof history, 2) ?? []
    expect(again).toBe(3)
    expect((afterRedo as typeof history).past).toEqual([1, 2])
    expect(undo(emptyHistory<number>(), 1)).toBeNull()
  })

  it("merges a burst in one group, but not across groups or after the window", () => {
    let history = emptyHistory<string>()
    history = record(history, "a", "nudge", 0)
    history = record(history, "ab", "nudge", 100)
    expect(history.past).toEqual(["a"])
    history = record(history, "abc", "type", 200)
    history = record(history, "abcd", "type", 200 + MERGE_WINDOW + 1)
    expect(history.past).toEqual(["a", "abc", "abcd"])
  })
})

describe("backgroundToCss", () => {
  it("writes flat colours and gradients as CSS", () => {
    expect(backgroundToCss({ kind: "flat", color: "#112233" })).toBe("#112233")
    expect(backgroundToCss({ kind: "gradient", from: "#111111", to: "#222222", angle: 125 })).toBe(
      "linear-gradient(125deg, #111111, #222222)",
    )
  })
})

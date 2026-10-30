import Konva from "konva"
import { describe, expect, it } from "vitest"
import { CANVAS } from "@/artifacts/plugins/slide/model"
import { findById, gradientPoints } from "@/artifacts/plugins/slide/scene"

describe("findById", () => {
  it("finds element nodes whose UUID starts with a digit", () => {
    const root = new Konva.Group()
    const node = new Konva.Group({ id: "1f2e3d4c-0000-4000-8000-000000000000" })
    root.add(new Konva.Group({ id: "abc" }), node)
    expect(findById(root, node.id())).toBe(node)
    expect(findById(root, "missing")).toBeUndefined()
  })
})

describe("gradientPoints", () => {
  it("matches CSS angles: 90deg runs left → right, 180deg top → bottom", () => {
    const [start, end] = gradientPoints(90)
    expect(start.x).toBeCloseTo(0)
    expect(end.x).toBeCloseTo(CANVAS.width)
    expect(start.y).toBeCloseTo(CANVAS.height / 2)
    const [top, bottom] = gradientPoints(180)
    expect(top.y).toBeCloseTo(0)
    expect(bottom.y).toBeCloseTo(CANVAS.height)
  })
})

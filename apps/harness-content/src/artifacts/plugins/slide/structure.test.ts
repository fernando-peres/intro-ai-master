import { describe, expect, it } from "vitest"
import { layoutChart, niceCeil, seriesColor } from "@/artifacts/plugins/slide/chart-layout"
import fixture from "@/artifacts/plugins/slide/fixtures/dod4-slide.json"
import {
  CANVAS,
  type ChartElement,
  createElement,
  SLIDE_THEMES,
  type SlideContent,
  slideSchema,
  type TextElement,
} from "@/artifacts/plugins/slide/model"
import {
  alignElements,
  applyTransforms,
  distributeElements,
  expandToGroups,
  groupElements,
  reorder,
  ungroupElements,
  updateElement,
  updateStyle,
} from "@/artifacts/plugins/slide/ops"
import { snapBox, visualBounds } from "@/artifacts/plugins/slide/snapping"

const theme = SLIDE_THEMES.dark
const reload = (content: SlideContent) => slideSchema.parse(JSON.parse(JSON.stringify(content)))
const ids = (content: SlideContent) => content.elements.map((el) => el.id)
const byId = (content: SlideContent, id: string) => {
  const found = content.elements.find((el) => el.id === id)
  if (!found) throw new Error(`missing ${id}`)
  return found
}
const chartOf = (content: SlideContent) =>
  content.elements.find((el): el is ChartElement => el.type === "chart") as ChartElement

describe("charts", () => {
  const chart = createElement("chart") as ChartElement

  it("persist their data model, not a picture", () => {
    expect(chart.data.series[0].values).toEqual([62, 70, 78, 84])
    const rejected = slideSchema.safeParse({
      ...slideSchema.parse({ schemaVersion: 1, type: "slide" }),
      elements: [{ ...chart, data: { ...chart.data, labels: ["only one"] } }],
    })
    expect(rejected.success).toBe(false)
  })

  it("redraw from edited data: line points, bar heights and pie angles follow the values", () => {
    const line = layoutChart(chart, theme).filter((p) => p.kind === "dot")
    const edited = {
      ...chart,
      data: {
        ...chart.data,
        series: [{ ...chart.data.series[0], values: [10, 70, 78, 84] }, chart.data.series[1]],
      },
    }
    const after = layoutChart(edited, theme).filter((p) => p.kind === "dot")
    expect(after[0]).not.toEqual(line[0])
    expect(after.slice(1, 4)).toEqual(line.slice(1, 4))

    const bars = layoutChart({ ...chart, chartType: "bar" }, theme).filter(
      (p) => p.kind === "rect" && p.width > 20,
    )
    expect(bars).toHaveLength(8)

    const pie = layoutChart(
      {
        ...chart,
        chartType: "pie",
        data: { labels: ["A", "B"], series: [{ name: "s", values: [1, 3] }] },
      },
      theme,
    ).filter((p) => p.kind === "arc")
    expect(pie.map((p) => (p.kind === "arc" ? p.angle : 0))).toEqual([90, 270])
  })

  it("uses nice axis maxima and theme-led colours", () => {
    expect([niceCeil(84), niceCeil(7), niceCeil(1300), niceCeil(0)]).toEqual([100, 10, 2000, 0])
    expect(seriesColor(0, theme)).toBe(theme.accent)
    expect(seriesColor(1, theme, "#123456")).toBe("#123456")
  })
})

describe("groups, order and alignment", () => {
  const base = slideSchema.parse(fixture)

  it("groups select together, ungroup dissolves", () => {
    const grouped = groupElements(base, ["el-card-a", "el-card-b"])
    expect(expandToGroups(grouped, ["el-card-a"]).sort()).toEqual(["el-card-a", "el-card-b"])
    expect(expandToGroups(ungroupElements(grouped, ["el-card-b"]), ["el-card-a"])).toEqual([
      "el-card-a",
    ])
  })

  it("reorders while keeping a selection's relative order", () => {
    expect(ids(reorder(base, ["el-eyebrow"], "front")).at(-1)).toBe("el-eyebrow")
    expect(ids(reorder(base, ["el-chart"], "back"))[0]).toBe("el-chart")
    expect(ids(reorder(base, ["el-title"], "forward")).slice(0, 3)).toEqual([
      "el-eyebrow",
      "el-card-a",
      "el-title",
    ])
    expect(ids(reorder(base, ["el-card-a", "el-card-b"], "backward")).slice(0, 4)).toEqual([
      "el-eyebrow",
      "el-card-a",
      "el-card-b",
      "el-title",
    ])
    expect(reorder(base, ["el-eyebrow"], "backward")).toEqual(base)
  })

  it("aligns to the selection box, or to the canvas for one element or one group", () => {
    const left = alignElements(base, ["el-card-a", "el-card-b"], "top", CANVAS)
    expect(left.elements.find((el) => el.id === "el-card-b")?.y).toBe(360)
    const centred = alignElements(base, ["el-chart"], "center", CANVAS)
    const chart = chartOf(centred)
    expect(chart.x + chart.width / 2).toBe(CANVAS.width / 2)
    const grouped = groupElements(base, ["el-card-a", "el-card-b"])
    const right = alignElements(grouped, ["el-card-a", "el-card-b"], "right", CANVAS)
    const [a, b] = ["el-card-a", "el-card-b"].map((id) => byId(right, id))
    expect(b.x + b.width).toBe(CANVAS.width)
    expect(b.x - a.x).toBe(700 - 120)
  })

  it("distributes equal gaps", () => {
    const spread = distributeElements(base, ["el-card-a", "el-card-b", "el-chart"], "horizontal")
    const [a, b, c] = ["el-card-a", "el-card-b", "el-chart"].map((id) => byId(spread, id))
    expect(b.x - (a.x + a.width)).toBeCloseTo(c.x - (b.x + b.width))
  })
})

describe("snapping", () => {
  it("snaps the nearest edge or centre within the threshold and reports the guide", () => {
    const snap = snapBox(
      { x: 96, y: 500, width: 100, height: 100 },
      [
        { x: 100, y: 0, width: 300, height: 50 },
        { x: 0, y: 0, width: CANVAS.width, height: CANVAS.height },
      ],
      8,
    )
    expect(snap.dx).toBe(4)
    expect(snap.vertical).toContain(100)
    // Its middle (550) is 10 from the canvas middle (540): outside the threshold.
    expect(snap.dy).toBe(0)
  })

  it("measures rotated elements by what is visible", () => {
    const quarter = visualBounds({ x: 100, y: 100, width: 200, height: 50, rotation: 90 })
    expect(quarter.x).toBeCloseTo(50)
    expect(quarter.y).toBeCloseTo(100)
    expect(quarter.width).toBeCloseTo(50)
    expect(quarter.height).toBeCloseTo(200)
    expect(visualBounds({ x: 1, y: 2, width: 3, height: 4, rotation: 0 })).toEqual({
      x: 1,
      y: 2,
      width: 3,
      height: 4,
    })
  })

  it("leaves far boxes alone", () => {
    expect(
      snapBox(
        { x: 500, y: 500, width: 10, height: 10 },
        [{ x: 0, y: 0, width: 50, height: 50 }],
        8,
      ),
    ).toEqual({
      dx: 0,
      dy: 0,
      vertical: [],
      horizontal: [],
    })
  })
})

describe("definition of done 4: generated slide stays fully editable", () => {
  it("font/colour, reposition + rotate shapes, group, edit series, save and reload", () => {
    let slide = slideSchema.parse(fixture)
    expect(slide.elements.map((el) => el.type)).toEqual([
      "text",
      "text",
      "rect",
      "ellipse",
      "image",
      "chart",
    ])
    slide = updateStyle(slide, ["el-title"], { fontFamily: "Inter Variable", color: "#FFD166" })
    slide = applyTransforms(slide, [
      { id: "el-card-a", x: 160, y: 380, width: 520, height: 300, rotation: 12 },
      { id: "el-card-b", x: 760, y: 400, width: 260, height: 260, rotation: -30 },
    ])
    slide = groupElements(slide, ["el-card-a", "el-card-b"])
    const chart = chartOf(slide)
    slide = updateElement(slide, chart.id, {
      data: {
        labels: [...chart.data.labels, "Run 6"],
        series: chart.data.series.map((s, i) => ({ ...s, values: [...s.values, i ? 80 : 90] })),
      },
    })

    const reloaded = reload(slide)
    expect(reloaded).toEqual(slide)
    const title = reloaded.elements.find((el) => el.id === "el-title") as TextElement
    expect(title.style).toEqual({ fontFamily: "Inter Variable", color: "#FFD166" })
    expect(reloaded.elements.find((el) => el.id === "el-card-b")).toMatchObject({ rotation: 330 })
    expect(expandToGroups(reloaded, ["el-card-b"]).sort()).toEqual(["el-card-a", "el-card-b"])
    expect(chartOf(reloaded).data.series[0].values.at(-1)).toBe(90)
    expect(layoutChart(chartOf(reloaded), theme).filter((p) => p.kind === "dot")).toHaveLength(12)
  })
})

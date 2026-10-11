import type { PerceptronPoint } from "@/lib/perceptron"
import { DATASET_IDS, DATASETS } from "./perceptron-data"

type XY = { x: number; y: number }
const toXY = (p: PerceptronPoint): XY => ({ x: p.x1, y: p.x2 })
const cross = (o: XY, a: XY, b: XY) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)

/** Andrew's monotone chain, counter-clockwise. */
function hull(points: XY[]): XY[] {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y)
  const half = (list: XY[]) => {
    const out: XY[] = []
    for (const p of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop()
      out.push(p)
    }
    return out.slice(0, -1)
  }
  return [...half(sorted), ...half([...sorted].reverse())]
}

const insideConvex = (poly: XY[], p: XY) =>
  poly.length >= 3 && poly.every((a, i) => cross(a, poly[(i + 1) % poly.length], p) >= 0)

const segmentsCross = (a: XY, b: XY, c: XY, d: XY) =>
  cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0

function hullsIntersect(points: PerceptronPoint[]) {
  const [h0, h1] = ([0, 1] as const).map((c) => hull(points.filter((p) => p.y === c).map(toXY)))
  const edges = (h: XY[]) => h.map((a, i) => [a, h[(i + 1) % h.length]] as const)
  return (
    h0.some((p) => insideConvex(h1, p)) ||
    h1.some((p) => insideConvex(h0, p)) ||
    edges(h0).some(([a, b]) => edges(h1).some(([c, d]) => segmentsCross(a, b, c, d)))
  )
}

/** Every class-1 point is strictly above `x1 + x2 = c`, every class-0 point strictly below. */
const separatedBySum = (points: PerceptronPoint[], c: number) =>
  points.every((p) => (p.y === 1 ? p.x1 + p.x2 - c > 0.05 : c - (p.x1 + p.x2) > 0.05))

const table = (id: "or" | "and" | "xor") => DATASETS[id].points.map((p) => [p.x1, p.x2, p.y])

test("Boolean presets are the exact four truth-table rows", () => {
  expect(table("or")).toEqual([
    [0, 0, 0],
    [0, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
  ])
  expect(table("and").map((r) => r[2])).toEqual([0, 0, 0, 1])
  expect(table("xor").map((r) => r[2])).toEqual([0, 1, 1, 0])
})

test("separable presets have a separating line with a margin", () => {
  expect(separatedBySum(DATASETS.or.points, 0.5)).toBe(true)
  expect(separatedBySum(DATASETS.and.points, 1.5)).toBe(true)
  expect(separatedBySum(DATASETS.clusters.points, 1.1)).toBe(true)
})

test("XOR and moons have intersecting class convex hulls", () => {
  expect(hullsIntersect(DATASETS.xor.points)).toBe(true)
  expect(hullsIntersect(DATASETS.moons.points)).toBe(true)
  expect(hullsIntersect(DATASETS.or.points)).toBe(false)
})

test("clusters have 40 bounded points, 20 per class", () => {
  const { points } = DATASETS.clusters
  expect(points).toHaveLength(40)
  expect(points.filter((p) => p.y === 1)).toHaveLength(20)
  for (const p of points) {
    const [cx, cy] = p.y === 1 ? [0.95, 0.9] : [0.15, 0.2]
    expect(Math.abs(p.x1 - cx)).toBeLessThanOrEqual(0.15)
    expect(Math.abs(p.x2 - cy)).toBeLessThanOrEqual(0.15)
  }
})

test("moons follow the noiseless formula", () => {
  const { points } = DATASETS.moons
  expect(points).toHaveLength(60)
  expect(points[0]).toMatchObject({ x1: 1, x2: 0, y: 0 })
  expect(points[30].x1).toBeCloseTo(0, 12)
  expect(points[30].x2).toBeCloseTo(0.5, 12)
  expect(points[30].y).toBe(1)
})

test("ids are unique and every point fits inside its fixed padded domain", () => {
  for (const id of DATASET_IDS) {
    const { points, domain } = DATASETS[id]
    expect(new Set(points.map((p) => p.id)).size).toBe(points.length)
    for (const p of points) {
      expect(p.x1).toBeGreaterThan(domain.x[0])
      expect(p.x1).toBeLessThan(domain.x[1])
      expect(p.x2).toBeGreaterThan(domain.y[0])
      expect(p.x2).toBeLessThan(domain.y[1])
    }
  }
})

test("only XOR and moons are marked not linearly separable", () => {
  expect(DATASET_IDS.filter((id) => !DATASETS[id].separable)).toEqual(["xor", "moons"])
})

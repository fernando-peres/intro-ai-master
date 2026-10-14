import { emptySketch, placeLineEnd, placePoint } from "./sketch"

test("placePoint appends a labeled point without touching segments", () => {
  const state = placePoint(emptySketch, { x: 70, y: 3 }, "at-risk")
  expect(state.points).toEqual([{ id: 0, x: 70, y: 3, label: "at-risk" }])
  expect(state.segments).toEqual([])
})

test("placeLineEnd takes two clicks per segment", () => {
  const started = placeLineEnd(emptySketch, { x: 60, y: 1 })
  expect(started.pending).toEqual({ x: 60, y: 1 })
  expect(started.segments).toEqual([])

  const finished = placeLineEnd(started, { x: 90, y: 6 })
  expect(finished.pending).toBeNull()
  expect(finished.segments).toEqual([{ from: { x: 60, y: 1 }, to: { x: 90, y: 6 } }])
})

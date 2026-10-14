import type { MachineClass } from "./dataset"

export type SketchMode = "point" | "line"
export type Coord = { x: number; y: number }
/** `id` is stable across renders; points are only appended, and clearing resets the list. */
export type SketchPoint = Coord & { id: number; label: MachineClass }
export type SketchState = {
  points: SketchPoint[]
  segments: { from: Coord; to: Coord }[]
  /** First end of a line waiting for its second click. */
  pending: Coord | null
}

export const emptySketch: SketchState = { points: [], segments: [], pending: null }

export function placePoint(state: SketchState, at: Coord, label: MachineClass): SketchState {
  return { ...state, points: [...state.points, { ...at, id: state.points.length, label }] }
}

/** Alternates between starting a segment and finishing it. */
export function placeLineEnd(state: SketchState, at: Coord): SketchState {
  if (!state.pending) return { ...state, pending: at }
  return {
    ...state,
    segments: [...state.segments, { from: state.pending, to: at }],
    pending: null,
  }
}

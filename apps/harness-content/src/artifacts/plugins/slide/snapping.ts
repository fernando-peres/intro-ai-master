/** Snap a dragged box to canvas and sibling edges and centres. */
export type Box = { x: number; y: number; width: number; height: number }
export type Snap = { dx: number; dy: number; vertical: number[]; horizontal: number[] }

const anchors = (start: number, size: number) => [start, start + size / 2, start + size]

/**
 * The smallest shift (each axis independently, within `threshold`) that puts one of the box's
 * left/centre/right (top/middle/bottom) on a target line, and the lines it landed on.
 */
export function snapBox(moving: Box, targets: readonly Box[], threshold: number): Snap {
  const xs = targets.flatMap((t) => anchors(t.x, t.width))
  const ys = targets.flatMap((t) => anchors(t.y, t.height))
  const [dx, vertical] = nearest(anchors(moving.x, moving.width), xs, threshold)
  const [dy, horizontal] = nearest(anchors(moving.y, moving.height), ys, threshold)
  return { dx, dy, vertical, horizontal }
}

function nearest(own: number[], lines: number[], threshold: number): [number, number[]] {
  let best: number | null = null
  for (const point of own) {
    for (const line of lines) {
      const delta = line - point
      if (Math.abs(delta) <= threshold && (best === null || Math.abs(delta) < Math.abs(best))) {
        best = delta
      }
    }
  }
  if (best === null) return [0, []]
  const shifted = own.map((point) => point + (best as number))
  const hits = [...new Set(lines.filter((line) => shifted.some((p) => Math.abs(p - line) < 0.5)))]
  return [best, hits]
}

/** Axis-aligned bounds of a box rotated by `rotation` degrees around its top-left (Konva's origin). */
export function visualBounds(box: Box & { rotation: number }): Box {
  const radians = (box.rotation * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const corners = [
    [0, 0],
    [box.width, 0],
    [0, box.height],
    [box.width, box.height],
  ].map(([cx, cy]) => [box.x + cx * cos - cy * sin, box.y + cx * sin + cy * cos])
  const xs = corners.map(([x]) => x)
  const ys = corners.map(([, y]) => y)
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  }
}

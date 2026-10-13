import { forward, type Network } from "@/lib/neural-net"

export type Domain = { xMin: number; xMax: number; yMin: number; yMax: number }

/**
 * Every layer's per-neuron values across a grid of the 2D input plane — one `forward` call per
 * cell, so all neurons in every layer (input included) come from a single shared pass. Returns
 * `grids[layer][neuron][row][col]`.
 */
export function sampleLayers(
  net: Network,
  toInput: (x: number, y: number) => number[],
  domain: Domain,
  resolution = 10,
): number[][][][] {
  const grids: number[][][][] = net.layerSizes.map((size) =>
    Array.from({ length: size }, () =>
      Array.from({ length: resolution }, () => new Array(resolution).fill(0)),
    ),
  )

  for (let row = 0; row < resolution; row++) {
    // Row 0 is the top of the chart, i.e. the domain's highest y.
    const y = domain.yMax - (row / (resolution - 1)) * (domain.yMax - domain.yMin)
    for (let col = 0; col < resolution; col++) {
      const x = domain.xMin + (col / (resolution - 1)) * (domain.xMax - domain.xMin)
      const layerActivations = forward(net, toInput(x, y))
      layerActivations.forEach((values, layer) => {
        values.forEach((value, neuron) => {
          grids[layer][neuron][row][col] = value
        })
      })
    }
  }
  return grids
}

function hexToRgb(hex: string): [number, number, number] {
  const match = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim())
  if (!match) return [128, 128, 128]
  return [
    Number.parseInt(match[1], 16),
    Number.parseInt(match[2], 16),
    Number.parseInt(match[3], 16),
  ]
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

/** Diverging color at `t` (0..1): negative color → white at the midpoint → positive color. */
export function divergingColor(
  t: number,
  negativeRgb: [number, number, number],
  positiveRgb: [number, number, number],
): [number, number, number] {
  const white: [number, number, number] = [255, 255, 255]
  const [from, to, localT] =
    t < 0.5 ? [negativeRgb, white, t * 2] : [white, positiveRgb, (t - 0.5) * 2]
  return [lerp(from[0], to[0], localT), lerp(from[1], to[1], localT), lerp(from[2], to[2], localT)]
}

/** Resolves a theme color variable to its literal hex, so it tracks the active theme at draw time. */
export function resolveThemeColor(cssVariable: string, fallback: string): string {
  if (typeof window === "undefined") return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(cssVariable).trim()
  return value || fallback
}

/**
 * Draws `grid` (each neuron's own min/max normalized independently, for visibility) to an
 * off-screen canvas and returns a data URL — the small blocky gradient square per node.
 * Returns `null` where canvas isn't available (e.g. a non-browser test environment).
 */
export function gridToDataUrl(
  grid: number[][],
  negativeColor: string,
  positiveColor: string,
): string | null {
  const resolution = grid.length
  const canvas = typeof document === "undefined" ? null : document.createElement("canvas")
  const ctx = canvas?.getContext("2d")
  if (!canvas || !ctx) return null

  canvas.width = resolution
  canvas.height = resolution
  const flat = grid.flat()
  const min = Math.min(...flat)
  const max = Math.max(...flat)
  const negativeRgb = hexToRgb(negativeColor)
  const positiveRgb = hexToRgb(positiveColor)

  const image = ctx.createImageData(resolution, resolution)
  for (let row = 0; row < resolution; row++) {
    for (let col = 0; col < resolution; col++) {
      const t = (grid[row][col] - min) / (max - min || 1)
      const [r, g, b] = divergingColor(t, negativeRgb, positiveRgb)
      const i = (row * resolution + col) * 4
      image.data[i] = r
      image.data[i + 1] = g
      image.data[i + 2] = b
      image.data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
  return canvas.toDataURL()
}

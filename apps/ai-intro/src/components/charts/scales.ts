export const CHART_WIDTH = 760
export const CHART_HEIGHT = 420
export const CHART_MARGIN = { top: 20, right: 24, bottom: 56, left: 48 }

/** "Nice" round numbers (1/2/5 × 10^n) for axis ticks, independent of the data's own scale. */
export function niceTicks(min: number, max: number, targetCount = 5): number[] {
  const span = max - min || 1
  const rawStep = span / targetCount
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const residual = rawStep / magnitude
  const step = (residual > 5 ? 10 : residual > 2 ? 5 : residual > 1 ? 2 : 1) * magnitude

  const start = Math.floor(min / step) * step
  const end = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Math.round(v * 1000) / 1000)
  return ticks
}

/** Shared pixel-mapping for every SVG chart, so axes/margins/ticks stay consistent across them. */
export function createScale({
  xValues,
  yValues,
  xTickCount = 5,
  yTickCount = 4,
  yMin = 0,
  width = CHART_WIDTH,
  height = CHART_HEIGHT,
  margin = CHART_MARGIN,
}: {
  xValues: number[]
  yValues: number[]
  xTickCount?: number
  yTickCount?: number
  /** Lowest value the y-axis must show, e.g. 0 so bars/boundaries read from a true baseline. */
  yMin?: number
  width?: number
  height?: number
  margin?: typeof CHART_MARGIN
}) {
  const plotWidth = width - margin.left - margin.right
  const plotHeight = height - margin.top - margin.bottom

  const xTicks = niceTicks(Math.min(...xValues), Math.max(...xValues), xTickCount)
  const yTicks = niceTicks(yMin, Math.max(...yValues), yTickCount)
  const xMin = xTicks[0]
  const xMax = xTicks[xTicks.length - 1]
  const yLo = yTicks[0]
  const yHi = yTicks[yTicks.length - 1]

  const px = (x: number) => margin.left + ((x - xMin) / (xMax - xMin)) * plotWidth
  const py = (y: number) => margin.top + plotHeight - ((y - yLo) / (yHi - yLo)) * plotHeight

  return {
    width,
    height,
    margin,
    plotWidth,
    plotHeight,
    xTicks,
    yTicks,
    xDomain: [xMin, xMax] as const,
    yDomain: [yLo, yHi] as const,
    px,
    py,
  }
}

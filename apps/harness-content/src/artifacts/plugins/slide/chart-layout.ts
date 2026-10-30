import { type ChartElement, FONTS, type SlideTheme } from "@/artifacts/plugins/slide/model"

/** Drawing primitives in the chart's local box; the scene maps each to one Konva shape. */
export type ChartPrimitive =
  | {
      kind: "rect"
      x: number
      y: number
      width: number
      height: number
      fill: string
      radius: number
    }
  | { kind: "line"; points: number[]; stroke: string; width: number; dash?: number[] }
  | { kind: "dot"; x: number; y: number; radius: number; fill: string }
  | {
      kind: "arc"
      x: number
      y: number
      radius: number
      angle: number
      rotation: number
      fill: string
    }
  | {
      kind: "text"
      x: number
      y: number
      width: number
      text: string
      size: number
      fill: string
      align: "left" | "center" | "right"
      font: string
    }

/** Categorical colours after the theme accent; a series' own `color` wins. */
const PALETTE = ["#2DD4A7", "#F2A65A", "#E0607E", "#7FB3FF", "#C9A0FF", "#9AD07A"]

export function seriesColor(index: number, theme: SlideTheme, own?: string): string {
  if (own) return own
  return index === 0 ? theme.accent : PALETTE[(index - 1) % PALETTE.length]
}

/** Rounds `value` up to 1, 2, 2.5 or 5 × 10ⁿ so axis ticks land on readable numbers. */
export function niceCeil(value: number): number {
  if (value <= 0) return 0
  const exponent = 10 ** Math.floor(Math.log10(value))
  const fraction = value / exponent
  const nice = [1, 2, 2.5, 5, 10].find((step) => fraction <= step) ?? 10
  return nice * exponent
}

const TICKS = 4
const AXIS_FONT = 26
const LEGEND_FONT = 26
const TITLE_FONT = 34

export function formatValue(value: number): string {
  if (Math.abs(value) >= 1000) return `${Math.round(value / 100) / 10}k`
  return String(Math.round(value * 10) / 10)
}

/** Lays out a line, bar or pie chart; pure, so data edits are testable without a canvas. */
export function layoutChart(chart: ChartElement, theme: SlideTheme): ChartPrimitive[] {
  const prims: ChartPrimitive[] = []
  const { width, height, data, options } = chart
  let top = 0
  let bottom = height

  if (options.title) {
    prims.push(text(0, 0, width, options.title, TITLE_FONT, theme.text, "left", FONTS.display))
    top += TITLE_FONT + 24
  }

  const legendItems =
    chart.chartType === "pie"
      ? data.labels.map((label, i) => ({ label, color: seriesColor(i, theme) }))
      : data.series.map((series, i) => ({
          label: series.name,
          color: seriesColor(i, theme, series.color),
        }))
  if (options.showLegend && legendItems.length) {
    bottom -= LEGEND_FONT + 24
    let x = 0
    for (const item of legendItems) {
      prims.push({
        kind: "rect",
        x,
        y: bottom + 30,
        width: 20,
        height: 20,
        fill: item.color,
        radius: 4,
      })
      const labelWidth = item.label.length * LEGEND_FONT * 0.56 + 20
      prims.push(text(x + 30, bottom + 26, labelWidth, item.label, LEGEND_FONT, theme.body, "left"))
      x += 30 + labelWidth + 28
    }
  }

  if (chart.chartType === "pie") {
    layoutPie(chart, theme, prims, top, bottom)
    return prims
  }

  const values = data.series.flatMap((series) => series.values)
  const min = options.yMin ?? Math.min(0, ...values)
  const max = options.yMax ?? (niceCeil(Math.max(0, ...values)) || 1)
  const span = max - min || 1
  const plotLeft = 90
  const plotRight = width
  const plotTop = top + 10
  const plotBottom = bottom - (AXIS_FONT + 22)
  const plotHeight = Math.max(1, plotBottom - plotTop)
  const y = (value: number) => plotBottom - ((value - min) / span) * plotHeight

  for (let i = 0; i <= TICKS; i++) {
    const value = min + (span * i) / TICKS
    const ty = y(value)
    if (options.showGrid) {
      prims.push({
        kind: "line",
        points: [plotLeft, ty, plotRight, ty],
        stroke: theme.line,
        width: 2,
        dash: i === 0 ? undefined : [8, 8],
      })
    }
    prims.push(
      text(
        0,
        ty - AXIS_FONT / 2,
        plotLeft - 16,
        formatValue(value),
        AXIS_FONT,
        theme.muted,
        "right",
      ),
    )
  }

  const count = Math.max(1, data.labels.length)
  const band = (plotRight - plotLeft) / count
  data.labels.forEach((label, i) => {
    prims.push(
      text(plotLeft + i * band, plotBottom + 14, band, label, AXIS_FONT, theme.muted, "center"),
    )
  })

  if (chart.chartType === "bar") {
    const groupWidth = band * 0.72
    const barWidth = groupWidth / data.series.length
    data.series.forEach((series, s) => {
      const fill = seriesColor(s, theme, series.color)
      series.values.forEach((value, i) => {
        const x = plotLeft + i * band + (band - groupWidth) / 2 + s * barWidth
        const top = Math.min(y(value), y(Math.max(min, 0)))
        const barHeight = Math.abs(y(value) - y(Math.max(min, 0)))
        prims.push({
          kind: "rect",
          x: x + 3,
          y: top,
          width: Math.max(1, barWidth - 6),
          height: barHeight,
          fill,
          radius: 6,
        })
        if (options.showValues) {
          prims.push(
            text(
              x,
              top - AXIS_FONT - 8,
              barWidth,
              formatValue(value),
              AXIS_FONT,
              theme.text,
              "center",
            ),
          )
        }
      })
    })
    return prims
  }

  data.series.forEach((series, s) => {
    const stroke = seriesColor(s, theme, series.color)
    const points = series.values.flatMap((value, i) => [plotLeft + (i + 0.5) * band, y(value)])
    prims.push({ kind: "line", points, stroke, width: 6 })
    series.values.forEach((value, i) => {
      const cx = plotLeft + (i + 0.5) * band
      prims.push({ kind: "dot", x: cx, y: y(value), radius: 9, fill: stroke })
      if (options.showValues) {
        prims.push(
          text(
            cx - 60,
            y(value) - AXIS_FONT - 14,
            120,
            formatValue(value),
            AXIS_FONT,
            theme.text,
            "center",
          ),
        )
      }
    })
  })
  return prims
}

/** Slices from the first series; negative values count as zero. */
function layoutPie(
  chart: ChartElement,
  theme: SlideTheme,
  prims: ChartPrimitive[],
  top: number,
  bottom: number,
) {
  const values = chart.data.series[0].values.map((value) => Math.max(0, value))
  const total = values.reduce((sum, value) => sum + value, 0)
  const radius = Math.max(1, Math.min(chart.width, bottom - top) / 2 - 8)
  const cx = chart.width / 2
  const cy = top + (bottom - top) / 2
  if (total === 0) {
    prims.push({ kind: "arc", x: cx, y: cy, radius, angle: 360, rotation: -90, fill: theme.line })
    return
  }
  let rotation = -90
  values.forEach((value, i) => {
    const angle = (value / total) * 360
    if (angle > 0) {
      prims.push({
        kind: "arc",
        x: cx,
        y: cy,
        radius,
        angle,
        rotation,
        fill: seriesColor(i, theme),
      })
      if (chart.options.showValues) {
        const mid = ((rotation + angle / 2) * Math.PI) / 180
        prims.push(
          text(
            cx + Math.cos(mid) * radius * 0.62 - 70,
            cy + Math.sin(mid) * radius * 0.62 - AXIS_FONT / 2,
            140,
            `${Math.round((value / total) * 100)}%`,
            AXIS_FONT,
            "#FFFFFF",
            "center",
          ),
        )
      }
    }
    rotation += angle
  })
}

function text(
  x: number,
  y: number,
  width: number,
  value: string,
  size: number,
  fill: string,
  align: "left" | "center" | "right",
  font: string = FONTS.ui,
): ChartPrimitive {
  return { kind: "text", x, y, width, text: value, size, fill, align, font }
}

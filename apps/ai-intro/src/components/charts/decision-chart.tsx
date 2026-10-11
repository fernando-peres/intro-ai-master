import { useId } from "react"
import { useTranslation } from "@/i18n/use-translation"
import { createScale } from "./scales"
import type { ScatterPoint, ScatterSeries } from "./scatter-chart"
import { pointKey } from "./scatter-chart"

const GRID_COLS = 40
const GRID_ROWS = 24
const CONTOUR_COLS = 72
const CONTOUR_ROWS = 48

type Point = { x: number; y: number }

/**
 * The 0.5-probability contour via marching squares — "the line that's been learned". Returns
 * short segments, so it can curve, wrap around a region, or split into several pieces.
 */
function findBoundarySegments(
  valueAt: (x: number, y: number) => number,
  xDomain: readonly [number, number],
  yDomain: readonly [number, number],
): [Point, Point][] {
  const xAt = (c: number) => xDomain[0] + (c / CONTOUR_COLS) * (xDomain[1] - xDomain[0])
  const yAt = (r: number) => yDomain[0] + (r / CONTOUR_ROWS) * (yDomain[1] - yDomain[0])
  const values = Array.from({ length: CONTOUR_ROWS + 1 }, (_, r) =>
    Array.from({ length: CONTOUR_COLS + 1 }, (_, c) => valueAt(xAt(c), yAt(r)) - 0.5),
  )
  const cross = (a: Point, b: Point, va: number, vb: number): Point => {
    const t = va / (va - vb)
    return { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) }
  }

  const segments: [Point, Point][] = []
  for (let r = 0; r < CONTOUR_ROWS; r++) {
    for (let c = 0; c < CONTOUR_COLS; c++) {
      // Corners counter-clockwise from bottom-left; an edge is crossed when its signs differ.
      const corners = [
        { p: { x: xAt(c), y: yAt(r) }, v: values[r][c] },
        { p: { x: xAt(c + 1), y: yAt(r) }, v: values[r][c + 1] },
        { p: { x: xAt(c + 1), y: yAt(r + 1) }, v: values[r + 1][c + 1] },
        { p: { x: xAt(c), y: yAt(r + 1) }, v: values[r + 1][c] },
      ]
      const hits: Point[] = []
      for (let e = 0; e < 4; e++) {
        const a = corners[e]
        const b = corners[(e + 1) % 4]
        if (a.v < 0 !== b.v < 0) hits.push(cross(a.p, b.p, a.v, b.v))
      }
      if (hits.length === 2) segments.push([hits[0], hits[1]])
      else if (hits.length === 4) {
        segments.push([hits[0], hits[1]], [hits[2], hits[3]])
      }
    }
  }
  return segments
}

/**
 * A scatter plot with a model's predicted-probability background: a grid shaded toward
 * `positiveColor` (value > 0.5) or `negativeColor` (value < 0.5), the labelled points on top.
 */
export function DecisionChart({
  points,
  series,
  xLabel,
  yLabel,
  valueAt,
  positiveColor = "var(--color-brand)",
  negativeColor = "var(--color-chart-cool)",
  showBoundaryLine = false,
  flaggedKeys,
  boundaries,
}: {
  points: ScatterPoint[]
  series: ScatterSeries[]
  xLabel: string
  yLabel: string
  /** The model's predicted probability (0..1) at a point in data space. */
  valueAt: (x: number, y: number) => number
  positiveColor?: string
  negativeColor?: string
  /** Draw the 0.5-probability line on top of the background wash. */
  showBoundaryLine?: boolean
  /** Points to ring, e.g. misclassified examples. */
  flaggedKeys?: Set<string>
  /** Extra 0.5 contours drawn over the shading, e.g. one per training run plus the true rule. */
  boundaries?: {
    key: string
    valueAt: (x: number, y: number) => number
    color: string
    dashed?: boolean
  }[]
}) {
  const { t } = useTranslation()
  const clipId = useId()
  const { width, height, margin, plotWidth, plotHeight, xTicks, yTicks, xDomain, yDomain, px, py } =
    createScale({ xValues: points.map((p) => p.x), yValues: points.map((p) => p.y) })

  const colorOf = (key: string) => series.find((s) => s.key === key)?.color ?? "currentColor"
  const cellWidth = plotWidth / GRID_COLS
  const cellHeight = plotHeight / GRID_ROWS

  const cells = Array.from({ length: GRID_COLS * GRID_ROWS }, (_, i) => {
    const col = i % GRID_COLS
    const row = Math.floor(i / GRID_COLS)
    const dataX = xDomain[0] + ((col + 0.5) / GRID_COLS) * (xDomain[1] - xDomain[0])
    const dataY = yDomain[0] + ((GRID_ROWS - row - 0.5) / GRID_ROWS) * (yDomain[1] - yDomain[0])
    const value = valueAt(dataX, dataY)
    return {
      key: `${col}-${row}`,
      x: margin.left + col * cellWidth,
      y: margin.top + row * cellHeight,
      color: value >= 0.5 ? positiveColor : negativeColor,
      opacity: Math.min(Math.abs(value - 0.5) * 2 * 0.35, 0.35),
    }
  })

  const contourPath = (f: (x: number, y: number) => number) =>
    findBoundarySegments(f, xDomain, yDomain)
      .map(([a, b]) => `M${px(a.x)},${py(a.y)}L${px(b.x)},${py(b.y)}`)
      .join("")
  const boundaryPath = showBoundaryLine ? contourPath(valueAt) : ""

  return (
    <figure className="flex flex-col gap-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={t(
          "{0} against {1}, with the model's predicted decision boundary shaded behind the data.",
          [t(xLabel), t(yLabel)],
        )}
      >
        <clipPath id={clipId}>
          <rect x={margin.left} y={margin.top} width={plotWidth} height={plotHeight} />
        </clipPath>
        <g clipPath={`url(#${clipId})`}>
          {cells.map((cell) => (
            <rect
              key={cell.key}
              x={cell.x}
              y={cell.y}
              width={cellWidth + 0.5}
              height={cellHeight + 0.5}
              fill={cell.color}
              fillOpacity={cell.opacity}
            />
          ))}
          {boundaryPath && (
            <path
              d={boundaryPath}
              fill="none"
              className="stroke-fg"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          )}
          {boundaries?.map((b) => (
            <path
              key={b.key}
              d={contourPath(b.valueAt)}
              fill="none"
              stroke={b.color}
              strokeWidth={b.dashed ? 2 : 2.5}
              strokeDasharray={b.dashed ? "6 5" : undefined}
              strokeLinecap="round"
            />
          ))}
        </g>

        {yTicks.map((t) => (
          <g key={`y-${t}`}>
            <line
              x1={margin.left}
              x2={width - margin.right}
              y1={py(t)}
              y2={py(t)}
              className="stroke-divider"
              strokeDasharray="4 4"
            />
            <text
              x={margin.left - 12}
              y={py(t)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-fg-muted font-ui text-[13px]"
            >
              {t}
            </text>
          </g>
        ))}

        <line
          x1={margin.left}
          x2={margin.left}
          y1={margin.top}
          y2={margin.top + plotHeight}
          className="stroke-fg-muted"
        />
        <line
          x1={margin.left}
          x2={width - margin.right}
          y1={margin.top + plotHeight}
          y2={margin.top + plotHeight}
          className="stroke-fg-muted"
        />

        {xTicks.map((t) => (
          <text
            key={`x-${t}`}
            x={px(t)}
            y={margin.top + plotHeight + 28}
            textAnchor="middle"
            className="fill-fg-muted font-ui text-[13px]"
          >
            {t}
          </text>
        ))}

        <text
          x={margin.left + plotWidth / 2}
          y={height - 6}
          textAnchor="middle"
          className="fill-fg-secondary font-ui text-[14px]"
        >
          {t(xLabel)}
        </text>
        <text
          x={-(margin.top + plotHeight / 2)}
          y={16}
          textAnchor="middle"
          transform="rotate(-90)"
          className="fill-fg-secondary font-ui text-[14px]"
        >
          {t(yLabel)}
        </text>

        {points.map((p) => (
          <g key={pointKey(p)}>
            {flaggedKeys?.has(pointKey(p)) && (
              <circle
                cx={px(p.x)}
                cy={py(p.y)}
                r={15}
                fill="none"
                className="stroke-fg"
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
            )}
            <circle
              cx={px(p.x)}
              cy={py(p.y)}
              r={9}
              fill={colorOf(p.series)}
              stroke="var(--color-canvas)"
              strokeWidth={2.5}
            />
          </g>
        ))}
      </svg>
      <figcaption className="flex items-center justify-center gap-6">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-2 font-ui text-sm text-fg-secondary">
            <span
              aria-hidden
              className="size-3 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            {t(s.label)}
          </span>
        ))}
      </figcaption>
    </figure>
  )
}

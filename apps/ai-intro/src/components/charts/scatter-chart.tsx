import { useTranslation } from "@/i18n/use-translation"
import { createScale } from "./scales"

export type ScatterPoint = { x: number; y: number; series: string }
export type ScatterShape = "circle" | "square" | "triangle" | "diamond"
export type ScatterSeries = { key: string; label: string; color: string; shape?: ScatterShape }

/** A point key, as used in `flaggedKeys` — matches a point's `${x}-${y}-${series}`. */
export const pointKey = (p: ScatterPoint) => `${p.x}-${p.y}-${p.series}`

/** One mark, centered at `(cx, cy)` — so a series can be told apart by shape, not color alone. */
function ShapeMark({
  shape,
  cx,
  cy,
  r,
  ...fillProps
}: {
  shape: ScatterShape
  cx: number
  cy: number
  r: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  strokeDasharray?: string
  className?: string
}) {
  switch (shape) {
    case "square":
      return (
        <rect x={cx - r * 0.9} y={cy - r * 0.9} width={r * 1.8} height={r * 1.8} {...fillProps} />
      )
    case "triangle":
      return (
        <polygon
          points={`${cx},${cy - r * 1.15} ${cx - r * 1.05},${cy + r * 0.75} ${cx + r * 1.05},${cy + r * 0.75}`}
          {...fillProps}
        />
      )
    case "diamond":
      return (
        <polygon
          points={`${cx},${cy - r * 1.15} ${cx + r * 1.15},${cy} ${cx},${cy + r * 1.15} ${cx - r * 1.15},${cy}`}
          {...fillProps}
        />
      )
    default:
      return <circle cx={cx} cy={cy} r={r} {...fillProps} />
  }
}

/**
 * Minimal SVG scatter plot: axis ticks are derived from the data, so it fits any two numeric
 * series without a charting library.
 */
export function ScatterChart({
  points,
  series,
  xLabel,
  yLabel,
  flaggedKeys,
  markers,
  lines,
}: {
  points: ScatterPoint[]
  series: ScatterSeries[]
  xLabel: string
  yLabel: string
  /** Points to ring in the brand color, e.g. a misclassified example. */
  flaggedKeys?: Set<string>
  /** Extra "×" marks with a label, e.g. cluster centroids — distinct from the data points. */
  markers?: { x: number; y: number; label: string }[]
  /** Polylines drawn under the points, e.g. a fitted regression line or sigmoid curve. */
  lines?: {
    points: { x: number; y: number }[]
    /** Drawn at the line's end; an empty label draws no text (pass a `key` instead). */
    label: string
    key?: string
    dashed?: boolean
    color?: string
  }[]
}) {
  const { t } = useTranslation()
  const linePoints = lines?.flatMap((l) => l.points) ?? []
  const scale = createScale({
    xValues: [...points, ...linePoints].map((p) => p.x),
    yValues: [...points, ...linePoints].map((p) => p.y),
    yMin: Math.min(0, ...[...points, ...linePoints].map((p) => p.y)),
  })
  const { width, height, margin, plotWidth, plotHeight, xTicks, yTicks, px, py } = scale

  const colorOf = (key: string) => series.find((s) => s.key === key)?.color ?? "currentColor"
  const shapeOf = (key: string): ScatterShape =>
    series.find((s) => s.key === key)?.shape ?? "circle"
  const counts = series.map(
    (s) => `${points.filter((p) => p.series === s.key).length} ${t(s.label)}`,
  )

  return (
    <figure className="flex flex-col gap-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={t("Scatter plot of {0} against {1}: {2}.", [
          t(xLabel),
          t(yLabel),
          counts.join(", "),
        ])}
      >
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

        {lines?.map((line) => {
          const last = line.points[line.points.length - 1]
          return (
            <g key={line.key ?? line.label}>
              <path
                d={line.points.map((p, i) => `${i ? "L" : "M"}${px(p.x)},${py(p.y)}`).join(" ")}
                fill="none"
                stroke={line.color}
                className={line.color ? undefined : line.dashed ? "stroke-fg-muted" : "stroke-fg"}
                strokeWidth={line.dashed ? 2 : 2.5}
                strokeDasharray={line.dashed ? "6 5" : undefined}
              />
              {last && line.label && (
                <text
                  x={px(last.x) - 6}
                  y={py(last.y) - 12}
                  textAnchor="end"
                  className="fill-fg font-ui text-[13px]"
                >
                  {t(line.label)}
                </text>
              )}
            </g>
          )
        })}

        {points.map((p) => {
          const flagged = flaggedKeys?.has(pointKey(p))
          return (
            <g key={pointKey(p)}>
              {flagged && (
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
              <ShapeMark
                shape={shapeOf(p.series)}
                cx={px(p.x)}
                cy={py(p.y)}
                r={9}
                fill={colorOf(p.series)}
                stroke="var(--color-canvas)"
                strokeWidth={2.5}
              />
            </g>
          )
        })}

        {markers?.map((m) => (
          <g key={m.label}>
            <line
              x1={px(m.x) - 7}
              y1={py(m.y) - 7}
              x2={px(m.x) + 7}
              y2={py(m.y) + 7}
              className="stroke-fg"
              strokeWidth={2.5}
            />
            <line
              x1={px(m.x) - 7}
              y1={py(m.y) + 7}
              x2={px(m.x) + 7}
              y2={py(m.y) - 7}
              className="stroke-fg"
              strokeWidth={2.5}
            />
            <text
              x={px(m.x)}
              y={py(m.y) - 12}
              textAnchor="middle"
              className="fill-fg font-ui text-[11px]"
            >
              {t(m.label)}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-2 font-ui text-sm text-fg-secondary">
            <svg aria-hidden width={14} height={14} viewBox="0 0 14 14" className="shrink-0">
              <ShapeMark shape={s.shape ?? "circle"} cx={7} cy={7} r={6} fill={s.color} />
            </svg>
            {t(s.label)}
          </span>
        ))}
      </figcaption>
    </figure>
  )
}

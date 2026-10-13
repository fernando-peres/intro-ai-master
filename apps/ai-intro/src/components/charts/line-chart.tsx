import { useTranslation } from "@/i18n/use-translation"
import { createScale } from "./scales"

export type LinePoint = { x: number; y: number }
export type LineSeries = {
  key: string
  label: string
  color: string
  points: LinePoint[]
  /** Draw as a dashed reference line, e.g. a fixed baseline to compare against. */
  dashed?: boolean
}

/** Minimal multi-series SVG line chart, e.g. train vs test loss over training epochs. */
export function LineChart({
  series,
  xLabel,
  yLabel,
  vLines,
  xExtent = [],
  showPoints = false,
}: {
  series: LineSeries[]
  xLabel: string
  yLabel: string
  /** Labeled vertical reference lines, e.g. a chosen threshold or the best k. */
  vLines?: { x: number; label: string }[]
  /** x values the axis must span even without data there, e.g. the first epochs of a run. */
  xExtent?: number[]
  showPoints?: boolean
}) {
  const { t } = useTranslation()
  const allPoints = series.flatMap((s) => s.points)
  if (allPoints.length === 0) return null

  const { width, height, margin, plotWidth, plotHeight, xTicks, yTicks, px, py } = createScale({
    xValues: [...allPoints.map((p) => p.x), ...xExtent],
    yValues: allPoints.map((p) => p.y),
    yMin: Math.min(0, ...allPoints.map((p) => p.y)),
    xTickCount: Math.min(allPoints.length - 1, 5) || 1,
  })

  const pathOf = (points: LinePoint[]) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"}${px(p.x)},${py(p.y)}`).join(" ")

  return (
    <figure className="flex flex-col gap-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={t("{0} over {1}: {2}.", [
          t(yLabel),
          t(xLabel),
          series.map((s) => t(s.label)).join(", "),
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

        {series.map((s) => (
          <path
            key={s.key}
            d={pathOf(s.points)}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeDasharray={s.dashed ? "6 5" : undefined}
          />
        ))}
        {showPoints &&
          series.flatMap((s) =>
            s.points.map((p) => (
              <circle
                key={`${s.key}-${p.x}-${p.y}`}
                cx={px(p.x)}
                cy={py(p.y)}
                r={4}
                fill={s.color}
              />
            )),
          )}
        {vLines?.map((v) => (
          <g key={v.label}>
            <line
              x1={px(v.x)}
              x2={px(v.x)}
              y1={margin.top}
              y2={margin.top + plotHeight}
              className="stroke-fg-muted"
              strokeDasharray="3 4"
            />
            <text
              x={px(v.x) + 6}
              y={margin.top + 14}
              className="fill-fg-secondary font-ui text-[13px]"
            >
              {t(v.label)}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
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

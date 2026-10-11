import { useTranslation } from "@/i18n/use-translation"
import { CHART_HEIGHT, CHART_MARGIN, CHART_WIDTH, niceTicks } from "./scales"

export type BarSeries = {
  key: string
  label: string
  color: string
  values: number[]
  /** Per-bar color overrides, e.g. one color per cluster in a single series. */
  colors?: string[]
}

const MAX_LABELED_CATEGORIES = 16

/** Grouped vertical bars over named categories; bars grow up or down from a zero baseline. */
export function BarChart({
  categories,
  series,
  yLabel,
  xLabel,
  legend,
  showValues = false,
  yMax,
}: {
  categories: string[]
  series: BarSeries[]
  yLabel: string
  xLabel?: string
  /** Replaces the per-series legend, e.g. when `colors` encode something else. */
  legend?: { label: string; color: string }[]
  showValues?: boolean
  /** Fixes the top of the axis, e.g. 1 for rates, so charts side by side compare honestly. */
  yMax?: number
}) {
  const { t } = useTranslation()
  const width = CHART_WIDTH
  const height = CHART_HEIGHT
  const margin = CHART_MARGIN
  const plotWidth = width - margin.left - margin.right
  const plotHeight = height - margin.top - margin.bottom
  const values = series.flatMap((s) => s.values)
  const ticks = niceTicks(Math.min(0, ...values), yMax ?? Math.max(0, ...values), 4)
  const lo = ticks[0]
  const hi = ticks[ticks.length - 1]
  const py = (v: number) => margin.top + plotHeight - ((v - lo) / (hi - lo || 1)) * plotHeight
  const band = plotWidth / categories.length
  const barWidth = (band * 0.76) / series.length
  const showLabels = categories.length <= MAX_LABELED_CATEGORIES
  const legendItems = legend ?? series.map((s) => ({ label: s.label, color: s.color }))

  return (
    <figure className="flex flex-col gap-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={t("{0} by {1}: {2}.", [
          t(yLabel),
          t(xLabel ?? "category"),
          series
            .map((s) => `${t(s.label)} ${s.values.map((v) => v.toFixed(2)).join(", ")}`)
            .join("; "),
        ])}
      >
        {ticks.map((t) => (
          <g key={`y-${t}`}>
            <line
              x1={margin.left}
              x2={width - margin.right}
              y1={py(t)}
              y2={py(t)}
              className={t === 0 ? "stroke-fg-muted" : "stroke-divider"}
              strokeDasharray={t === 0 ? undefined : "4 4"}
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

        {categories.map((category, ci) => (
          <g key={category}>
            {series.map((s, si) => {
              const v = s.values[ci]
              const x = margin.left + ci * band + band * 0.12 + si * barWidth
              return (
                <g key={s.key}>
                  <rect
                    x={x}
                    y={Math.min(py(v), py(0))}
                    width={Math.max(barWidth - 2, 1)}
                    height={Math.abs(py(v) - py(0))}
                    fill={s.colors?.[ci] ?? s.color}
                  />
                  {showValues && (
                    <text
                      x={x + barWidth / 2}
                      y={v >= 0 ? py(v) - 6 : py(v) + 16}
                      textAnchor="middle"
                      className="fill-fg font-ui text-[13px]"
                    >
                      {v.toFixed(2)}
                    </text>
                  )}
                </g>
              )
            })}
            {showLabels && (
              <text
                x={margin.left + ci * band + band / 2}
                y={margin.top + plotHeight + 24}
                textAnchor="middle"
                className="fill-fg-muted font-ui text-[13px]"
              >
                {category}
              </text>
            )}
          </g>
        ))}

        {xLabel && (
          <text
            x={margin.left + plotWidth / 2}
            y={height - 6}
            textAnchor="middle"
            className="fill-fg-secondary font-ui text-[14px]"
          >
            {t(xLabel)}
          </text>
        )}
        <text
          x={-(margin.top + plotHeight / 2)}
          y={16}
          textAnchor="middle"
          transform="rotate(-90)"
          className="fill-fg-secondary font-ui text-[14px]"
        >
          {t(yLabel)}
        </text>
      </svg>
      <figcaption className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
        {legendItems.map((l) => (
          <span key={l.label} className="flex items-center gap-2 font-ui text-sm text-fg-secondary">
            <span
              aria-hidden
              className="size-3 rounded-full"
              style={{ backgroundColor: l.color }}
            />
            {t(l.label)}
          </span>
        ))}
      </figcaption>
    </figure>
  )
}

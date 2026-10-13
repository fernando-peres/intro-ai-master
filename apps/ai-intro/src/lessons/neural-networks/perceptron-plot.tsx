import { CHART_MARGIN, niceTicks } from "@/components/charts/scales"
import { useTranslation } from "@/i18n/use-translation"
import {
  boundarySegment,
  type Domain,
  type Params,
  type PerceptronActivation,
  type PerceptronPoint,
  score,
  sigmoid,
} from "@/lib/perceptron"
import { signed, term } from "./perceptron-format"

const WIDTH = 520
const HEIGHT = 480
const GRID = 40

export const CLASS_COLOR = ["var(--color-class-1)", "var(--color-class-2)"] as const

/** Class 0 is a square, class 1 a circle, so class never depends on color alone. */
export function ClassMarker({ cls, cx, cy, r }: { cls: 0 | 1; cx: number; cy: number; r: number }) {
  const shared = { fill: CLASS_COLOR[cls], stroke: "var(--color-canvas)", strokeWidth: 2 }
  return cls === 1 ? (
    <circle cx={cx} cy={cy} r={r} {...shared} />
  ) : (
    <rect x={cx - r * 0.9} y={cy - r * 0.9} width={r * 1.8} height={r * 1.8} {...shared} />
  )
}

/**
 * Labelled points over the neuron's decision regions on fixed axes. Step shades two flat regions;
 * sigmoid shades by P(class 1). The explicit line is omitted when it misses the viewport or the
 * weight vector is zero.
 */
export function PerceptronPlot({
  points,
  domain,
  params,
  activation,
  misclassifiedIds,
  selectedId,
  onSelect,
}: {
  points: PerceptronPoint[]
  domain: Domain
  params: Params
  activation: PerceptronActivation
  misclassifiedIds: ReadonlySet<string>
  selectedId: string
  onSelect: (id: string) => void
}) {
  const { t } = useTranslation()
  const margin = { ...CHART_MARGIN, left: 64 }
  const plotWidth = WIDTH - margin.left - margin.right
  const plotHeight = HEIGHT - margin.top - margin.bottom
  const [x0, x1] = domain.x
  const [y0, y1] = domain.y
  const px = (x: number) => margin.left + ((x - x0) / (x1 - x0)) * plotWidth
  const py = (y: number) => margin.top + plotHeight - ((y - y0) / (y1 - y0)) * plotHeight
  const inside = (v: number, [lo, hi]: readonly [number, number]) => v >= lo && v <= hi
  const xTicks = niceTicks(x0, x1, 4).filter((v) => inside(v, domain.x))
  const yTicks = niceTicks(y0, y1, 4).filter((v) => inside(v, domain.y))
  const radius = points.length <= 4 ? 12 : 7

  const cellW = plotWidth / GRID
  const cellH = plotHeight / GRID
  const cells = Array.from({ length: GRID * GRID }, (_, i) => {
    const col = i % GRID
    const row = Math.floor(i / GRID)
    const z = score(params, {
      x1: x0 + ((col + 0.5) / GRID) * (x1 - x0),
      x2: y1 - ((row + 0.5) / GRID) * (y1 - y0),
    })
    const cls = z >= 0 ? 1 : 0
    const opacity =
      activation === "step" ? 0.2 : Math.min(Math.abs(sigmoid(z) - 0.5) * 2 * 0.4, 0.4)
    return { key: i, x: margin.left + col * cellW, y: margin.top + row * cellH, cls, opacity }
  })

  const segment = boundarySegment(params, domain)
  const boundaryText = segment
    ? t("the line {0}", [`${signed(params.w1)}·x₁ ${term(params.w2)}·x₂ ${term(params.b)} = 0`])
    : params.w1 === 0 && params.w2 === 0
      ? t("none — every point gets the same prediction")
      : t("outside the visible area — every visible point gets the same prediction")

  return (
    <figure className="flex flex-col gap-3">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label={t(
          "Decision plot: {0} training points, {1} misclassified. Decision boundary: {2}.",
          [points.length, misclassifiedIds.size, boundaryText],
        )}
      >
        {cells.map((cell) => (
          <rect
            key={cell.key}
            x={cell.x}
            y={cell.y}
            width={cellW + 0.5}
            height={cellH + 0.5}
            fill={CLASS_COLOR[cell.cls]}
            fillOpacity={cell.opacity}
          />
        ))}

        {yTicks.map((v) => (
          <g key={`y-${v}`}>
            <line
              x1={margin.left}
              x2={WIDTH - margin.right}
              y1={py(v)}
              y2={py(v)}
              className="stroke-divider"
              strokeDasharray="4 4"
            />
            <text
              x={margin.left - 10}
              y={py(v)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-fg-muted font-ui text-[13px]"
            >
              {v}
            </text>
          </g>
        ))}
        {xTicks.map((v) => (
          <text
            key={`x-${v}`}
            x={px(v)}
            y={margin.top + plotHeight + 26}
            textAnchor="middle"
            className="fill-fg-muted font-ui text-[13px]"
          >
            {v}
          </text>
        ))}
        <rect
          x={margin.left}
          y={margin.top}
          width={plotWidth}
          height={plotHeight}
          fill="none"
          className="stroke-fg-muted"
        />
        <text
          x={margin.left + plotWidth / 2}
          y={HEIGHT - 8}
          textAnchor="middle"
          className="fill-fg-secondary font-ui text-[14px]"
        >
          x₁
        </text>
        <text
          x={-(margin.top + plotHeight / 2)}
          y={16}
          textAnchor="middle"
          transform="rotate(-90)"
          className="fill-fg-secondary font-ui text-[14px]"
        >
          x₂
        </text>

        {segment && (
          <line
            x1={px(segment[0].x)}
            y1={py(segment[0].y)}
            x2={px(segment[1].x)}
            y2={py(segment[1].y)}
            className="stroke-fg"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        )}

        {points.map((p) => {
          const cx = px(p.x1)
          const cy = py(p.x2)
          return (
            // biome-ignore lint/a11y/noStaticElementInteractions: keyboard selection is the point list beside the plot.
            <g key={p.id} onClick={() => onSelect(p.id)} className="cursor-pointer">
              {misclassifiedIds.has(p.id) && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius + 6}
                  fill="none"
                  className="stroke-fg"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                />
              )}
              {p.id === selectedId && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius + 10}
                  fill="none"
                  className="stroke-brand"
                  strokeWidth={2.5}
                />
              )}
              <ClassMarker cls={p.y} cx={cx} cy={cy} r={radius} />
            </g>
          )
        })}
      </svg>
      <figcaption className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-ui text-sm text-fg-secondary">
        {([0, 1] as const).map((cls) => (
          <span key={cls} className="flex items-center gap-2">
            <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
              <ClassMarker cls={cls} cx={8} cy={8} r={6} />
            </svg>
            {t("Class {0}", [cls])}
          </span>
        ))}
        <span className="flex items-center gap-2">
          <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
            <circle
              cx={8}
              cy={8}
              r={6}
              fill="none"
              className="stroke-fg"
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />
          </svg>
          {t("Misclassified")}
        </span>
        <span className="flex items-center gap-2">
          <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
            <circle cx={8} cy={8} r={6} fill="none" className="stroke-brand" strokeWidth={2.5} />
          </svg>
          {t("Selected")}
        </span>
        {activation === "sigmoid" && (
          <span className="flex items-center gap-2">
            {t("P(class 1)")} 0
            <span
              aria-hidden
              className="h-2.5 w-16 rounded-[2px]"
              style={{
                background: `linear-gradient(to right, ${CLASS_COLOR[0]}, transparent, ${CLASS_COLOR[1]})`,
              }}
            />
            1
          </span>
        )}
      </figcaption>
    </figure>
  )
}

import { useId } from "react"
import { Expandable } from "@/components/charts/expandable"
import { createScale } from "@/components/charts/scales"
import { useTranslation } from "@/i18n/use-translation"
import { fmt } from "./embeddings-math"

export type EmbeddingPoint = { id: string; label: string; x: number; y: number; series: string }
export type EmbeddingSeries = { key: string; label: string; color: string }
export type EmbeddingArrow = {
  from: { x: number; y: number }
  to: { x: number; y: number }
  label: string
  dashed?: boolean
}

const WIDTH = 760
const HEIGHT = 460
const MARGIN = { top: 24, right: 40, bottom: 28, left: 40 }
const RADIUS = 7

/** Points sharing rounded coordinates would print on top of each other, so they share one label. */
function mergedLabels(points: EmbeddingPoint[]) {
  const groups = new Map<string, { x: number; y: number; labels: string[] }>()
  for (const p of points) {
    const key = `${p.x.toFixed(2)}|${p.y.toFixed(2)}`
    const group = groups.get(key) ?? { x: p.x, y: p.y, labels: [] }
    group.labels.push(p.label)
    groups.set(key, group)
  }
  return [...groups.entries()].map(([key, g]) => ({
    key,
    x: g.x,
    y: g.y,
    text: g.labels.join(" / "),
  }))
}

/**
 * A 2D projection of embeddings; point ids must be unique and stable, since they key the marks.
 * `selected` holds up to two ids; `arrows` are drawn in data coordinates under the points.
 */
export function EmbeddingScatter({
  points,
  series,
  selected = [],
  onSelect,
  arrows = [],
  caption,
  ariaLabel,
  showLabels = true,
}: {
  points: EmbeddingPoint[]
  series: EmbeddingSeries[]
  selected?: string[]
  onSelect?: (id: string) => void
  arrows?: EmbeddingArrow[]
  caption: string
  ariaLabel: string
  showLabels?: boolean
}) {
  const { t } = useTranslation()
  const markerId = useId()
  if (points.length === 0) {
    return <p className="text-sm text-fg-muted">{t("No points to draw yet.")}</p>
  }
  const coordinates = [...points, ...arrows.flatMap((a) => [a.from, a.to])]
  const ys = coordinates.map((p) => p.y)
  const { px, py } = createScale({
    xValues: coordinates.map((p) => p.x),
    yValues: ys,
    yMin: Math.min(...ys),
    width: WIDTH,
    height: HEIGHT,
    margin: MARGIN,
  })
  const colorOf = (key: string) => series.find((s) => s.key === key)?.color ?? "currentColor"

  const plot = (
    <figure className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <svg
          role="img"
          aria-label={ariaLabel}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full min-w-[560px]"
        >
          <defs>
            <marker
              id={markerId}
              viewBox="0 0 10 10"
              refX={9}
              refY={5}
              markerWidth={7}
              markerHeight={7}
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" className="fill-fg-secondary" />
            </marker>
          </defs>
          {arrows.map((a) => (
            <g key={`${a.label}-${a.from.x}-${a.from.y}`}>
              <line
                data-testid="embedding-arrow"
                x1={px(a.from.x)}
                y1={py(a.from.y)}
                x2={px(a.to.x)}
                y2={py(a.to.y)}
                className="stroke-fg-secondary"
                strokeWidth={1.5}
                strokeDasharray={a.dashed ? "5 4" : undefined}
                markerEnd={`url(#${markerId})`}
              />
              <text
                x={(px(a.from.x) + px(a.to.x)) / 2}
                y={(py(a.from.y) + py(a.to.y)) / 2 - 6}
                textAnchor="middle"
                className="fill-fg-secondary font-ui text-[11px]"
              >
                {a.label}
              </text>
            </g>
          ))}
          {points.map((p) => {
            const isSelected = selected.includes(p.id)
            const select = () => onSelect?.(p.id)
            return (
              // biome-ignore lint/a11y/useSemanticElements: an SVG circle cannot be a <button>
              <circle
                key={p.id}
                data-testid="embedding-point"
                data-label={p.label}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={p.label}
                cx={px(p.x)}
                cy={py(p.y)}
                r={isSelected ? RADIUS + 2 : RADIUS}
                fill={isSelected ? "var(--color-brand)" : colorOf(p.series)}
                stroke="var(--color-canvas)"
                strokeWidth={2}
                className="cursor-pointer outline-none focus-visible:stroke-brand"
                onClick={select}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    select()
                  }
                }}
              >
                <title>{`${p.label} (${fmt(p.x)}, ${fmt(p.y)})`}</title>
              </circle>
            )
          })}
          {showLabels &&
            mergedLabels(points).map((l) => (
              <text
                key={l.key}
                data-point-label
                x={px(l.x) + RADIUS + 4}
                y={py(l.y) + 4}
                className="pointer-events-none fill-fg font-display text-[13px]"
              >
                {l.text}
              </text>
            ))}
        </svg>
      </div>
      <figcaption className="flex flex-col gap-2">
        <span className="flex flex-wrap gap-x-5 gap-y-1">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-2 font-ui text-sm text-fg-secondary">
              <span
                aria-hidden
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              {t(s.label)}
            </span>
          ))}
        </span>
        <span className="text-xs text-fg-muted">{caption}</span>
      </figcaption>
    </figure>
  )
  return <Expandable title={ariaLabel}>{plot}</Expandable>
}

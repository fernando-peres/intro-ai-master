import { useId } from "react"
import { useTranslation } from "@/i18n/use-translation"

export type DonutSegment = { key: string; label: string; value: number; color: string }

const SIZE = 220
const CENTER = SIZE / 2
const OUTER_R = 100
const INNER_R = 62

function polarToCartesian(angle: number, radius: number) {
  const rad = ((angle - 90) * Math.PI) / 180
  return { x: CENTER + radius * Math.cos(rad), y: CENTER + radius * Math.sin(rad) }
}

/** An SVG donut slice from `start` to `end` degrees (clockwise from the top), as a closed path. */
function slicePath(start: number, end: number) {
  const outerStart = polarToCartesian(start, OUTER_R)
  const outerEnd = polarToCartesian(end, OUTER_R)
  const innerEnd = polarToCartesian(end, INNER_R)
  const innerStart = polarToCartesian(start, INNER_R)
  const largeArc = end - start > 180 ? 1 : 0
  return [
    `M${outerStart.x},${outerStart.y}`,
    `A${OUTER_R},${OUTER_R} 0 ${largeArc} 1 ${outerEnd.x},${outerEnd.y}`,
    `L${innerEnd.x},${innerEnd.y}`,
    `A${INNER_R},${INNER_R} 0 ${largeArc} 0 ${innerStart.x},${innerStart.y}`,
    "Z",
  ].join(" ")
}

/** A full-circle donut, drawn as a single ring, for a lone 100% segment. */
function ringPath() {
  return [
    `M${CENTER - OUTER_R},${CENTER}`,
    `A${OUTER_R},${OUTER_R} 0 1 1 ${CENTER + OUTER_R},${CENTER}`,
    `A${OUTER_R},${OUTER_R} 0 1 1 ${CENTER - OUTER_R},${CENTER}`,
    `L${CENTER - INNER_R},${CENTER}`,
    `A${INNER_R},${INNER_R} 0 1 0 ${CENTER + INNER_R},${CENTER}`,
    `A${INNER_R},${INNER_R} 0 1 0 ${CENTER - INNER_R},${CENTER}`,
    "Z",
  ].join(" ")
}

/** Share of a whole, as a donut: one ring per segment, proportional to its value. */
export function DonutChart({
  segments,
  centerLabel,
}: {
  segments: DonutSegment[]
  /** Short text in the hole, e.g. the total count. */
  centerLabel?: string
}) {
  const { t } = useTranslation()
  const titleId = useId()
  const total = segments.reduce((sum, s) => sum + s.value, 0)

  let angle = 0
  const slices = segments.map((s) => {
    const share = total ? s.value / total : 0
    const start = angle
    const end = angle + share * 360
    angle = end
    return { ...s, share, start, end }
  })

  return (
    <figure className="flex flex-col items-center gap-3">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-auto w-full max-w-[220px]"
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>
          {slices.map((s) => `${t(s.label)} ${Math.round(s.share * 100)}%`).join(", ")}
        </title>
        {slices.map((s) =>
          s.share >= 0.999 ? (
            <path key={s.key} d={ringPath()} fill={s.color} />
          ) : s.share > 0 ? (
            <path key={s.key} d={slicePath(s.start, s.end)} fill={s.color} />
          ) : null,
        )}
        {centerLabel && (
          <text
            x={CENTER}
            y={CENTER}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-fg font-display text-2xl"
          >
            {centerLabel}
          </text>
        )}
      </svg>
      <figcaption className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
        {slices.map((s) => (
          <span key={s.key} className="flex items-center gap-2 font-ui text-sm text-fg-secondary">
            <span
              aria-hidden
              className="size-3 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            {t(s.label)} {Math.round(s.share * 100)}%
          </span>
        ))}
      </figcaption>
    </figure>
  )
}

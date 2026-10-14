import { useState } from "react"
import { createScale } from "@/components/charts/scales"
import { useTranslation } from "@/i18n/use-translation"
import {
  lossAt,
  type stepByStep,
  WEIGHT_REFS,
  type WeightRef,
  weightOf,
} from "./back-propagation-step-by-step-math"
import { fmt } from "./back-propagation-step-network"

type Pass = ReturnType<typeof stepByStep>

const WIDTH = 520
const HEIGHT = 240
const MARGIN = { top: 16, right: 20, bottom: 44, left: 44 }
const SAMPLES = 60
const SPAN = 2.5

/**
 * Gradient descent on one weight: this row's loss as that weight moves, the others held fixed.
 * The tangent appears at Backward and the step to the updated weight at Update.
 */
export function StepGradient({ pass, step }: { pass: Pass; step: number }) {
  const { t } = useTranslation()
  const [id, setId] = useState<WeightRef["id"]>("v0")
  const ref = WEIGHT_REFS.find((r) => r.id === id) ?? WEIGHT_REFS[8]
  const { value, grad } = weightOf(pass, ref)
  const next = value - pass.learningRate * grad

  const curve = Array.from({ length: SAMPLES + 1 }, (_, i) => {
    const x = value - SPAN + (i / SAMPLES) * 2 * SPAN
    return { x, y: lossAt(pass, ref, x) }
  })
  const { width, height, margin, xTicks, yTicks, px, py, plotWidth, plotHeight } = createScale({
    xValues: curve.map((p) => p.x),
    yValues: curve.map((p) => p.y),
    width: WIDTH,
    height: HEIGHT,
    margin: MARGIN,
    xTickCount: 4,
  })
  const here = { x: px(value), y: py(pass.loss) }
  const after = { x: px(next), y: py(lossAt(pass, ref, next)) }
  const reach = 0.6
  const tangent = [-reach, reach].map((d) => ({
    x: px(value + d),
    y: py(pass.loss + grad * d),
  }))

  return (
    <figure className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <figcaption className="label-ui text-brand">{t("Gradient descent")}</figcaption>
        <label className="flex items-center gap-2 text-sm text-fg-secondary">
          {t("Weight")}
          <select
            value={id}
            onChange={(e) => setId(e.target.value as WeightRef["id"])}
            aria-label={t("Weight")}
            className="rounded-[2px] border border-divider bg-canvas px-2 py-1 font-ui text-xs text-fg"
          >
            {WEIGHT_REFS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={t("Loss of this row as {0} moves, from {1} to {2}.", [
          ref.label,
          fmt(value, 2),
          fmt(next, 2),
        ])}
      >
        {yTicks.map((tick) => (
          <g key={`y${tick}`}>
            <line
              x1={margin.left}
              x2={margin.left + plotWidth}
              y1={py(tick)}
              y2={py(tick)}
              className="stroke-divider"
              strokeDasharray="4 4"
            />
            <text
              x={margin.left - 8}
              y={py(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-fg-muted font-ui text-[11px]"
            >
              {tick}
            </text>
          </g>
        ))}
        {xTicks.map((tick) => (
          <text
            key={`x${tick}`}
            x={px(tick)}
            y={margin.top + plotHeight + 16}
            textAnchor="middle"
            className="fill-fg-muted font-ui text-[11px]"
          >
            {tick}
          </text>
        ))}
        <text
          x={margin.left + plotWidth / 2}
          y={height - 6}
          textAnchor="middle"
          className="fill-fg-muted font-ui text-[12px]"
        >
          {ref.label}
        </text>
        <text x={12} y={margin.top + 8} className="fill-fg-muted font-ui text-[12px]">
          L
        </text>
        <path
          d={curve.map((p, i) => `${i === 0 ? "M" : "L"}${px(p.x)},${py(p.y)}`).join("")}
          fill="none"
          className="stroke-brand"
          strokeWidth={2}
        />
        {step >= 3 && (
          <line
            x1={tangent[0].x}
            y1={tangent[0].y}
            x2={tangent[1].x}
            y2={tangent[1].y}
            className="stroke-fg"
            strokeWidth={1.5}
          />
        )}
        {step >= 4 && (
          <>
            <line
              x1={here.x}
              y1={here.y}
              x2={after.x}
              y2={after.y}
              className="stroke-fg"
              strokeDasharray="4 3"
            />
            <circle
              cx={after.x}
              cy={after.y}
              r={5}
              className="fill-canvas stroke-brand"
              strokeWidth={2}
            />
          </>
        )}
        <circle cx={here.x} cy={here.y} r={6} className="fill-brand" />
      </svg>
      <p className="text-xs text-fg-muted">
        {step >= 4
          ? `${ref.label}: ${fmt(value)} → ${fmt(next)}   (η·∂L/∂${ref.label} = ${fmt(pass.learningRate * grad)})`
          : step >= 3
            ? `∂L/∂${ref.label} = ${fmt(grad)}`
            : `${ref.label} = ${fmt(value)}, L = ${fmt(pass.loss)}`}
      </p>
    </figure>
  )
}

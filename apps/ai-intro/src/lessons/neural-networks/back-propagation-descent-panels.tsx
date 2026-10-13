import { useId, useMemo } from "react"
import { Expandable } from "@/components/charts/expandable"
import { createScale } from "@/components/charts/scales"
import { Panel, PanelNote } from "@/components/workbench"
import { useTranslation } from "@/i18n/use-translation"
import type { Example, Network } from "@/lib/neural-net"
import {
  countRises,
  type DescentRecord,
  WEIGHT_MAX,
  WEIGHT_MIN,
  weightSlice,
} from "./back-propagation-descent"

const W = 400
const H = 250
const LEFT = 48
const RIGHT = 16
const TOP = 30
const BOTTOM = 52
const LOSS_MAX = 2
const TRAIL = 30

const fmt = (v: number, digits = 3) => (v < 0 ? "−" : "") + Math.abs(v).toFixed(digits)

type Slice = ReturnType<typeof weightSlice>

const px = (w: number) => LEFT + ((w - WEIGHT_MIN) / (WEIGHT_MAX - WEIGHT_MIN)) * (W - LEFT - RIGHT)
const py = (loss: number) => TOP + (1 - Math.min(loss, LOSS_MAX) / LOSS_MAX) * (H - TOP - BOTTOM)
const clampW = (w: number) => Math.max(WEIGHT_MIN, Math.min(WEIGHT_MAX, w))

/** The loss as a U in one weight: the ball is where the weight is now, the hollow dot where one step sends it. */
function UChart({
  slice,
  trail,
  learningRate,
}: {
  slice: Slice
  trail: DescentRecord[]
  learningRate: number
}) {
  const { t } = useTranslation()
  const clipId = useId()
  const overshoot = slice.nextLoss > slice.loss
  const path = slice.curve.map((p, i) => `${i === 0 ? "M" : "L"}${px(p.x)},${py(p.y)}`).join("")
  const reach = 1.2
  const tangent = [slice.w - reach, slice.w + reach].map((x) => ({
    x,
    y: slice.loss + slice.gradient * (x - slice.w),
  }))
  const next = { x: clampW(slice.nextW), y: slice.nextLoss }
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={t(
        "Loss as a function of one weight: the weight is {0} now (loss {1}) and one step of size η = {2} sends it to {3}.",
        [fmt(slice.w, 2), fmt(slice.loss), learningRate, fmt(slice.nextW, 2)],
      )}
    >
      <clipPath id={clipId}>
        <rect x={LEFT} y={TOP} width={W - LEFT - RIGHT} height={H - TOP - BOTTOM} />
      </clipPath>
      <line x1={LEFT} x2={LEFT} y1={TOP} y2={H - BOTTOM} className="stroke-fg-muted" />
      <line x1={LEFT} x2={W - RIGHT} y1={H - BOTTOM} y2={H - BOTTOM} className="stroke-fg-muted" />
      {[-6, -3, 0, 3, 6].map((w) => (
        <text
          key={w}
          x={px(w)}
          y={H - BOTTOM + 16}
          textAnchor="middle"
          className="fill-fg-muted font-ui text-[11px]"
        >
          {w}
        </text>
      ))}
      {[0, 1, 2].map((l) => (
        <text
          key={l}
          x={LEFT - 8}
          y={py(l)}
          textAnchor="end"
          dominantBaseline="middle"
          className="fill-fg-muted font-ui text-[11px]"
        >
          {l}
        </text>
      ))}
      <text
        x={LEFT + (W - LEFT - RIGHT) / 2}
        y={H - 8}
        textAnchor="middle"
        className="fill-fg-secondary font-ui text-[12px]"
      >
        {t("weight w (the output neuron's first weight)")}
      </text>
      <text
        x={-(TOP + (H - TOP - BOTTOM) / 2)}
        y={14}
        textAnchor="middle"
        transform="rotate(-90)"
        className="fill-fg-secondary font-ui text-[12px]"
      >
        {t("Loss")}
      </text>

      <g clipPath={`url(#${clipId})`}>
        <path d={path} fill="none" className="stroke-fg" strokeWidth={2} />
        <polyline
          points={trail.map((r) => `${px(clampW(r.w))},${py(r.loss)}`).join(" ")}
          fill="none"
          className="stroke-chart-warm"
          strokeOpacity={0.5}
        />
        {trail.slice(0, -1).map((r, i) => (
          <circle
            key={r.epoch}
            cx={px(clampW(r.w))}
            cy={py(r.loss)}
            r={3}
            className="fill-chart-warm"
            fillOpacity={0.2 + 0.5 * (i / trail.length)}
          />
        ))}
        <line
          x1={px(tangent[0].x)}
          y1={py(tangent[0].y)}
          x2={px(tangent[1].x)}
          y2={py(tangent[1].y)}
          className="stroke-brand"
          strokeWidth={1.5}
        />
        <line
          x1={px(clampW(slice.w))}
          y1={py(slice.loss)}
          x2={px(next.x)}
          y2={py(next.y)}
          className={overshoot ? "stroke-error" : "stroke-brand"}
          strokeDasharray="4 4"
        />
        <circle
          cx={px(next.x)}
          cy={py(next.y)}
          r={6}
          fill="none"
          strokeWidth={2}
          className={overshoot ? "stroke-error" : "stroke-brand"}
        />
        <circle
          cx={px(clampW(slice.w))}
          cy={py(slice.loss)}
          r={7}
          className="fill-chart-warm"
          stroke="var(--color-canvas)"
          strokeWidth={2}
        />
      </g>
      <circle cx={px(slice.lowest.w)} cy={py(slice.lowest.loss)} r={4} className="fill-success" />
      <text
        x={px(slice.lowest.w)}
        y={py(slice.lowest.loss) + 18}
        textAnchor="middle"
        className="fill-success font-ui text-[11px]"
      >
        {t("lowest")}
      </text>
      <text x={LEFT + 6} y={TOP - 12} className="fill-chart-warm font-ui text-[11px]">
        {t("● now")}
      </text>
      <text
        x={LEFT + 60}
        y={TOP - 12}
        className={`${overshoot ? "fill-error" : "fill-brand"} font-ui text-[11px]`}
      >
        {t("○ after one step (η = {0})", [learningRate])}
      </text>
    </svg>
  )
}

type Checkpoint = DescentRecord

/** Every recorded epoch as a dot on the loss path; steps where the loss rose are red. */
function HistoryChart({ history }: { history: Checkpoint[] }) {
  const { t } = useTranslation()
  const { width, height, margin, plotWidth, plotHeight, xTicks, yTicks, px, py } = createScale({
    xValues: [...history.map((h) => h.epoch), 10],
    yValues: history.map((h) => h.loss),
    xTickCount: 5,
  })
  const path = history.map((h, i) => `${i === 0 ? "M" : "L"}${px(h.epoch)},${py(h.loss)}`).join("")
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label={t("Loss at every recorded epoch, from {0} to {1}.", [
        fmt(history[0].loss),
        fmt(history[history.length - 1].loss),
      ])}
    >
      {yTicks.map((v) => (
        <g key={`y-${v}`}>
          <line
            x1={margin.left}
            x2={width - margin.right}
            y1={py(v)}
            y2={py(v)}
            className="stroke-divider"
            strokeDasharray="4 4"
          />
          <text
            x={margin.left - 12}
            y={py(v)}
            textAnchor="end"
            dominantBaseline="middle"
            className="fill-fg-muted font-ui text-[13px]"
          >
            {v}
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
        x2={margin.left + plotWidth}
        y1={margin.top + plotHeight}
        y2={margin.top + plotHeight}
        className="stroke-fg-muted"
      />
      {xTicks.map((v) => (
        <text
          key={`x-${v}`}
          x={px(v)}
          y={margin.top + plotHeight + 28}
          textAnchor="middle"
          className="fill-fg-muted font-ui text-[13px]"
        >
          {v}
        </text>
      ))}
      <text
        x={margin.left + plotWidth / 2}
        y={height - 6}
        textAnchor="middle"
        className="fill-fg-secondary font-ui text-[14px]"
      >
        {t("Epoch")}
      </text>
      <text
        x={-(margin.top + plotHeight / 2)}
        y={16}
        textAnchor="middle"
        transform="rotate(-90)"
        className="fill-fg-secondary font-ui text-[14px]"
      >
        {t("Loss")}
      </text>
      <path d={path} fill="none" className="stroke-brand" strokeWidth={2} />
      {history.map((h, i) => (
        <circle
          key={h.epoch}
          cx={px(h.epoch)}
          cy={py(h.loss)}
          r={i === history.length - 1 ? 7 : 4}
          className={i > 0 && h.loss > history[i - 1].loss ? "fill-error" : "fill-brand"}
        />
      ))}
    </svg>
  )
}

/** The verdict on η at this epoch: how far one step goes compared with the way down to the bottom. */
function verdict(slice: Slice, t: ReturnType<typeof useTranslation>["t"]) {
  if (slice.nextLoss > slice.loss) {
    return t("Overshoot: the step jumps over the bottom of the U and the loss goes up. Lower η.")
  }
  const toBottom = Math.abs(slice.lowest.w - slice.w)
  const step = Math.abs(slice.nextW - slice.w)
  if (toBottom < 0.15)
    return t("The weight is at the bottom of the U: converged along this weight.")
  if (step < toBottom * 0.3)
    return t("Tiny steps toward the bottom: safe, but it needs many epochs.")
  if (step > toBottom * 1.6) return t("The step goes past the bottom: expect zig-zag across the U.")
  return t("The step lands near the bottom of the U: an efficient η.")
}

/** Below the decision boundary: this epoch's step on the loss, beside the path of every epoch so far. */
export function GradientDescentPanels({
  net,
  examples,
  learningRate,
  epoch,
  history,
}: {
  net: Network
  examples: Example[]
  learningRate: number
  epoch: number
  history: Checkpoint[]
}) {
  const { t } = useTranslation()
  const slice = useMemo(
    () => weightSlice(net, examples, learningRate),
    [net, examples, learningRate],
  )
  const rises = countRises(history)
  const trail = history.slice(-TRAIL)

  return (
    <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
      <Panel
        title={t("Gradient descent")}
        aside={`${t("Epoch {0}", [epoch])} · η = ${learningRate}`}
      >
        <Expandable title={t("Gradient descent")}>
          <UChart slice={slice} trail={trail} learningRate={learningRate} />
        </Expandable>
        <p className="text-sm text-fg-secondary">
          {t(
            "The loss as a U in a single weight, with all the others held fixed. The ball is the weight now, the tangent is the slope, and the hollow dot is where one step of size η sends it. Fading dots are earlier epochs. With a large η the ball leaps across the U instead of settling at the bottom.",
          )}
        </p>
        <PanelNote>
          <p>
            {t("loss")}: {fmt(slice.loss)} → {fmt(slice.nextLoss)}. {verdict(slice, t)}
          </p>
        </PanelNote>
      </Panel>

      <Panel
        title={t("Gradient descent history")}
        aside={t("{0} epochs recorded", [history[history.length - 1].epoch])}
      >
        <Expandable title={t("Gradient descent history")}>
          <HistoryChart history={history} />
        </Expandable>
        <p className="text-sm text-fg-secondary">
          {t(
            "One dot per epoch: the path the loss has taken so far. Red dots are steps where the loss went up — overshoots. A small η gives a slow, smooth slide; a large η zig-zags.",
          )}
        </p>
        <PanelNote>
          <p>
            {t("loss")}: {fmt(history[0].loss)} → {fmt(history[history.length - 1].loss)} ·{" "}
            {t("{0} overshoot(s)", [rises])}
          </p>
        </PanelNote>
      </Panel>
    </div>
  )
}

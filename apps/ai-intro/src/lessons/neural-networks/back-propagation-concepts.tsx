import type { ReactNode } from "react"
import { Expandable } from "@/components/charts/expandable"
import { useTranslation } from "@/i18n/use-translation"
import type { ActivationName } from "@/lib/neural-net"
import {
  isPlateaued,
  MAX_EPOCHS,
  PLATEAU_EPSILON,
  PLATEAU_WINDOW,
} from "./back-propagation-training"

const W = 220
const H = 120

/** Shared with the decision plot's class colors; kept local since this lesson is self-contained. */
const CLASS_COLOR = ["var(--color-class-1)", "var(--color-class-2)"] as const
function ClassDot({ cls, cx, cy }: { cls: 0 | 1; cx: number; cy: number }) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={6}
      fill={CLASS_COLOR[cls]}
      stroke="var(--color-canvas)"
      strokeWidth={2}
    />
  )
}

function Card({
  title,
  label,
  what,
  why,
  caption,
  children,
}: {
  title: string
  label: string
  what: string
  why: string
  caption?: string
  children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <article className="flex flex-col gap-2 rounded-[3px] border border-divider bg-surface p-3">
      <h3 className="label-ui text-fg">{title}</h3>
      <Expandable title={title}>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={label}>
          {children}
        </svg>
      </Expandable>
      <dl className="flex flex-col gap-1 text-xs leading-relaxed text-fg-secondary">
        <div>
          <dt className="label-ui inline text-brand">{t("What")} </dt>
          <dd className="inline">{what}</dd>
        </div>
        <div>
          <dt className="label-ui inline text-brand">{t("Why")} </dt>
          <dd className="inline">{why}</dd>
        </div>
      </dl>
      {caption && <p className="border-t border-divider pt-2 text-xs text-fg-muted">{caption}</p>}
    </article>
  )
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
  className,
}: Record<"x1" | "y1" | "x2" | "y2", number> & { className: string }) {
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const head = (da: number) => `${x2 - 7 * Math.cos(angle + da)},${y2 - 7 * Math.sin(angle + da)}`
  return (
    <g className={className}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth={2} />
      <polygon points={`${x2},${y2} ${head(0.45)} ${head(-0.45)}`} fill="currentColor" />
    </g>
  )
}

const Note = ({
  x,
  y,
  children,
  anchor = "start",
}: {
  x: number
  y: number
  children: ReactNode
  anchor?: "start" | "middle" | "end"
}) => (
  <text x={x} y={y} textAnchor={anchor} className="fill-fg-secondary font-ui text-[10px]">
    {children}
  </text>
)

const ACTIVATION_CURVE: Record<ActivationName, (z: number) => number> = {
  sigmoid: (z) => 1 / (1 + Math.exp(-z)),
  tanh: Math.tanh,
  relu: (z) => Math.max(0, z),
  linear: (z) => z,
}
const SATURATES: Record<ActivationName, boolean> = {
  sigmoid: true,
  tanh: true,
  relu: false,
  linear: false,
}

/** Live graphics for each key concept, all drawn from the current run's snapshot. */
export function BackPropagationConcepts({
  hiddenLayers,
  activation,
  learningRate,
  learningRatePresets,
  epoch,
  pointCount,
  history,
}: {
  hiddenLayers: number[]
  activation: ActivationName
  learningRate: number
  learningRatePresets: readonly number[]
  epoch: number
  pointCount: number
  history: { epoch: number; loss: number }[]
}) {
  const { t } = useTranslation()
  const hasHidden = hiddenLayers.length > 0

  // Activation curve over a fixed z window.
  const zMin = -6
  const zMax = 6
  const ax = (v: number) => 20 + ((v - zMin) / (zMax - zMin)) * 180
  const ay = (v: number) => 100 - v * 42 - 10
  const curveFn = ACTIVATION_CURVE[activation]
  const curve = Array.from({ length: 61 }, (_, i) => {
    const v = zMin + (i / 60) * (zMax - zMin)
    return `${i === 0 ? "M" : "L"}${ax(v)},${ay(curveFn(v))}`
  }).join("")

  const dots = Math.min(pointCount, 40)
  const progress = Math.min(epoch / MAX_EPOCHS, 1)

  const plateaued = isPlateaued(history, PLATEAU_WINDOW, PLATEAU_EPSILON)
  const recent = history.slice(-PLATEAU_WINDOW)
  const lossSpan = Math.max(0.05, ...recent.map((h) => h.loss))
  const barW = recent.length ? (W - 24) / recent.length : 0

  const rateMin = Math.min(...learningRatePresets)
  const rateMax = Math.max(...learningRatePresets)
  // Presets span decades, so the arrow length follows log η.
  const rateShare =
    Math.log(Math.max(learningRate, rateMin) / rateMin) / Math.log(rateMax / rateMin)

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Card
        title={t("Hidden layers")}
        label={
          hasHidden
            ? t("Hidden layers: with {0} hidden layer(s), the boundary can curve.", [
                hiddenLayers.length,
              ])
            : t("Hidden layers: with none, the boundary is one straight line.")
        }
        what={t(
          "The layers between the inputs and the output. Each hidden neuron draws one straight line and passes its verdict on.",
        )}
        why={t(
          "With hidden layers we can turn a problem no single line solves into one a line can — the next layer combines the lines into a curve.",
        )}
        caption={
          hasHidden
            ? t("This run: {0} hidden layer(s), so the boundary can curve.", [hiddenLayers.length])
            : t("This run: no hidden layer, so the boundary is one straight line.")
        }
      >
        {[
          { x: 4, label: t("inputs x₁ × x₂"), active: !hasHidden, stage: "input" },
          { x: 80, label: t("hidden lines"), active: hasHidden, stage: "lines" },
          { x: 156, label: t("hidden space h₁ × h₂"), active: hasHidden, stage: "space" },
        ].map((panel) => (
          <g key={panel.stage} opacity={panel.stage === "input" || hasHidden ? 1 : 0.3}>
            <g transform={`translate(${panel.x},6) scale(0.94)`}>
              <rect
                width={64}
                height={74}
                rx={3}
                fill="none"
                className={panel.active ? "stroke-brand" : "stroke-divider"}
                strokeWidth={panel.active ? 2 : 1}
              />
              {panel.stage === "input" && (
                <>
                  <line
                    x1={6}
                    y1={64}
                    x2={58}
                    y2={10}
                    className="stroke-fg-muted"
                    strokeWidth={1.5}
                  />
                  <ClassDot cls={0} cx={16} cy={18} />
                  <ClassDot cls={1} cx={48} cy={18} />
                  <ClassDot cls={1} cx={16} cy={56} />
                  <ClassDot cls={0} cx={48} cy={56} />
                </>
              )}
              {panel.stage === "lines" && (
                <>
                  <line x1={4} y1={34} x2={34} y2={4} className="stroke-fg" strokeWidth={1.5} />
                  <line x1={30} y1={70} x2={60} y2={40} className="stroke-fg" strokeWidth={1.5} />
                  <ClassDot cls={0} cx={16} cy={18} />
                  <ClassDot cls={1} cx={48} cy={18} />
                  <ClassDot cls={1} cx={16} cy={56} />
                  <ClassDot cls={0} cx={48} cy={56} />
                </>
              )}
              {panel.stage === "space" && (
                <>
                  <line x1={30} y1={6} x2={62} y2={38} className="stroke-fg" strokeWidth={1.5} />
                  <ClassDot cls={0} cx={16} cy={18} />
                  <ClassDot cls={1} cx={48} cy={18} />
                  <ClassDot cls={0} cx={48} cy={56} />
                </>
              )}
            </g>
            <Note x={panel.x + 30} y={100} anchor="middle">
              {panel.label}
            </Note>
          </g>
        ))}
        <Arrow x1={67} y1={44} x2={79} y2={44} className="text-fg-muted" />
        <Arrow x1={143} y1={44} x2={155} y2={44} className="text-fg-muted" />
      </Card>

      <Card
        title={t("Nonlinear activation")}
        label={t("Activation curve for {0}: it {1}.", [
          activation,
          SATURATES[activation] ? t("saturates at both ends") : t("does not saturate"),
        ])}
        what={t("A bend applied to each neuron's sum before it passes the result on (here: {0}).", [
          activation,
        ])}
        why={t(
          "Without it, stacked layers collapse into one single line — the bend is what lets the network curve.",
        )}
        caption={
          SATURATES[activation]
            ? t(
                "{0} squashes large |z| toward a flat region, where its slope is near zero. Stack enough of these and the backward gradient shrinks layer by layer.",
                [activation],
              )
            : t(
                "{0} stays linear (or flat at zero) without squashing large values, so its gradient doesn't shrink the same way.",
                [activation],
              )
        }
      >
        <line x1={ax(zMin)} y1={ay(0)} x2={ax(zMax)} y2={ay(0)} className="stroke-divider" />
        <line
          x1={ax(0)}
          y1={6}
          x2={ax(0)}
          y2={110}
          className="stroke-divider"
          strokeDasharray="3 3"
        />
        <path d={curve} fill="none" className="stroke-fg" strokeWidth={2} />
        <Note x={ax(zMin)} y={14}>
          a
        </Note>
        <Note x={ax(zMax)} y={ay(0) + 14} anchor="end">
          z
        </Note>
      </Card>

      <Card
        title={t("Backpropagation")}
        label={t(
          "Backpropagation: the forward pass computes the prediction; the backward pass sends the error back through the same layers using the chain rule.",
        )}
        what={t(
          "A forward pass computes the prediction ŷ; a backward pass sends the error back through the same layers using the chain rule.",
        )}
        why={t(
          "It tells every weight how much it contributed to the mistake, so each one knows which way to change.",
        )}
      >
        {[20, 76, 132, 188].map((x, i) => (
          <rect
            key={x}
            x={x}
            y={40}
            width={20}
            height={20}
            rx={3}
            className={
              i === 0 || i === 3 ? "fill-elevated stroke-fg-muted" : "fill-elevated stroke-brand"
            }
            strokeWidth={1.5}
          />
        ))}
        <Arrow x1={44} y1={50} x2={72} y2={50} className="text-fg-muted" />
        <Arrow x1={100} y1={50} x2={128} y2={50} className="text-fg-muted" />
        <Arrow x1={156} y1={50} x2={184} y2={50} className="text-fg-muted" />
        <Note x={104} y={30} anchor="middle">
          {t("forward → ŷ")}
        </Note>
        <Arrow x1={184} y1={86} x2={156} y2={86} className="text-brand" />
        <Arrow x1={128} y1={86} x2={100} y2={86} className="text-brand" />
        <Arrow x1={72} y1={86} x2={44} y2={86} className="text-brand" />
        <Note x={104} y={102} anchor="middle">
          {t("backward → ∂L/∂w")}
        </Note>
      </Card>

      <Card
        title={t("Learning rate")}
        label={t("Learning rate η = {0}; the arrow length shows the step size.", [learningRate])}
        what={t("The step size: how far each backpropagation update moves the weights.")}
        why={t("Too small is slow; too large overshoots the minimum and bounces.")}
        caption={t("This run: η = {0}.", [learningRate])}
      >
        <Note x={10} y={30}>
          {t("η = {0}", [learningRate])}
        </Note>
        <circle cx={14} cy={52} r={3} className="fill-fg-muted" />
        <Arrow x1={14} y1={52} x2={14 + 8 + rateShare * 168} y2={52} className="text-brand" />
        <Note x={10} y={80}>
          {t("smaller η = smaller, steadier steps")}
        </Note>
      </Card>

      <Card
        title={t("Epoch")}
        label={t("Epoch {0} of {1}. Each epoch visits all {2} points once.", [
          epoch,
          MAX_EPOCHS,
          pointCount,
        ])}
        what={t("One full pass over every training point, in a shuffled order.")}
        why={t(
          "One pass is not enough: the weights improve a little each epoch, so training takes many.",
        )}
        caption={t("This run: {0} points, at epoch {1}.", [pointCount, epoch])}
      >
        {Array.from({ length: dots }, (_, i) => {
          const angle = (i / dots) * Math.PI * 2 - Math.PI / 2
          return (
            <circle
              // biome-ignore lint/suspicious/noArrayIndexKey: dots are positional placeholders.
              key={i}
              cx={56 + Math.cos(angle) * 38}
              cy={52 + Math.sin(angle) * 38}
              r={dots > 20 ? 2.5 : 4}
              className="fill-fg-muted"
            />
          )
        })}
        <text
          x={56}
          y={52}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-fg font-ui text-[13px]"
        >
          {epoch}
        </text>
        <Note x={112} y={44}>
          {t("epoch {0} / {1}", [epoch, MAX_EPOCHS])}
        </Note>
        <rect x={112} y={52} width={96} height={8} rx={2} className="fill-elevated" />
        <rect x={112} y={52} width={96 * progress} height={8} rx={2} className="fill-brand" />
      </Card>

      <Card
        title={t("Vanishing gradients")}
        label={
          plateaued
            ? t("Vanishing gradients: the recent loss history is flat — training has stalled.")
            : t("Vanishing gradients: the recent loss history is still moving.")
        }
        what={t(
          "The backward signal shrinks a little at every layer it crosses, so the earliest layers get almost no update.",
        )}
        why={t(
          "Those layers stop learning and the loss stalls — deep stacks with sigmoid or tanh are the usual cause.",
        )}
        caption={
          plateaued
            ? t(
                "This architecture's loss has barely moved for the last {0} checkpoints — a sign that the gradient reaching the earliest layers is too small to keep learning.",
                [PLATEAU_WINDOW],
              )
            : t(
                "Each bar is a recent loss checkpoint. A flat row of bars near the top (no progress) is what a vanishing gradient looks like at depth.",
              )
        }
      >
        <line x1={4} y1={100} x2={W - 4} y2={100} className="stroke-divider" />
        {recent.map((h, i) => {
          const height = Math.max(2, (h.loss / lossSpan) * 80)
          return (
            <rect
              key={h.epoch}
              x={12 + i * barW}
              y={100 - height}
              width={Math.max(2, barW - 2)}
              height={height}
              className={plateaued ? "fill-brand" : "fill-fg-muted"}
            />
          )
        })}
      </Card>
    </div>
  )
}

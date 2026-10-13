import type { ReactNode } from "react"
import { LegendDot } from "@/components/workbench"
import { useTranslation } from "@/i18n/use-translation"
import {
  type backpropExample,
  bowl,
  descentPath,
  gradientFlow,
  OPTIMIZER_SETTINGS,
  OPTIMIZERS,
  type OptimizerName,
  optimizerPath,
  softmax,
} from "./back-propagation-theory-math"

const fmt = (v: number, digits = 3) => (v < 0 ? "−" : "") + Math.abs(v).toFixed(digits)

const Label = ({
  x,
  y,
  children,
  anchor = "start",
  className = "fill-fg-secondary",
}: {
  x: number
  y: number
  children: ReactNode
  anchor?: "start" | "middle" | "end"
  className?: string
}) => (
  <text x={x} y={y} textAnchor={anchor} className={`${className} font-ui text-[12px]`}>
    {children}
  </text>
)

function Arrow({ x1, x2, y, className }: { x1: number; x2: number; y: number; className: string }) {
  const dir = Math.sign(x2 - x1)
  return (
    <g className={className}>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke="currentColor" strokeWidth={2} />
      <polygon
        points={`${x2},${y} ${x2 - dir * 8},${y - 4.5} ${x2 - dir * 8},${y + 4.5}`}
        fill="currentColor"
      />
    </g>
  )
}

/** The worked example as a chain: values flow right on top, gradients flow left underneath. */
export function BackpropGraph({ example: e }: { example: ReturnType<typeof backpropExample> }) {
  const { t } = useTranslation()
  const xs = [80, 280, 480, 680]
  const nodes = [t("input x"), t("hidden a₁"), t("output ŷ"), t("loss L")]
  return (
    <svg
      viewBox="0 0 760 230"
      className="h-auto w-full"
      role="img"
      aria-label={t(
        "Computation chain for one example: the forward pass computes z₁, a₁, z₂, ŷ and L; the backward pass sends δ₂ and δ₁ back to get the gradients of w₂ and w₁.",
      )}
    >
      <Label x={4} y={14} className="fill-fg-muted">
        {t("forward →")}
      </Label>
      <Label x={xs[0]} y={52} anchor="middle" className="fill-fg">{`x = ${e.x}`}</Label>
      <Label
        x={xs[1]}
        y={52}
        anchor="middle"
        className="fill-fg"
      >{`z₁ = ${fmt(e.z1)}  a₁ = ${fmt(e.a1)}`}</Label>
      <Label
        x={xs[2]}
        y={52}
        anchor="middle"
        className="fill-fg"
      >{`z₂ = ${fmt(e.z2)}  ŷ = ${fmt(e.yHat)}`}</Label>
      <Label x={xs[3]} y={52} anchor="middle" className="fill-fg">{`L = ${fmt(e.loss)}`}</Label>

      {xs.map((x, i) => (
        <g key={x}>
          <rect
            x={x - 55}
            y={66}
            width={110}
            height={40}
            rx={3}
            className="fill-elevated stroke-fg-muted"
            strokeWidth={1.5}
          />
          <Label x={x} y={91} anchor="middle" className="fill-fg">
            {nodes[i]}
          </Label>
        </g>
      ))}

      {[0, 1, 2].map((i) => (
        <Arrow key={i} x1={xs[i] + 60} x2={xs[i + 1] - 60} y={86} className="text-fg-muted" />
      ))}
      <Label x={(xs[0] + xs[1]) / 2} y={80} anchor="middle">{`× w₁ = ${fmt(e.w1, 2)}`}</Label>
      <Label x={(xs[1] + xs[2]) / 2} y={80} anchor="middle">{`× w₂ = ${fmt(e.w2, 2)}`}</Label>
      <Label x={(xs[2] + xs[3]) / 2} y={80} anchor="middle">{`vs y = ${e.y}`}</Label>

      {[0, 1, 2].map((i) => (
        <Arrow key={i} x1={xs[i + 1] - 60} x2={xs[i] + 60} y={134} className="text-brand" />
      ))}
      <Label x={4} y={176} className="fill-brand">
        {t("← backward")}
      </Label>
      <Label x={(xs[2] + xs[3]) / 2} y={128} anchor="middle" className="fill-brand">
        {`δ₂ = ŷ − y = ${fmt(e.delta2)}`}
      </Label>
      <Label x={(xs[1] + xs[2]) / 2} y={128} anchor="middle" className="fill-brand">
        {`δ₁ = δ₂·w₂·a₁(1−a₁) = ${fmt(e.delta1)}`}
      </Label>
      <Label x={(xs[0] + xs[1]) / 2} y={128} anchor="middle" className="fill-brand">
        {t("(no weight before x)")}
      </Label>
      <Label x={(xs[1] + xs[2]) / 2} y={158} anchor="middle" className="fill-fg">
        {`∂L/∂w₂ = δ₂·a₁ = ${fmt(e.gradW2)}`}
      </Label>
      <Label x={(xs[0] + xs[1]) / 2} y={158} anchor="middle" className="fill-fg">
        {`∂L/∂w₁ = δ₁·x = ${fmt(e.gradW1)}`}
      </Label>
      <Label x={380} y={214} anchor="middle" className="fill-fg-muted">
        {t("Each gradient reuses the values the forward pass already computed.")}
      </Label>
    </svg>
  )
}

const BOWL = { w: [-5, 5], j: [0, 25] } as const
const BOWL_W = 360
const BOWL_H = 200
const bowlX = (w: number) => 20 + ((w - BOWL.w[0]) / (BOWL.w[1] - BOWL.w[0])) * (BOWL_W - 40)
const bowlY = (j: number) => 176 - ((j - BOWL.j[0]) / (BOWL.j[1] - BOWL.j[0])) * 150

/** Gradient descent on J(w) = w²: the curve, the starting point and each step taken. */
export function DescentPlot({
  start,
  learningRate,
  steps,
  title,
}: {
  start: number
  learningRate: number
  steps: number
  title?: string
}) {
  const { t } = useTranslation()
  const path = descentPath(start, learningRate, steps)
  const clampW = (w: number) => Math.max(BOWL.w[0] - 0.4, Math.min(BOWL.w[1] + 0.4, w))
  const clampJ = (j: number) => Math.min(BOWL.j[1] + 2, j)
  const pts = path.map((w) => ({ x: bowlX(clampW(w)), y: bowlY(clampJ(bowl(w))) }))
  const curve = Array.from({ length: 81 }, (_, i) => {
    const w = BOWL.w[0] + (i / 80) * (BOWL.w[1] - BOWL.w[0])
    return `${i === 0 ? "M" : "L"}${bowlX(w)},${bowlY(bowl(w))}`
  }).join("")
  const last = path[path.length - 1]
  const offChart = Math.abs(last) > BOWL.w[1]
  return (
    <figure className="flex flex-col gap-1">
      {title && <figcaption className="label-ui text-fg">{title}</figcaption>}
      <svg
        viewBox={`0 0 ${BOWL_W} ${BOWL_H}`}
        className="h-auto w-full rounded-[2px] border border-divider bg-canvas"
        role="img"
        aria-label={t(
          "Gradient descent on J(w) = w² from w = {0} with learning rate {1}: after {2} steps w = {3}.",
          [start, learningRate, steps, offChart ? t("off the chart") : last.toFixed(2)],
        )}
      >
        <line x1={20} x2={BOWL_W - 20} y1={bowlY(0)} y2={bowlY(0)} className="stroke-fg-muted" />
        <path d={curve} fill="none" className="stroke-fg-muted" strokeWidth={2} />
        <polyline
          points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          className="stroke-brand"
          strokeWidth={1.5}
        />
        {pts.map((p, i) => (
          <circle
            // biome-ignore lint/suspicious/noArrayIndexKey: steps are positional.
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === 0 ? 6 : 3.5}
            className={i === 0 ? "fill-chart-warm" : "fill-brand"}
            fillOpacity={i === 0 ? 1 : 0.35 + 0.65 * (i / steps)}
          />
        ))}
        <Label x={bowlX(0)} y={bowlY(0) + 16} anchor="middle" className="fill-fg-muted">
          {t("minimum")}
        </Label>
        <Label x={24} y={16} className="fill-fg-muted">
          J(w) = w²
        </Label>
        <Label x={BOWL_W - 24} y={16} anchor="end" className="fill-fg">
          {`η = ${learningRate}`}
        </Label>
        <Label x={BOWL_W - 24} y={BOWL_H - 6} anchor="end" className="fill-fg-muted">
          w
        </Label>
        <Label
          x={Math.min(Math.max(pts[0].x, 40), BOWL_W - 40)}
          y={Math.max(pts[0].y - 11, 30)}
          anchor="middle"
          className="fill-chart-warm"
        >
          {t("start")}
        </Label>
      </svg>
    </figure>
  )
}

const FLOW = { lo: -8, hi: 4.5 }

/** Gradient size at each layer on a log scale: shrinking bars vanish, growing bars explode. */
export function GradientFlowChart({
  factor,
  layers,
  title,
  barClass,
}: {
  factor: number
  layers: number
  title: string
  barClass: string
}) {
  const { t } = useTranslation()
  const flow = gradientFlow(factor, layers)
  const left = 46
  const width = 360
  const barW = (width - left - 10) / flow.length
  const y = (log: number) => 22 + ((FLOW.hi - log) / (FLOW.hi - FLOW.lo)) * 138
  const base = y(0)
  const final = flow[flow.length - 1]
  return (
    <figure className="flex flex-col gap-1">
      <figcaption className="label-ui text-fg">{title}</figcaption>
      <svg
        viewBox={`0 0 ${width} 200`}
        className="h-auto w-full rounded-[2px] border border-divider bg-canvas"
        role="img"
        aria-label={t(
          "Gradient size at each of {0} layers going backward when every layer multiplies it by {1}: it ends at {2} times the output gradient.",
          [layers, factor, final.toExponential(1)],
        )}
      >
        <line x1={left} x2={width - 6} y1={base} y2={base} className="stroke-fg-muted" />
        <Label x={left - 6} y={base + 4} anchor="end" className="fill-fg-muted">
          ×1
        </Label>
        {flow.map((v, k) => {
          const log = Math.max(FLOW.lo, Math.min(FLOW.hi, Math.log10(v)))
          const top = Math.min(y(log), base)
          return (
            <rect
              // biome-ignore lint/suspicious/noArrayIndexKey: bars are positional layers.
              key={k}
              x={left + k * barW + 1}
              y={top}
              width={Math.max(1, barW - 2)}
              height={Math.max(2, Math.abs(y(log) - base))}
              className={barClass}
            />
          )
        })}
        <Label x={width - 6} y={16} anchor="end" className="fill-fg">
          {`×${factor} ${t("per layer")}`}
        </Label>
        <Label x={left} y={188} className="fill-fg-muted">
          {t("output")}
        </Label>
        <Label x={width - 6} y={188} anchor="end" className="fill-fg-muted">
          {t("first layer")}
        </Label>
        <Label x={left + 4} y={16} className="fill-fg">
          {`×${final.toExponential(1)}`}
        </Label>
      </svg>
    </figure>
  )
}

const OPTIMIZER_STYLE: Record<OptimizerName, { label: string; color: string }> = {
  sgd: { label: "SGD", color: "var(--color-chart-warm)" },
  momentum: { label: "Momentum", color: "var(--color-chart-cool)" },
  adam: { label: "Adam", color: "var(--color-brand)" },
}
const VALLEY_START: [number, number] = [-4, 1.5]
const VALLEY_STEPS = 30
const vx = (x: number) => 30 + ((x + 5) / 10) * 500
const vy = (y: number) => 120 - y * 55

/** Three optimizers descending the same narrow valley from the same start. */
export function OptimizerPaths() {
  const { t } = useTranslation()
  return (
    <figure className="flex flex-col gap-2">
      <svg
        viewBox="0 0 560 240"
        className="h-auto w-full rounded-[2px] border border-divider bg-canvas"
        role="img"
        aria-label={t(
          "Three optimizers descending the same narrow valley from the same start: SGD zig-zags across the valley, momentum overshoots then settles, Adam heads almost straight to the minimum.",
        )}
      >
        <defs>
          <clipPath id="valley-clip">
            <rect x={30} y={10} width={500} height={220} />
          </clipPath>
        </defs>
        <g clipPath="url(#valley-clip)">
          {[0.5, 2, 6, 14, 30].map((c) => (
            <ellipse
              key={c}
              cx={vx(0)}
              cy={vy(0)}
              rx={Math.sqrt(2 * c) * 50}
              ry={Math.sqrt(c / 10) * 55}
              fill="none"
              className="stroke-divider"
            />
          ))}
          {OPTIMIZERS.map((name) => {
            const path = optimizerPath(name, VALLEY_START, VALLEY_STEPS)
            return (
              <g key={name}>
                <polyline
                  points={path.map(([x, y]) => `${vx(x)},${vy(y)}`).join(" ")}
                  fill="none"
                  stroke={OPTIMIZER_STYLE[name].color}
                  strokeWidth={2}
                />
                {path.map(([x, y], i) => (
                  <circle
                    // biome-ignore lint/suspicious/noArrayIndexKey: steps are positional.
                    key={i}
                    cx={vx(x)}
                    cy={vy(y)}
                    r={2.5}
                    fill={OPTIMIZER_STYLE[name].color}
                  />
                ))}
              </g>
            )
          })}
        </g>
        <circle cx={vx(VALLEY_START[0])} cy={vy(VALLEY_START[1])} r={6} className="fill-fg" />
        <Label x={vx(VALLEY_START[0]) + 10} y={vy(VALLEY_START[1]) - 6} className="fill-fg">
          {t("start")}
        </Label>
        <circle cx={vx(0)} cy={vy(0)} r={4} className="fill-success" />
        <Label x={vx(0) + 8} y={vy(0) - 8} className="fill-fg-muted">
          {t("minimum")}
        </Label>
      </svg>
      <figcaption className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 font-ui text-sm text-fg-secondary">
        {OPTIMIZERS.map((name) => (
          <LegendDot
            key={name}
            color={OPTIMIZER_STYLE[name].color}
            label={`${OPTIMIZER_STYLE[name].label} (η = ${OPTIMIZER_SETTINGS[name].learningRate})`}
          />
        ))}
      </figcaption>
    </figure>
  )
}

/** Raw scores in, probabilities out: softmax bars beside the logits they came from. */
export function SoftmaxBars({ logits }: { logits: number[] }) {
  const { t } = useTranslation()
  const probabilities = softmax(logits)
  const names = [t("class A"), t("class B"), t("class C")]
  return (
    <div className="flex flex-col gap-1.5" role="img" aria-label={t("Softmax of the logits.")}>
      {probabilities.map((p, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: classes are positional.
        <div key={i} className="flex items-center gap-3 font-ui text-xs text-fg-secondary">
          <span className="w-14 shrink-0">{names[i]}</span>
          <span className="w-16 shrink-0 text-fg-muted">z = {logits[i].toFixed(1)}</span>
          <span className="relative h-4 flex-1 rounded-[2px] bg-elevated">
            <span
              className="absolute inset-y-0 left-0 rounded-[2px] bg-brand"
              style={{ width: `${p * 100}%` }}
            />
          </span>
          <span className="w-12 shrink-0 text-right text-fg">{(p * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  )
}

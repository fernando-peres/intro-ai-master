import type { ReactNode } from "react"
import { useTranslation } from "@/i18n/use-translation"
import {
  boundarySegment,
  classOf,
  type Domain,
  LEARNING_RATE,
  MAX_EPOCHS,
  type Params,
  type PerceptronActivation,
  type PerceptronPoint,
  score,
  sigmoid,
} from "@/lib/perceptron"
import { signed } from "./perceptron-format"
import { CLASS_COLOR, ClassMarker } from "./perceptron-plot"

const W = 220
const H = 120
const UNIT: Domain = { x: [-0.25, 1.25], y: [-0.25, 1.25] }

/** The three signed terms of z for one point; they always add up to `score(params, point)`. */
export function contributions(params: Params, point: Pick<PerceptronPoint, "x1" | "x2">) {
  return [
    { key: "w1x1", label: "w₁x₁", value: params.w1 * point.x1 },
    { key: "w2x2", label: "w₂x₂", value: params.w2 * point.x2 },
    { key: "b", label: "b", value: params.b },
  ]
}

const zoomOut = (d: Domain, factor: number): Domain => {
  const grow = ([lo, hi]: readonly [number, number]) => {
    const c = (lo + hi) / 2
    const h = ((hi - lo) / 2) * factor
    return [c - h, c + h] as const
  }
  return { x: grow(d.x), y: grow(d.y) }
}

/** A square mini plot of `domain` inside the card, returning data → pixel mappers. */
function miniFrame(domain: Domain, box = { x: 14, y: 10, size: 100 }) {
  const px = (x: number) => box.x + ((x - domain.x[0]) / (domain.x[1] - domain.x[0])) * box.size
  const py = (y: number) =>
    box.y + box.size - ((y - domain.y[0]) / (domain.y[1] - domain.y[0])) * box.size
  return { ...box, px, py }
}

function Card({
  title,
  label,
  caption,
  children,
}: {
  title: string
  label: string
  caption: string
  children: ReactNode
}) {
  return (
    <article className="flex flex-col gap-2 rounded-[3px] border border-divider bg-surface p-3">
      <h3 className="label-ui text-fg">{title}</h3>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={label}>
        {children}
      </svg>
      <p className="text-xs leading-relaxed text-fg-secondary">{caption}</p>
    </article>
  )
}

function Frame({ f }: { f: ReturnType<typeof miniFrame> }) {
  return (
    <rect x={f.x} y={f.y} width={f.size} height={f.size} fill="none" className="stroke-divider" />
  )
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
  className,
}: Record<"x1" | "y1" | "x2" | "y2", number> & {
  className: string
}) {
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

/** Live graphics for each key concept, all drawn from the current run's snapshot. */
export function PerceptronConcepts({
  params,
  activation,
  selected,
  pointCount,
  epoch,
  separable,
  domain = UNIT,
}: {
  params: Params
  activation: PerceptronActivation
  selected: PerceptronPoint
  pointCount: number
  epoch: number
  separable: boolean
  domain?: Domain
}) {
  const { t } = useTranslation()
  const f = miniFrame(domain)
  const z = score(params, selected)
  const zeroWeights = params.w1 === 0 && params.w2 === 0
  // Bias view zooms out so the shift stays visible when the line leaves the data's own view.
  const zoomed = zoomOut(domain, 2.5)
  const fb = miniFrame(zoomed)
  const line = boundarySegment(params, zoomed)
  const ghost = boundarySegment({ ...params, b: 0 }, zoomed)
  const toPx = (s: NonNullable<typeof line>) => ({
    x1: fb.px(s[0].x),
    y1: fb.py(s[0].y),
    x2: fb.px(s[1].x),
    y2: fb.py(s[1].y),
  })
  const mid = (s: NonNullable<typeof line>) => ({
    x: fb.px((s[0].x + s[1].x) / 2),
    y: fb.py((s[0].y + s[1].y) / 2),
  })
  // Weights view: the boundary's orientation and the weight vector, drawn through the frame centre.
  const centre = { x: f.x + f.size / 2, y: f.y + f.size / 2 }
  const toPxDir = (dx: number, dy: number) => {
    const vx = (dx / (domain.x[1] - domain.x[0])) * f.size
    const vy = (-dy / (domain.y[1] - domain.y[0])) * f.size
    const n = Math.hypot(vx, vy) || 1
    return { x: vx / n, y: vy / n }
  }
  const along = toPxDir(-params.w2, params.w1)
  const normal = toPxDir(params.w1, params.w2)

  // Weighted-sum bars share one scale so their lengths compare honestly.
  const parts = contributions(params, selected)
  const span = Math.max(0.5, Math.abs(z), ...parts.map((p) => Math.abs(p.value)))
  const zeroX = 128
  const barScale = 70 / span

  // Activation curve over a fixed z window.
  const zMin = -6
  const zMax = 6
  const ax = (v: number) => 20 + ((v - zMin) / (zMax - zMin)) * 180
  const ay = (v: number) => 100 - v * 84
  const curve =
    activation === "step"
      ? `M${ax(zMin)},${ay(0)}L${ax(0)},${ay(0)}M${ax(0)},${ay(1)}L${ax(zMax)},${ay(1)}`
      : Array.from({ length: 61 }, (_, i) => {
          const v = zMin + (i / 60) * (zMax - zMin)
          return `${i === 0 ? "M" : "L"}${ax(v)},${ay(sigmoid(v))}`
        }).join("")
  const shownZ = Math.min(zMax, Math.max(zMin, z))
  const output = activation === "step" ? classOf(z) : sigmoid(z)

  const dots = Math.min(pointCount, 40)
  const progress = Math.min(epoch / MAX_EPOCHS, 1)
  const fmt = (v: number) => signed(v)

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card
        title={t("Inputs")}
        label={t(
          "Inputs: the selected point has x₁ = {0} and x₂ = {1}; the bias input is always 1.",
          [fmt(selected.x1), fmt(selected.x2)],
        )}
        caption={t(
          "x₁ and x₂ are the point's two coordinates. The constant 1 is not a feature; it carries the bias.",
        )}
      >
        <Frame f={f} />
        <line
          x1={f.px(selected.x1)}
          y1={f.py(selected.x2)}
          x2={f.px(selected.x1)}
          y2={f.y + f.size}
          className="stroke-fg-muted"
          strokeDasharray="3 3"
        />
        <line
          x1={f.x}
          y1={f.py(selected.x2)}
          x2={f.px(selected.x1)}
          y2={f.py(selected.x2)}
          className="stroke-fg-muted"
          strokeDasharray="3 3"
        />
        <ClassMarker cls={selected.y} cx={f.px(selected.x1)} cy={f.py(selected.x2)} r={6} />
        <Note x={130} y={34}>
          x₁ = {fmt(selected.x1)}
        </Note>
        <Note x={130} y={50}>
          x₂ = {fmt(selected.x2)}
        </Note>
        <rect x={130} y={66} width={26} height={22} rx={4} className="fill-elevated stroke-brand" />
        <text
          x={143}
          y={77}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-fg font-ui text-[12px]"
        >
          1
        </text>
        <Note x={162} y={81}>
          {t("bias input")}
        </Note>
      </Card>

      <Card
        title={t("Weights")}
        label={t(
          "Weights: w₁ = {0}, w₂ = {1}. The line shows the boundary's direction; the arrow points toward the class-1 side.",
          [fmt(params.w1), fmt(params.w2)],
        )}
        caption={t(
          "w₁ = {0}, w₂ = {1}. They set the boundary's orientation and how strongly each input moves the score.",
          [fmt(params.w1), fmt(params.w2)],
        )}
      >
        <Frame f={f} />
        {!zeroWeights && (
          <>
            <line
              x1={centre.x - along.x * 48}
              y1={centre.y - along.y * 48}
              x2={centre.x + along.x * 48}
              y2={centre.y + along.y * 48}
              className="stroke-fg"
              strokeWidth={2}
            />
            <Arrow
              x1={centre.x}
              y1={centre.y}
              x2={centre.x + normal.x * 34}
              y2={centre.y + normal.y * 34}
              className="text-brand"
            />
          </>
        )}
        <Note x={130} y={34}>
          w₁ = {fmt(params.w1)}
        </Note>
        <Note x={130} y={50}>
          w₂ = {fmt(params.w2)}
        </Note>
        <Note x={130} y={74}>
          {zeroWeights ? t("no direction yet") : t("→ class-1 side")}
        </Note>
      </Card>

      <Card
        title={t("Bias")}
        label={t(
          "Bias: b = {0}. The dashed line is the same boundary with b = 0; the arrow shows the shift.",
          [fmt(params.b)],
        )}
        caption={t("b = {0}. It shifts the boundary without rotating it.", [fmt(params.b)])}
      >
        <Frame f={fb} />
        {ghost && (
          <line
            {...toPx(ghost)}
            className="stroke-fg-muted"
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />
        )}
        {line && <line {...toPx(line)} className="stroke-fg" strokeWidth={2} />}
        {line && ghost && Math.abs(params.b) > 1e-9 && (
          <Arrow
            x1={mid(ghost).x}
            y1={mid(ghost).y}
            x2={mid(line).x}
            y2={mid(line).y}
            className="text-brand"
          />
        )}
        <Note x={130} y={34}>
          b = {fmt(params.b)}
        </Note>
        <Note x={130} y={54}>
          - - b = 0
        </Note>
        <Note x={130} y={70}>
          — {t("current")}
        </Note>
      </Card>

      <Card
        title={t("Weighted sum")}
        label={t("Weighted sum for the selected point: {0} → z = {1}, so class {2}.", [
          parts.map((p) => `${p.label} = ${fmt(p.value)}`).join(", "),
          signed(z, 3),
          classOf(z),
        ])}
        caption={t("z = w₁x₁ + w₂x₂ + b. Class 1 is predicted when z ≥ 0.")}
      >
        <line x1={zeroX} y1={6} x2={zeroX} y2={112} className="stroke-fg-muted" />
        {[...parts, { key: "z", label: "z", value: z }].map((part, i) => {
          const y = 10 + i * 25
          const width = Math.max(Math.abs(part.value) * barScale, 1)
          const isZ = part.key === "z"
          return (
            <g key={part.key}>
              <Note x={8} y={y + 12}>
                {part.label}
              </Note>
              <Note x={52} y={y + 12}>
                {signed(part.value, 2)}
              </Note>
              <rect
                x={part.value >= 0 ? zeroX : zeroX - width}
                y={y + 2}
                width={width}
                height={14}
                rx={2}
                fill={isZ ? CLASS_COLOR[classOf(z)] : undefined}
                className={isZ ? undefined : "fill-fg-muted"}
              />
            </g>
          )
        })}
        <line x1={4} y1={84} x2={W - 4} y2={84} className="stroke-divider" />
      </Card>

      <Card
        title={t("Activation")}
        label={
          activation === "step"
            ? t("Step activation: z = {0} gives ŷ = {1}.", [signed(z, 3), classOf(z)])
            : t("Sigmoid activation: z = {0} gives p = {1}.", [signed(z, 3), output.toFixed(3)])
        }
        caption={
          activation === "step"
            ? t("Step turns z into a hard 0 or 1.")
            : t("Sigmoid turns z into a probability p; p = 0.5 exactly on the line.")
        }
      >
        <line x1={ax(zMin)} y1={ay(0)} x2={ax(zMax)} y2={ay(0)} className="stroke-divider" />
        <line
          x1={ax(0)}
          y1={ay(-0.05)}
          x2={ax(0)}
          y2={ay(1.05)}
          className="stroke-divider"
          strokeDasharray="3 3"
        />
        <line
          x1={ax(zMin)}
          y1={ay(0.5)}
          x2={ax(zMax)}
          y2={ay(0.5)}
          className="stroke-divider"
          strokeDasharray="3 3"
        />
        <path d={curve} fill="none" className="stroke-fg" strokeWidth={2} />
        <circle
          cx={ax(shownZ)}
          cy={ay(output)}
          r={5}
          className="fill-brand"
          stroke="var(--color-canvas)"
          strokeWidth={2}
        />
        <Note x={ax(zMin)} y={ay(1) - 4}>
          {activation === "step" ? "ŷ" : "p"}
        </Note>
        <Note x={ax(zMax)} y={ay(0) + 14} anchor="end">
          z
        </Note>
        <Note x={ax(0) + 4} y={ay(0) + 14}>
          0
        </Note>
      </Card>

      <Card
        title={t("Learning rate")}
        label={t(
          "Learning rate: step uses η = {0}, sigmoid uses η = {1}; arrow length shows the step size.",
          [LEARNING_RATE.step, LEARNING_RATE.sigmoid],
        )}
        caption={t("η = {0}: how far each update moves the weights.", [LEARNING_RATE[activation]])}
      >
        {(["step", "sigmoid"] as const).map((mode, i) => {
          const y = 34 + i * 44
          const active = mode === activation
          return (
            <g key={mode}>
              <Note x={10} y={y - 10}>
                {mode === "step" ? t("step") : t("sigmoid")} · η = {LEARNING_RATE[mode]}
              </Note>
              <circle cx={14} cy={y} r={3} className="fill-fg-muted" />
              <Arrow
                x1={14}
                y1={y}
                x2={14 + LEARNING_RATE[mode] * 380}
                y2={y}
                className={active ? "text-brand" : "text-fg-muted"}
              />
            </g>
          )
        })}
      </Card>

      <Card
        title={t("Epoch")}
        label={t("Epoch {0} of {1}. Each epoch visits all {2} points once.", [
          epoch,
          MAX_EPOCHS,
          pointCount,
        ])}
        caption={t("One pass over all {0} points in a shuffled order. This run is at epoch {1}.", [
          pointCount,
          epoch,
        ])}
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
        <Note x={112} y={80}>
          {t("{0} points per epoch", [pointCount])}
        </Note>
      </Card>

      <Card
        title={t("Linear separability")}
        label={
          separable
            ? t("Linear separability: this dataset is linearly separable.")
            : t("Linear separability: this dataset is not linearly separable.")
        }
        caption={
          separable
            ? t(
                "A straight line can put every class-1 point on one side and every class-0 point on the other. This dataset is linearly separable.",
              )
            : t(
                "A straight line can put every class-1 point on one side and every class-0 point on the other. This dataset is not linearly separable.",
              )
        }
      >
        {[
          { x: 10, ok: true, classes: [0, 1, 1, 1] as const },
          { x: 116, ok: false, classes: [0, 1, 1, 0] as const },
        ].map((thumb) => {
          const active = thumb.ok === separable
          const corner = (i: number) => ({
            cx: thumb.x + 22 + (i >> 1) * 50,
            cy: 78 - (i & 1) * 50,
          })
          return (
            <g key={thumb.x}>
              <rect
                x={thumb.x}
                y={10}
                width={94}
                height={92}
                rx={3}
                fill="none"
                className={active ? "stroke-brand" : "stroke-divider"}
                strokeWidth={active ? 2 : 1}
              />
              {thumb.ok && (
                <line
                  x1={thumb.x + 4}
                  y1={52}
                  x2={thumb.x + 50}
                  y2={102}
                  className="stroke-fg"
                  strokeWidth={1.5}
                />
              )}
              {thumb.classes.map((cls, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: the four Boolean corners are positional.
                <ClassMarker key={i} cls={cls} {...corner(i)} r={6} />
              ))}
              <Note x={thumb.x + 47} y={114} anchor="middle">
                {thumb.ok ? `✓ ${t("one line works")}` : `✗ ${t("no line works")}`}
              </Note>
            </g>
          )
        })}
      </Card>
    </div>
  )
}

import type { ReactNode } from "react"
import { useTranslation } from "@/i18n/use-translation"
import { ACTIVATION_FUNCTIONS, type ActivationKey } from "./back-propagation-theory-math"

/** The example neuron every section feeds: z = w₁x₁ + w₂x₂ + b. */
export const NEURON = { x: [2, 1], w: [0.5, -1.5] } as const
export const weightedSum = (bias: number) =>
  NEURON.x.reduce((sum, x, i) => sum + x * NEURON.w[i], 0) + bias

export const fmt = (v: number, digits = 2) =>
  (v < 0 && Math.abs(v) >= 0.5 * 10 ** -digits ? "−" : "") + Math.abs(v).toFixed(digits)

const Z_RANGE = [-4, 4] as const
const BOX = { x: 280, y: 30, w: 150, h: 120 }

const Label = ({
  x,
  y,
  children,
  anchor = "middle",
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

function Arrow({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  return (
    <g className="text-fg-muted">
      <line x1={x1} y1={y} x2={x2 - 6} y2={y} stroke="currentColor" strokeWidth={1.5} />
      <polygon points={`${x2},${y} ${x2 - 8},${y - 4} ${x2 - 8},${y + 4}`} fill="currentColor" />
    </g>
  )
}

/** Inputs → weighted sum z → activation curve (dot at z) → output, for one bias value. */
export function NeuronFlow({
  name,
  f,
  bias,
  yRange,
}: {
  name: string
  f: (z: number) => number
  bias: number
  /** The curve box's vertical extent; the output is clamped to it for drawing only. */
  yRange: readonly [number, number]
}) {
  const { t } = useTranslation()
  const z = weightedSum(bias)
  const out = f(z)
  const px = (v: number) => BOX.x + ((v - Z_RANGE[0]) / (Z_RANGE[1] - Z_RANGE[0])) * BOX.w
  const py = (v: number) => {
    const c = Math.min(yRange[1], Math.max(yRange[0], v))
    return BOX.y + BOX.h - ((c - yRange[0]) / (yRange[1] - yRange[0])) * BOX.h
  }
  const path = Array.from({ length: 81 }, (_, i) => Z_RANGE[0] + i * 0.1)
    .map((v, i) => `${i ? "L" : "M"}${px(v).toFixed(1)},${py(f(v)).toFixed(1)}`)
    .join(" ")
  const inputsY = [55, 125]

  return (
    <svg
      viewBox="0 0 600 180"
      className="w-full"
      role="img"
      aria-label={t("{0}: z = {1} becomes output {2}.", [name, fmt(z), fmt(out)])}
    >
      {NEURON.x.map((x, i) => (
        <g key={inputsY[i]}>
          <line
            x1={60}
            y1={inputsY[i]}
            x2={168}
            y2={90}
            className="stroke-fg-muted"
            strokeWidth={1.5}
          />
          <circle cx={40} cy={inputsY[i]} r={20} className="fill-surface stroke-divider" />
          <Label x={40} y={inputsY[i] + 4} className="fill-fg">
            {x}
          </Label>
          <Label x={40} y={inputsY[i] + (i ? 36 : -28)} className="fill-fg-muted">
            x{i ? "₂" : "₁"}
          </Label>
          <Label x={112} y={inputsY[i] + (i ? 4 : -8)} className="fill-brand">
            w = {fmt(NEURON.w[i], 1)}
          </Label>
        </g>
      ))}
      <circle cx={190} cy={90} r={24} className="fill-surface stroke-brand" strokeWidth={1.5} />
      <Label x={190} y={96} className="fill-fg text-[18px]">
        Σ
      </Label>
      <Label x={190} y={135} className="fill-fg-muted">
        b = {fmt(bias, 1)}
      </Label>
      <Label x={190} y={155} className="fill-fg">
        z = {fmt(z)}
      </Label>
      <Arrow x1={216} x2={268} y={90} />

      <rect
        x={BOX.x}
        y={BOX.y}
        width={BOX.w}
        height={BOX.h}
        rx={3}
        className="fill-canvas stroke-divider"
      />
      {yRange[0] < 0 && yRange[1] > 0 && (
        <line
          x1={BOX.x}
          x2={BOX.x + BOX.w}
          y1={py(0)}
          y2={py(0)}
          className="stroke-divider"
          strokeWidth={1}
        />
      )}
      <line
        x1={px(0)}
        x2={px(0)}
        y1={BOX.y}
        y2={BOX.y + BOX.h}
        className="stroke-divider"
        strokeWidth={1}
      />
      <path d={path} fill="none" className="stroke-brand" strokeWidth={2} />
      <line
        x1={px(z)}
        x2={px(z)}
        y1={BOX.y + BOX.h}
        y2={py(out)}
        className="stroke-fg-muted"
        strokeDasharray="3 3"
      />
      <circle cx={px(z)} cy={py(out)} r={5} className="fill-fg" />
      <Label x={BOX.x + BOX.w / 2} y={BOX.y - 10} className="fill-fg">
        {name}
      </Label>
      <Arrow x1={438} x2={478} y={90} />

      <rect x={486} y={62} width={104} height={56} rx={3} className="fill-brand/10 stroke-brand" />
      <Label x={538} y={82} className="fill-fg-muted">
        {t("output")}
      </Label>
      <Label x={538} y={106} className="fill-fg text-[18px]">
        {fmt(out)}
      </Label>
    </svg>
  )
}

type Choice = {
  name: string
  use: string
  key: ActivationKey | "softmax"
  yRange: [number, number]
}

const HIDDEN_CHOICES: Choice[] = [
  { name: "ReLU", use: "the default", key: "relu", yRange: [-1, 4] },
  { name: "Leaky ReLU", use: "when ReLU neurons die", key: "leakyRelu", yRange: [-1, 4] },
  { name: "GELU / SiLU", use: "transformers, deep nets", key: "gelu", yRange: [-1, 4] },
  { name: "tanh", use: "small or recurrent nets", key: "tanh", yRange: [-1.2, 1.2] },
]
const OUTPUT_CHOICES: Choice[] = [
  { name: "Linear", use: "a number (regression)", key: "linear", yRange: [-4.5, 4.5] },
  { name: "Sigmoid", use: "yes / no (binary)", key: "sigmoid", yRange: [-0.1, 1.1] },
  { name: "Softmax", use: "one class of many", key: "softmax", yRange: [0, 1] },
]

const CARD = 56
const HIDDEN_X = 190
const OUTPUT_X = 690
const SUM = { x: 480, y: 280 }
const Y_HAT = { x: 900, y: 280 }
const hiddenY = (i: number) => 100 + i * 120
const outputY = (i: number) => 160 + i * 120

/** A function's curve (or softmax's bars) drawn inside a CARD-sized box centered at (cx, cy). */
function MiniCurve({ choice, cx, cy }: { choice: Choice; cx: number; cy: number }) {
  const pad = 8
  const left = cx - CARD / 2 + pad
  const top = cy - CARD / 2 + pad
  const size = CARD - 2 * pad
  if (choice.key === "softmax") {
    return (
      <g className="fill-brand">
        {[0.55, 0.3, 0.15].map((p, i) => (
          <rect
            key={p}
            x={left + 4 + i * 13}
            y={top + size * (1 - p / 0.6)}
            width={9}
            height={(size * p) / 0.6}
            rx={1}
          />
        ))}
      </g>
    )
  }
  const { f } = ACTIVATION_FUNCTIONS[choice.key]
  const [lo, hi] = choice.yRange
  const d = Array.from({ length: 41 }, (_, i) => -4 + i * 0.2)
    .map((z, i) => {
      const x = left + ((z + 4) / 8) * size
      const y = top + size - ((f(z) - lo) / (hi - lo)) * size
      return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")
  return <path d={d} fill="none" className="stroke-brand" strokeWidth={2} />
}

function ChoiceCard({ choice, cx, cy }: { choice: Choice; cx: number; cy: number }) {
  const { t } = useTranslation()
  return (
    <g>
      <rect
        x={cx - CARD / 2}
        y={cy - CARD / 2}
        width={CARD}
        height={CARD}
        rx={8}
        className="fill-surface stroke-fg-secondary"
        strokeWidth={1.5}
      />
      <MiniCurve choice={choice} cx={cx} cy={cy} />
      <Label x={cx} y={cy - CARD / 2 - 8} className="fill-fg">
        {choice.name}
      </Label>
      <Label x={cx} y={cy + CARD / 2 + 18}>
        {t(choice.use)}
      </Label>
    </g>
  )
}

const Neuron = ({
  x,
  y,
  r,
  children,
}: {
  x: number
  y: number
  r: number
  children: ReactNode
}) => (
  <g>
    <circle cx={x} cy={y} r={r} className="fill-surface stroke-fg-secondary" strokeWidth={1.5} />
    <Label x={x} y={y + 5} className="fill-fg text-[15px]">
      {children}
    </Label>
  </g>
)

const Wire = ({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-fg-muted" strokeWidth={1.5} />
)

const Divider = ({ x1, x2, y }: { x1: number; x2: number; y: number }) => (
  <line x1={x1} x2={x2} y1={y} y2={y} className="stroke-divider" strokeDasharray="4 4" />
)

/** Each hidden choice fed by its own two inputs, all wired into one output neuron, which fans out to the output choices. */
export function NutshellFlow() {
  const { t } = useTranslation()
  return (
    <figure className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 960 540"
          className="w-full min-w-[720px]"
          role="img"
          aria-label={t(
            "Inputs pass through hidden neurons and their activation, then an output neuron and the output activation.",
          )}
        >
          <Label x={HIDDEN_X} y={24} className="label-ui fill-brand">
            {t("Hidden layers")}
          </Label>
          <Label x={OUTPUT_X} y={24} className="label-ui fill-brand">
            {t("Output layer")}
          </Label>
          {HIDDEN_CHOICES.slice(1).map((c, i) => (
            <Divider key={c.name} x1={10} x2={300} y={hiddenY(i) + 60} />
          ))}
          {OUTPUT_CHOICES.slice(1).map((c, i) => (
            <Divider key={c.name} x1={620} x2={800} y={outputY(i) + 60} />
          ))}
          {HIDDEN_CHOICES.map((c, i) => (
            <g key={c.name}>
              <Wire x1={40} y1={hiddenY(i) - 22} x2={HIDDEN_X - CARD / 2} y2={hiddenY(i)} />
              <Wire x1={40} y1={hiddenY(i) + 22} x2={HIDDEN_X - CARD / 2} y2={hiddenY(i)} />
              <Wire x1={HIDDEN_X + CARD / 2} y1={hiddenY(i)} x2={SUM.x} y2={SUM.y} />
              <Neuron x={40} y={hiddenY(i) - 22} r={16}>
                x₁
              </Neuron>
              <Neuron x={40} y={hiddenY(i) + 22} r={16}>
                x₂
              </Neuron>
              <ChoiceCard choice={c} cx={HIDDEN_X} cy={hiddenY(i)} />
            </g>
          ))}
          {OUTPUT_CHOICES.map((c, i) => (
            <g key={c.name}>
              <Wire x1={SUM.x} y1={SUM.y} x2={OUTPUT_X - CARD / 2} y2={outputY(i)} />
              <Wire x1={OUTPUT_X + CARD / 2} y1={outputY(i)} x2={Y_HAT.x} y2={Y_HAT.y} />
              <ChoiceCard choice={c} cx={OUTPUT_X} cy={outputY(i)} />
            </g>
          ))}
          <Neuron x={SUM.x} y={SUM.y} r={26}>
            Σ
          </Neuron>
          <Label x={SUM.x} y={SUM.y + 48} className="fill-fg">
            {t("output neuron")}
          </Label>
          <Neuron x={Y_HAT.x} y={Y_HAT.y} r={22}>
            ŷ
          </Neuron>
        </svg>
      </div>
      <figcaption className="rounded-[3px] border border-dashed border-divider px-3 py-2 text-sm text-fg-secondary">
        {t(
          "Pick one hidden activation and one output activation. The hidden results always go through an output neuron (its own weights and bias) before the output activation. With no hidden layer, the inputs go straight to that output neuron — that is linear or logistic regression, which can only draw straight lines.",
        )}
      </figcaption>
    </figure>
  )
}

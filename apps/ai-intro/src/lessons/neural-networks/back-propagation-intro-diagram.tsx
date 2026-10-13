import { useTranslation } from "@/i18n/use-translation"

const W = 760
const H = 400
const BOX = 56
const R = 24

const INPUTS = [
  { label: "x₁", y: 170 },
  { label: "x₂", y: 250 },
]
const HIDDEN = [
  { x: 210, y: 150, curve: "tanh" },
  { x: 210, y: 270, curve: "relu" },
  { x: 330, y: 150, curve: "tanh" },
  { x: 330, y: 270, curve: "relu" },
] as const
const SUM = { x: 460, y: 210 }
const ACT = { x: 565, y: 210 }
const OUT = { x: 690, y: 210 }

/** A glyph of the activation curve, drawn inside a neuron box centred on (cx, cy). */
function curvePath(kind: "tanh" | "relu" | "sigmoid", cx: number, cy: number) {
  if (kind === "relu") return `M${cx - 18},${cy + 10} L${cx},${cy + 10} L${cx + 16},${cy - 14}`
  const f = kind === "tanh" ? Math.tanh : (z: number) => 2 / (1 + Math.exp(-z)) - 1
  return Array.from({ length: 21 }, (_, i) => {
    const z = -3 + (i / 20) * 6
    return `${i === 0 ? "M" : "L"}${cx - 18 + (i / 20) * 36},${cy - f(z) * 14}`
  }).join("")
}

function Neuron({ x, y, curve }: { x: number; y: number; curve: "tanh" | "relu" | "sigmoid" }) {
  return (
    <g>
      <rect
        x={x - BOX / 2}
        y={y - BOX / 2}
        width={BOX}
        height={BOX}
        rx={10}
        className="fill-surface stroke-fg"
        strokeWidth={1.5}
      />
      <path d={curvePath(curve, x, y)} fill="none" className="stroke-fg" strokeWidth={2} />
    </g>
  )
}

function Circle({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={R} className="fill-surface stroke-fg" strokeWidth={1.5} />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-fg font-display text-[18px]"
      >
        {label}
      </text>
    </g>
  )
}

function Arrow({
  from,
  to,
  y,
  className,
}: {
  from: number
  to: number
  y: number
  className: string
}) {
  const dir = Math.sign(to - from)
  return (
    <g className={className}>
      <line x1={from} y1={y} x2={to} y2={y} stroke="currentColor" strokeWidth={2} />
      <polyline
        points={`${to - dir * 12},${y - 7} ${to},${y} ${to - dir * 12},${y + 7}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      />
    </g>
  )
}

function Step({
  x,
  y,
  n,
  text,
  className,
}: {
  x: number
  y: number
  n: number
  text: string | string[]
  className: string
}) {
  const [first, ...rest] = typeof text === "string" ? [text] : text
  return (
    <text x={x} y={y} className={`font-ui text-[13px] ${className}`}>
      <tspan className="font-bold">{n} · </tspan>
      {first}
      {rest.map((line) => (
        <tspan key={line} x={x + 18} dy={18}>
          {line}
        </tspan>
      ))}
    </text>
  )
}

/** The forward prediction and the backward error flow through a small two-hidden-layer network. */
export function BackPropagationIntroDiagram() {
  const { t } = useTranslation()
  const edges: [number, number, number, number][] = [
    ...INPUTS.flatMap((input) =>
      HIDDEN.slice(0, 2).map(
        (h) => [50 + R, input.y, h.x - BOX / 2, h.y] as [number, number, number, number],
      ),
    ),
    ...HIDDEN.slice(0, 2).flatMap((a) =>
      HIDDEN.slice(2).map(
        (b) => [a.x + BOX / 2, a.y, b.x - BOX / 2, b.y] as [number, number, number, number],
      ),
    ),
    ...HIDDEN.slice(2).map(
      (h) => [h.x + BOX / 2, h.y, SUM.x - R, SUM.y] as [number, number, number, number],
    ),
    [SUM.x + R, SUM.y, ACT.x - BOX / 2, ACT.y],
    [ACT.x + BOX / 2, ACT.y, OUT.x - R, OUT.y],
  ]

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={t(
        "Backpropagation in two steps: the prediction flows forward through the hidden layers to ŷ, then the error flows backward to every connection.",
      )}
    >
      <Arrow from={50} to={730} y={44} className="text-fg-muted" />
      <Step
        x={50}
        y={30}
        n={1}
        text={t("Forward: hidden layers let the network represent more complex patterns.")}
        className="fill-fg-secondary"
      />

      {[
        { x: 50, label: t("Inputs") },
        { x: 270, label: t("Hidden layers") },
        { x: 512, label: t("Output neuron") },
        { x: 690, label: t("Prediction") },
      ].map((h) => (
        <text key={h.x} x={h.x} y={84} textAnchor="middle" className="label-ui fill-fg-muted">
          {h.label}
        </text>
      ))}
      {[210, 330].map((x, i) => (
        <text
          key={x}
          x={x}
          y={112}
          textAnchor="middle"
          className="fill-fg-secondary font-ui text-[12px]"
        >
          {t("Layer {0}", [i + 1])}
        </text>
      ))}

      {edges.map(([x1, y1, x2, y2]) => (
        <line
          key={`${x1},${y1},${x2},${y2}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          className="stroke-fg-muted"
          strokeWidth={1.5}
        />
      ))}

      {INPUTS.map((input) => (
        <Circle key={input.label} x={50} y={input.y} label={input.label} />
      ))}
      {HIDDEN.map((h) => (
        <Neuron key={`${h.x},${h.y}`} {...h} />
      ))}
      <Circle x={SUM.x} y={SUM.y} label="Σ" />
      <Neuron x={ACT.x} y={ACT.y} curve="sigmoid" />
      <Circle x={OUT.x} y={OUT.y} label="ŷ" />

      <Arrow from={730} to={180} y={340} className="text-brand" />
      <Step
        x={50}
        y={366}
        n={2}
        text={[
          t("Backward: the error flows back,"),
          t("measuring how much each connection contributed."),
        ]}
        className="fill-brand"
      />
    </svg>
  )
}

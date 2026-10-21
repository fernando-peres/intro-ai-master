import { Fragment } from "react"
import { useTranslation } from "@/i18n/use-translation"
import { stage } from "./stages"

const FOUNDATION = stage("foundation").color
const ADAPTED = stage("adaptation").color
const DATA = "var(--color-fg-muted)"
const MUTED = "var(--color-fg-secondary)"

const CY = 165
const LAYERS = [3, 4, 4, 3]

function Network({ x, color }: { x: number; color: string }) {
  const nodes = LAYERS.map((count, l) =>
    Array.from({ length: count }, (_, i) => ({
      x: x + l * 40,
      y: CY + (i - (count - 1) / 2) * 24,
    })),
  )
  return (
    <g>
      {nodes
        .slice(1)
        .map((layer, l) =>
          layer.map((to) =>
            nodes[l].map((from) => (
              <line
                key={`${from.x}-${from.y}-${to.x}-${to.y}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={MUTED}
                strokeOpacity={0.35}
                strokeWidth={0.8}
              />
            )),
          ),
        )}
      {nodes.flat().map((n) => (
        <circle
          key={`${n.x}-${n.y}`}
          cx={n.x}
          cy={n.y}
          r={7}
          fill="var(--color-canvas)"
          stroke={color}
          strokeWidth={2}
        />
      ))}
    </g>
  )
}

function Arrow({ x1, x2 }: { x1: number; x2: number }) {
  return (
    <g stroke={MUTED} fill={MUTED}>
      <line x1={x1} y1={CY} x2={x2 - 8} y2={CY} strokeWidth={2} strokeDasharray="2 6" />
      <path d={`M ${x2 - 9} ${CY - 5} L ${x2} ${CY} L ${x2 - 9} ${CY + 5} Z`} stroke="none" />
    </g>
  )
}

function Pill({ x, label, color }: { x: number; label: string; color: string }) {
  return (
    <g>
      <rect x={x} y={CY - 22} width={110} height={44} rx={12} fill={color} />
      <text
        x={x + 55}
        y={CY + 4}
        textAnchor="middle"
        className="font-ui"
        fontSize={12}
        fontWeight={700}
        letterSpacing="0.12em"
        fill="var(--color-canvas)"
      >
        {label}
      </text>
    </g>
  )
}

function DataStack({ x }: { x: number }) {
  const sheets = [
    [x + 18, CY - 52],
    [x, CY - 30],
    [x + 34, CY - 18],
    [x + 12, CY + 2],
  ]
  return (
    <g>
      {sheets.map(([sx, sy]) => (
        <g key={`${sx}-${sy}`}>
          <rect
            x={sx}
            y={sy}
            width={52}
            height={58}
            rx={5}
            fill="var(--color-canvas)"
            stroke={DATA}
            strokeWidth={1.5}
          />
          {["01010", "10101", "01110"].map((bits, i) => (
            <text
              key={bits}
              x={sx + 7}
              y={sy + 18 + i * 14}
              fontSize={10}
              className="font-ui"
              fill={DATA}
            >
              {bits}
            </text>
          ))}
        </g>
      ))}
    </g>
  )
}

/** Lines of SVG text centered on `x`; the first line can stand out as a heading. */
function Caption({
  x,
  y,
  lines,
  color,
  heading,
  eyebrow,
}: {
  x: number
  y: number
  lines: string[]
  color: string
  heading?: string
  eyebrow?: string
}) {
  let row = 0
  const next = () => y + row++ * 17
  return (
    <text textAnchor="middle" fill={color}>
      {eyebrow && (
        <tspan
          x={x}
          y={next()}
          fontSize={10}
          className="font-ui"
          letterSpacing="0.14em"
          textDecoration="underline"
        >
          {eyebrow}
        </tspan>
      )}
      {heading && (
        <tspan x={x} y={next() + 2} fontSize={15} fontWeight={700} className="font-display">
          {heading}
        </tspan>
      )}
      {lines.map((line) => (
        <Fragment key={line}>
          <tspan x={x} y={next() + (heading ? 4 : 0)} fontSize={12.5} className="font-display">
            {line}
          </tspan>
        </Fragment>
      ))}
    </text>
  )
}

const TASKS = ["Summarization", "Translation", "Q&A", "Content generation", "…"]

/**
 * Data → pretraining → foundation model → adaptation → adapted model. `labels` adds the stage
 * captions; `tasks` adds the downstream tasks an assistant handles.
 */
export function PipelineDiagram({
  labels = false,
  tasks = false,
}: {
  labels?: boolean
  tasks?: boolean
}) {
  const { t } = useTranslation()
  const width = tasks ? 1010 : 850
  const top = labels ? 40 : 70
  const height = labels ? 250 : 160
  return (
    <div className="overflow-x-auto rounded-[3px] border border-divider bg-surface px-4 py-5">
      <svg
        role="img"
        aria-label={t(
          "Training data feeds pretraining, which produces a foundation model; adaptation turns it into an adapted model.",
        )}
        viewBox={`0 ${top} ${width} ${height}`}
        className="mx-auto h-auto w-full min-w-[640px]"
      >
        <DataStack x={10} />
        <Arrow x1={110} x2={150} />
        <Pill x={155} label={t("TRAINING")} color={FOUNDATION} />
        <Arrow x1={272} x2={310} />
        <Network x={322} color={FOUNDATION} />
        <Arrow x1={460} x2={498} />
        <Pill x={503} label={t("ADAPTED")} color={ADAPTED} />
        <Arrow x1={620} x2={658} />
        <Network x={670} color={ADAPTED} />
        {tasks && (
          <g>
            <Arrow x1={808} x2={846} />
            {TASKS.map((task, i) => (
              <g key={task}>
                <rect
                  x={852}
                  y={CY - 78 + i * 32}
                  width={150}
                  height={26}
                  rx={8}
                  fill="none"
                  stroke={MUTED}
                  strokeWidth={1.2}
                />
                <text
                  x={927}
                  y={CY - 61 + i * 32}
                  textAnchor="middle"
                  fontSize={10}
                  letterSpacing="0.1em"
                  className="font-ui"
                  fill={MUTED}
                >
                  {t(task).toUpperCase()}
                </text>
              </g>
            ))}
          </g>
        )}
        {labels && (
          <g>
            <Caption
              x={52}
              y={68}
              lines={[t("Hundreds of billions"), t("of training tokens")]}
              color={MUTED}
            />
            <Caption
              x={210}
              y={212}
              heading={t("Pretraining")}
              lines={[
                t("Learns general language"),
                t("patterns by predicting"),
                t("the next token"),
              ]}
              color={FOUNDATION}
            />
            <Caption
              x={382}
              y={62}
              eyebrow={t("FOUNDATION MODEL")}
              lines={[t("General-purpose"), t("language model")]}
              color={FOUNDATION}
            />
            <Caption
              x={558}
              y={212}
              heading={t("Post-training")}
              lines={[
                t("Adapted to follow human"),
                t("instructions through fine-"),
                t("tuning and human feedback"),
              ]}
              color={ADAPTED}
            />
            <Caption
              x={730}
              y={62}
              eyebrow={t("ADAPTED MODEL")}
              lines={[t("Conversational"), t("assistant model")]}
              color={ADAPTED}
            />
          </g>
        )}
      </svg>
    </div>
  )
}

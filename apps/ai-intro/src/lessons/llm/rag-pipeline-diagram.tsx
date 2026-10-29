import { useTranslation } from "@/i18n/use-translation"

const STEP = "var(--color-chart-warm)"
const MUTED = "var(--color-fg-muted)"

const W = 150
const H = 34
const STEP_X = 200
const x = (i: number) => 20 + i * STEP_X
const OFFLINE_Y = 40
const ONLINE_Y = 170

function Box({
  i,
  y,
  label,
  dashed = false,
}: {
  i: number
  y: number
  label: string
  dashed?: boolean
}) {
  const color = dashed ? MUTED : STEP
  return (
    <g>
      <rect
        x={x(i)}
        y={y}
        width={W}
        height={H}
        rx={3}
        fill="var(--color-canvas)"
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray={dashed ? "5 4" : undefined}
      />
      <text
        x={x(i) + W / 2}
        y={y + H / 2 + 4}
        fontSize={12}
        textAnchor="middle"
        className="font-display"
        fill={dashed ? MUTED : "var(--color-fg)"}
      >
        {label}
      </text>
    </g>
  )
}

function Arrow({ i, y, dashed = false }: { i: number; y: number; dashed?: boolean }) {
  const x1 = x(i) + W
  const x2 = x(i + 1)
  const cy = y + H / 2
  return (
    <g stroke={MUTED} fill={MUTED}>
      <line
        x1={x1}
        y1={cy}
        x2={x2 - 7}
        y2={cy}
        strokeWidth={1.5}
        strokeDasharray={dashed ? "5 4" : undefined}
      />
      <path d={`M ${x2 - 8} ${cy - 4} L ${x2} ${cy} L ${x2 - 8} ${cy + 4} Z`} stroke="none" />
    </g>
  )
}

/** Index building (top) and question answering (bottom); the LLM step is drawn but not run here. */
export function RagPipelineDiagram() {
  const { t } = useTranslation()
  const offline = [t("Documents"), t("Chunks"), t("Embeddings"), t("Vector index")]
  const online = [t("Question"), t("Query embedding"), t("Top-k chunks"), t("Prompt")]
  const indexX = x(3) + W / 2
  const topKX = x(2) + W / 2
  const midY = (OFFLINE_Y + H + ONLINE_Y) / 2
  return (
    <div className="overflow-x-auto rounded-[3px] border border-divider bg-surface px-4 py-5">
      <svg
        role="img"
        aria-label={t(
          "Retrieval-augmented generation in two rows. Indexing: documents are split into chunks, embedded and stored in a vector index. Answering: the question is embedded, the index returns the top-k nearest chunks, they go into a prompt, and a language model, not run here, writes the answer.",
        )}
        viewBox="0 0 1000 240"
        className="mx-auto h-auto w-full min-w-[720px]"
      >
        <text x={20} y={26} fontSize={12} className="fill-fg-secondary font-display">
          {t("Indexing (once)")}
        </text>
        <text x={20} y={156} fontSize={12} className="fill-fg-secondary font-display">
          {t("Answering (every question)")}
        </text>
        {offline.map((label, i) => (
          <Box key={label} i={i} y={OFFLINE_Y} label={label} />
        ))}
        {online.map((label, i) => (
          <Box key={label} i={i} y={ONLINE_Y} label={label} />
        ))}
        <Box i={4} y={ONLINE_Y} label={t("LLM")} dashed />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <Arrow i={i} y={OFFLINE_Y} />
            <Arrow i={i} y={ONLINE_Y} />
          </g>
        ))}
        <Arrow i={3} y={ONLINE_Y} dashed />
        <path
          d={`M ${indexX} ${OFFLINE_Y + H} L ${indexX} ${midY} L ${topKX} ${midY} L ${topKX} ${ONLINE_Y - 7}`}
          fill="none"
          stroke={MUTED}
          strokeWidth={1.5}
        />
        <path
          d={`M ${topKX - 4} ${ONLINE_Y - 8} L ${topKX} ${ONLINE_Y} L ${topKX + 4} ${ONLINE_Y - 8} Z`}
          fill={MUTED}
        />
        <text
          x={x(4) + W / 2}
          y={ONLINE_Y + H + 18}
          fontSize={11}
          textAnchor="middle"
          fill={MUTED}
          className="font-display"
        >
          {t("not run here")}
        </text>
      </svg>
    </div>
  )
}

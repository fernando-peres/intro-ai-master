import { useTranslation } from "@/i18n/use-translation"

const ATTENTION = "var(--color-chart-warm)"
const FFN = "var(--color-fg-secondary)"
const IO = "var(--color-fg-muted)"

const W = 150
const H = 34
const GAP = 14

function Block({
  x,
  y,
  label,
  color,
  filled = false,
}: {
  x: number
  y: number
  label: string
  color: string
  filled?: boolean
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={W}
        height={H}
        rx={filled ? 17 : 3}
        fill={filled ? color : "var(--color-canvas)"}
        stroke={color}
        strokeWidth={filled ? 0 : 1.5}
      />
      <text
        x={x + W / 2}
        y={y + H / 2 + 4}
        fontSize={12}
        textAnchor="middle"
        className="font-display"
        fill={filled ? "var(--color-canvas)" : "var(--color-fg)"}
      >
        {label}
      </text>
    </g>
  )
}

function Up({ x, y1, y2 }: { x: number; y1: number; y2: number }) {
  return (
    <g stroke={IO} fill={IO}>
      <line x1={x} y1={y1} x2={x} y2={y2 + 7} strokeWidth={1.5} />
      <path d={`M ${x - 4} ${y2 + 8} L ${x} ${y2} L ${x + 4} ${y2 + 8} Z`} stroke="none" />
    </g>
  )
}

/** Bottom-up stack of blocks; returns the y of its top block for arrows. */
function Stack({
  x,
  bottom,
  blocks,
}: {
  x: number
  bottom: number
  blocks: Parameters<typeof Block>[0][]
}) {
  return (
    <g>
      {blocks.map((block, i) => {
        const y = bottom - i * (H + GAP)
        return (
          <g key={block.label}>
            {i > 0 && <Up x={x + W / 2} y1={y + H + GAP} y2={y + H} />}
            <Block {...block} x={x} y={y} />
          </g>
        )
      })}
    </g>
  )
}

/** Encoder, decoder and encoder–decoder side by side; attention blocks share one colour. */
export function TransformerVariantsDiagram() {
  const { t } = useTranslation()
  const bottom = 236
  const col = (i: number) => 24 + i * 300
  const encDec = col(2)
  return (
    <div className="overflow-x-auto rounded-[3px] border border-divider bg-surface px-4 py-5">
      <svg
        role="img"
        aria-label={t(
          "Three stacks: an encoder (self-attention then feed-forward), a decoder (causal attention then feed-forward, ending in next-token logits) and an encoder–decoder whose decoder also cross-attends to the encoder.",
        )}
        viewBox="0 0 980 300"
        className="mx-auto h-auto w-full min-w-[720px]"
      >
        {[t("Encoder-only"), t("Decoder-only"), t("Encoder–decoder")].map((title, i) => (
          <text
            key={title}
            x={col(i) + W / 2 + (i === 2 ? 87 : 0)}
            y={22}
            fontSize={13}
            textAnchor="middle"
            className="fill-fg font-display"
          >
            {title}
          </text>
        ))}
        <Stack
          x={col(0)}
          bottom={bottom}
          blocks={[
            { x: 0, y: 0, label: t("Input vectors"), color: IO, filled: true },
            { x: 0, y: 0, label: t("Self-attention"), color: ATTENTION },
            { x: 0, y: 0, label: t("Feed-forward"), color: FFN },
            { x: 0, y: 0, label: t("Output vectors"), color: IO, filled: true },
          ]}
        />
        <Stack
          x={col(1)}
          bottom={bottom}
          blocks={[
            { x: 0, y: 0, label: t("Input vectors"), color: IO, filled: true },
            { x: 0, y: 0, label: t("Causal attention"), color: ATTENTION },
            { x: 0, y: 0, label: t("Feed-forward"), color: FFN },
            { x: 0, y: 0, label: t("Next-token logits"), color: IO, filled: true },
          ]}
        />
        <Stack
          x={encDec}
          bottom={bottom}
          blocks={[
            { x: 0, y: 0, label: t("Source tokens"), color: IO, filled: true },
            { x: 0, y: 0, label: t("Encoder"), color: ATTENTION },
          ]}
        />
        <Stack
          x={encDec + W + 24}
          bottom={bottom}
          blocks={[
            { x: 0, y: 0, label: t("Target so far"), color: IO, filled: true },
            { x: 0, y: 0, label: t("Causal attention"), color: ATTENTION },
            { x: 0, y: 0, label: t("Cross-attention"), color: ATTENTION },
            { x: 0, y: 0, label: t("Output tokens"), color: IO, filled: true },
          ]}
        />
        <g stroke={ATTENTION} fill={ATTENTION}>
          <line
            x1={encDec + W}
            y1={bottom - (H + GAP) + H / 2}
            x2={encDec + W + 24 - 8}
            y2={bottom - 2 * (H + GAP) + H / 2}
            strokeWidth={1.5}
            strokeDasharray="3 4"
          />
          <path
            d={`M ${encDec + W + 24 - 9} ${bottom - 2 * (H + GAP) + H / 2 - 4} L ${encDec + W + 24} ${bottom - 2 * (H + GAP) + H / 2} L ${encDec + W + 24 - 9} ${bottom - 2 * (H + GAP) + H / 2 + 4} Z`}
            stroke="none"
          />
        </g>
        <text
          x={490}
          y={290}
          fontSize={11}
          textAnchor="middle"
          className="fill-fg-muted font-display"
        >
          {t(
            "Conceptual only: residual connections, normalization and the layer repeats are omitted.",
          )}
        </text>
      </svg>
    </div>
  )
}

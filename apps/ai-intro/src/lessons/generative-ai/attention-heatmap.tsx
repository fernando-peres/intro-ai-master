import { useId } from "react"
import { useTranslation } from "@/i18n/use-translation"
import { cn } from "@/lib/utils"
import type { Matrix } from "./attention-math"
import { tokenLabel } from "./stages"

const CELL = 26
const LEFT = 92
const TOP = 64

const shortLabel = (token: string) => {
  const text = tokenLabel(token)
  return text.length > 11 ? `${text.slice(0, 10)}…` : text
}

/**
 * Query tokens are rows, key tokens are columns; a cell's opacity is its weight. With `masked`,
 * future keys (above the diagonal) are hatched. `weights[q][k]` must be `tokens.length` square.
 */
export function AttentionHeatmap({
  tokens,
  weights,
  selected,
  onSelect,
  masked,
  label,
}: {
  tokens: string[]
  weights: Matrix
  selected: number
  onSelect?: (index: number) => void
  masked: boolean
  /** Names the image for assistive technology, e.g. the text it belongs to. */
  label: string
}) {
  const { t } = useTranslation()
  const patternId = useId()
  const n = tokens.length
  const width = LEFT + n * CELL
  const height = TOP + n * CELL

  const cells: { key: string; q: number; k: number; weight: number }[] = []
  for (let q = 0; q < n; q++) {
    for (let k = 0; k < n; k++) cells.push({ key: `${q}-${k}`, q, k, weight: weights[q]?.[k] ?? 0 })
  }
  const maskedCells = masked ? cells.filter((c) => c.k > c.q) : []
  const row = weights[selected] ?? []
  const strongest = row.indexOf(Math.max(...row))
  // Tokens repeat ("the" twice), so keys carry the position.
  const positions = tokens.map((token, i) => ({ key: `${i}-${token}`, token, i }))

  return (
    <div className="flex flex-col gap-3">
      {onSelect && (
        <fieldset className="flex flex-wrap gap-1 font-display text-[15px]">
          <legend className="sr-only">{t("Query token")}</legend>
          {positions.map(({ key, token, i }) => (
            <button
              key={key}
              type="button"
              aria-pressed={i === selected}
              aria-label={token.trim() || tokenLabel(token)}
              onClick={() => onSelect(i)}
              className={cn(
                "rounded-[2px] border px-1.5 py-0.5 whitespace-pre transition-colors",
                i === selected
                  ? "border-brand bg-brand/15 text-brand"
                  : "border-line text-fg-secondary hover:text-fg",
              )}
            >
              {tokenLabel(token)}
            </button>
          ))}
        </fieldset>
      )}
      <svg
        role="img"
        aria-label={t("Attention of “{0}” in {1}: strongest on “{2}”", [
          tokenLabel(tokens[selected] ?? "").trim(),
          label,
          tokenLabel(tokens[strongest] ?? "").trim(),
        ])}
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full max-w-[560px]"
      >
        <defs>
          <pattern
            id={patternId}
            width={6}
            height={6}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1={0} y1={0} x2={0} y2={6} stroke="var(--color-fg-muted)" strokeOpacity={0.45} />
          </pattern>
        </defs>
        {positions.map(({ key, token, i: k }) => (
          <text
            key={`k-${key}`}
            x={LEFT + k * CELL + CELL / 2}
            y={TOP - 8}
            fontSize={11}
            textAnchor="start"
            transform={`rotate(-50 ${LEFT + k * CELL + CELL / 2} ${TOP - 8})`}
            className="fill-fg-muted font-display"
          >
            {shortLabel(token)}
          </text>
        ))}
        {positions.map(({ key, token, i: q }) => (
          <text
            key={`q-${key}`}
            x={LEFT - 8}
            y={TOP + q * CELL + CELL / 2 + 4}
            fontSize={11}
            textAnchor="end"
            className={cn("font-display", q === selected ? "fill-brand" : "fill-fg-muted")}
          >
            {shortLabel(token)}
          </text>
        ))}
        {cells.map((cell) => (
          <rect
            key={cell.key}
            data-testid="attention-cell"
            data-weight={String(Number(cell.weight.toFixed(4)))}
            x={LEFT + cell.k * CELL}
            y={TOP + cell.q * CELL}
            width={CELL}
            height={CELL}
            fill="var(--color-chart-warm)"
            fillOpacity={Math.max(0.04, cell.weight)}
            stroke="var(--color-surface)"
            strokeWidth={1}
          >
            <title>
              {`${tokenLabel(tokens[cell.q])} → ${tokenLabel(tokens[cell.k])}: ${Math.round(cell.weight * 100)}%`}
            </title>
          </rect>
        ))}
        {maskedCells.map((cell) => (
          <rect
            key={`m-${cell.key}`}
            data-testid="masked-cell"
            x={LEFT + cell.k * CELL}
            y={TOP + cell.q * CELL}
            width={CELL}
            height={CELL}
            fill={`url(#${patternId})`}
          />
        ))}
        {n > 0 && (
          <rect
            x={LEFT}
            y={TOP + selected * CELL}
            width={n * CELL}
            height={CELL}
            fill="none"
            stroke="var(--color-brand)"
            strokeWidth={1.5}
          />
        )}
      </svg>
    </div>
  )
}

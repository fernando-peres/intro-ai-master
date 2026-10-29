import { useTranslation } from "@/i18n/use-translation"
import { fmt } from "./embeddings-math"

const LEFT = 96
const TOP = 96
const RIGHT = 60

/**
 * `matrix[i][j]` is the value for `labels[i]` × `labels[j]`. Opacity is |value|; values beyond 1
 * (dot products, distances) are scaled by the largest magnitude so the colors stay readable.
 */
export function SimilarityHeatmap({
  labels,
  matrix,
  selected,
  onSelect,
  ariaLabel,
  format = fmt,
  distance = false,
}: {
  labels: string[]
  matrix: number[][]
  selected: [number, number] | null
  onSelect: (row: number, col: number) => void
  ariaLabel: string
  format?: (value: number) => string
  /** The matrix holds distances, so darker means farther apart. */
  distance?: boolean
}) {
  const { t } = useTranslation()
  const n = labels.length
  const cell = n <= 8 ? 56 : n <= 12 ? 40 : 28
  const showValues = n <= 8
  const width = LEFT + n * cell + RIGHT
  const height = TOP + n * cell
  const scale = Math.max(1, ...matrix.flatMap((row) => row.map(Math.abs)))
  const short = (label: string) => (label.length > 14 ? `${label.slice(0, 13)}…` : label)

  return (
    <figure className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <svg
          role="img"
          aria-label={ariaLabel}
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full max-w-[640px]"
          style={{ minWidth: Math.min(width, 420) }}
        >
          {labels.map((label, i) => (
            <text
              // biome-ignore lint/suspicious/noArrayIndexKey: labels may repeat; position is the identity
              key={`c-${i}`}
              x={LEFT + i * cell + cell / 2}
              y={TOP - 8}
              fontSize={11}
              transform={`rotate(-45 ${LEFT + i * cell + cell / 2} ${TOP - 8})`}
              className="fill-fg-muted font-display"
            >
              {short(label)}
            </text>
          ))}
          {labels.map((label, i) => (
            <text
              // biome-ignore lint/suspicious/noArrayIndexKey: labels may repeat; position is the identity
              key={`r-${i}`}
              x={LEFT - 8}
              y={TOP + i * cell + cell / 2 + 4}
              fontSize={11}
              textAnchor="end"
              className="fill-fg-muted font-display"
            >
              {short(label)}
            </text>
          ))}
          {matrix.flatMap((row, i) =>
            row.map((value, j) => {
              const isSelected = selected?.[0] === i && selected?.[1] === j
              const x = LEFT + j * cell
              const y = TOP + i * cell
              const select = () => onSelect(i, j)
              return (
                // biome-ignore lint/suspicious/noArrayIndexKey: the row and column are the identity
                <g key={`${i}-${j}`}>
                  {/* biome-ignore lint/a11y/useSemanticElements: an SVG rect cannot be a <button> */}
                  <rect
                    data-testid="similarity-cell"
                    data-value={String(Number(value.toFixed(4)))}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={`${labels[i]} × ${labels[j]}: ${format(value)}`}
                    x={x}
                    y={y}
                    width={cell}
                    height={cell}
                    fill={
                      i === j
                        ? "var(--color-fg-muted)"
                        : value < 0
                          ? "var(--color-chart-amber)"
                          : "var(--color-chart-warm)"
                    }
                    fillOpacity={
                      i === j ? 0.25 : Number(Math.min(1, Math.abs(value) / scale).toFixed(4))
                    }
                    stroke={isSelected ? "var(--color-brand)" : "var(--color-surface)"}
                    strokeWidth={isSelected ? 2.5 : 1}
                    className="cursor-pointer outline-none focus-visible:stroke-brand"
                    onClick={select}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        select()
                      }
                    }}
                  >
                    <title>{`${labels[i]} × ${labels[j]}: ${format(value)}`}</title>
                  </rect>
                  {showValues && (
                    <text
                      x={x + cell / 2}
                      y={y + cell / 2 + 4}
                      textAnchor="middle"
                      fontSize={11}
                      className="pointer-events-none fill-fg font-ui"
                    >
                      {format(value)}
                    </text>
                  )}
                </g>
              )
            }),
          )}
        </svg>
      </div>
      <figcaption className="text-xs text-fg-muted">
        {distance
          ? t("Distance: darker = farther apart. Click a cell to compare that pair.")
          : t(
              "Orange cells are positive, amber cells negative; the stronger the value, the stronger the color. Click a cell to compare that pair.",
            )}
      </figcaption>
    </figure>
  )
}

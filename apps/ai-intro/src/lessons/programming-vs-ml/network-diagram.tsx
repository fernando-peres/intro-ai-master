import type { Translate } from "@/i18n/translate"
import { useTranslation } from "@/i18n/use-translation"
import type { Network } from "@/lib/neural-net"
import { type Domain, gridToDataUrl, resolveThemeColor, sampleLayers } from "./activation-grid"

const WIDTH = 760
const HEIGHT = 300
const NODE = 58
const LABEL_SPACE = 26
const MARGIN_X = 70
const RESOLUTION = 10

/** Weight magnitude → line thickness/opacity; sign → warm (excitatory) or secondary (inhibitory). */
function edgeStyle(weight: number, positiveColor: string, negativeColor: string) {
  const magnitude = Math.min(Math.abs(weight), 3)
  return {
    stroke: weight >= 0 ? positiveColor : negativeColor,
    strokeWidth: 0.75 + magnitude * 1.5,
    strokeOpacity: 0.25 + (magnitude / 3) * 0.6,
  }
}

function layerTitle(layer: number, count: number, lastLayer: number, t: Translate) {
  if (layer === 0) return t("INPUT")
  if (layer === lastLayer) return t("OUTPUT")
  return t("HIDDEN {0} ({1})", [layer, count])
}

/**
 * A read-only diagram of a feedforward network: a row of layer titles above square nodes, each a
 * live thumbnail of what it computes across the input plane, recomputed from `network` each render.
 */
export function NetworkDiagram({
  network,
  toInput,
  domain,
  inputLabels,
  outputLabel,
  showWeights = false,
}: {
  network: Network
  toInput: (x: number, y: number) => number[]
  domain: Domain
  inputLabels: string[]
  outputLabel: string
  /** Print every weight on its edge and every bias under its neuron. */
  showWeights?: boolean
}) {
  const { t } = useTranslation()
  const positiveColor = resolveThemeColor("--ae-chart-warm", "#d9742e")
  const negativeColor = resolveThemeColor("--ae-text-muted", "#8a7b70")
  const grids = sampleLayers(network, toInput, domain, RESOLUTION)

  const sizes = network.layerSizes
  const lastLayer = sizes.length - 1
  // Each layer spreads its nodes over the full height, so small layers sit far apart (room for labels).
  const span = HEIGHT - LABEL_SPACE
  const spacingOf = (layer: number) => Math.min(150, span / sizes[layer])
  const node = Math.min(NODE, span / Math.max(...sizes) - 8)
  const xOf = (layer: number) => MARGIN_X + (layer * (WIDTH - 2 * MARGIN_X)) / lastLayer
  const yOf = (layer: number, index: number) =>
    span / 2 + (index - (sizes[layer] - 1) / 2) * spacingOf(layer)

  return (
    <div className="flex flex-col gap-2.5">
      <div aria-hidden className="relative h-3">
        {sizes.map((count, layer) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: layers are positional, not identified by value.
            key={layer}
            className="label-ui absolute top-0 -translate-x-1/2 whitespace-nowrap text-fg-secondary"
            style={{ left: `${(xOf(layer) / WIDTH) * 100}%` }}
          >
            {layerTitle(layer, count, lastLayer, t)}
          </span>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label={t(
          "Live diagram of the {0} network: each node is a small thumbnail of what it computes across the input plane",
          [sizes.join("-")],
        )}
      >
        {network.weights.map((layerWeights, l) =>
          layerWeights.map((neuronWeights, n) =>
            neuronWeights.map((weight, i) => (
              <line
                // biome-ignore lint/suspicious/noArrayIndexKey: edges are positional, not identified by value.
                key={`e${l}-${i}-${n}`}
                x1={xOf(l) + node / 2}
                y1={yOf(l, i)}
                x2={xOf(l + 1) - node / 2}
                y2={yOf(l + 1, n)}
                {...edgeStyle(weight, positiveColor, negativeColor)}
              />
            )),
          ),
        )}

        {showWeights &&
          network.weights.map((layerWeights, l) =>
            layerWeights.map((neuronWeights, n) =>
              neuronWeights.map((weight, i) => {
                // Label on the side with fewer nodes' edges converging, where lines are still apart.
                const t = sizes[l] < sizes[l + 1] ? 0.72 : 0.28
                const x1 = xOf(l) + node / 2
                const x2 = xOf(l + 1) - node / 2
                return (
                  <text
                    // biome-ignore lint/suspicious/noArrayIndexKey: edges are positional, not identified by value.
                    key={`w${l}-${i}-${n}`}
                    x={x1 + t * (x2 - x1)}
                    y={yOf(l, i) + t * (yOf(l + 1, n) - yOf(l, i))}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-fg font-ui text-[10px]"
                    stroke="var(--color-surface)"
                    strokeWidth={3}
                    paintOrder="stroke"
                  >
                    {weight.toFixed(2)}
                  </text>
                )
              }),
            ),
          )}

        {sizes.map((count, layer) =>
          Array.from({ length: count }, (_, i) => {
            const thumbnail = gridToDataUrl(grids[layer][i], negativeColor, positiveColor)
            const label = layer === 0 ? inputLabels[i] : layer === lastLayer ? outputLabel : ""
            const x = xOf(layer) - node / 2
            const y = yOf(layer, i) - node / 2
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: neurons are positional, not identified by value.
              <g key={`n${layer}-${i}`}>
                <rect
                  x={x}
                  y={y}
                  width={node}
                  height={node}
                  rx={2}
                  className="fill-elevated stroke-line"
                  strokeWidth={1}
                />
                {thumbnail && (
                  <image
                    href={thumbnail}
                    x={x + 0.5}
                    y={y + 0.5}
                    width={node - 1}
                    height={node - 1}
                    preserveAspectRatio="none"
                    style={{ imageRendering: "pixelated" }}
                  />
                )}
                {label && (
                  <text
                    x={xOf(layer)}
                    y={y + node + 18}
                    textAnchor="middle"
                    className="fill-fg-secondary font-display text-[15px]"
                  >
                    {t(label)}
                  </text>
                )}
                {showWeights && layer > 0 && (
                  <text
                    x={xOf(layer)}
                    y={y + node + (label ? 32 : 13)}
                    textAnchor="middle"
                    className="fill-fg-secondary font-ui text-[10px]"
                  >
                    b = {network.biases[layer - 1][i].toFixed(2)}
                  </text>
                )}
              </g>
            )
          }),
        )}
      </svg>
    </div>
  )
}

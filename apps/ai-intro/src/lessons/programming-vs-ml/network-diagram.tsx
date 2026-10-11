import type { Translate } from "@/i18n/translate"
import { useTranslation } from "@/i18n/use-translation"
import type { Network } from "@/lib/neural-net"
import { type Domain, gridToDataUrl, resolveThemeColor, sampleLayers } from "./activation-grid"

const WIDTH = 760
const HEIGHT = 400
const NODE = 52
const MARGIN_X = 90
const TOP = 34
const RESOLUTION = 10

/** Weight magnitude → line thickness/opacity; sign → brand (excitatory) or cool (inhibitory). */
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
 * A read-only diagram of a feedforward network. Every node shows a small live thumbnail of what
 * it computes across the input plane — recomputed from `network` each render, so it visibly
 * changes as training progresses. Plain SVG: it re-renders every epoch without re-measuring.
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
  const positiveColor = resolveThemeColor("--ae-accent", "#df753e")
  const negativeColor = resolveThemeColor("--ae-chart-cool", "#5b8def")
  const grids = sampleLayers(network, toInput, domain, RESOLUTION)

  const sizes = network.layerSizes
  const lastLayer = sizes.length - 1
  const xOf = (layer: number) => MARGIN_X + (layer * (WIDTH - 2 * MARGIN_X)) / lastLayer
  const yOf = (layer: number, index: number) => {
    const spacing = Math.min(86, (HEIGHT - TOP - 40) / sizes[layer])
    return TOP + (HEIGHT - TOP) / 2 + (index - (sizes[layer] - 1) / 2) * spacing
  }

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-auto w-full rounded-[3px] border border-divider"
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
              x1={xOf(l) + NODE / 2}
              y1={yOf(l, i)}
              x2={xOf(l + 1) - NODE / 2}
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
              const x1 = xOf(l) + NODE / 2
              const x2 = xOf(l + 1) - NODE / 2
              return (
                <text
                  // biome-ignore lint/suspicious/noArrayIndexKey: edges are positional, not identified by value.
                  key={`w${l}-${i}-${n}`}
                  x={x1 + t * (x2 - x1)}
                  y={yOf(l, i) + t * (yOf(l + 1, n) - yOf(l, i))}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-fg font-ui text-[10px]"
                  stroke="var(--color-canvas)"
                  strokeWidth={3}
                  paintOrder="stroke"
                >
                  {weight.toFixed(2)}
                </text>
              )
            }),
          ),
        )}

      {sizes.map((count, layer) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: layers are positional, not identified by value.
        <g key={`layer-${layer}`}>
          <text
            x={xOf(layer)}
            y={18}
            textAnchor="middle"
            className="fill-fg-muted font-ui text-[11px] tracking-wider"
          >
            {layerTitle(layer, count, lastLayer, t)}
          </text>
          {Array.from({ length: count }, (_, i) => {
            const thumbnail = gridToDataUrl(grids[layer][i], negativeColor, positiveColor)
            const label = layer === 0 ? inputLabels[i] : layer === lastLayer ? outputLabel : ""
            const x = xOf(layer) - NODE / 2
            const y = yOf(layer, i) - NODE / 2
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: neurons are positional, not identified by value.
              <g key={`n${layer}-${i}`}>
                <rect
                  x={x - 1.5}
                  y={y - 1.5}
                  width={NODE + 3}
                  height={NODE + 3}
                  rx={3}
                  className="fill-surface stroke-divider"
                  strokeWidth={2}
                />
                {thumbnail && (
                  <image
                    href={thumbnail}
                    x={x}
                    y={y}
                    width={NODE}
                    height={NODE}
                    style={{ imageRendering: "pixelated" }}
                  />
                )}
                {label && (
                  <text
                    x={xOf(layer)}
                    y={y + NODE + 16}
                    textAnchor="middle"
                    className="fill-fg-muted font-ui text-[11px]"
                  >
                    {t(label)}
                  </text>
                )}
                {showWeights && layer > 0 && (
                  <text
                    x={xOf(layer)}
                    y={y + NODE + (label ? 30 : 16)}
                    textAnchor="middle"
                    className="fill-fg-secondary font-ui text-[10px]"
                  >
                    b = {network.biases[layer - 1][i].toFixed(2)}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      ))}
    </svg>
  )
}

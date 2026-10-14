import { useMemo } from "react"
import { useTranslation } from "@/i18n/use-translation"
import type { Network } from "@/lib/neural-net"
import { gridToDataUrl, resolveThemeColor, sampleLayers } from "./back-propagation-grid"
import { HIDDEN, type stepByStep } from "./back-propagation-step-by-step-math"

type Pass = ReturnType<typeof stepByStep>

export const fmt = (v: number, digits = 3) => (v < 0 ? "−" : "") + Math.abs(v).toFixed(digits)

// Same geometry and palette as the Training Lab's diagram, which this mirrors for a 2-4-1 net.
const WIDTH = 760
const HEIGHT = 460
const NODE = 58
const LABEL_SPACE = 26
const MARGIN_X = 70
const RESOLUTION = 10
const SIZES = [2, HIDDEN, 1]
const DOMAIN = { xMin: 0, xMax: 1, yMin: 0, yMax: 1 }

/** The pass's 2 → 4 → 1 sigmoid network; its parameters are the updated ones at step 5. */
export function stepNetwork(pass: Pass, step: number): Network {
  return {
    layerSizes: SIZES,
    weights: step === 4 ? [pass.newW, [pass.newV]] : [pass.w, [pass.v]],
    biases: step === 4 ? [pass.newB1, [pass.newB2]] : [pass.b1, [pass.b2]],
    hiddenActivation: "sigmoid",
  }
}

/** Weight magnitude → line thickness/opacity; sign → warm or muted, as in the Training Lab. */
function edgeStyle(weight: number, positiveColor: string, negativeColor: string) {
  const magnitude = Math.min(Math.abs(weight), 3)
  return {
    stroke: weight >= 0 ? positiveColor : negativeColor,
    strokeWidth: 0.75 + magnitude * 1.5,
    strokeOpacity: 0.25 + (magnitude / 3) * 0.6,
  }
}

/** What each node and edge prints at a step (0 = forward weights … 4 = update). */
function labels(p: Pass, step: number) {
  const edge = (layer: number, j: number, k: number) => {
    const w = layer === 0 ? p.w[j][k] : p.v[k]
    const g = layer === 0 ? p.gradW[j][k] : p.gradV[k]
    const n = layer === 0 ? p.newW[j][k] : p.newV[k]
    return fmt(step === 3 ? g : step === 4 ? n : w, step === 3 ? 3 : 2)
  }
  const hidden = (j: number) =>
    step === 0 ? `z=${fmt(p.z1[j])}` : step === 3 ? `δ=${fmt(p.delta1[j])}` : `a=${fmt(p.a1[j])}`
  const output =
    step === 0
      ? `z=${fmt(p.z2)}`
      : step === 1
        ? `ŷ=${fmt(p.yHat)}`
        : step === 3
          ? `δ=${fmt(p.delta2)}`
          : `L=${fmt(step === 4 ? p.newLoss : p.loss)}`
  return { edge, hidden, output }
}

/** The Training Lab's tile-and-edge network, for one hidden layer, with the active step's numbers. */
export function StepNetwork({ pass, step }: { pass: Pass; step: number }) {
  const { t } = useTranslation()
  // Steps 1–4 draw the same parameters, so the heatmaps are rebuilt only at the update.
  const updated = step === 4
  const network = useMemo(() => stepNetwork(pass, updated ? 4 : 0), [pass, updated])
  const positiveColor = resolveThemeColor("--ae-chart-warm", "#d9742e")
  const negativeColor = resolveThemeColor("--ae-text-muted", "#8a7b70")
  const thumbnails = useMemo(
    () =>
      sampleLayers(network, (x, y) => [x, y], DOMAIN, RESOLUTION).map((layer) =>
        layer.map((grid) => gridToDataUrl(grid, negativeColor, positiveColor)),
      ),
    [network, negativeColor, positiveColor],
  )
  const text = labels(pass, step)

  const lastLayer = SIZES.length - 1
  const span = HEIGHT - LABEL_SPACE
  const spacingOf = (layer: number) => Math.min(150, span / SIZES[layer])
  const node = Math.min(NODE, span / Math.max(...SIZES) - 8)
  const xOf = (layer: number) => MARGIN_X + (layer * (WIDTH - 2 * MARGIN_X)) / lastLayer
  const yOf = (layer: number, index: number) =>
    span / 2 + (index - (SIZES[layer] - 1) / 2) * spacingOf(layer)

  const titles = [t("INPUT"), t("HIDDEN {0} ({1})", [1, SIZES[1]]), t("OUTPUT")]
  const names = ["x₁", "x₂"]
  const values = (layer: number, i: number) =>
    layer === 0 ? String(pass.x[i]) : layer === 1 ? text.hidden(i) : text.output
  // The observation being processed, as a dot on each tile's heatmap of the input plane.
  const [px, py] = pass.x
  const dotX = (x0: number) => x0 + 0.5 + (((px - DOMAIN.xMin) * 9 + 0.5) / 10) * (node - 1)
  const dotY = (y0: number) => y0 + 0.5 + (((DOMAIN.yMax - py) * 9 + 0.5) / 10) * (node - 1)

  return (
    <div className="flex flex-col gap-2.5">
      <div aria-hidden className="relative h-3">
        {titles.map((title, layer) => (
          <span
            key={title}
            className="label-ui absolute top-0 -translate-x-1/2 whitespace-nowrap text-fg-secondary"
            style={{ left: `${(xOf(layer) / WIDTH) * 100}%` }}
          >
            {title}
          </span>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label={t(
          "Live diagram of the {0} network: each node is a small thumbnail of what it computes across the input plane",
          [SIZES.join("-")],
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

        {network.weights.map((layerWeights, l) =>
          layerWeights.map((neuronWeights, n) =>
            neuronWeights.map((_, i) => {
              const ratio = SIZES[l] < SIZES[l + 1] ? 0.72 : 0.28
              const x1 = xOf(l) + node / 2
              const x2 = xOf(l + 1) - node / 2
              return (
                <text
                  // biome-ignore lint/suspicious/noArrayIndexKey: edges are positional, not identified by value.
                  key={`w${l}-${i}-${n}`}
                  x={x1 + ratio * (x2 - x1)}
                  y={yOf(l, i) + ratio * (yOf(l + 1, n) - yOf(l, i))}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-fg font-ui text-[10px]"
                  stroke="var(--color-surface)"
                  strokeWidth={3}
                  paintOrder="stroke"
                >
                  {l === 0 ? text.edge(0, n, i) : text.edge(1, 0, i)}
                </text>
              )
            }),
          ),
        )}

        {SIZES.map((count, layer) =>
          Array.from({ length: count }, (_, i) => {
            const thumbnail = thumbnails[layer][i]
            const name = layer === 0 ? names[i] : layer === lastLayer ? "ŷ" : ""
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
                <circle
                  cx={dotX(x)}
                  cy={dotY(y)}
                  r={3}
                  className="fill-brand stroke-canvas"
                  strokeWidth={1}
                />
                {name && (
                  <text
                    x={xOf(layer)}
                    y={y + node + 18}
                    textAnchor="middle"
                    className="fill-fg-secondary font-display text-[15px]"
                  >
                    {name}
                  </text>
                )}
                <text
                  x={xOf(layer)}
                  y={y + node + (name ? 32 : 14)}
                  textAnchor="middle"
                  className="fill-fg-secondary font-ui text-[11px]"
                >
                  {values(layer, i)}
                </text>
                {layer > 0 && (
                  <text
                    x={xOf(layer)}
                    y={y + node + (name ? 45 : 27)}
                    textAnchor="middle"
                    className="fill-fg-muted font-ui text-[10px]"
                  >
                    b={fmt(network.biases[layer - 1][i], 2)}
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

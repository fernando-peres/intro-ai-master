import { useTranslation } from "@/i18n/use-translation"
import { forward, type Network } from "@/lib/neural-net"

const fmt = (v: number) => (v < 0 ? `−${Math.abs(v).toFixed(2)}` : v.toFixed(2))
const term = (w: number, a: number) => `(${fmt(w)})(${fmt(a)})`
const plus = (v: number) => (v < 0 ? ` − ${Math.abs(v).toFixed(2)}` : ` + ${v.toFixed(2)}`)
const SUPERSCRIPT = "¹²³⁴⁵⁶⁷⁸⁹"

/** Layer names in the equations: x for the input, h¹, h², … for hidden layers, ŷ for the output. */
function symbol(layer: number, lastLayer: number) {
  if (layer === 0) return "x"
  if (layer === lastLayer) return "ŷ"
  return `h${SUPERSCRIPT[layer - 1]}`
}

/**
 * The network's math, live: one equation per layer, a worked forward pass for one machine
 * (first neuron of each layer, using the current weights), and the loss + update rule.
 */
export function NetworkMath({
  network,
  input,
  exampleLabel,
  learningRate,
}: {
  network: Network
  /** The example machine, already scaled the way the network sees it. */
  input: number[]
  exampleLabel: string
  learningRate: number
}) {
  const { t } = useTranslation()
  const sizes = network.layerSizes
  const lastLayer = sizes.length - 1
  const activations = forward(network, input)
  const hiddenFn = network.hiddenActivation
  const fnOf = (layer: number) => (layer === lastLayer ? "σ" : hiddenFn)
  const paramCount = network.weights.reduce(
    (sum, layer, l) => sum + layer.length * layer[0].length + network.biases[l].length,
    0,
  )

  return (
    <div className="flex flex-col gap-4 font-ui text-xs text-fg-secondary">
      <div className="flex flex-col gap-1.5">
        <p className="label-ui text-fg-muted">{t("Every neuron computes")}</p>
        <p className="text-sm text-fg">z = w₁·a₁ + w₂·a₂ + … + b, then a = f(z)</p>
        <p>
          {t(
            "A weighted sum of the previous layer's outputs plus a bias, squashed by an activation f ( ",
          )}
          {hiddenFn}{" "}
          {t(
            ' in hidden layers, σ = sigmoid at the output, so ŷ is a 0–1 probability of "at risk"). This network has ',
          )}
          {paramCount} {t(" weights and biases to learn. ")}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="label-ui text-fg-muted">{t("Layer by layer")}</p>
        {sizes.slice(1).map((count, i) => {
          const layer = i + 1
          return (
            <p key={layer} className="text-sm text-fg">
              {symbol(layer, lastLayer)} = {fnOf(layer)}(W{SUPERSCRIPT[layer - 1]}·
              {symbol(layer - 1, lastLayer)} + b{SUPERSCRIPT[layer - 1]})
              <span className="ml-3 text-xs text-fg-muted">
                {t(" W is ")}
                {count}×{sizes[layer - 1]}
              </span>
            </p>
          )
        })}
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="label-ui text-fg-muted">
          {t("Worked example — ")}
          {exampleLabel}
        </p>
        <p>
          x = ({input.map(fmt).join(", ")}){" "}
          <span className="text-fg-muted">{t("(scaled inputs)")}</span>
        </p>
        {network.weights.map((layerWeights, l) => {
          const layer = l + 1
          const w = layerWeights[0]
          const b = network.biases[l][0]
          const prev = activations[l]
          const z = w.reduce((sum, wi, k) => sum + wi * prev[k], b)
          const name = layer === lastLayer ? t("output") : t("hidden {0}, neuron 1", [layer])
          return (
            <p key={layer} className="break-words">
              <span className="text-fg-muted">{name}: </span>z ={" "}
              {w.map((wi, k) => term(wi, prev[k])).join(" + ")}
              {plus(b)} = {fmt(z)} → {fnOf(layer)}({fmt(z)}) ={" "}
              <span className="text-fg">{fmt(activations[layer][0])}</span>
            </p>
          )
        })}
        <p className="text-fg">
          ŷ = {Math.round(activations[lastLayer][0] * 100)}
          {t("% at risk →")} {activations[lastLayer][0] >= 0.5 ? t("B — At Risk") : t("A — Normal")}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="label-ui text-fg-muted">{t("How training changes the weights")}</p>
        <p className="text-sm text-fg">L = −[y·log ŷ + (1 − y)·log(1 − ŷ)]</p>
        <p className="text-sm text-fg">
          w ← w − η·∂L/∂w <span className="ml-3 text-xs text-fg-muted">η = {learningRate}</span>
        </p>
        <p>
          {t(
            "The loss L is small when ŷ is confidently right (y is the true label: 1 at risk, 0 normal). Backpropagation applies the chain rule from the output back to every weight to get ∂L/∂w — how much the loss would change if that weight moved — and each step nudges every weight a little in the direction that lowers the loss. ",
          )}
        </p>
      </div>
    </div>
  )
}

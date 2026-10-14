import { useState } from "react"
import { useTranslation } from "@/i18n/use-translation"
import { forward, type Network } from "@/lib/neural-net"
import { fmt, SUPERSCRIPT, symbol } from "./math-format"
import { TEMP_CENTER, TEMP_SCALE, VIB_CENTER, VIB_SCALE } from "./ml-training"

const SUBSCRIPT = "₁₂₃₄₅₆₇₈₉"
const sub = (n: number) =>
  `${n + 1}`
    .split("")
    .map((d) => SUBSCRIPT[+d - 1] ?? "₀")
    .join("")
const name = (layer: number, last: number, n: number, size: number) =>
  layer === last && size === 1 ? "ŷ" : `${symbol(layer, last)}${sub(n)}`

/** `w·a + w·a … + b` for one neuron, with signs folded into the operators. */
function sum(weights: number[], bias: number, inputs: string[]) {
  const parts = weights.map((w, i) => `${fmt(Math.abs(w))}·${inputs[i]}`)
  const signs = weights.map((w) => (w < 0 ? "−" : "+"))
  const body = parts.map((p, i) =>
    i === 0 ? (signs[i] === "−" ? `−${p}` : p) : ` ${signs[i]} ${p}`,
  )
  return `${body.join("")} ${bias < 0 ? "−" : "+"} ${fmt(Math.abs(bias))}`
}

/** The trained network written out as one function of the raw readings, with its current numbers. */
export function NetworkFunction({
  network,
  inputLabels,
  input,
  exampleLabel,
}: {
  network: Network
  inputLabels: [string, string]
  /** The example reading, already scaled the way the network sees it. */
  input: number[]
  exampleLabel: string
}) {
  const { t } = useTranslation()
  const sizes = network.layerSizes
  const last = sizes.length - 1
  const fnOf = (layer: number) => (layer === last ? "σ" : network.hiddenActivation)
  const result = forward(network, input)[last][0]
  const [tab, setTab] = useState<"calculations" | "entire">("calculations")

  /** The output with every hidden neuron substituted in, down to the raw readings. */
  const expand = (layer: number, n: number): string => {
    const inputs =
      layer === 1
        ? [
            `((${inputLabels[0]} − ${TEMP_CENTER}) / ${TEMP_SCALE})`,
            `((${inputLabels[1]} − ${VIB_CENTER}) / ${VIB_SCALE})`,
          ]
        : network.weights[layer - 2].map((_, k) => expand(layer - 1, k))
    return `${fnOf(layer)}(${sum(network.weights[layer - 1][n], network.biases[layer - 1][n], inputs)})`
  }

  const tabs = [
    ["calculations", t("Calculations")],
    ["entire", t("Entire function")],
  ] as const

  return (
    <div className="flex flex-col gap-4 font-ui text-xs text-fg-secondary">
      <p className="text-sm text-fg">
        ŷ = f({inputLabels[0]}, {inputLabels[1]})
      </p>
      <p>
        {t(
          "This is everything the network learned: a chain of weighted sums and squashing functions. Training only changed the numbers.",
        )}
      </p>

      <div role="tablist" className="flex gap-1 border-b border-divider">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`label-ui -mb-px border-b-2 px-3 py-1.5 focus-visible:outline-2 focus-visible:outline-brand ${
              tab === id
                ? "border-brand text-fg"
                : "border-transparent text-fg-muted hover:text-fg-secondary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "entire" ? (
        <div role="tabpanel" className="flex flex-col gap-3">
          <p className="break-words text-sm leading-relaxed text-fg">ŷ = {expand(last, 0)}</p>
          <p>
            {exampleLabel}: ŷ = {fmt(result)} → {result >= 0.5 ? t("B — At Risk") : t("A — Normal")}
          </p>
        </div>
      ) : (
        <div role="tabpanel" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <p className="label-ui text-fg-muted">{t("Scale the readings")}</p>
            <p className="text-fg-muted">x = (reading − center) / scale</p>
            <p className="text-sm text-fg">
              x₁ = ({inputLabels[0]} − {TEMP_CENTER}) / {TEMP_SCALE}
            </p>
            <p className="text-sm text-fg">
              x₂ = ({inputLabels[1]} − {VIB_CENTER}) / {VIB_SCALE}
            </p>
          </div>

          {network.weights.map((layerWeights, l) => {
            const layer = l + 1
            const inputs = Array.from({ length: sizes[l] }, (_, n) => name(l, last, n, sizes[l]))
            const sup = SUPERSCRIPT[l]
            return (
              <div key={layer} className="flex flex-col gap-1.5">
                <p className="label-ui text-fg-muted">
                  {layer === last ? t("Output") : t("Hidden layer {0}", [layer])}
                </p>
                <p className="text-fg-muted">
                  {symbol(layer, last)} = {fnOf(layer)}(W{sup}·{symbol(l, last)} + b{sup}){"  "}
                  <span>
                    {t(" W is ")}
                    {sizes[layer]}×{sizes[l]}
                  </span>
                </p>
                {layerWeights.map((w, n) => {
                  const label = name(layer, last, n, sizes[layer])
                  return (
                    <p key={label} className="break-words text-sm text-fg">
                      {label} = {fnOf(layer)}({sum(w, network.biases[l][n], inputs)})
                    </p>
                  )
                })}
              </div>
            )
          })}

          <div className="flex flex-col gap-1.5">
            <p className="label-ui text-fg-muted">{t("Decide")}</p>
            <p className="text-sm text-fg">
              ŷ ≥ 0.5 → {t("B — At Risk")}, {t("otherwise")} {t("A — Normal")}
            </p>
            <p>
              {exampleLabel}: ŷ = {fmt(result)} →{" "}
              {result >= 0.5 ? t("B — At Risk") : t("A — Normal")}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

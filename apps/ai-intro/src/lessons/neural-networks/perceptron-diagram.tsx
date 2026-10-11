import { useTranslation } from "@/i18n/use-translation"
import type { Params, PerceptronActivation } from "@/lib/perceptron"
import { signed } from "./perceptron-format"

const WIDTH = 520
const HEIGHT = 300
const R = 24
const INPUT_X = 70
const SUM_X = 270
const ACT_X = 370
const OUT_X = 460
const MID_Y = 160

/** Width encodes |w|, dash encodes sign — deliberately not the class colors. */
function edgeStyle(weight: number) {
  return {
    strokeWidth: 1 + Math.min(Math.abs(weight), 4) * 1.5,
    strokeDasharray: weight < 0 ? "7 5" : undefined,
  }
}

/** x₁, x₂ and the constant 1 feed one neuron: weighted sum, then activation, then output. */
export function PerceptronDiagram({
  params,
  activation,
  showWeights,
}: {
  params: Params
  activation: PerceptronActivation
  showWeights: boolean
}) {
  const { t } = useTranslation()
  const inputs = [
    { key: "x1", label: "x₁", y: 70, weight: params.w1, name: "w₁" },
    { key: "x2", label: "x₂", y: MID_Y, weight: params.w2, name: "w₂" },
    { key: "bias", label: "1", y: 250, weight: params.b, name: "b" },
  ]

  return (
    <figure className="flex flex-col gap-3">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full rounded-[3px] border border-divider"
        role="img"
        aria-label={t(
          "Network: 2 inputs → 1 neuron. w₁ = {0}, w₂ = {1}, b = {2}; weighted sum, then {3} activation.",
          [
            signed(params.w1),
            signed(params.w2),
            signed(params.b),
            activation === "step" ? t("step") : t("sigmoid"),
          ],
        )}
      >
        <text
          x={WIDTH / 2}
          y={24}
          textAnchor="middle"
          className="fill-fg-muted font-ui text-[12px]"
        >
          {t("2 inputs → 1 neuron")}
        </text>
        <rect
          x={SUM_X - R - 14}
          y={MID_Y - R - 22}
          width={ACT_X - SUM_X + 2 * R + 28}
          height={2 * R + 44}
          rx={6}
          fill="none"
          className="stroke-divider"
          strokeDasharray="4 4"
        />
        <text
          x={(SUM_X + ACT_X) / 2}
          y={MID_Y + R + 36}
          textAnchor="middle"
          className="fill-fg-muted font-ui text-[11px]"
        >
          {t("one neuron")}
        </text>

        {inputs.map((input) => (
          <g key={input.key}>
            <line
              x1={INPUT_X + R}
              y1={input.y}
              x2={SUM_X - R}
              y2={MID_Y}
              className="stroke-fg-secondary"
              strokeOpacity={0.8}
              {...edgeStyle(input.weight)}
            />
            {showWeights && (
              <text
                x={(INPUT_X + SUM_X) / 2}
                y={(input.y + MID_Y) / 2 - 8}
                textAnchor="middle"
                className="fill-fg font-ui text-[12px]"
                stroke="var(--color-canvas)"
                strokeWidth={3}
                paintOrder="stroke"
              >
                {input.name} = {signed(input.weight)}
              </text>
            )}
            <circle cx={INPUT_X} cy={input.y} r={R} className="fill-surface stroke-line" />
            <text
              x={INPUT_X}
              y={input.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-fg font-ui text-[15px]"
            >
              {input.label}
            </text>
          </g>
        ))}
        <text
          x={INPUT_X}
          y={250 + R + 16}
          textAnchor="middle"
          className="fill-fg-muted font-ui text-[11px]"
        >
          {t("bias input")}
        </text>

        <line x1={SUM_X + R} y1={MID_Y} x2={ACT_X - R} y2={MID_Y} className="stroke-fg-secondary" />
        <line x1={ACT_X + R} y1={MID_Y} x2={OUT_X - R} y2={MID_Y} className="stroke-fg-secondary" />
        {[
          { x: SUM_X, label: "Σ", caption: "z" },
          {
            x: ACT_X,
            label: activation === "step" ? "⌐" : "σ",
            caption: activation === "step" ? t("step") : t("sigmoid"),
          },
          { x: OUT_X, label: activation === "step" ? "ŷ" : "p", caption: t("output") },
        ].map((node) => (
          <g key={node.x}>
            <circle
              cx={node.x}
              cy={MID_Y}
              r={R}
              className="fill-elevated stroke-brand"
              strokeWidth={1.5}
            />
            <text
              x={node.x}
              y={MID_Y}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-fg font-ui text-[17px]"
            >
              {node.label}
            </text>
            <text
              x={node.x}
              y={MID_Y - R - 8}
              textAnchor="middle"
              className="fill-fg-muted font-ui text-[11px]"
            >
              {node.caption}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 font-ui text-xs text-fg-secondary">
        <span className="flex items-center gap-2">
          <svg viewBox="0 0 28 8" className="h-2 w-7" aria-hidden>
            <line x1={0} y1={4} x2={28} y2={4} className="stroke-fg-secondary" strokeWidth={2} />
          </svg>
          {t("positive weight")}
        </span>
        <span className="flex items-center gap-2">
          <svg viewBox="0 0 28 8" className="h-2 w-7" aria-hidden>
            <line
              x1={0}
              y1={4}
              x2={28}
              y2={4}
              className="stroke-fg-secondary"
              strokeWidth={2}
              strokeDasharray="7 5"
            />
          </svg>
          {t("negative weight")}
        </span>
        <span>{t("thicker line = larger magnitude")}</span>
      </figcaption>
    </figure>
  )
}

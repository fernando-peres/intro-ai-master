import { InfoIcon } from "lucide-react"
import { createContext, Fragment, type ReactNode, useContext, useId, useState } from "react"
import { useTranslation } from "@/i18n/use-translation"
import { cn } from "@/lib/utils"
import { type stepByStep, sub } from "./back-propagation-step-by-step-math"
import { fmt } from "./back-propagation-step-network"
import { sigmoid } from "./back-propagation-theory-math"

type Pass = ReturnType<typeof stepByStep>
/** Plain text, or `{ v }`: a result or a value carried in from an earlier step, drawn as a chip. */
type Seg = string | { v: string }
type Line = Seg[]

export type StepContent = {
  analogy: string
  formula: string[]
  math: Line[]
  /** Names of the values handed to the next step. */
  carries: string
  /** Activation function used by this step, named in its block header. */
  name?: string
  /** What each symbol in the formulas means, shown from the block's info button. */
  vars: { symbol: string; meaning: string }[]
  /** `input → [σ] → output` rows, drawn above the worked lines. */
  flows?: { input: number; output: number }[]
}

/** True inside the zoom dialog: the same math in bigger type. */
const LargeContext = createContext(false)

/** A weight or input at most 3 decimals wide: 0.5, 0.521. */
const n = (v: number) => String(Math.round(v * 1000) / 1000)
const c = (v: number) => ({ v: fmt(v) })

/** Chips for a list of numbers, comma separated: `0.1, 0.2`. */
const chips = (values: number[]): Seg[] =>
  values.flatMap((v, i) => (i === 0 ? [c(v)] : [", ", c(v)]))

/** The five steps' copy and worked lines; each step re-uses the chips the one before produced. */
export function buildSteps(p: Pass, t: (s: string) => string): StepContent[] {
  const [x1, x2] = p.x
  const g = (a: number) => a * (1 - a)
  const hidden = p.a1.map((_, j) => j)
  return [
    {
      analogy: t(
        "You feed raw ingredients into the machine and press “Start.” The gears turn based on how the dials are currently set. Each hidden neuron mixes the inputs with its own weights.",
      ),
      formula: ["zⱼ = wⱼ₁·x₁ + wⱼ₂·x₂ + bⱼ"],
      math: hidden.map((j) => [
        `z${sub(j + 1)} = ${n(p.w[j][0])}·${n(x1)} + ${n(p.w[j][1])}·${n(x2)} + ${n(p.b1[j])} = `,
        c(p.z1[j]),
      ]),
      carries: hidden.map((j) => `z${sub(j + 1)}`).join(", "),
      vars: [
        {
          symbol: "zⱼ",
          meaning: t("The weighted sum feeding hidden neuron j, before the activation"),
        },
        { symbol: "wⱼₖ", meaning: t("The weight from input k to hidden neuron j") },
        { symbol: "xₖ", meaning: t("Input k of the current row") },
        { symbol: "bⱼ", meaning: t("The bias of hidden neuron j: a constant added to its sum") },
      ],
    },
    {
      analogy: t(
        "Each gear squashes its raw signal into a smooth 0-to-1 range, so no single dial can shout. The output neuron does the same, and out pops the machine's first guess.",
      ),
      name: t("Sigmoid"),
      flows: [
        ...hidden.map((j) => ({ input: p.z1[j], output: p.a1[j] })),
        { input: p.z2, output: p.yHat },
      ],
      formula: ["σ(z) = 1 / (1 + e^−z)", "ŷ = σ(Σ vⱼ·aⱼ + b)"],
      math: [
        ...hidden.map((j): Line => [`a${sub(j + 1)} = σ(`, c(p.z1[j]), ") = ", c(p.a1[j])]),
        [
          "z = ",
          ...hidden.flatMap((j): Seg[] => [j === 0 ? "" : " + ", `${n(p.v[j])}·`, c(p.a1[j])]),
          ` + ${n(p.b2)} = `,
          c(p.z2),
        ],
        ["ŷ = σ(", c(p.z2), ") = ", c(p.yHat)],
      ],
      carries: "ŷ",
      vars: [
        {
          symbol: "σ(z)",
          meaning: t("The sigmoid activation: squashes any z into a value between 0 and 1"),
        },
        { symbol: "z", meaning: t("The number entering the activation") },
        { symbol: "aⱼ", meaning: t("The activation (output) of hidden neuron j") },
        { symbol: "vⱼ", meaning: t("The weight from hidden neuron j to the output neuron") },
        { symbol: "b", meaning: t("The bias of the output neuron") },
        { symbol: "ŷ", meaning: t("The prediction: the probability that the class is 1") },
      ],
    },
    {
      analogy: t(
        "A master chef tastes the cake, compares it to the perfect recipe, and issues a strict penalty score. The further the guess is from the label, the bigger the penalty.",
      ),
      formula: ["L = −[y·ln ŷ + (1 − y)·ln(1 − ŷ)]"],
      math: [["L = −ln(", c(p.yHat), `) = `, c(p.loss), `   (y = ${p.y})`]],
      carries: "ŷ − y",
      vars: [
        {
          symbol: "L",
          meaning: t("The loss: the penalty for this row, 0 when the prediction is perfect"),
        },
        { symbol: "y", meaning: t("The true label of the row: 0 or 1") },
        { symbol: "ŷ", meaning: t("The prediction: the probability that the class is 1") },
        { symbol: "ln", meaning: t("The natural logarithm") },
      ],
    },
    {
      analogy: t(
        "The chef's score travels backward down the assembly line. Each dial learns how much it contributed to the mistake: that is its gradient, the blame it carries.",
      ),
      formula: [
        "δ_out = ŷ − y",
        "∂L/∂vⱼ = δ_out·aⱼ",
        "δⱼ = δ_out·vⱼ·aⱼ(1 − aⱼ)",
        "∂L/∂wⱼₖ = δⱼ·xₖ",
        "∂L/∂bⱼ = δⱼ",
      ],
      math: [
        ["δ_out = ", c(p.yHat), ` − ${p.y} = `, c(p.delta2)],
        ["∂L/∂v = (", ...chips(p.gradV), ")"],
        ...hidden.map(
          (j): Line => [
            `δ${sub(j + 1)} = `,
            c(p.delta2),
            `·${n(p.v[j])}·${fmt(g(p.a1[j]))} = `,
            c(p.delta1[j]),
          ],
        ),
        ...hidden.map((j): Line => [`∂L/∂w${sub(j + 1)} = (`, ...chips(p.gradW[j]), ")"]),
        ["∂L/∂b = (", ...chips(p.gradB1), "), ∂L/∂b_out = ", c(p.gradB2)],
      ],
      carries: "∂L/∂w, ∂L/∂v, ∂L/∂b",
      vars: [
        { symbol: "δ_out", meaning: t("The error signal at the output: ŷ − y") },
        {
          symbol: "δⱼ",
          meaning: t("The error signal of hidden neuron j: the blame passed back to it"),
        },
        { symbol: "∂L/∂vⱼ", meaning: t("How much the loss changes if vⱼ moves a little") },
        { symbol: "∂L/∂wⱼₖ", meaning: t("How much the loss changes if wⱼₖ moves a little") },
        { symbol: "∂L/∂bⱼ", meaning: t("How much the loss changes if bⱼ moves a little") },
        { symbol: "aⱼ(1 − aⱼ)", meaning: t("The slope of the sigmoid at neuron j") },
      ],
    },
    {
      analogy: t(
        "Turn each dial a small step against its blame, scaled by the learning rate η. The next guess should land closer to the perfect recipe.",
      ),
      formula: ["w ← w − η·∂L/∂w", "b ← b − η·∂L/∂b"],
      math: [
        [`η = ${p.learningRate}`],
        ...hidden.map((j): Line => [`w${sub(j + 1)} = (`, ...chips(p.newW[j]), ")"]),
        ["v = (", ...chips(p.newV), ")"],
        ["b = (", ...chips(p.newB1), "), b_out = ", c(p.newB2)],
        [`${t("new loss")}: `, c(p.newLoss), ` (${t("was")} `, c(p.loss), ")"],
      ],
      carries: "",
      vars: [
        { symbol: "w, b", meaning: t("The weights and biases being adjusted") },
        { symbol: "∂L/∂w, ∂L/∂b", meaning: t("Their gradients from the Backward step") },
        { symbol: "η", meaning: t("The learning rate: the size of each step") },
        { symbol: "←", meaning: t("Replace the old value with the new one") },
      ],
    },
  ]
}

function MathLine({ line }: { line: Line }) {
  const large = useContext(LargeContext)
  return (
    <p>
      {line.map((seg, i) =>
        typeof seg === "string" ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: segments are fixed and ordered
          <Fragment key={i}>{seg}</Fragment>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: segments are fixed and ordered
          <span key={i} className={cn("rounded-sm bg-brand/15 px-1 text-brand", large && "px-1.5")}>
            {seg.v}
          </span>
        ),
      )}
    </p>
  )
}

/** One step's formulas and worked lines; earlier steps are dimmed. */
export function MathBlock({
  number,
  title,
  step,
  active,
}: {
  number: number
  title: string
  step: StepContent
  active: boolean
}) {
  const { t } = useTranslation()
  const large = useContext(LargeContext)
  const [open, setOpen] = useState(false)
  const panelId = useId()
  return (
    <section
      aria-label={title}
      className={cn(
        "flex flex-col gap-2 rounded-[2px] border bg-brand/5 px-3 py-2",
        active ? "border-brand" : "border-brand/30 opacity-70",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={cn("label-ui text-brand", large && "text-sm")}>
          {number}. {title}
          {step.name && ` — ${step.name}`}
        </p>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={t("What the variables mean")}
          title={t("What the variables mean")}
          onClick={() => setOpen(!open)}
          className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-brand hover:bg-brand/15 focus-visible:outline-2 focus-visible:outline-brand aria-expanded:bg-brand/15"
        >
          <InfoIcon className="size-4" aria-hidden />
        </button>
      </div>
      <div
        className={cn(
          "flex flex-col gap-0.5 rounded-[2px] border border-divider bg-canvas px-3 py-2 font-ui text-fg",
          large ? "gap-1 text-xl" : "text-xs",
        )}
      >
        {step.formula.map((f) => (
          <p key={f} className="text-fg-muted">
            {f}
          </p>
        ))}
      </div>
      {open && (
        <div
          id={panelId}
          className={cn("flex flex-col gap-1 text-fg-secondary", large ? "text-base" : "text-xs")}
        >
          <p className="label-ui text-fg-muted">{t("where:")}</p>
          <ul className="flex flex-col gap-0.5">
            {step.vars.map((v) => (
              <li key={v.symbol}>
                <span className="font-ui text-fg">{v.symbol}</span>: {v.meaning}
              </li>
            ))}
          </ul>
        </div>
      )}
      {step.flows?.map((f) => (
        <ActivationFlow key={f.input} {...f} />
      ))}
      <div
        className={cn(
          "flex flex-col gap-0.5 font-ui leading-relaxed text-fg",
          large ? "text-xl" : "text-xs",
        )}
      >
        {step.math.map((line) => (
          <MathLine key={line.map((s) => (typeof s === "string" ? s : s.v)).join("")} line={line} />
        ))}
      </div>
    </section>
  )
}

const chip = "rounded-sm bg-brand/15 px-1.5 py-0.5 font-ui text-brand"
const CURVE = Array.from({ length: 13 }, (_, i) => {
  const z = -6 + i
  return `${i === 0 ? "M" : "L"}${(i * 3).toFixed(1)},${(14 - 12 * sigmoid(z)).toFixed(1)}`
}).join(" ")

/** `input → [σ] → output`: the number entering the activation and the one leaving it. */
function ActivationFlow({ input, output }: { input: number; output: number }) {
  const size = useContext(LargeContext) ? "text-lg" : "text-xs"
  return (
    <div aria-hidden className={cn("flex items-center justify-center gap-2 py-1 text-brand", size)}>
      <span className={cn(chip, size)}>{fmt(input)}</span>
      <span>→</span>
      <span
        className={cn(
          "flex items-center gap-1.5 rounded-sm border border-brand px-2 py-0.5 font-ui",
          size,
        )}
      >
        σ
        <svg viewBox="0 0 36 16" className="h-4 w-9" fill="none" stroke="currentColor">
          <title>sigmoid</title>
          <path d={CURVE} />
        </svg>
      </span>
      <span>→</span>
      <span className={cn(chip, size)}>{fmt(output)}</span>
    </div>
  )
}

/** The line and arrow that hand a step's results to the next step as its inputs. */
export function Connector({ carries }: { carries: string }) {
  const large = useContext(LargeContext)
  return (
    <div aria-hidden className="flex flex-col items-center text-brand">
      <span className="h-4 border-l-2 border-brand" />
      <span className={cn("label-ui", large && "text-sm")}>{carries}</span>
      <span className="h-3 border-l-2 border-brand" />
      <span className="-mt-1 text-xs leading-none">▼</span>
    </div>
  )
}

/** The math blocks reached so far, joined by connectors; `large` sets them in bigger type. */
export function MathStack({
  steps,
  titles,
  step,
  large = false,
}: {
  steps: StepContent[]
  titles: string[]
  step: number
  large?: boolean
}): ReactNode {
  return (
    <LargeContext.Provider value={large}>
      {steps.slice(0, step + 1).map((s, i) => (
        <Fragment key={titles[i]}>
          {i > 0 && <Connector carries={steps[i - 1].carries} />}
          <MathBlock number={i + 1} title={titles[i]} step={s} active={i === step} />
        </Fragment>
      ))}
    </LargeContext.Provider>
  )
}

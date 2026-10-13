import { type ReactNode, useState } from "react"
import { Expandable } from "@/components/charts/expandable"
import { LineChart } from "@/components/charts/line-chart"
import {
  LessonArticle,
  LessonFooter,
  LessonHero,
  LessonLead,
  SectionTitle,
} from "@/components/course/lesson-layout"
import type { LessonEntry } from "@/curriculum"
import { useTranslation } from "@/i18n/use-translation"
import {
  CheatSheet,
  MetricSection,
  OptionList,
  Slider,
  StatRow,
  Takeaway,
} from "@/lessons/machine-learning/metric-section"
import { fmt, NeuronFlow, NutshellFlow, weightedSum } from "./activation-functions-chart"
import { SoftmaxBars } from "./back-propagation-theory-charts"
import { ACTIVATION_FUNCTIONS, type ActivationKey, softmax } from "./back-propagation-theory-math"

/** Bias range that sweeps the example neuron's z over −4…4. */
const BIAS = { min: -3.5, max: 4.5, start: 1.5 }
const ZS = Array.from({ length: 41 }, (_, i) => -4 + i * 0.2)
const EXAMPLE_ZS = [-2, 0, 2]
const STACK_X = Array.from({ length: 61 }, (_, i) => -3 + i * 0.1)

type FunctionCopy = {
  key: ActivationKey
  title: string
  name: string
  yRange: readonly [number, number]
  what: string
  why: string
  formulas: ReactNode
  use: string[]
  avoid: string[]
  takeaway: string
}

const OUTPUT: FunctionCopy[] = [
  {
    key: "linear",
    title: "Linear (no activation)",
    name: "f(z) = z",
    yRange: [-4, 4],
    what: "Passes z through unchanged. The output can be any real number.",
    why: "A regression answer — a price, a temperature — can be any number, so the last neuron must not squash it.",
    formulas: (
      <>
        <p>f(z) = z, f′(z) = 1</p>
        <p>W₂(W₁x + b₁) + b₂ = (W₂W₁)x + (W₂b₁ + b₂)</p>
      </>
    ),
    use: ["Output layer of regression, paired with mean squared error."],
    avoid: ["Hidden layers: stacked linear layers collapse into one single linear layer."],
    takeaway:
      "Linear means “no activation”: right for a number output, useless inside the network.",
  },
  {
    key: "sigmoid",
    title: "Sigmoid",
    name: "sigmoid(z)",
    yRange: [0, 1],
    what: "Squashes z into 0…1: very negative z → near 0, very positive z → near 1, z = 0 → 0.5.",
    why: "The output reads as a probability for a yes/no question: spam or not, at risk or not.",
    formulas: (
      <>
        <p>σ(z) = 1 / (1 + e⁻ᶻ)</p>
        <p>σ′(z) = σ(z)(1 − σ(z)) ≤ 0.25</p>
      </>
    ),
    use: [
      "Output of binary classification, paired with binary cross-entropy.",
      "Multi-label outputs: one independent yes/no per label.",
    ],
    avoid: [
      "Deep hidden layers: its slope is at most 0.25 and near 0 at both ends, so gradients vanish.",
      "Several classes with one right answer: use softmax.",
    ],
    takeaway: "Sigmoid turns a score into a probability — keep it at the output.",
  },
]

const HIDDEN: FunctionCopy[] = [
  {
    key: "tanh",
    title: "Hyperbolic tangent (tanh)",
    name: "tanh(z)",
    yRange: [-1, 1],
    what: "Squashes z into −1…1, centered on 0.",
    why: "Zero-centered outputs keep the next layer's inputs balanced around 0, so training usually converges faster than with sigmoid. Its slope peaks at 1, four times sigmoid's.",
    formulas: (
      <>
        <p>tanh(z) = (eᶻ − e⁻ᶻ) / (eᶻ + e⁻ᶻ)</p>
        <p>tanh′(z) = 1 − tanh²(z) ≤ 1</p>
      </>
    ),
    use: ["Hidden layers of small networks.", "Recurrent networks (LSTM, GRU)."],
    avoid: ["Very deep networks: it still saturates at both ends, so gradients can vanish."],
    takeaway: "tanh is a zero-centered sigmoid: better inside the network, but it still saturates.",
  },
  {
    key: "relu",
    title: "Rectified Linear Unit (ReLU)",
    name: "relu(z)",
    yRange: [-1, 4],
    what: "Keeps positive z and turns negative z into 0.",
    why: "Its slope is exactly 1 for z > 0, so gradients do not vanish there. It is a single comparison, so it is cheap, and deep networks train much faster with it.",
    formulas: (
      <>
        <p>ReLU(z) = max(0, z)</p>
        <p>ReLU′(z) = 1 if z &gt; 0, else 0</p>
      </>
    ),
    use: ["The default for hidden layers of most networks (MLPs, CNNs)."],
    avoid: [
      "Output layers whose answer can be negative.",
      "When many neurons “die”: if z stays below 0, the slope is 0 and the weights never update again.",
    ],
    takeaway: "ReLU is the default hidden activation: simple, fast, and no saturation for z > 0.",
  },
  {
    key: "leakyRelu",
    title: "Leaky ReLU",
    name: "leaky_relu(z)",
    yRange: [-1, 4],
    what: "Like ReLU, but negative z keeps a small slope α. Libraries use α = 0.01; here α = 0.1 so the leak is visible.",
    why: "It fixes dying ReLU: a neuron with negative z still passes a small gradient, so it can recover.",
    formulas: (
      <>
        <p>f(z) = z if z &gt; 0, else αz</p>
        <p>f′(z) = 1 if z &gt; 0, else α</p>
      </>
    ),
    use: [
      "Hidden layers where many ReLU neurons are stuck at 0.",
      "GAN discriminators, where it is the usual choice.",
    ],
    avoid: [
      "When plain ReLU already trains well: the gain is often small, and α is one more knob.",
    ],
    takeaway: "Leaky ReLU is a ReLU that never fully switches off.",
  },
  {
    key: "gelu",
    title: "GELU and SiLU",
    name: "gelu(z)",
    yRange: [-1, 4],
    what: "Smooth versions of ReLU: near 0 for very negative z, near z for large z, with a soft bend and a small dip below 0 in between.",
    why: "The smooth curve passes some gradient almost everywhere, which helps very deep models train. GELU is the activation inside BERT and GPT; SiLU (also called Swish) is used in many vision models and LLMs such as Llama.",
    formulas: (
      <>
        <p>GELU(z) = z · Φ(z)</p>
        <p>≈ 0.5z(1 + tanh(√(2/π)(z + 0.044715z³)))</p>
        <p>SiLU(z) = z · σ(z)</p>
      </>
    ),
    use: ["Hidden layers of transformers and other large, deep networks."],
    avoid: ["Small or speed-critical models: they cost more than ReLU for little gain."],
    takeaway: "GELU and SiLU are the smooth ReLUs of modern deep learning.",
  },
]

/** Two linear layers, W₂(W₁x + b₁) + b₂ with W₁ = 2, b₁ = 1, W₂ = −0.5, b₂ = 0.5, always reduce to −x. */
const stacked = (x: number) => -0.5 * (2 * x + 1) + 0.5
const relu = (z: number) => Math.max(0, z)
/** Three ReLU neurons with kinks at −1, 0 and 1, combined: relu(x + 1) − 2·relu(x) + relu(x − 1). */
const bump = (x: number) => relu(x + 1) - 2 * relu(x) + relu(x - 1)
const STACK_SERIES = [
  {
    key: "stacked",
    label: "Two linear layers",
    color: "var(--color-class-1)",
    points: STACK_X.map((x) => ({ x, y: stacked(x) })),
  },
  {
    key: "bump",
    label: "Hidden layer with ReLU",
    color: "var(--color-brand)",
    points: STACK_X.map((x) => ({ x, y: bump(x) })),
  },
]

const COMPARE = [
  { key: "sigmoid", label: "sigmoid", color: "var(--color-class-1)" },
  { key: "tanh", label: "tanh", color: "var(--color-class-2)" },
  { key: "relu", label: "ReLU", color: "var(--color-brand)" },
  { key: "leakyRelu", label: "Leaky ReLU", color: "var(--color-chart-amber)" },
  { key: "gelu", label: "GELU", color: "var(--color-chart-cool)" },
] as const

const CHEAT_SHEET = [
  { metric: "Linear", question: "any number", use: "Regression output" },
  { metric: "Sigmoid", question: "0 to 1", use: "Binary or multi-label output" },
  { metric: "Softmax", question: "0 to 1, sums to 1", use: "Multiclass output" },
  { metric: "tanh", question: "−1 to 1", use: "Hidden layers of small or recurrent networks" },
  { metric: "ReLU", question: "0 to ∞", use: "Default hidden layer" },
  { metric: "Leaky ReLU", question: "−∞ to ∞", use: "Hidden layers when ReLU neurons die" },
  { metric: "GELU / SiLU", question: "≈ −0.3 to ∞", use: "Hidden layers of transformers" },
]

function WhenToUse({ use, avoid }: { use: string[]; avoid: string[] }) {
  const { t } = useTranslation()
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1">
        <p className="label-ui text-success">{t("When to use")}</p>
        <OptionList ordered={false} items={use.map((u) => t(u))} />
      </div>
      <div className="flex flex-col gap-1">
        <p className="label-ui text-error">{t("When not to use")}</p>
        <OptionList ordered={false} items={avoid.map((a) => t(a))} />
      </div>
    </div>
  )
}

function FunctionSection({ number, copy }: { number: string; copy: FunctionCopy }) {
  const { t } = useTranslation()
  const [bias, setBias] = useState(BIAS.start)
  const { f } = ACTIVATION_FUNCTIONS[copy.key]
  return (
    <MetricSection
      number={number}
      title={copy.title}
      whatLabel="What it is"
      what={<p>{t(copy.what)}</p>}
      whyLabel="Why use it"
      why={<p>{t(copy.why)}</p>}
      formulas={copy.formulas}
    >
      <NeuronFlow name={copy.name} f={f} bias={bias} yRange={copy.yRange} />
      <Slider
        label="Bias b"
        value={bias}
        min={BIAS.min}
        max={BIAS.max}
        step={0.1}
        onChange={setBias}
        format={(v) => fmt(v, 1)}
      />
      <StatRow stats={EXAMPLE_ZS.map((z) => ({ label: `z = ${fmt(z, 0)}`, value: fmt(f(z)) }))} />
      <WhenToUse use={copy.use} avoid={copy.avoid} />
      <Takeaway>{t(copy.takeaway)}</Takeaway>
    </MetricSection>
  )
}

function SoftmaxSection({ number }: { number: string }) {
  const { t } = useTranslation()
  const [logits, setLogits] = useState([2, 1, 0.1])
  const total = softmax(logits).reduce((a, b) => a + b, 0)
  return (
    <MetricSection
      number={number}
      title="Softmax"
      whatLabel="What it is"
      what={
        <p>
          {t(
            "Turns a list of scores (logits), one per class, into probabilities that are all positive and sum to 1.",
          )}
        </p>
      }
      whyLabel="Why use it"
      why={
        <p>
          {t(
            "A multiclass problem needs one answer among many: cat, dog or bird. Raising one logit raises its class and lowers all the others. It is sigmoid generalized to many classes.",
          )}
        </p>
      }
      formulas={
        <>
          <p>softmax(z)ₖ = eᶻᵏ / Σⱼ eᶻʲ</p>
          <p>softmax([z, 0])₁ = σ(z)</p>
        </>
      }
    >
      {logits.map((value, i) => (
        <Slider
          // biome-ignore lint/suspicious/noArrayIndexKey: logits are positional.
          key={i}
          label={["Logit z (class A)", "Logit z (class B)", "Logit z (class C)"][i]}
          value={value}
          min={-3}
          max={3}
          step={0.1}
          onChange={(v) => setLogits(logits.map((l, j) => (j === i ? v : l)))}
          format={(v) => fmt(v, 1)}
        />
      ))}
      <SoftmaxBars logits={logits} />
      <StatRow stats={[{ label: "Sum of probabilities", value: `${(total * 100).toFixed(0)}%` }]} />
      <WhenToUse
        use={[
          "Output of multiclass classification with exactly one right class, paired with categorical cross-entropy.",
          "Attention weights inside transformers.",
        ]}
        avoid={[
          "Hidden layers.",
          "Multi-label problems, where several classes can be true at once: use one sigmoid per class.",
        ]}
      />
      <Takeaway>{t("Softmax picks one class out of many; sigmoid answers one yes/no.")}</Takeaway>
    </MetricSection>
  )
}

function WhatAndWhy({ number }: { number: string }) {
  const { t } = useTranslation()
  return (
    <MetricSection
      number={number}
      title="What an activation function is, and why we need it"
      whatLabel="What it is"
      what={
        <p>
          {t(
            "The function f applied to each neuron's z = w·x + b. It is the only non-linear step in a neuron: it takes a number and returns the signal the neuron passes on.",
          )}
        </p>
      }
      whyLabel="Why we need it"
      why={
        <p>
          {t(
            "Weighted sums are linear, and so is a stack of them. Without f, two layers collapse into one line (formula below), however deep the network. With f between the layers, each hidden neuron bends the signal, and the network can fit curves.",
          )}
        </p>
      }
      formulas={
        <>
          <p>W₂(W₁x + b₁) + b₂ = (W₂W₁)x + (W₂b₁ + b₂)</p>
          <p>{t("With W₁ = 2, b₁ = 1, W₂ = −0.5, b₂ = 0.5: y = −x, a straight line.")}</p>
        </>
      }
    >
      <LineChart series={STACK_SERIES} xLabel="x" yLabel="y" />
      <p className="text-sm text-fg-secondary">
        {t(
          "The straight line can never make a bump. Three ReLU neurons, one at each kink (x = −1, 0, 1), can: a single hidden layer is enough to bend the answer.",
        )}
      </p>
      <Takeaway>
        {t(
          "Without an activation function, depth adds nothing. Each one is what lets depth bend the answer.",
        )}
      </Takeaway>
    </MetricSection>
  )
}

function GroupHeading({ children }: { children: string }) {
  const { t } = useTranslation()
  return <p className="label-ui text-brand">{t(children)}</p>
}

export function ActivationFunctionsLesson({ entry }: { entry: LessonEntry }) {
  const { t } = useTranslation()
  const curves = (pick: "f" | "slope") =>
    COMPARE.map((c) => ({
      key: c.key,
      label: c.label,
      color: c.color,
      points: ZS.map((z) => ({ x: z, y: ACTIVATION_FUNCTIONS[c.key][pick](z) })),
    }))

  return (
    <LessonArticle entry={entry}>
      <LessonHero line1={t("Activation functions")} />
      <LessonLead>
        {t(
          "Every neuron works in two steps. It adds up its weighted inputs plus a bias, z = w₁x₁ + w₂x₂ + b, then passes z through an activation function f, which decides how strongly the neuron fires.",
        )}
      </LessonLead>
      <p className="text-fg-secondary">
        {t(
          "Activation functions bring non-linearity: without them, any stack of layers is still one straight line. They play two roles:",
        )}
      </p>
      <OptionList
        items={[
          t("Hidden layers bend z, so the network can learn curves: tanh, ReLU, Leaky ReLU, GELU."),
          t(
            "The output layer shapes z into the form the answer needs: linear for a number, sigmoid for yes/no, softmax for one class among many.",
          ),
        ]}
      />
      <Takeaway>
        {t(
          "Hidden activations make the network expressive; the output activation makes the answer readable.",
        )}
      </Takeaway>
      <WhatAndWhy number="1" />

      <p className="text-sm text-fg-secondary">
        {t(
          "Every section below uses the same neuron: x = (2, 1), w = (0.5, −1.5), so z = {0} + b. Move the bias to change z and watch the output.",
          [fmt(weightedSum(0), 1)],
        )}
      </p>

      <GroupHeading>Output layer</GroupHeading>
      {OUTPUT.map((copy, i) => (
        <FunctionSection key={copy.key} number={String(i + 2)} copy={copy} />
      ))}
      <SoftmaxSection number="4" />

      <GroupHeading>Hidden layers</GroupHeading>
      {HIDDEN.map((copy, i) => (
        <FunctionSection key={copy.key} number={String(i + 5)} copy={copy} />
      ))}

      <MetricSection
        number="9"
        title="Side by side"
        whatLabel="The curves"
        what={
          <p>
            {t(
              "Sigmoid and tanh flatten at both ends. The ReLU family keeps rising for positive z.",
            )}
          </p>
        }
        whyLabel="The slopes"
        why={
          <p>
            {t(
              "Training sends its learning signal back through each slope f′(z). Where the slope is near 0, the signal fades, and every extra layer multiplies those small slopes together.",
            )}
          </p>
        }
      >
        <Expandable title={t("Activation curves")}>
          <LineChart series={curves("f")} xLabel="z" yLabel="f(z)" />
        </Expandable>
        <Expandable title={t("Activation slopes")}>
          <LineChart series={curves("slope")} xLabel="z" yLabel="slope f′(z)" />
        </Expandable>
        <Takeaway>
          {t("A flat slope means no learning signal: that is why ReLU-style functions won.")}
        </Takeaway>
      </MetricSection>

      <section aria-label={t("In a nutshell")} className="flex flex-col gap-4">
        <SectionTitle number="10">{t("In a nutshell")}</SectionTitle>
        <NutshellFlow />
        <Takeaway>
          {t(
            "Choose hidden activations for learning; choose the output activation for the answer.",
          )}
        </Takeaway>
      </section>

      <CheatSheet
        number="11"
        columns={["Function", "Output range", "Use it for"]}
        rows={CHEAT_SHEET}
      />
      <LessonFooter entry={entry} />
    </LessonArticle>
  )
}

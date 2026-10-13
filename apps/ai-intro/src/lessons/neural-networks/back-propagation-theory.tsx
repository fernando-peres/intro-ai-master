import { useState } from "react"
import { Expandable } from "@/components/charts/expandable"
import { LineChart } from "@/components/charts/line-chart"
import {
  LessonArticle,
  LessonFooter,
  LessonHero,
  LessonLead,
} from "@/components/course/lesson-layout"
import type { LessonEntry } from "@/curriculum"
import { useTranslation } from "@/i18n/use-translation"
import {
  MetricSection,
  OptionList,
  Slider,
  StatRow,
  Takeaway,
} from "@/lessons/machine-learning/metric-section"
import {
  DescentPlot,
  GradientFlowChart,
  OptimizerPaths,
  SoftmaxBars,
} from "./back-propagation-theory-charts"
import {
  ACTIVATION_FUNCTIONS,
  crossEntropyCurve,
  descentPath,
} from "./back-propagation-theory-math"

const ZS = Array.from({ length: 33 }, (_, i) => -4 + i * 0.25)
const CURVES = [
  { key: "sigmoid", label: "sigmoid", color: "var(--color-class-1)" },
  { key: "tanh", label: "tanh", color: "var(--color-class-2)" },
  { key: "relu", label: "ReLU", color: "var(--color-brand)" },
] as const

/** Back-propagation, page 3: seven short explainers, each with a live graphic. */
export function BackPropagationUnderTheHoodLesson({ entry }: { entry: LessonEntry }) {
  const { t } = useTranslation()
  const [start, setStart] = useState(4)
  const [descentRate, setDescentRate] = useState(0.1)
  const [layers, setLayers] = useState(8)
  const [logits, setLogits] = useState([2, 1, 0.1])

  const walk = descentPath(4, 0.1, 3)
  const finalW = descentPath(start, descentRate, 12)[12]

  return (
    <LessonArticle entry={entry}>
      <LessonHero line1={t("Key")} line2={t("concepts")} />
      <LessonLead>
        {t(
          "Seven short ideas sit behind the training loop. Each one is brief, with the formula and a graphic you can move.",
        )}
      </LessonLead>

      <MetricSection
        number="1"
        title="Loss function"
        whatLabel="What it is"
        what={
          <p>
            {t(
              "The loss measures how wrong one prediction is. The cost J is the average loss over the training set. The two words are often swapped; the “Loss” in this page's toolbar is the average over every point.",
            )}
          </p>
        }
        why={
          <p>
            {t(
              "It is the network's only feedback, and its gradient tells every weight which way to move. A good loss is differentiable and punishes confident mistakes harder than unsure ones. Training stops when J stops falling — cross-entropy only approaches 0, it does not have to reach it.",
            )}
          </p>
        }
        formulas={
          <>
            <p>J = (1/N) · Σ Lᵢ</p>
            <p className="mt-1 text-fg-muted">{t("Common losses")}</p>
            <p>{t("binary cross-entropy")}: L = −[y·ln ŷ + (1 − y)·ln(1 − ŷ)]</p>
            <p>{t("categorical cross-entropy")}: L = −Σₖ yₖ·ln ŷₖ</p>
            <p>{t("mean squared error")}: L = ½(y − ŷ)²</p>
          </>
        }
      >
        <OptionList
          ordered={false}
          items={[
            t("Binary cross-entropy — two classes, sigmoid output. This lesson."),
            t("Categorical cross-entropy — many classes, softmax output."),
            t("Mean squared error — predicting a number (regression), linear output."),
          ]}
        />
        <Expandable title={t("Loss function")}>
          <LineChart
            series={[
              {
                key: "y1",
                label: "true label y = 1",
                color: "var(--color-class-2)",
                points: crossEntropyCurve(1),
              },
              {
                key: "y0",
                label: "true label y = 0",
                color: "var(--color-class-1)",
                points: crossEntropyCurve(0),
              },
            ]}
            xLabel="Predicted probability ŷ"
            yLabel="Loss L"
          />
        </Expandable>
        <Takeaway>
          {t(
            "Cross-entropy is gentle when ŷ is nearly right and steep when it is confidently wrong — that steepness is the gradient that drives learning.",
          )}
        </Takeaway>
      </MetricSection>

      <MetricSection
        number="1"
        title="Gradient descent"
        whatLabel="What it is"
        what={
          <p>
            {t(
              "An optimization algorithm that finds the parameter values that minimize a differentiable cost function. The gradient ∇J points toward the steepest increase of J, so each step goes the opposite way. Stepping along +∇J instead climbs to a maximum — that is gradient ascent.",
            )}
          </p>
        }
        why={
          <p>
            {t(
              "A network has thousands of weights and no closed-form answer, but the gradient is cheap to get from backpropagation. Descent follows the local slope, so it finds a local minimum — not guaranteed to be the global one, which is usually good enough.",
            )}
          </p>
        }
        formulas={
          <>
            <p>w ← w − η·∇J(w)</p>
            <p className="text-fg-muted">∇J = [∂J/∂w₁, ∂J/∂w₂, …]</p>
            <p className="mt-1 text-fg-muted">
              {t(
                "This page uses mini-batch gradient descent: each step averages the gradient of up to 10 points, and one epoch visits every point once.",
              )}
            </p>
          </>
        }
        worked={
          <>
            <p>J(w) = w², ∇J = 2w, w₀ = 4, η = 0.1</p>
            <p>
              w₁ = 4 − 0.1·8 = {walk[1].toFixed(2)}, w₂ = {walk[1].toFixed(2)} −{" "}
              {(0.1 * 2 * walk[1]).toFixed(2)} = {walk[2].toFixed(2)}, w₃ = {walk[3].toFixed(3)}
            </p>
            <p>
              {t("Each step multiplies w by (1 − 2η) = 0.8, so it slides into the minimum at 0.")}
            </p>
          </>
        }
      >
        <Slider
          label="Starting point w₀"
          value={start}
          min={-4.5}
          max={4.5}
          step={0.5}
          onChange={setStart}
        />
        <Slider
          label="Learning rate η"
          value={descentRate}
          min={0.05}
          max={1.2}
          step={0.05}
          onChange={setDescentRate}
          format={(v) => v.toFixed(2)}
        />
        <Expandable title={t("Gradient descent")}>
          <DescentPlot start={start} learningRate={descentRate} steps={12} />
        </Expandable>
        <StatRow
          stats={[
            { label: "Starting point", value: String(start) },
            { label: "Learning rate", value: descentRate.toFixed(2) },
            {
              label: "w after 12 steps",
              value: Math.abs(finalW) > 99 ? "> 99" : finalW.toFixed(2),
            },
          ]}
        />
        <Takeaway>
          {t(
            "The network's goal is to minimize the cost: repeat “step downhill” until the slope is flat.",
          )}
        </Takeaway>
      </MetricSection>

      <MetricSection
        number="1"
        title="Learning rate"
        whatLabel="What it is"
        what={
          <div className="flex flex-col gap-2">
            <p>
              {t(
                "The learning rate η (also called the step size, or alpha) is how far each update moves the weights along the negative gradient. You choose it; the network does not learn it.",
              )}
            </p>
            <OptionList
              items={[
                t("Too small: precise but slow — many epochs for the same progress."),
                t("About right: the loss falls steadily and settles."),
                t(
                  "Too large: steps overshoot the minimum, the loss bounces or grows, and the weights can end up NaN.",
                ),
              ]}
            />
          </div>
        }
        why={
          <p>
            {t(
              "It is usually the most important setting to tune. A large η is not the same thing as an exploding gradient (section 4), but it makes one much more likely.",
            )}
          </p>
        }
        formulas={
          <>
            <p>{t("On the bowl J = w²")}: w ← (1 − 2η)·w</p>
            <p>|1 − 2η| &lt; 1 → {t("converges")}</p>
            <p>η = 1 → {t("bounces between ±w forever")}</p>
            <p>η &gt; 1 → {t("diverges")}</p>
            <p className="mt-1 text-fg-muted">
              {t(
                "For other costs the limit is 2 ÷ the steepest curvature. Try the extremes in the rail.",
              )}
            </p>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3">
          <Expandable title={t("Learning rate")}>
            <DescentPlot start={4} learningRate={0.05} steps={12} title={t("Too small")} />
          </Expandable>
          <Expandable title={t("Learning rate")}>
            <DescentPlot start={4} learningRate={0.3} steps={12} title={t("About right")} />
          </Expandable>
          <Expandable title={t("Learning rate")}>
            <DescentPlot start={4} learningRate={1.05} steps={12} title={t("Too large")} />
          </Expandable>
        </div>
        <Takeaway>{t("Too small is slow; too large overshoots and diverges.")}</Takeaway>
      </MetricSection>

      <MetricSection
        number="1"
        title="Vanishing and exploding gradients"
        whatLabel="What it is"
        what={
          <div className="flex flex-col gap-2">
            <p>
              {t(
                "Going backwards, the gradient is multiplied by one factor per layer. In a network with n layers that is n factors in a row:",
              )}
            </p>
            <OptionList
              items={[
                t(
                  "Vanishing: the factors are below 1, so the gradient shrinks exponentially. The earliest layers barely update and stop learning while the last layers carry on.",
                ),
                t(
                  "Exploding: the factors are above 1, so the gradient grows exponentially. Weights jump, the loss blows up, and the numbers end as NaN.",
                ),
              ]}
            />
          </div>
        }
        why={
          <p>
            {t(
              "Both make deep networks unstable or unable to learn. A sigmoid's slope never exceeds 0.25, so ten sigmoid layers can scale the gradient by 0.25¹⁰ ≈ 10⁻⁶.",
            )}
          </p>
        }
        formulas={
          <>
            <p>∂L/∂w₁ ≈ δ_out · Π (wₗ · f′(zₗ))</p>
            <p>0.25¹⁰ ≈ 1.0×10⁻⁶ ({t("vanishes")})</p>
            <p>2¹⁰ = 1024 ({t("explodes")})</p>
            <p className="mt-1 text-fg-muted">{t("Common fixes")}</p>
            <p>
              {t(
                "vanishing: ReLU-family activations, Xavier/He initialization, skip connections, normalization",
              )}
            </p>
            <p>
              {t("exploding: gradient clipping, a smaller η, careful initialization, weight decay")}
            </p>
          </>
        }
      >
        <Slider label="Layers" value={layers} min={2} max={12} step={1} onChange={setLayers} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
          <Expandable title={t("Vanishing and exploding gradients")}>
            <GradientFlowChart
              factor={0.25}
              layers={layers}
              title={t("Vanishing: ×0.25 per layer")}
              barClass="fill-chart-cool"
            />
          </Expandable>
          <Expandable title={t("Vanishing and exploding gradients")}>
            <GradientFlowChart
              factor={2}
              layers={layers}
              title={t("Exploding: ×2 per layer")}
              barClass="fill-chart-warm"
            />
          </Expandable>
        </div>
        <p className="text-sm text-fg-secondary">
          {t(
            "The bars share one log scale: the line is the output layer's gradient. Set the playground to sigmoid with 6+ hidden layers to see the vanishing case in a real loss curve.",
          )}
        </p>
        <Takeaway>
          {t(
            "Depth multiplies derivatives: below 1 per layer they vanish, above 1 they explode — either way deep networks stop learning.",
          )}
        </Takeaway>
      </MetricSection>

      <MetricSection
        number="1"
        title="Optimizers"
        whatLabel="What it is"
        what={
          <p>
            {t(
              "An optimizer is the rule that turns gradients into weight updates. Backpropagation supplies g = ∂L/∂w; the optimizer decides the step.",
            )}
          </p>
        }
        why={
          <p>
            {t(
              "Plain gradient descent zig-zags in narrow valleys and treats every weight the same. Better update rules reach a good solution in fewer steps and with less tuning. This playground uses plain mini-batch gradient descent.",
            )}
          </p>
        }
        formulas={
          <>
            <p>SGD: w ← w − η·g</p>
            <p>
              {t("Momentum")}: v ← β·v + g, w ← w − η·v ({t("β ≈ 0.9")})
            </p>
            <p>RMSProp: s ← ρ·s + (1 − ρ)·g², w ← w − η·g / (√s + ε)</p>
            <p>Adam: {t("momentum + RMSProp scaling, with bias correction")}</p>
            <p className="text-fg-muted">
              {t("Adam defaults: η = 0.001, β₁ = 0.9, β₂ = 0.999, ε = 10⁻⁸")}
            </p>
          </>
        }
      >
        <OptionList
          ordered={false}
          items={[
            t("SGD — simple and predictable; needs a well-tuned η."),
            t(
              "Momentum — keeps a running velocity, so steady directions speed up and zig-zags cancel.",
            ),
            t("RMSProp / AdaGrad — scale each weight's step by its recent gradient size."),
            t("Adam — momentum plus per-weight scaling; the usual first choice."),
          ]}
        />
        <Expandable title={t("Optimizers")}>
          <OptimizerPaths />
        </Expandable>
        <p className="text-sm text-fg-secondary">
          {t(
            "Same valley, same start, 30 steps; each optimizer uses a rate that suits it. SGD zig-zags across the narrow direction, momentum overshoots and then settles, Adam heads almost straight down.",
          )}
        </p>
      </MetricSection>

      <MetricSection
        number="1"
        title="Hidden-layer activation"
        whatLabel="What it is"
        what={
          <div className="flex flex-col gap-2">
            <p>
              {t(
                "Each hidden neuron bends its weighted sum z with a nonlinear function f. The curve of the boundary comes from that bending, and from combining many bent neurons.",
              )}
            </p>
            <OptionList
              ordered={false}
              items={[
                t("Sigmoid — squashes to 0–1; slope at most 0.25, saturates at both ends."),
                t(
                  "tanh — squashes to −1…1, zero-centered; slope at most 1, saturates at both ends.",
                ),
                t(
                  "ReLU — max(0, z); slope 1 for z > 0, so it does not saturate there. A neuron stuck at z < 0 outputs 0 forever (“dying ReLU”).",
                ),
                t("Linear — no bending, only useful to see why bending matters."),
              ]}
            />
          </div>
        }
        why={
          <p>
            {t(
              "Without a nonlinear activation, stacked layers collapse into one single line. Pick the activation by its slope too: where the slope is near 0, no gradient gets through.",
            )}
          </p>
        }
        formulas={
          <>
            <p className="text-fg-muted">{t("Why linear layers collapse")}</p>
            <p>W₂(W₁x + b₁) + b₂ = (W₂W₁)x + (W₂b₁ + b₂)</p>
            <p className="mt-1">σ(z) = 1 / (1 + e⁻ᶻ), σ′ = σ(1 − σ)</p>
            <p>tanh′ = 1 − tanh²(z)</p>
            <p>ReLU(z) = max(0, z), ReLU′ = 1 if z &gt; 0 else 0</p>
          </>
        }
      >
        <p className="text-sm text-fg-secondary">
          {t(
            "Choose “linear” in the Activation selector above: even with many layers the boundary stays one straight line.",
          )}
        </p>
        <Expandable title={t("Hidden-layer activation")}>
          <LineChart
            series={CURVES.map((c) => ({
              key: c.key,
              label: c.label,
              color: c.color,
              points: ZS.map((z) => ({ x: z, y: ACTIVATION_FUNCTIONS[c.key].f(z) })),
            }))}
            xLabel="z"
            yLabel="f(z)"
          />
        </Expandable>
        <Expandable title={t("Hidden-layer activation")}>
          <LineChart
            series={CURVES.map((c) => ({
              key: c.key,
              label: c.label,
              color: c.color,
              points: ZS.map((z) => ({ x: z, y: ACTIVATION_FUNCTIONS[c.key].slope(z) })),
            }))}
            xLabel="z"
            yLabel="slope f′(z)"
          />
        </Expandable>
        <Takeaway>
          {t(
            "The curve is the activation; the slope is how much learning signal passes through it.",
          )}
        </Takeaway>
      </MetricSection>

      <MetricSection
        number="1"
        title="Output activation"
        whatLabel="What it is"
        what={
          <div className="flex flex-col gap-2">
            <p>
              {t(
                "The last layer's activation shapes the final z into the form the answer needs, and it is paired with a matching loss:",
              )}
            </p>
            <OptionList
              items={[
                t(
                  "Sigmoid → one probability, for two classes (this lesson). Loss: binary cross-entropy.",
                ),
                t(
                  "Softmax → one probability per class, summing to 1. Loss: categorical cross-entropy.",
                ),
                t("Linear → any real number, for regression. Loss: mean squared error."),
              ]}
            />
          </div>
        }
        why={
          <p>
            {t(
              "With the matching loss the output gradient simplifies to prediction minus target (ŷ − y) — the first backward step on the Step by Step page. Mismatched pairs, such as sigmoid with squared error, give gradients that fade exactly when the output is confidently wrong.",
            )}
          </p>
        }
        formulas={
          <>
            <p>σ(z) = 1 / (1 + e⁻ᶻ)</p>
            <p>softmax(z)ₖ = eᶻᵏ / Σⱼ eᶻʲ</p>
            <p>∂L/∂z = ŷ − y</p>
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
            format={(v) => v.toFixed(1)}
          />
        ))}
        <SoftmaxBars logits={logits} />
        <Takeaway>
          {t(
            "Choose the output activation from the answer's shape, then pair it with its matching loss.",
          )}
        </Takeaway>
      </MetricSection>

      <LessonFooter entry={entry} />
    </LessonArticle>
  )
}

import { useMemo } from "react"
import { Expandable } from "@/components/charts/expandable"
import {
  LessonArticle,
  LessonFooter,
  LessonHero,
  LessonLead,
} from "@/components/course/lesson-layout"
import type { LessonEntry } from "@/curriculum"
import { useTranslation } from "@/i18n/use-translation"
import { MetricSection, OptionList, Takeaway } from "@/lessons/machine-learning/metric-section"
import { BackpropGraph } from "./back-propagation-theory-charts"
import { backpropExample } from "./back-propagation-theory-math"

const fmt = (v: number, digits = 3) => (v < 0 ? "−" : "") + Math.abs(v).toFixed(digits)

/** Back-propagation, page 2: the forward and backward passes on a worked two-weight example. */
export function BackPropagationForwardBackwardLesson({ entry }: { entry: LessonEntry }) {
  const { t } = useTranslation()
  const e = useMemo(() => backpropExample(), [])

  return (
    <LessonArticle entry={entry}>
      <LessonHero line1={t("Forward pass,")} line2={t("backward pass")} />
      <LessonLead>
        {t(
          "Training a network is one loop: guess, measure the mistake, trace the blame backwards, adjust.",
        )}
      </LessonLead>
      <MetricSection
        number="1"
        title="Backpropagation"
        whatLabel="What it is"
        what={
          <div className="flex flex-col gap-2">
            <p>
              {t(
                "Backpropagation computes ∂L/∂w — how much the loss changes if one weight moves a little — for every weight at once. It works in four beats:",
              )}
            </p>
            <OptionList
              items={[
                t(
                  "Forward Pass (The Attempt): You feed raw ingredients into the machine and press “Start.” The gears turn based on how the dials are currently set, and out pops a baked cake. That is the machine's first guess.",
                ),
                t(
                  "Loss Calculation (The Reality Check): A master chef tastes the cake, compares it to the perfect recipe, and issues a strict penalty score. “Too salty, not sweet enough. Error score: 85.”",
                ),
                t(
                  "Backward Pass (Assigning Blame): The chef's error score is sent backward down the assembly line. The system figures out exactly which dials caused the saltiness and which caused the lack of sweetness. It then mathematically nudges each dial slightly in the correct direction.",
                ),
                t(
                  "Update (Adjusting): Turning the salt dial down 2% and the sugar dial up 5% so the next guess is closer to perfect.",
                ),
              ]}
            />
            <p className="label-ui text-brand">{t("Reading ŷ")}</p>
            <OptionList
              ordered={false}
              items={[
                t("y — the true label, the answer in the data: 0 or 1."),
                t(
                  "ŷ (“y-hat”) — the network's prediction: a probability between 0 and 1 that the class is 1. The hat means “estimated”.",
                ),
                t("ŷ − y — the error. It is 0 when the prediction matches the label."),
              ]}
            />
          </div>
        }
        why={
          <p>
            {t(
              "Measuring each weight's effect separately would cost one forward pass per weight. Backpropagation shares the work, so all gradients cost about one extra pass. It only computes gradients — the optimizer (on the Key concepts page) decides what to do with them.",
            )}
          </p>
        }
        formulas={
          <>
            <p className="text-fg-muted">{t("A tiny network: x → hidden → ŷ (biases left out)")}</p>
            <p>z₁ = w₁·x, a₁ = σ(z₁)</p>
            <p>z₂ = w₂·a₁, ŷ = σ(z₂)</p>
            <p>L = −[y·ln ŷ + (1 − y)·ln(1 − ŷ)]</p>
            <p className="mt-1 text-fg-muted">{t("Chain rule, from the loss backwards")}</p>
            <p>δ₂ = ∂L/∂z₂ = ŷ − y</p>
            <p>∂L/∂w₂ = δ₂·a₁</p>
            <p>δ₁ = ∂L/∂z₁ = δ₂·w₂·σ′(z₁), σ′ = a₁(1 − a₁)</p>
            <p>∂L/∂w₁ = δ₁·x</p>
            <p className="mt-1">w ← w − η·∂L/∂w</p>
          </>
        }
        worked={
          <>
            <p>
              x = {e.x}, y = {e.y}, w₁ = {e.w1}, w₂ = {e.w2}, η = {e.learningRate}
            </p>
            <p>
              {t("forward")}: z₁ = {fmt(e.z1)}, a₁ = {fmt(e.a1)}, z₂ = {fmt(e.z2)}, ŷ ={" "}
              {fmt(e.yHat)}, L = {fmt(e.loss)}
            </p>
            <p>
              {t("backward")}: δ₂ = {fmt(e.yHat)} − {e.y} = {fmt(e.delta2)}, ∂L/∂w₂ ={" "}
              {fmt(e.gradW2)}
            </p>
            <p>
              δ₁ = {fmt(e.delta2)}·{e.w2}·{fmt(e.a1 * (1 - e.a1))} = {fmt(e.delta1)}, ∂L/∂w₁ ={" "}
              {fmt(e.gradW1)}
            </p>
            <p>
              {t("update")}: w₁ = {fmt(e.newW1)}, w₂ = {fmt(e.newW2)}
            </p>
            <p>
              {t("new loss")}: {fmt(e.newLoss)} ({t("was")} {fmt(e.loss)})
            </p>
          </>
        }
      >
        <Expandable title={t("Backpropagation")}>
          <BackpropGraph example={e} />
        </Expandable>
        <Takeaway>
          {t(
            "Backpropagation is the chain rule run from the loss back to the first layer, reusing every result once.",
          )}
        </Takeaway>
      </MetricSection>

      <LessonFooter entry={entry} />
    </LessonArticle>
  )
}

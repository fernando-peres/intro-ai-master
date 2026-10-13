import { useMemo } from "react"
import { DecisionChart } from "@/components/charts/decision-chart"
import { pointKey, ScatterChart } from "@/components/charts/scatter-chart"
import { CodeBlock } from "@/components/code-block"
import {
  LessonArticle,
  LessonFooter,
  LessonHero,
  LessonLead,
  SectionTitle,
} from "@/components/course/lesson-layout"
import type { LessonEntry } from "@/curriculum"
import { useTranslation } from "@/i18n/use-translation"
import { predict } from "@/lib/neural-net"
import { machineReadings } from "./dataset"
import {
  DEFAULT_ACTIVATION,
  DEFAULT_HIDDEN_LAYERS,
  TEMP_DOMAIN,
  toInput,
  trainWithLossHistory,
  VIB_DOMAIN,
} from "./ml-training"
import { NetworkDiagram } from "./network-diagram"
import { classifyByRules, rulesPythonSource, rulesScore } from "./rules"

const points = machineReadings.map((r) => ({ x: r.temperature, y: r.vibration, series: r.label }))
const series = [
  { key: "normal", label: "A — Normal", color: "var(--color-class-1)" },
  { key: "at-risk", label: "B — At Risk", color: "var(--color-class-2)" },
]
const ruleMisses = new Set(
  points
    .filter((_, i) => classifyByRules(machineReadings[i]) !== machineReadings[i].label)
    .map(pointKey),
)
const SUMMARY_EPOCHS = 300

const comparison = [
  {
    dimension: "When useful",
    traditional: "Clear, stable rules you can specify and check",
    ml: "Patterns that are hard to specify, with representative labeled data",
  },
  { dimension: "Logic", traditional: "Written by humans", ml: "Learned from data" },
  { dimension: "Knowledge", traditional: "Expert-defined rules", ml: "Labeled observations" },
  { dimension: "Adaptation", traditional: "Modify the code", ml: "Retrain or update the model" },
  {
    dimension: "Complex patterns",
    traditional: "Requires increasingly complex rules",
    ml: "Can learn nonlinear patterns",
  },
  {
    dimension: "Explainability",
    traditional: "Individual rules are explicit",
    ml: "Learned behavior may be harder to interpret",
  },
  {
    dimension: "Main limitation",
    traditional: "Rule complexity and maintenance",
    ml: "Data quality, generalization and evaluation",
  },
]

export function ContentLesson({ entry }: { entry: LessonEntry }) {
  const { t } = useTranslation()
  const { net } = useMemo(
    () =>
      trainWithLossHistory(
        [2, ...DEFAULT_HIDDEN_LAYERS, 1],
        DEFAULT_ACTIVATION,
        SUMMARY_EPOCHS,
        SUMMARY_EPOCHS,
      ),
    [],
  )
  const networkValue = (temperature: number, vibration: number) =>
    predict(net, toInput({ temperature, vibration }))[0]
  const networkMisses = new Set(
    points
      .filter((p) => (networkValue(p.x, p.y) >= 0.5 ? "at-risk" : "normal") !== p.series)
      .map(pointKey),
  )
  const networkCorrect = points.length - networkMisses.size
  const networkAccuracy = Math.round((networkCorrect / points.length) * 100)
  const score = (correct: number, accuracy: number) =>
    t("{0}/{1} correct · {2}% accuracy", [correct, points.length, accuracy])
  const chartProps = { points, series, xLabel: "Temperature (°C)", yLabel: "Vibration (mm/s)" }

  return (
    <LessonArticle entry={entry}>
      <LessonHero line1={t("Machines that learn")} line2={t("from examples")} />
      <LessonLead>
        {t(
          "One problem, two ways to solve it. Review the solutions, read their results, and learn what those results can—and cannot—tell us.",
        )}
      </LessonLead>

      <section aria-label={t("The problem")} className="flex flex-col gap-4">
        <SectionTitle number="1">{t("The problem")}</SectionTitle>
        <p className="text-fg-secondary">
          {t(
            "A factory wants to identify machines that may need maintenance. Given temperature (°C) and vibration (mm/s), predict one of two labels: A — Normal or B — At Risk.",
          )}
        </p>
        <div className="break-inside-avoid rounded-[3px] border border-divider p-4 sm:p-6">
          <p className="mb-4 text-sm text-fg-muted">
            {t("{0} synthetic observations, shared by both approaches.", [points.length])}
          </p>
          <ScatterChart {...chartProps} />
          <p className="mt-4 text-sm text-fg-secondary">
            {t(
              "Each dot is one labeled observation. The two groups form interlocking curves: a single straight line cannot separate them.",
            )}
          </p>
        </div>
        <p className="text-sm text-fg-muted">
          {t("These are synthetic teaching examples, not real industrial safety thresholds.")}
        </p>
      </section>

      <section aria-label={t("Programming")} className="flex flex-col gap-4">
        <SectionTitle number="2">{t("Programming")}</SectionTitle>
        <p className="text-fg-secondary">
          {t(
            "Humans write the decision logic. These rules flag high temperature, high vibration, or a combination of moderately high readings; everything else is classified as Normal.",
          )}
        </p>
        <CodeBlock code={rulesPythonSource} />
        <div className="break-inside-avoid rounded-[3px] border border-divider p-4 sm:p-6">
          <p className="label-ui text-fg-muted">{t("Result on the shared examples")}</p>
          <p className="mt-2 mb-4 font-display text-3xl font-bold text-fg">
            {score(rulesScore.correct, rulesScore.accuracy)}
          </p>
          <DecisionChart
            {...chartProps}
            showBoundaryLine
            flaggedKeys={ruleMisses}
            valueAt={(temperature, vibration) =>
              classifyByRules({ temperature, vibration, label: "normal" }) === "at-risk" ? 1 : 0
            }
          />
          <p className="mt-4 text-sm text-fg-secondary">
            {t(
              "The background shows the rules’ predictions; dots show the known labels. Dashed rings mark mistakes. These thresholds create rectangular regions that do not follow the curved pattern.",
            )}
          </p>
        </div>
        <p className="text-sm text-fg-muted">
          {t("Accuracy = correct predictions ÷ total observations.")}
        </p>
        <ul className="list-disc space-y-2 pl-5 text-fg-secondary">
          <li>
            {t(
              "False alarm: at 88°C and 2.3 mm/s, the temperature rule predicts At Risk, but the example is Normal.",
            )}
          </li>
          <li>
            {t(
              "Missed risk: at 51°C and 5.1 mm/s, no rule fires, so the prediction is Normal, but the example is At Risk.",
            )}
          </li>
        </ul>
        <p className="text-fg-secondary">
          {t(
            "Better rules could improve this score. The limitation belongs to this particular solution, not to programming as a whole.",
          )}
        </p>
      </section>

      <section aria-label={t("Machine learning")} className="flex flex-col gap-4">
        <SectionTitle number="3">{t("Machine learning")}</SectionTitle>
        <p className="text-fg-secondary">
          {t(
            "Humans still write the training program and choose the inputs and model. Instead of specifying every decision rule, we use labeled examples to learn the network’s weights.",
          )}
        </p>
        <div className="break-inside-avoid border-l-2 border-brand pl-4">
          <p className="font-ui text-sm text-fg">
            {t("2 sensor inputs → 4 hidden neurons → 2 hidden neurons → 1 risk score")}
          </p>
          <p className="mt-2 text-sm text-fg-secondary">
            {t("Hidden layers use tanh; the sigmoid output becomes At Risk at a threshold of 0.5.")}
          </p>
        </div>
        <h3 className="font-display text-2xl font-bold text-fg">
          {t("How does the network learn?")}
        </h3>
        <ol className="list-decimal space-y-2 pl-5 text-fg-secondary">
          <li>
            <strong className="text-fg">{t("Predict")}.</strong>{" "}
            {t("Pass the readings through the network to produce a risk score.")}
          </li>
          <li>
            <strong className="text-fg">{t("Measure error")}.</strong>{" "}
            {t("Compare the score with the known label using cross-entropy loss.")}
          </li>
          <li>
            <strong className="text-fg">{t("Update")}.</strong>{" "}
            {t("Backpropagation computes gradients; gradient descent adjusts the weights.")}
          </li>
          <li>
            <strong className="text-fg">{t("Repeat")}.</strong>{" "}
            {t("Repeat over the examples, then evaluate separately on unseen data.")}
          </li>
        </ol>
        <figure className="flex break-inside-avoid flex-col gap-3">
          <h3 className="font-display text-2xl font-bold text-fg">
            {t("What was learned — the trained network")}
          </h3>
          <section
            className="overflow-x-auto print:overflow-visible"
            aria-label={t("Trained network weights and biases")}
            // biome-ignore lint/a11y/noNoninteractiveTabindex: enables keyboard scrolling of the wide diagram.
            tabIndex={0}
          >
            <div className="min-w-[640px] print:min-w-0">
              <NetworkDiagram
                network={net}
                toInput={(temperature, vibration) => toInput({ temperature, vibration })}
                domain={{
                  xMin: TEMP_DOMAIN[0],
                  xMax: TEMP_DOMAIN[1],
                  yMin: VIB_DOMAIN[0],
                  yMax: VIB_DOMAIN[1],
                }}
                inputLabels={["Temperature", "Vibration"]}
                outputLabel="At Risk?"
                showWeights
              />
            </div>
          </section>
          <figcaption className="text-sm text-fg-secondary">
            {t(
              "After {0} epochs, these are the learned parameters: each connection is labeled with its weight, and b beneath each neuron is its bias. Values are rounded to two decimal places. Together, weights and biases determine how the network combines the scaled sensor readings to make a prediction. This is the same trained model evaluated below.",
              [SUMMARY_EPOCHS],
            )}
          </figcaption>
        </figure>
        <div className="break-inside-avoid rounded-[3px] border border-divider p-4 sm:p-6">
          <p className="label-ui text-fg-muted">
            {t("Training-data result after {0} epochs", [SUMMARY_EPOCHS])}
          </p>
          <p className="mt-2 mb-4 font-display text-3xl font-bold text-fg">
            {score(networkCorrect, networkAccuracy)}
          </p>
          <DecisionChart
            {...chartProps}
            showBoundaryLine
            flaggedKeys={networkMisses}
            valueAt={networkValue}
          />
          <p className="mt-4 text-sm text-fg-secondary">
            {t(
              "The learned boundary follows the curved pattern. Both this chart and the score come from the same trained network, using a fixed seed for a reproducible example.",
            )}
          </p>
        </div>
        <p className="border-l-2 border-brand pl-4 text-fg">
          {t(
            "Training accuracy is not test accuracy. The network learned from these same examples. No held-out test set is measured here, so performance on new machines is unknown.",
          )}
        </p>
      </section>

      <section aria-label={t("Main takeaways")} className="flex flex-col gap-6">
        <SectionTitle number="4">{t("Main takeaways")}</SectionTitle>
        <h3 className="font-display text-2xl font-bold text-fg">
          {t("Compare the two approaches")}
        </h3>
        <div className="rounded-[3px] border border-divider">
          <table className="w-full table-fixed border-collapse text-left text-sm break-words">
            <thead>
              <tr className="border-b border-divider text-fg">
                <th scope="col" className="w-1/4 p-3 font-semibold">
                  {t("Dimension")}
                </th>
                <th scope="col" className="p-3 font-semibold">
                  {t("Traditional programming")}
                </th>
                <th scope="col" className="p-3 font-semibold">
                  {t("Machine learning")}
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  dimension: "Result on the shared examples",
                  traditional: score(rulesScore.correct, rulesScore.accuracy),
                  ml: score(networkCorrect, networkAccuracy),
                },
                {
                  dimension: "Performance on unseen machines",
                  traditional: "Not measured here",
                  ml: "Not measured here",
                },
                ...comparison,
              ].map((row) => (
                <tr
                  key={row.dimension}
                  className="break-inside-avoid border-b border-divider last:border-b-0"
                >
                  <th scope="row" className="p-3 align-top font-normal text-fg">
                    {t(row.dimension)}
                  </th>
                  <td className="p-3 align-top text-fg-secondary">{t(row.traditional)}</td>
                  <td className="p-3 align-top text-fg-secondary">{t(row.ml)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-fg-secondary">
          {t(
            "Before trusting either solution: which is more costly here—a false alarm or a missed failure? Accuracy alone does not answer that question.",
          )}
        </p>
        <section
          aria-label={t("See it break")}
          className="flex flex-col gap-4 rounded-[3px] border border-divider bg-surface p-4 sm:p-6"
        >
          <h3 className="font-display text-2xl font-bold text-fg">
            {t("See it break — Learning patterns is not understanding")}
          </h3>
          <p className="text-fg-secondary">
            {t(
              "Machine learning is not magic. These thought experiments show why even a perfect training score can be misleading.",
            )}
          </p>
          <article className="break-inside-avoid border-t border-divider pt-4">
            <h4 className="font-semibold text-fg">{t("Wrong labels")}</h4>
            <p className="mt-2 text-fg-secondary">
              {t(
                "Imagine maintenance records mark faulty machines as Normal. Training rewards the model for repeating those errors.",
              )}
            </p>
            <p className="mt-2 text-sm text-fg-secondary">
              {t("Check: audit labels against reliable maintenance outcomes before training.")}
            </p>
          </article>
          <article className="break-inside-avoid border-t border-divider pt-4">
            <h4 className="font-semibold text-fg">{t("Too few representative examples")}</h4>
            <p className="mt-2 text-fg-secondary">
              {t(
                "Imagine training only on cool machines. A high training score says little about hot machines; a flexible model may also fit accidental patterns (overfitting).",
              )}
            </p>
            <p className="mt-2 text-sm text-fg-secondary">
              {t(
                "Check: collect examples across operating conditions and compare training results with a separate, representative test set.",
              )}
            </p>
          </article>
          <article className="break-inside-avoid border-t border-divider pt-4">
            <h4 className="font-semibold text-fg">{t("Changed operating conditions")}</h4>
            <p className="mt-2 text-fg-secondary">
              {t(
                "Imagine a new machine type or a recalibrated sensor. The relationship between the readings and failure risk may change: this is distribution shift.",
              )}
            </p>
            <p className="mt-2 text-sm text-fg-secondary">
              {t(
                "Check: monitor errors on recent labeled data, investigate changes, and validate any retrained model before use.",
              )}
            </p>
          </article>
        </section>
        <p className="font-display text-2xl leading-relaxed text-fg">
          {t(
            "Choose the approach that works on representative, unseen data. A perfect training score is not a guarantee—and machine learning does not automatically beat well-designed rules.",
          )}
        </p>
      </section>
      <LessonFooter entry={entry} />
    </LessonArticle>
  )
}

import { Link } from "@tanstack/react-router"
import { BarChart } from "@/components/charts/bar-chart"
import { DonutChart } from "@/components/charts/donut-chart"
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
import { ConfusionMatrix } from "./algorithm-card"
import {
  candidate,
  lazy,
  type MetricKey,
  metricRows,
  observations,
  scoreBands,
} from "./classification-fairness-data"
import { type FairnessMetric, fairnessMetrics } from "./classification-fairness-metrics"
import { MetricSection, OptionList, StatRow, Takeaway } from "./metric-section"

const LEGIT = "var(--color-class-1)"
const FRAUD = "var(--color-class-2)"
const BASELINE = "var(--color-fg-muted)"
const MODEL = "var(--color-brand)"
const percentKeys = new Set<MetricKey>([
  "recall",
  "specificity",
  "fpr",
  "precision",
  "accuracy",
  "balancedAccuracy",
])
const valueText = (key: MetricKey, value: number | null) =>
  value === null ? "—" : percentKeys.has(key) ? `${(value * 100).toFixed(2)}%` : value.toFixed(4)
const totals = {
  fraud: observations.filter((p) => p.fraud).length,
  legit: observations.filter((p) => !p.fraud).length,
}

function CalibrationPlot() {
  const { t } = useTranslation()
  return (
    <>
      <LineChart
        showPoints
        series={[
          {
            key: "candidate",
            label: t("Candidate model"),
            color: MODEL,
            points: candidate.calibration,
          },
          { key: "lazy", label: t("Lazy model"), color: BASELINE, points: lazy.calibration },
          {
            key: "ideal",
            label: t("Perfect calibration"),
            color: "var(--color-fg-secondary)",
            dashed: true,
            points: [
              { x: 0, y: 0 },
              { x: 1, y: 1 },
            ],
          },
        ]}
        xLabel={t("Estimated fraud probability")}
        yLabel={t("Observed fraud rate")}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="mb-2 text-left text-fg-muted">
            {t("Candidate: non-empty probability bins")}
          </caption>
          <thead>
            <tr>
              <th>{t("Mean estimate")}</th>
              <th>{t("Observed rate")}</th>
              <th>{t("Payments")}</th>
            </tr>
          </thead>
          <tbody>
            {candidate.calibration.map((bin) => (
              <tr key={bin.x} className="border-t border-divider">
                <td>{(100 * bin.x).toFixed(0)}%</td>
                <td>{(100 * bin.y).toFixed(0)}%</td>
                <td>{bin.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function MetricPlot({ metric }: { metric: FairnessMetric }) {
  const { t } = useTranslation()
  if (metric.key === "ece") return <CalibrationPlot />
  if (metric.key === "auc")
    return (
      <LineChart
        series={[
          { key: "candidate", label: t("Candidate model"), color: MODEL, points: candidate.roc },
          {
            key: "lazy",
            label: t("Lazy / chance ranking"),
            color: BASELINE,
            dashed: true,
            points: lazy.roc,
          },
        ]}
        xLabel="FPR"
        yLabel="TPR"
      />
    )
  if (metric.key === "ap") {
    const stepPoints = (points: { x: number; y: number }[]) =>
      points.flatMap((p, i) => [{ x: i ? points[i - 1].x : 0, y: p.y }, p])
    return (
      <LineChart
        series={[
          {
            key: "candidate",
            label: t("Candidate model"),
            color: MODEL,
            points: stepPoints(candidate.pr),
          },
          {
            key: "lazy",
            label: t("Lazy / prevalence baseline"),
            color: BASELINE,
            dashed: true,
            points: [
              { x: 0, y: 0.02 },
              { x: 1, y: 0.02 },
            ],
          },
        ]}
        xLabel={t("Recall")}
        yLabel={t("Precision")}
      />
    )
  }
  const a = lazy[metric.key],
    b = candidate[metric.key]
  return (
    <div className="flex flex-col gap-4">
      <BarChart
        categories={a === null ? [t("Candidate model")] : [t("Lazy model"), t("Candidate model")]}
        series={[
          {
            key: metric.key,
            label: t(metric.name),
            color: MODEL,
            colors: a === null ? [MODEL] : [BASELINE, MODEL],
            values: a === null ? [b ?? 0] : [a, b ?? 0],
          },
        ]}
        yMax={metric.key === "logLoss" ? undefined : 1}
        yLabel={t("Score")}
        showValues
      />
      {a === null && (
        <p className="text-sm text-fg-secondary">
          {t(
            "Lazy precision is undefined: it never raises a fraud alert. It is omitted from the chart, not plotted as zero.",
          )}
        </p>
      )}
      <p className="text-sm text-fg-secondary">{t(metric.note)}</p>
    </div>
  )
}

function MetricWalkthrough({ metric, number }: { metric: FairnessMetric; number: string }) {
  const { t } = useTranslation()
  return (
    <MetricSection
      number={number}
      title={t(metric.name)}
      what={<p>{t(metric.what)}</p>}
      why={<p>{t(metric.why)}</p>}
      formulas={<p>{metric.formula}</p>}
      worked={
        <p>
          {t("Candidate model")}: {metric.worked} ={" "}
          <strong>{valueText(metric.key, candidate[metric.key])}</strong>
        </p>
      }
      range={<p>{t(metric.good)}</p>}
    >
      <MetricPlot metric={metric} />
    </MetricSection>
  )
}

export function ClassificationFairnessLesson({ entry }: { entry: LessonEntry }) {
  const { t } = useTranslation()
  return (
    <LessonArticle entry={entry}>
      <LessonHero line1={t("Classification Fairness")} />
      <LessonLead>
        {t(
          "A good classifier must find the rare class without ignoring errors in the majority class.",
        )}
      </LessonLead>
      <Takeaway>{t("Class imbalance ≠ fairness")}</Takeaway>
      <OptionList
        ordered={false}
        items={[
          t(
            "Class imbalance: one label is rare — for example, 98% legitimate payments and 2% fraud.",
          ),
          t(
            "Demographic fairness: assess how the model’s benefits, errors, and harms are distributed across groups of people.",
          ),
        ]}
      />

      <section className="flex flex-col gap-4" aria-label={t("The problem")}>
        <SectionTitle number="1">{t("The problem: what does an overall score hide?")}</SectionTitle>
        <p className="text-fg-secondary">
          {t(
            "A majority class can dominate the overall score. Representation imbalance may also contribute to unfairness, but class imbalance and demographic unfairness are distinct: neither establishes the other.",
          )}
        </p>
        <OptionList
          items={[
            t("Balanced classes can coexist with unfair outcomes."),
            t("Imbalanced classes can coexist with reasonably fair outcomes."),
            t("Class imbalance can exist without demographic imbalance."),
            t("Demographic imbalance can exist without class imbalance."),
          ]}
        />
        <Takeaway>
          {t(
            "Evaluate each class, inspect the relevant errors, and compare demographic groups when assessing fairness.",
          )}
        </Takeaway>
        <h3 className="font-display text-2xl text-fg">{t("Before choosing a metric")}</h3>
        <OptionList
          items={[
            t("Does evaluation represent the population and fraud prevalence expected in use?"),
            t(
              "Are evaluation examples separate from training and tuning, including customers and time periods?",
            ),
            t(
              "Are there enough fraud examples? Here, one of only 20 frauds changes recall by five percentage points.",
            ),
            t("Which costs matter: missed fraud, false alarms, or investigation workload?"),
            t("Which groups need separate assessment, and how many examples belong to each?"),
          ]}
        />
      </section>

      <section className="flex flex-col gap-4" aria-label={t("Fraud example")}>
        <SectionTitle number="2">{t("The example: 1,000 payments, only 20 frauds")}</SectionTitle>
        <p className="text-fg-secondary">
          {t(
            "Fraud is rare and can resemble a legitimate payment. This synthetic evaluation set contains 980 legitimate payments and 20 frauds. Finding the rare cases without overwhelming investigators with false alarms requires more than an overall accuracy score.",
          )}
        </p>
        <div className="grid items-center gap-6 md:grid-cols-2">
          <BarChart
            categories={[t("Legitimate"), t("Fraud")]}
            series={[
              {
                key: "count",
                label: t("Payments"),
                color: LEGIT,
                colors: [LEGIT, FRAUD],
                values: [totals.legit, totals.fraud],
              },
            ]}
            yLabel={t("Count")}
            showValues
          />
          <DonutChart
            segments={[
              { key: "legit", label: t("Legitimate"), value: totals.legit, color: LEGIT },
              { key: "fraud", label: t("Fraud"), value: totals.fraud, color: FRAUD },
            ]}
            centerLabel={String(observations.length)}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4" aria-label={t("Lazy model")}>
        <SectionTitle number="3">
          {t("The lazy model: 98% accuracy, no fraud detected")}
        </SectionTitle>
        <p className="text-fg-secondary">
          {t(
            "Take the lazy model seriously for a moment: it labels every payment legitimate. It is right on 980 payments, but finding fraud is the reason to build this detector — and it finds none.",
          )}
        </p>
        <div className="grid items-center gap-8 md:grid-cols-2">
          <ConfusionMatrix
            metrics={{ ...lazy, precision: lazy.precision ?? 0 }}
            positive={t("Fraud")}
            negative={t("Legitimate")}
            positiveColor={FRAUD}
            negativeColor={LEGIT}
          />
          <StatRow
            stats={[
              { label: t("Fraud detected"), value: valueText("recall", lazy.recall) },
              {
                label: t("Legitimate classified correctly"),
                value: valueText("specificity", lazy.specificity),
              },
              { label: t("Overall accuracy"), value: valueText("accuracy", lazy.accuracy) },
              {
                label: t("Precision of fraud alerts"),
                value: valueText("precision", lazy.precision),
              },
            ]}
          />
        </div>
        <OptionList
          items={[
            t("Accuracy alone is insufficient: it conceals complete failure on fraud."),
            t("The classifier fails its fraud-detection purpose."),
            t("We need to evaluate both missed fraud and false alarms."),
          ]}
        />
      </section>

      <section className="flex flex-col gap-4" aria-label={t("Candidate model")}>
        <SectionTitle number="4">{t("A detector that finds fraud — with a cost")}</SectionTitle>
        <p className="text-fg-secondary">
          {t(
            "On the same 1,000 payments, the candidate catches 14 of 20 frauds and correctly clears 940 of 980 legitimate payments. Fraud is the positive class. These are illustrative predictions, not the results of training a model on this page.",
          )}
        </p>
        <div className="grid items-center gap-8 md:grid-cols-2">
          <ConfusionMatrix
            metrics={{ ...candidate, precision: candidate.precision ?? 0 }}
            positive={t("Fraud")}
            negative={t("Legitimate")}
            positiveColor={FRAUD}
            negativeColor={LEGIT}
          />
          <StatRow
            stats={[
              { label: t("Fraud detected"), value: valueText("recall", candidate.recall) },
              {
                label: t("Legitimate classified correctly"),
                value: valueText("specificity", candidate.specificity),
              },
              { label: t("Overall accuracy"), value: valueText("accuracy", candidate.accuracy) },
              {
                label: t("Precision of fraud alerts"),
                value: valueText("precision", candidate.precision),
              },
            ]}
          />
        </div>
        <Takeaway>
          {t(
            "The candidate catches fraud, yet accuracy drops from 98% to 95.4%. Only 14 of its 54 alerts are real fraud. Whether that trade-off is acceptable depends on the task.",
          )}
        </Takeaway>
      </section>

      <SectionTitle number="5">{t("Metrics that expose the trade-offs")}</SectionTitle>
      {fairnessMetrics.slice(0, 9).map((metric, i) => (
        <MetricWalkthrough key={metric.key} metric={metric} number={`5.${i + 1}`} />
      ))}

      <section className="flex flex-col gap-4" aria-label={t("Scores behind the predictions")}>
        <SectionTitle number="6">{t("Beyond labels: ranking and probabilities")}</SectionTitle>
        <p className="text-fg-secondary">
          {t(
            "A confusion matrix cannot determine AUC or probability losses. We now reveal four illustrative probability bands for the same candidate. A threshold of 0.5 produces exactly the matrix above; sweeping thresholds produces the curves below.",
          )}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="mb-2 text-left text-fg-muted">
              {t("Illustrative candidate scores")}
            </caption>
            <thead>
              <tr>
                <th>{t("Actual class")}</th>
                <th>{t("Count")}</th>
                <th>{t("Fraud probability estimate")}</th>
                <th>{t("At threshold 0.5")}</th>
              </tr>
            </thead>
            <tbody>
              {scoreBands.map((band) => (
                <tr key={band.score} className="border-t border-divider">
                  <td>{band.fraud ? t("Fraud") : t("Legitimate")}</td>
                  <td>{band.count}</td>
                  <td>{band.score}</td>
                  <td>
                    {band.fraud
                      ? band.score >= 0.5
                        ? "TP"
                        : "FN"
                      : band.score >= 0.5
                        ? "FP"
                        : "TN"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-fg-secondary">
          {t(
            "For probability evaluation, the lazy model assigns 0.02 to every payment: the 2% base rate. At threshold 0.5, it still predicts legitimate every time. This assumption makes its probabilities explicit rather than inventing losses from hard labels.",
          )}
        </p>
      </section>
      {fairnessMetrics.slice(9, 13).map((metric, i) => (
        <MetricWalkthrough key={metric.key} metric={metric} number={`6.${i + 1}`} />
      ))}
      <MetricSection
        number="6.5"
        title={t("Calibration curve")}
        what={
          <p>
            {t(
              "Group probability estimates into ten equal-width bins. Plot mean predicted probability against the observed fraud fraction in each non-empty bin.",
            )}
          </p>
        }
        why={
          <p>
            {t(
              "If a model says 80%, does fraud occur about 80% of the time for those predictions? Here all 14 payments scored 0.8 are fraud. A high ranking score does not ensure reliable probabilities.",
            )}
          </p>
        }
        formulas={<p>x = mean(p); y = fraud count / bin count</p>}
        worked={<p>p = 0.8: 14/14 = 1; |1 − 0.8| = 0.2</p>}
        range={
          <p>
            {t(
              "Closer to the diagonal y = x is better; there is no single curve score. Read bin counts and sampling uncertainty. The constant 2% baseline is calibrated here but cannot rank payments.",
            )}
          </p>
        }
      >
        <CalibrationPlot />
      </MetricSection>
      <MetricWalkthrough metric={fairnessMetrics[13]} number="6.6" />

      <section className="flex flex-col gap-4" aria-label={t("Assessing demographic fairness")}>
        <SectionTitle number="7">{t("What would we need to assess fairness?")}</SectionTitle>
        <p className="text-fg-secondary">
          {t(
            "The class metrics above do not tell us whether groups of people experience different errors or harms. With relevant group labels and enough examples, repeat the evaluation for each group and compare:",
          )}
        </p>
        <OptionList
          items={[
            t("TPR: equal opportunity."),
            t("TPR and FPR: equalized odds."),
            t("Precision: predictive parity."),
            t("Calibration and probability errors separately by group."),
          ]}
        />
        <p className="text-fg-secondary">
          {t(
            "Criteria can conflict, and no single score certifies fairness. Definitions and trade-offs: ",
          )}
          <Link
            to="/learn/$chapter/$lesson"
            params={{ chapter: "machine-learning", lesson: "fairness" }}
            className="text-brand underline"
          >
            {t("Bias & Fairness →")}
          </Link>
        </p>
      </section>

      <section
        className="flex flex-col gap-4"
        aria-label={t("Comparison of Lazy Model and Candidate Model")}
      >
        <SectionTitle number="8">{t("Comparison of Lazy Model and Candidate Model")}</SectionTitle>
        <p className="text-fg-secondary">
          {t(
            "Same 1,000 payments. Label metrics use threshold 0.5; ranking metrics sweep thresholds; probability metrics use the estimates above. A higher or lower score is a direction, not a universal deployment threshold.",
          )}
        </p>
        <div className="overflow-x-auto rounded border border-divider">
          <table className="w-full min-w-[680px] text-left text-sm">
            <caption className="sr-only">{t("Model comparison")}</caption>
            <thead className="bg-surface">
              <tr>
                <th scope="col" rowSpan={2} className="p-3">
                  {t("Metric")}
                </th>
                <th scope="colgroup" colSpan={2} className="p-3 text-center">
                  {t("Performance")}
                </th>
                <th scope="col" rowSpan={2} className="p-3">
                  {t("Interpretation and good score")}
                </th>
              </tr>
              <tr>
                <th scope="col" className="p-3">
                  {t("Lazy model")}
                </th>
                <th scope="col" className="p-3">
                  {t("Candidate model")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {metricRows.map((row) => {
                const info = fairnessMetrics.find((m) => m.key === row.key)
                if (!info) return null
                return (
                  <tr key={row.key}>
                    <th scope="row" className="p-3 font-normal text-fg">
                      {t(info.name)}
                    </th>
                    <td className="p-3 tabular-nums">{valueText(row.key, row.lazy)}</td>
                    <td className="p-3 tabular-nums">{valueText(row.key, row.candidate)}</td>
                    <td className="max-w-md p-3 text-fg-secondary">
                      <p>{t(info.note)}</p>
                      <p className="mt-1 text-xs">{t(info.good)}</p>
                    </td>
                  </tr>
                )
              })}
              <tr>
                <th scope="row" className="p-3 font-normal">
                  {t("Calibration curve")}
                </th>
                <td className="p-3">{t("One point on the diagonal")}</td>
                <td className="p-3">{t("Four bins off the diagonal")}</td>
                <td className="p-3 text-fg-secondary">
                  {t(
                    "Closer to y = x is better. Inspect the diagram and bin counts; a curve is not a scalar score.",
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-4" aria-label={t("Main takeaways")}>
        <SectionTitle number="9">{t("Main takeaways")}</SectionTitle>
        <OptionList
          items={[
            t("Inspect the evaluation distribution before interpreting a score."),
            t(
              "Accuracy alone can hide total failure on a rare class. Read the confusion matrix and both class recalls.",
            ),
            t(
              "Recall, precision, and false-positive rate describe different costs. No single metric selects the right trade-off for every task.",
            ),
            t(
              "Good ranking, good probability estimates, and useful decisions are different properties.",
            ),
            t(
              "Balanced performance across classes does not establish fairness across demographic groups.",
            ),
          ]}
        />
        <div className="overflow-x-auto rounded border border-divider">
          <table className="w-full min-w-[760px] text-left text-sm">
            <caption className="sr-only">{t("Choosing classification metrics")}</caption>
            <thead className="bg-surface">
              <tr>
                {[
                  t("Metric"),
                  t("Balanced data"),
                  t("Imbalanced data"),
                  t("Fairness assessment"),
                  t("Good score"),
                ].map((label) => (
                  <th scope="col" key={label} className="p-3">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {fairnessMetrics.map((metric) => (
                <tr key={metric.key}>
                  <th scope="row" className="p-3 font-normal">
                    {t(metric.name)}
                  </th>
                  <td className="p-3">{t(metric.balanced)}</td>
                  <td className="p-3">{t(metric.imbalanced)}</td>
                  <td className="p-3">{t(metric.fairness)}</td>
                  <td className="p-3">{t(metric.good)}</td>
                </tr>
              ))}
              <tr>
                <th scope="row" className="p-3 font-normal">
                  {t("Calibration curve")}
                </th>
                <td className="p-3">{t("Useful for probability reliability")}</td>
                <td className="p-3">{t("Inspect bin counts and rare outcomes")}</td>
                <td className="p-3">{t("Compare calibration by group")}</td>
                <td className="p-3">y ≈ x</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <p className="text-sm text-fg-muted">
        {t("Synthetic evaluation data; no model is trained here. Metric references: ")}
        <a
          className="underline"
          href="https://scikit-learn.org/stable/modules/model_evaluation.html"
        >
          scikit-learn
        </a>
        {" · "}
        <a
          className="underline"
          href="https://fairlearn.org/main/user_guide/assessment/common_fairness_metrics.html"
        >
          Fairlearn
        </a>
      </p>
      <LessonFooter entry={entry} />
    </LessonArticle>
  )
}

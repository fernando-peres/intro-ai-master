import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { BarChart } from "@/components/charts/bar-chart"
import { LineChart } from "@/components/charts/line-chart"
import { ScatterChart } from "@/components/charts/scatter-chart"
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
  averagePrecision,
  brierScore,
  calibrationCurve,
  classificationMetrics,
  expectedCalibrationError,
  logLoss,
  precisionRecallCurve,
  rocCurve,
} from "@/lib/metrics"
import { ConfusionMatrix } from "./algorithm-card"
import { examResults } from "./classic-datasets"
import { examScores, hours, passed, passProbability } from "./classic-models"
import {
  CheatSheet,
  MetricSection,
  OptionList,
  Slider,
  StatRow,
  Takeaway,
  Worked,
} from "./metric-section"
import { FRAUD_RATE, PAYMENT_COUNT, paymentFraud, paymentScores } from "./payments"

const BRAND = "var(--color-brand)"
const COOL = "var(--color-chart-cool)"
const FG = "var(--color-fg)"

const thresholds = Array.from({ length: 19 }, (_, i) => Number((0.05 + i * 0.05).toFixed(2)))
const byThreshold = thresholds.map((t) => ({ t, m: classificationMetrics(passed, examScores, t) }))
const bestF1 = byThreshold.reduce((a, b) => (b.m.f1 > a.m.f1 ? b : a))
const roc = rocCurve(passed, examScores)
const pr = precisionRecallCurve(passed, examScores)
const ap = averagePrecision(passed, examScores)
const prevalence = passed.filter(Boolean).length / passed.length
const modelLogLoss = logLoss(passed, examScores)
const positives = passed.filter(Boolean).length
const negatives = passed.length - positives
const examAuc = classificationMetrics(passed, examScores).auc
/** The non-zero terms of AP = Σ (Rₙ − Rₙ₋₁)·Pₙ, for the worked example. */
const apTerms = (() => {
  let previous = 0
  return pr.flatMap((point) => {
    const step = point.x - previous
    previous = point.x
    return step > 0 ? [{ step, precision: point.y }] : []
  })
})()
const firstStudent = { hours: hours[0], passed: passed[0], p: examScores[0] }
const lastStudent = {
  hours: hours[hours.length - 1],
  passed: passed[passed.length - 1],
  p: examScores[examScores.length - 1],
}

/** 1,000 card payments, 10 of them fraud, and a "model" that always answers "not fraud". */
const fraudActual = Array.from({ length: 1000 }, (_, i) => i < 10)
const lazy = classificationMetrics(
  fraudActual,
  fraudActual.map(() => 0),
)

/** The synthetic payments: a lazy always-"not fraud" model vs. the scored fraud model. */
const paymentLazy = classificationMetrics(
  paymentFraud,
  paymentFraud.map(() => 0),
)
const paymentModel = classificationMetrics(paymentFraud, paymentScores)
const firstFraud = paymentScores[paymentFraud.indexOf(true)]
const firstLegit = paymentScores[paymentFraud.indexOf(false)]
const middleBin = calibrationCurve(paymentFraud, paymentScores).find((b) => b.x >= 0.5 && b.x < 0.6)
const imbalanceMetrics = [
  { name: "Accuracy", lazy: paymentLazy.accuracy, model: paymentModel.accuracy },
  { name: "Bal. acc.", lazy: paymentLazy.balancedAccuracy, model: paymentModel.balancedAccuracy },
  { name: "F1", lazy: paymentLazy.f1, model: paymentModel.f1 },
  { name: "MCC", lazy: paymentLazy.mcc, model: paymentModel.mcc },
  { name: "ROC AUC", lazy: paymentLazy.auc, model: paymentModel.auc },
  {
    name: "PR AUC",
    lazy: averagePrecision(
      paymentFraud,
      paymentFraud.map(() => 0),
    ),
    model: averagePrecision(paymentFraud, paymentScores),
  },
]
const imbalanceGuide = [
  {
    metric: "Precision, recall, F1, Fβ",
    why: "They focus on the rare positive class; Fβ lets you weigh recall or precision.",
  },
  {
    metric: "PR AUC (average precision)",
    why: "More informative than ROC AUC when negatives dominate.",
  },
  {
    metric: "ROC AUC",
    why: "Still useful for ranking, but can look optimistic when negatives dominate.",
  },
  { metric: "MCC", why: "One summary number built from all four confusion-matrix cells." },
  {
    metric: "Balanced accuracy",
    why: "Each class counts equally: the mean of recall and specificity.",
  },
  { metric: "Specificity (TNR)", why: "When false positives are costly." },
  { metric: "Recall (sensitivity, TPR)", why: "When missing a positive is costly." },
  {
    metric: "Log loss, Brier score",
    why: "They judge the probabilities, not just the final yes/no.",
  },
  {
    metric: "Calibration curve, ECE",
    why: "When the predicted probabilities themselves are used.",
  },
]

const pct = (v: number) => `${Math.round(v * 100)}%`
const f2 = (v: number) => v.toFixed(2)

export function ClassificationMetricsLesson({ entry }: { entry: LessonEntry }) {
  const { t } = useTranslation()
  const [threshold, setThreshold] = useState(0.5)
  const m = classificationMetrics(passed, examScores, threshold)
  const fpr = m.fp / (m.fp + m.tn)

  return (
    <LessonArticle entry={entry}>
      <LessonHero line1={t("Classification")} line2={t("metrics")} />
      <LessonLead>
        {t(
          'A classifier answers "which category?" — and every answer is either right or wrong. But not all wrong answers cost the same:',
        )}
      </LessonLead>
      <OptionList
        ordered={false}
        items={[
          t("missing a fraud (a false negative) is one mistake;"),
          t("flagging an honest customer (a false positive) is another."),
        ]}
      />
      <Takeaway>{t("Each metric below counts the mistakes a different way.")}</Takeaway>
      <p className="text-fg-secondary">
        {t(
          "The running example is the exam model from ML Components: logistic regression turns hours studied into a probability of passing, for ",
        )}
        {examResults.length} {t(" students. A probability only becomes a yes/no once you pick a ")}
        <span className="text-fg">{t("threshold")}</span>{" "}
        {t(" — drag it and watch sections 1–6 change. ")}
      </p>
      <Slider
        label={t("Threshold")}
        value={threshold}
        min={0.05}
        max={0.95}
        step={0.05}
        onChange={setThreshold}
        format={pct}
      />

      <MetricSection
        number="1"
        worked={
          <p>
            total = TP + FN + FP + TN = {m.tp} + {m.fn} + {m.fp} + {m.tn} ={" "}
            {m.tp + m.fn + m.fp + m.tn}
          </p>
        }
        title={t("Confusion matrix")}
        what={
          <p>
            {t(
              "Every prediction lands in one of four boxes: a true positive (TP, a pass predicted as pass), a false negative (FN, a pass missed), a false positive (FP, a fail predicted as pass) or a true negative (TN). ",
            )}
          </p>
        }
        why={
          <p>
            {t(
              "Every other classification metric is a ratio of these four counts. Look at the matrix first: it shows ",
            )}
            <em>{t("which")}</em> {t(" mistakes the model makes, not just how many. ")}
          </p>
        }
        formulas={<p>total = TP + FN + FP + TN</p>}
      >
        <ScatterChart
          points={examResults.map((r) => ({
            x: r.hours,
            y: r.passed * 100,
            series: r.passed ? "pass" : "fail",
          }))}
          series={[
            { key: "fail", label: "Failed", color: BRAND },
            { key: "pass", label: "Passed", color: COOL },
          ]}
          xLabel={t("Hours studied")}
          yLabel="P(pass) %"
          lines={[
            {
              points: Array.from({ length: 61 }, (_, i) => ({
                x: i / 10,
                y: passProbability(i / 10) * 100,
              })),
              label: "p",
            },
            {
              points: [
                { x: 0, y: threshold * 100 },
                { x: 6, y: threshold * 100 },
              ],
              label: t("threshold"),
              dashed: true,
            },
          ]}
        />
        <ConfusionMatrix metrics={m} positive={t("pass")} negative={t("fail")} />
      </MetricSection>

      <MetricSection
        number="2"
        worked={
          <>
            <p>
              accuracy = ({m.tp} + {m.tn}) / {passed.length} = {f2(m.accuracy)}
            </p>
            <p>
              {t("lazy fraud model: ")}({lazy.tp} + {lazy.tn}) / 1000 = {f2(lazy.accuracy)}
            </p>
          </>
        }
        title={t("Accuracy")}
        what={<p>{t("The share of all predictions that are correct.")}</p>}
        why={
          <p>
            {t(
              "Easy to read, and fine when classes are balanced and mistakes cost the same. With rare classes it lies: of 1,000 payments with 10 frauds, a model that ",
            )}
            <em>{t("always")}</em> {t(' says "not fraud" is ')}
            {pct(lazy.accuracy)} {t(" accurate — and catches none of them. ")}
          </p>
        }
        formulas={<p>accuracy = (TP + TN) / (TP + TN + FP + FN)</p>}
      >
        <StatRow
          stats={[{ label: t("exam model at {0}", [pct(threshold)]), value: f2(m.accuracy) }]}
        />
        <BarChart
          categories={[t("Accuracy"), t("Precision"), t("Recall"), "F1"]}
          series={[
            {
              key: "lazy",
              label: t('Fraud: always "not fraud"'),
              color: BRAND,
              values: [lazy.accuracy, lazy.precision, lazy.recall, lazy.f1],
            },
          ]}
          yLabel="Score"
          yMax={1}
          showValues
        />
      </MetricSection>

      <MetricSection
        number="3"
        worked={
          <>
            <p>
              precision = {m.tp} / ({m.tp} + {m.fp}) = {f2(m.precision)}
            </p>
            <p>
              recall = {m.tp} / ({m.tp} + {m.fn}) = {f2(m.recall)}
            </p>
          </>
        }
        title={t("Precision and recall")}
        what={
          <p>
            <span className="text-fg">{t("Precision")}</span>
            {t(": of everything predicted positive, how much really is. ")}
            <span className="text-fg">{t("Recall")}</span>{" "}
            {t(
              " (sensitivity, true-positive rate): of everything really positive, how much was caught. ",
            )}
          </p>
        }
        why={
          <p>
            {t(
              'They pull against each other. Raise the threshold and the model only says "pass" when sure: precision rises, recall falls. Favour precision when false alarms are costly (spam filters), recall when misses are (cancer screening). ',
            )}
          </p>
        }
        formulas={
          <>
            <p>precision = TP / (TP + FP)</p>
            <p>recall = TP / (TP + FN)</p>
          </>
        }
      >
        <StatRow
          stats={[
            { label: "precision", value: f2(m.precision) },
            { label: "recall", value: f2(m.recall) },
          ]}
        />
        <LineChart
          series={[
            {
              key: "precision",
              label: "precision",
              color: COOL,
              points: byThreshold.map(({ t, m }) => ({ x: t, y: m.precision })),
            },
            {
              key: "recall",
              label: "recall",
              color: BRAND,
              points: byThreshold.map(({ t, m }) => ({ x: t, y: m.recall })),
            },
          ]}
          xLabel={t("Threshold")}
          yLabel="Score"
          vLines={[{ x: threshold, label: "now" }]}
        />
      </MetricSection>

      <MetricSection
        number="4"
        worked={
          <p>
            F1 = 2·{f2(m.precision)}·{f2(m.recall)} / ({f2(m.precision)} + {f2(m.recall)}) ={" "}
            {f2(m.f1)}
          </p>
        }
        title={t("F1 score")}
        what={
          <p>
            {t("The harmonic mean of precision and recall — high only when ")}
            <em>{t("both")}</em>{" "}
            {t(
              " are high. Fβ generalizes it: β > 1 weighs recall more, β < 1 weighs precision more. ",
            )}
          </p>
        }
        why={
          <p>
            {t(
              "One number to compare models or pick a threshold when you care about both kinds of mistake. Here F1 peaks at a threshold of ",
            )}
            {pct(bestF1.t)} ({f2(bestF1.m.f1)}
            {t(
              "). With more than two classes, average per-class F1 equally (macro) or pool every decision (micro). ",
            )}
          </p>
        }
        formulas={
          <>
            <p>F1 = 2·P·R / (P + R)</p>
            <p>Fβ = (1 + β²)·P·R / (β²·P + R)</p>
          </>
        }
      >
        <StatRow stats={[{ label: "F1", value: f2(m.f1) }]} />
        <LineChart
          series={[
            {
              key: "f1",
              label: "F1",
              color: FG,
              points: byThreshold.map(({ t, m }) => ({ x: t, y: m.f1 })),
            },
          ]}
          xLabel={t("Threshold")}
          yLabel="F1"
          vLines={[
            { x: threshold, label: "now" },
            { x: bestF1.t, label: "best" },
          ]}
        />
      </MetricSection>

      <MetricSection
        number="5"
        worked={
          <>
            <p>
              specificity = {m.tn} / ({m.tn} + {m.fp}) = {f2(m.specificity)}
            </p>
            <p>
              balanced accuracy = ({f2(m.recall)} + {f2(m.specificity)}) / 2 ={" "}
              {f2(m.balancedAccuracy)}
            </p>
          </>
        }
        title={t("Specificity and balanced accuracy")}
        what={
          <p>
            <span className="text-fg">{t("Specificity")}</span>
            {t(
              " (true-negative rate): of everything really negative, how much was correctly left alone. ",
            )}
            <span className="text-fg">{t("Balanced accuracy")}</span>
            {t(": the average of recall and specificity.")}
          </p>
        }
        why={
          <p>
            {t(
              "Plain accuracy is dominated by whichever class is bigger. Balanced accuracy gives each class an equal vote, so a model that ignores the rare class scores 0.5 — chance — however lopsided the data.",
            )}
          </p>
        }
        formulas={
          <>
            <p>specificity = TN / (TN + FP)</p>
            <p>balanced accuracy = (recall + specificity) / 2</p>
          </>
        }
      >
        <StatRow
          stats={[
            { label: t("specificity"), value: f2(m.specificity) },
            { label: t("balanced accuracy"), value: f2(m.balancedAccuracy) },
          ]}
        />
        <LineChart
          series={[
            {
              key: "specificity",
              label: t("specificity"),
              color: COOL,
              points: byThreshold.map(({ t, m }) => ({ x: t, y: m.specificity })),
            },
            {
              key: "balanced",
              label: t("balanced accuracy"),
              color: FG,
              points: byThreshold.map(({ t, m }) => ({ x: t, y: m.balancedAccuracy })),
            },
          ]}
          xLabel={t("Threshold")}
          yLabel={t("Score")}
          vLines={[{ x: threshold, label: t("now") }]}
        />
      </MetricSection>

      <MetricSection
        number="6"
        worked={
          <>
            <p>
              MCC = ({m.tp}·{m.tn} − {m.fp}·{m.fn}) / √(({m.tp}+{m.fp})({m.tp}+{m.fn})({m.tn}+{m.fp}
              )({m.tn}+{m.fn}))
            </p>
            <p>
              = {m.tp * m.tn - m.fp * m.fn} /{" "}
              {Math.sqrt((m.tp + m.fp) * (m.tp + m.fn) * (m.tn + m.fp) * (m.tn + m.fn)).toFixed(1)}{" "}
              = {f2(m.mcc)}
            </p>
          </>
        }
        title={t("Matthews correlation coefficient (MCC)")}
        what={
          <p>
            {t(
              "The correlation between predicted and actual labels, from −1 (always wrong) through 0 (no better than chance) to 1 (perfect). It uses all four cells of the confusion matrix.",
            )}
          </p>
        }
        why={
          <p>
            {t(
              'F1 ignores true negatives and accuracy is swamped by them; MCC is high only when the model does well on both classes. That makes it one of the most reliable single numbers for imbalanced data: the always-"not fraud" model above scores ',
            )}
            {f2(lazy.mcc)}
            {t(", despite its 99% accuracy.")}
          </p>
        }
        formulas={<p>MCC = (TP·TN − FP·FN) / √((TP+FP)(TP+FN)(TN+FP)(TN+FN))</p>}
      >
        <StatRow stats={[{ label: "MCC", value: f2(m.mcc) }]} />
        <LineChart
          series={[
            {
              key: "mcc",
              label: "MCC",
              color: BRAND,
              points: byThreshold.map(({ t, m }) => ({ x: t, y: m.mcc })),
            },
          ]}
          xLabel={t("Threshold")}
          yLabel="MCC"
          vLines={[{ x: threshold, label: t("now") }]}
        />
      </MetricSection>

      <MetricSection
        number="7"
        worked={
          <>
            <p>
              TPR = {m.tp} / ({m.tp} + {m.fn}) = {f2(m.recall)}, FPR = {m.fp} / ({m.fp} + {m.tn}) ={" "}
              {f2(fpr)}
            </p>
            <p>
              AUC = {(examAuc * positives * negatives).toFixed(1)} / ({positives}·{negatives}){" "}
              {t("winning pass–fail pairs")} = {f2(examAuc)}
            </p>
          </>
        }
        title={t("ROC curve and AUC")}
        what={
          <p>
            {t("The ROC curve plots the true-positive rate against the false-positive rate for")}{" "}
            <em>{t("every")}</em>{" "}
            {t(
              " threshold at once. AUC is the area under it: the chance that a random student who passed gets a higher score than a random one who failed. ",
            )}
          </p>
        }
        why={
          <p>
            {t(
              "It judges the scores themselves, before any threshold is picked. 0.5 is a coin flip (the dashed diagonal), 1 is a perfect ranking; this model reaches",
            )}{" "}
            {f2(classificationMetrics(passed, examScores).auc)}
            {t(". Your current threshold sits at FPR")} {f2(fpr)}.
          </p>
        }
        formulas={
          <>
            <p>TPR = TP / (TP + FN), FPR = FP / (FP + TN)</p>
            <p>AUC = P(score⁺ &gt; score⁻)</p>
          </>
        }
      >
        <LineChart
          series={[
            { key: "roc", label: "ROC", color: COOL, points: roc },
            {
              key: "chance",
              label: t("coin flip"),
              color: "var(--color-fg-muted)",
              dashed: true,
              points: [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
              ],
            },
          ]}
          xLabel={t("False-positive rate")}
          yLabel={t("True-positive rate")}
          vLines={[{ x: fpr, label: "now" }]}
        />
      </MetricSection>

      <MetricSection
        number="8"
        worked={
          <p>
            AP = {apTerms.map((term) => `${f2(term.step)}·${f2(term.precision)}`).join(" + ")} ={" "}
            {f2(ap)}
          </p>
        }
        title={t("Precision–recall curve and average precision")}
        what={
          <p>
            {t(
              "Precision against recall across every threshold. Average precision (AP) summarizes it as one area, like AUC does for ROC. ",
            )}
          </p>
        }
        why={
          <p>
            {t(
              "ROC can look flattering when negatives vastly outnumber positives, because the false-positive rate barely moves. The PR curve ignores true negatives, so it shows how a rare-class detector really performs. A random model scores the positive rate ( ",
            )}
            {f2(prevalence)}
            {t(", dashed); this one reaches AP ")}
            {f2(ap)}.
          </p>
        }
        formulas={<p>AP = Σₙ (Rₙ − Rₙ₋₁)·Pₙ</p>}
      >
        <LineChart
          series={[
            { key: "pr", label: t("precision–recall"), color: COOL, points: pr },
            {
              key: "baseline",
              label: t("random model"),
              color: "var(--color-fg-muted)",
              dashed: true,
              points: [
                { x: 0, y: prevalence },
                { x: 1, y: prevalence },
              ],
            },
          ]}
          xLabel={t("Recall")}
          yLabel={t("Precision")}
        />
      </MetricSection>

      <MetricSection
        number="9"
        worked={
          <>
            <p>
              {t("{0} h, failed: ", [firstStudent.hours])}−ln(1 − {f2(firstStudent.p)}) ={" "}
              {f2(-Math.log(1 - firstStudent.p))}
            </p>
            <p>
              {t("{0} h, passed: ", [lastStudent.hours])}−ln({f2(lastStudent.p)}) ={" "}
              {f2(-Math.log(lastStudent.p))}
            </p>
            <p>
              log loss = ({t("sum of all")} {passed.length}) / {passed.length} ={" "}
              {(modelLogLoss * passed.length).toFixed(2)} / {passed.length} = {f2(modelLogLoss)}
            </p>
          </>
        }
        title={t("Log loss")}
        what={
          <p>
            {t(
              "How much probability the model gave to the true answer, on a log scale — the same cross-entropy that training minimizes. ",
            )}
          </p>
        }
        why={
          <p>
            {t("It rewards being right ")}
            <em>{t("and")}</em>{" "}
            {t(
              " calibrated: a confident wrong answer (p near 0 for what happened) costs almost unboundedly. Always guessing 50% scores ln 2 ≈ 0.69; this model scores ",
            )}
            {f2(modelLogLoss)}
            {t(". Lower is better. ")}
          </p>
        }
        formulas={<p>log loss = −(1/n)·Σ[y·ln p + (1 − y)·ln(1 − p)]</p>}
      >
        <LineChart
          series={[
            {
              key: "penalty",
              label: t("penalty for the true class"),
              color: BRAND,
              points: Array.from({ length: 50 }, (_, i) => {
                const p = 0.02 + i * 0.02
                return { x: p, y: -Math.log(p) }
              }),
            },
          ]}
          xLabel={t("Probability given to what actually happened")}
          yLabel="−ln p"
        />
        <StatRow
          stats={[
            { label: t("this model"), value: f2(modelLogLoss) },
            { label: t("always 50%"), value: f2(Math.log(2)) },
          ]}
        />
      </MetricSection>

      <MetricSection
        number="10"
        worked={
          <>
            <p>
              {t("a fraud scored {0}: ", [f2(firstFraud)])}({f2(firstFraud)} − 1)² ={" "}
              {((firstFraud - 1) ** 2).toFixed(3)}
            </p>
            <p>
              {t("a legit payment scored {0}: ", [f2(firstLegit)])}({f2(firstLegit)} − 0)² ={" "}
              {(firstLegit ** 2).toFixed(3)}
            </p>
            <p>
              Brier = ({t("sum of all")} {PAYMENT_COUNT}) / {PAYMENT_COUNT} ={" "}
              {brierScore(paymentFraud, paymentScores).toFixed(3)}
            </p>
            {middleBin && (
              <p>
                {t("bin around {0}: ", [f2(middleBin.x)])}
                {Math.round(middleBin.y * middleBin.count)} / {middleBin.count} {t("were fraud")} ={" "}
                {f2(middleBin.y)} {t("(gap")} {f2(Math.abs(middleBin.x - middleBin.y))})
              </p>
            )}
          </>
        }
        title={t("Brier score and calibration")}
        what={
          <p>
            {t(
              "Brier score: the mean squared gap between each predicted probability and what happened (1 or 0). A calibration curve groups predictions by confidence and plots how often the positive class actually occurred; expected calibration error (ECE) averages the gap.",
            )}
          </p>
        }
        why={
          <p>
            {t(
              "Ranking well and being calibrated are different skills. The fraud model below ranks payments almost perfectly (ROC AUC ",
            )}
            {f2(paymentModel.auc)}
            {t(
              "), yet its scores are not probabilities: payments it scores around 50% are fraud far less often. Calibrate before you treat a score as a probability — and check calibration per group when fairness matters.",
            )}
          </p>
        }
        formulas={
          <>
            <p>Brier = (1/n)·Σ(pᵢ − yᵢ)²</p>
            <p>ECE = Σ_bins (|bin|/n)·|mean p − positive rate|</p>
          </>
        }
      >
        <StatRow
          stats={[
            { label: t("Brier score"), value: brierScore(paymentFraud, paymentScores).toFixed(3) },
            { label: "ECE", value: f2(expectedCalibrationError(paymentFraud, paymentScores)) },
          ]}
        />
        <LineChart
          series={[
            {
              key: "calibration",
              label: t("fraud model"),
              color: BRAND,
              points: calibrationCurve(paymentFraud, paymentScores).map(({ x, y }) => ({ x, y })),
            },
            {
              key: "perfect",
              label: t("perfectly calibrated"),
              color: "var(--color-fg-muted)",
              dashed: true,
              points: [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
              ],
            },
          ]}
          xLabel={t("Predicted probability")}
          yLabel={t("Observed fraud rate")}
        />
      </MetricSection>

      <section
        aria-label={t("Balanced vs. imbalanced data — and fairness")}
        className="flex flex-col gap-4"
      >
        <SectionTitle number="11">{t("Balanced vs. imbalanced data — and fairness")}</SectionTitle>
        <p className="text-fg-secondary">
          {t("A dataset is imbalanced when one class is rare. In ")}
          {PAYMENT_COUNT} {t(" illustrative card payments, ")}
          {pct(FRAUD_RATE)}
          {t(" are fraud. Two models:")}
        </p>
        <OptionList
          items={[
            t('a lazy model that always answers "not fraud";'),
            t("a real fraud model that scores every payment."),
          ]}
        />
        <BarChart
          categories={imbalanceMetrics.map((r) => r.name)}
          series={[
            {
              key: "lazy",
              label: t('Always "not fraud"'),
              color: "var(--color-fg-muted)",
              values: imbalanceMetrics.map((r) => r.lazy),
            },
            {
              key: "model",
              label: t("Fraud model"),
              color: BRAND,
              values: imbalanceMetrics.map((r) => r.model),
            },
          ]}
          yLabel={t("Score")}
          yMax={1}
          showValues
        />
        <p className="text-fg-secondary">
          {t(
            "Accuracy barely separates them, and ROC AUC flatters the real model. Balanced accuracy, MCC, F1 and PR AUC tell the honest story: the lazy model is useless, and the real one still misses or mis-flags a lot of the rare class.",
          )}
        </p>
        <Worked>
          <p>
            {t("lazy: ")}accuracy = ({paymentLazy.tp} + {paymentLazy.tn}) / {PAYMENT_COUNT} ={" "}
            {f2(paymentLazy.accuracy)}
          </p>
          <p>
            {t("lazy: ")}balanced accuracy = ({f2(paymentLazy.recall)} +{" "}
            {f2(paymentLazy.specificity)}) / 2 = {f2(paymentLazy.balancedAccuracy)}
          </p>
          <p>
            {t("lazy: ")}MCC = ({paymentLazy.tp}·{paymentLazy.tn} − {paymentLazy.fp}·
            {paymentLazy.fn}) / √(0·…) → {f2(paymentLazy.mcc)}{" "}
            {t("(no positive predictions: defined as 0)")}
          </p>
          <p>
            {t("model: ")}MCC = ({paymentModel.tp}·{paymentModel.tn} − {paymentModel.fp}·
            {paymentModel.fn}) / √(({paymentModel.tp}+{paymentModel.fp})({paymentModel.tp}+
            {paymentModel.fn})({paymentModel.tn}+{paymentModel.fp})({paymentModel.tn}+
            {paymentModel.fn})) = {f2(paymentModel.mcc)}
          </p>
        </Worked>
        <div className="overflow-x-auto rounded-[3px] border border-divider">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface">
              <tr className="label-ui text-fg-muted">
                <th className="px-4 py-2 font-normal">{t("On imbalanced data, use")}</th>
                <th className="px-4 py-2 font-normal">{t("Because")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider text-fg-secondary">
              {imbalanceGuide.map((row) => (
                <tr key={row.metric}>
                  <td className="px-4 py-2 font-ui text-fg">{t(row.metric)}</td>
                  <td className="px-4 py-2">{t(row.why)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 rounded-[3px] border border-divider bg-surface p-4">
          <p className="font-display text-xl text-fg">{t("Class imbalance ≠ fairness")}</p>
          <OptionList
            ordered={false}
            items={[
              <>
                <span className="text-fg">{t("Class imbalance")}</span>
                {t(": one class is rare — e.g. 95% negative, 5% positive.")}
              </>,
              <>
                <span className="text-fg">{t("Fairness")}</span>
                {t(
                  ": the model behaves differently for different groups of people — e.g. TPR 90% for group A, 60% for group B.",
                )}
              </>,
            ]}
          />
          <p className="text-sm text-fg-secondary">{t("They are independent. You can have:")}</p>
          <OptionList
            items={[
              t("a perfectly balanced dataset that is still unfair;"),
              t("an imbalanced dataset that is reasonably fair;"),
              t("class imbalance without demographic imbalance;"),
              t("demographic imbalance without class imbalance."),
            ]}
          />
          <p className="text-sm text-fg-secondary">
            {t(
              "To evaluate fairness, compute the metrics on this page per group and compare them: TPR (equal opportunity), TPR and FPR (equalized odds), precision (predictive parity), and calibration or log loss per group — a model can be well calibrated overall and badly calibrated for a minority group. See ",
            )}
            <Link
              to="/learn/$chapter/$lesson"
              params={{ chapter: "machine-learning", lesson: "fairness" }}
              className="text-brand hover:text-brand-soft"
            >
              {t("Bias & Fairness →")}
            </Link>
          </p>
          <Takeaway>
            {t(
              "Representation imbalance can contribute to unfairness, but it is not the same thing as unfairness.",
            )}
          </Takeaway>
        </div>
      </section>

      <CheatSheet
        number="12"
        rows={[
          {
            metric: t("Accuracy"),
            question: t("How often is it right?"),
            use: t("Classes are balanced and mistakes cost the same."),
          },
          {
            metric: t("Precision"),
            question: t("When it says yes, is it right?"),
            use: t("False alarms are expensive (spam, recommendations)."),
          },
          {
            metric: t("Recall"),
            question: t("Does it find all the positives?"),
            use: t("Misses are expensive (disease, fraud, safety)."),
          },
          {
            metric: "F1 / Fβ",
            question: t("Balance of precision and recall?"),
            use: t("Both errors matter; one number to tune a threshold."),
          },
          {
            metric: "ROC AUC",
            question: t("Does it rank positives above negatives?"),
            use: t("Comparing models before choosing a threshold."),
          },
          {
            metric: t("Average precision"),
            question: t("How good is it on the rare class?"),
            use: t("Heavy class imbalance."),
          },
          {
            metric: t("Log loss"),
            question: t("Are its probabilities trustworthy?"),
            use: t("The probabilities themselves drive decisions."),
          },
          {
            metric: t("Balanced accuracy"),
            question: t("Is it right on both classes?"),
            use: t("Imbalanced classes; an accuracy you can still read."),
          },
          {
            metric: "MCC",
            question: t("One number using all four outcomes?"),
            use: t("Imbalanced classes; comparing models fairly."),
          },
          {
            metric: t("Brier / calibration"),
            question: t("Do its probabilities match reality?"),
            use: t("Scores are used as probabilities, or compared across groups."),
          },
        ]}
      />

      <p className="text-sm text-fg-muted">
        {t("Data: ")}
        {hours.length}{" "}
        {t(
          ' students, hours studied vs. passing (Wikipedia, "Logistic regression"). The fraud examples are synthetic, constructed to show the imbalance traps. ',
        )}
      </p>

      <LessonFooter entry={entry} />
    </LessonArticle>
  )
}

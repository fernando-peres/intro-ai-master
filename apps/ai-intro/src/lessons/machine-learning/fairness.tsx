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
import { FairnessSummary } from "./fairness-summary"
import {
  applicants,
  groupMetrics,
  modelVariants,
  scoreHistogram,
  splitScores,
} from "./loan-applicants"
import { CheatSheet, MetricSection, OptionList, Slider, StatRow, Takeaway } from "./metric-section"

const A = "var(--color-chart-cool)"
const B = "var(--color-brand)"
const FG = "var(--color-fg)"
const MUTED = "var(--color-fg-muted)"
const VARIANT_COLORS = [A, B, "var(--color-fg-secondary)", "var(--color-fg)"]

const thresholds = Array.from({ length: 13 }, (_, i) => Number((0.2 + i * 0.05).toFixed(2)))
const gaps = thresholds.map((t) => {
  const [a, b] = [groupMetrics("A", t), groupMetrics("B", t)]
  return {
    t,
    parity: Math.abs(a.selectionRate - b.selectionRate),
    opportunity: Math.abs(a.tpr - b.tpr),
    predictive: Math.abs(a.precision - b.precision),
  }
})

const pct = (v: number) => `${Math.round(v * 100)}%`
const f2 = (v: number) => v.toFixed(2)

const sources = [
  {
    name: "Historical bias",
    body: "The world the data records was already unequal; a faithful model reproduces it.",
  },
  {
    name: "Representation bias",
    body: "Some groups are under-sampled, so the model learns them less well.",
  },
  {
    name: "Measurement bias",
    body: "Features or labels are proxies that work worse for some groups — like a credit score built on history some people never had.",
  },
  {
    name: "Aggregation bias",
    body: "One model for everyone, when the pattern genuinely differs between groups.",
  },
  {
    name: "Evaluation bias",
    body: "Benchmarks or metrics that don't reflect the people the model will serve.",
  },
]

export function FairnessLesson({ entry }: { entry: LessonEntry }) {
  const { t } = useTranslation()
  const [threshold, setThreshold] = useState(0.5)
  const a = groupMetrics("A", threshold)
  const b = groupMetrics("B", threshold)
  const disparateImpact = a.selectionRate ? b.selectionRate / a.selectionRate : 0
  const groupBars = (label: string, pick: (m: typeof a) => number[]) => [
    { key: "A", label: t("Group A {0}", [t(label)]).trim(), color: A, values: pick(a) },
    { key: "B", label: t("Group B {0}", [t(label)]).trim(), color: B, values: pick(b) },
  ]

  return (
    <LessonArticle entry={entry}>
      <LessonHero line1={t("Bias &")} line2={t("fairness")} />
      <LessonLead>
        {t(
          '"Bias" also has an everyday meaning: a model that treats groups of people differently. A model can be accurate overall and still:',
        )}
      </LessonLead>
      <OptionList
        ordered={false}
        items={[
          t("approve one group far less often, or"),
          t("miss far more of one group's qualified members."),
        ]}
      />
      <Takeaway>
        {t(
          "Fairness metrics make those differences measurable — and show that they can't all be zero at once.",
        )}
      </Takeaway>

      <section aria-label={t("Accuracy and fairness at a glance")} className="flex flex-col gap-4">
        <p className="text-fg-secondary">
          {t(
            "Does the model make comparable decisions for different groups? Accuracy and fairness are separate questions, so a model can get either one right without the other:",
          )}
        </p>
        <FairnessSummary />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <blockquote className="border-l-2 border-brand pl-4 text-fg-secondary">
            <span className="font-display text-xl text-fg">{t("Bias")}</span>{" "}
            {t(
              "— a systematic error that makes a model's decisions depend on who you are, not only on the evidence about you.",
            )}
          </blockquote>
          <blockquote className="border-l-2 border-chart-cool pl-4 text-fg-secondary">
            <span className="font-display text-xl text-fg">{t("Fairness")}</span>{" "}
            {t(
              "— comparable decisions and error rates across groups. Which comparison counts (approval rates, TPR, FPR, precision) is a choice this lesson makes explicit.",
            )}
          </blockquote>
        </div>
        <div className="flex flex-col gap-2 rounded-[3px] border border-divider bg-surface p-4">
          <p className="font-display text-lg text-fg">{t("Class imbalance ≠ fairness")}</p>
          <OptionList
            ordered={false}
            items={[
              t(
                'Imbalanced data asks: "Is one class under-represented?" (e.g. 95% negative, 5% positive).',
              ),
              t(
                'Fairness asks: "Does the model treat different groups comparably?" (e.g. TPR 90% for group A, 60% for group B).',
              ),
            ]}
          />
          <p className="text-sm text-fg-secondary">
            {t(
              "Representation imbalance can contribute to unfairness, but it is not the same thing. Metrics for imbalanced data are in ",
            )}
            <Link
              to="/learn/$chapter/$lesson"
              params={{ chapter: "machine-learning", lesson: "classification-metrics" }}
              className="text-brand hover:text-brand-soft"
            >
              {t("Classification metrics →")}
            </Link>
          </p>
        </div>
      </section>
      <p className="text-fg-secondary">
        {t("The running example is synthetic and illustrative: ")}
        {applicants.length}{" "}
        {t(
          " loan applicants from two groups, A and B, each with a credit score from 0 to 1. Group A repaid",
        )}{" "}
        {pct(groupMetrics("A", 0.5).baseRate)} {t(" of the time, group B")}{" "}
        {pct(groupMetrics("B", 0.5).baseRate)}
        {t(
          ", and the score under-rates B's repayers. The bank approves everyone above one threshold — drag it and watch every metric move. ",
        )}
      </p>

      <section aria-label={t("Where bias comes from")} className="flex flex-col gap-4">
        <SectionTitle number="1">{t("Where bias comes from")}</SectionTitle>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_1.25fr]">
          <ul className="flex flex-col gap-2">
            {sources.map((s) => (
              <li key={s.name} className="flex gap-3 text-sm">
                <span aria-hidden className="text-brand">
                  —
                </span>
                <span className="text-fg-secondary">
                  <span className="text-fg">{t(s.name)}.</span> {t(s.body)}
                </span>
              </li>
            ))}
            <li className="text-xs text-fg-muted">{t("After Suresh & Guttag (2021).")}</li>
          </ul>
          <LineChart
            series={[
              { key: "a", label: t("Group A repaid"), color: A, points: scoreHistogram("A", true) },
              { key: "b", label: t("Group B repaid"), color: B, points: scoreHistogram("B", true) },
              {
                key: "d",
                label: t("defaulted (both)"),
                color: MUTED,
                dashed: true,
                points: scoreHistogram("A", false).map((p, i) => ({
                  x: p.x,
                  y: p.y + scoreHistogram("B", false)[i].y,
                })),
              },
            ]}
            xLabel={t("Credit score")}
            yLabel="Applicants"
            vLines={[{ x: threshold, label: t("threshold") }]}
          />
        </div>
      </section>

      <Slider
        label={t("Threshold")}
        value={threshold}
        min={0.2}
        max={0.8}
        step={0.05}
        onChange={setThreshold}
        format={f2}
      />
      <StatRow
        stats={[
          { label: t("accuracy, group A"), value: pct(a.accuracy) },
          { label: t("accuracy, group B"), value: pct(b.accuracy) },
        ]}
      />

      <MetricSection
        number="2"
        worked={
          <>
            <p>
              A: ({a.tp} + {a.fp}) / {a.tp + a.fp + a.tn + a.fn} = {f2(a.selectionRate)}
            </p>
            <p>
              B: ({b.tp} + {b.fp}) / {b.tp + b.fp + b.tn + b.fn} = {f2(b.selectionRate)}
            </p>
            <p>
              {t("gap")} = |{f2(a.selectionRate)} − {f2(b.selectionRate)}| ={" "}
              {f2(Math.abs(a.selectionRate - b.selectionRate))}
            </p>
          </>
        }
        title={t("Demographic parity")}
        what={
          <p>
            {t(
              "The selection rate — the share of each group that gets approved — should be equal, regardless of who would actually repay. ",
            )}
          </p>
        }
        why={
          <p>
            {t(
              "Simple, needs no labels, and matches the legal idea of equal outcomes. But when base rates genuinely differ, forcing equal approval means approving unequal risks. Gap now:",
            )}{" "}
            {pct(Math.abs(a.selectionRate - b.selectionRate))}.
          </p>
        }
        formulas={<p>P(ŷ = 1 | A) = P(ŷ = 1 | B)</p>}
      >
        <BarChart
          categories={[t("selection rate")]}
          series={groupBars("", (m) => [m.selectionRate])}
          yLabel={t("Share approved")}
          yMax={1}
          showValues
        />
      </MetricSection>

      <MetricSection
        number="3"
        worked={
          <p>
            DI = {f2(b.selectionRate)} / {f2(a.selectionRate)} = {f2(disparateImpact)}{" "}
            {disparateImpact >= 0.8 ? "≥" : "<"} 0.8
          </p>
        }
        title={t("Disparate impact ratio")}
        what={
          <p>
            {t(
              "The lower group's selection rate divided by the higher group's: demographic parity as a ratio instead of a gap. ",
            )}
          </p>
        }
        why={
          <p>
            {t(
              'US employment guidance flags a ratio below 0.8 — the "four-fifths rule" — as evidence of adverse impact. A quick, widely recognised screen; not proof of fairness or unfairness on its own. ',
            )}
          </p>
        }
        formulas={<p>DI = P(ŷ = 1 | B) / P(ŷ = 1 | A), flag if &lt; 0.8</p>}
      >
        <StatRow
          stats={[
            { label: t("disparate impact"), value: f2(disparateImpact) },
            {
              label: t("four-fifths rule"),
              value: disparateImpact >= 0.8 ? t("passes") : t("fails"),
            },
          ]}
        />
        <LineChart
          series={[
            {
              key: "di",
              label: t("disparate impact"),
              color: FG,
              points: thresholds.map((t) => {
                const [ga, gb] = [groupMetrics("A", t), groupMetrics("B", t)]
                return { x: t, y: ga.selectionRate ? gb.selectionRate / ga.selectionRate : 0 }
              }),
            },
            {
              key: "rule",
              label: t("0.8 line"),
              color: MUTED,
              dashed: true,
              points: [
                { x: thresholds[0], y: 0.8 },
                { x: thresholds[thresholds.length - 1], y: 0.8 },
              ],
            },
          ]}
          xLabel={t("Threshold")}
          yLabel={t("B ÷ A selection rate")}
          vLines={[{ x: threshold, label: "now" }]}
        />
      </MetricSection>

      <MetricSection
        number="4"
        worked={
          <>
            <p>
              TPR_A = {a.tp} / ({a.tp} + {a.fn}) = {f2(a.tpr)}
            </p>
            <p>
              TPR_B = {b.tp} / ({b.tp} + {b.fn}) = {f2(b.tpr)}
            </p>
          </>
        }
        title={t("Equal opportunity")}
        what={
          <p>
            {t("Among applicants who ")}
            <em>{t("would")}</em>{" "}
            {t(
              " repay, each group should be approved at the same rate: equal true-positive rates. ",
            )}
          </p>
        }
        why={
          <p>
            {t(
              "It focuses on the harm of being wrongly turned away when you deserved a yes. Here a creditworthy applicant from B is approved ",
            )}
            {pct(b.tpr)} {t(" of the time, versus ")}
            {pct(a.tpr)} {t("for A — the score's measurement bias, made visible. ")}
          </p>
        }
        formulas={<p>P(ŷ = 1 | y = 1, A) = P(ŷ = 1 | y = 1, B)</p>}
      >
        <BarChart
          categories={[t("true-positive rate")]}
          series={groupBars("", (m) => [m.tpr])}
          yLabel={t("Repayers approved")}
          yMax={1}
          showValues
        />
      </MetricSection>

      <MetricSection
        number="5"
        worked={
          <>
            <p>
              FPR_A = {a.fp} / ({a.fp} + {a.tn}) = {f2(a.fpr)}
            </p>
            <p>
              FPR_B = {b.fp} / ({b.fp} + {b.tn}) = {f2(b.fpr)}
            </p>
          </>
        }
        title={t("Equalized odds")}
        what={
          <p>
            {t(
              "Equal opportunity plus equal false-positive rates: both groups should share the same error rates on each side. ",
            )}
          </p>
        }
        why={
          <p>
            {t("Stricter: neither group gets more wrongful denials ")}
            <em>{t("or")}</em>{" "}
            {t(
              " more risky approvals. Usually reachable only with a different threshold per group — which may itself be legally restricted. ",
            )}
          </p>
        }
        formulas={
          <>
            <p>TPR_A = TPR_B</p>
            <p>FPR_A = FPR_B</p>
          </>
        }
      >
        <BarChart
          categories={[t("true-positive rate"), t("false-positive rate")]}
          series={groupBars("", (m) => [m.tpr, m.fpr])}
          yLabel="Rate"
          yMax={1}
          showValues
        />
      </MetricSection>

      <MetricSection
        number="6"
        worked={
          <>
            <p>
              {t("precision")}_A = {a.tp} / ({a.tp} + {a.fp}) = {f2(a.precision)}
            </p>
            <p>
              {t("precision")}_B = {b.tp} / ({b.tp} + {b.fp}) = {f2(b.precision)}
            </p>
          </>
        }
        title={t("Predictive parity")}
        what={
          <p>
            {t(
              "An approval should mean the same thing in both groups: equal precision, the share of approved applicants who actually repay. ",
            )}
          </p>
        }
        why={
          <p>
            {t(
              "It is the lender's view of fairness — a given score should carry the same risk whoever holds it. It is what calibration-focused tools such as recidivism scores defended themselves with, while critics pointed to unequal error rates. ",
            )}
          </p>
        }
        formulas={<p>P(y = 1 | ŷ = 1, A) = P(y = 1 | ŷ = 1, B)</p>}
      >
        <BarChart
          categories={["precision"]}
          series={groupBars("", (m) => [m.precision])}
          yLabel={t("Approved who repaid")}
          yMax={1}
          showValues
        />
      </MetricSection>

      <MetricSection
        number="7"
        worked={
          <>
            <p>
              {t("TPR gap")} = |{f2(a.tpr)} − {f2(b.tpr)}| = {f2(Math.abs(a.tpr - b.tpr))}
            </p>
            <p>
              {t("precision gap")} = |{f2(a.precision)} − {f2(b.precision)}| ={" "}
              {f2(Math.abs(a.precision - b.precision))}
            </p>
          </>
        }
        title={t("You can't have them all")}
        what={
          <p>
            {t(
              "The gap in each criterion across every threshold. No single threshold closes all three at once. ",
            )}
          </p>
        }
        why={
          <p>
            {t(
              "This isn't a flaw of this model. When base rates differ, predictive parity and equal error rates are mathematically incompatible unless the classifier is perfect (Kleinberg, Mullainathan & Raghavan, 2016; Chouldechova, 2017). Choosing a fairness metric is a value judgement about which harm matters most — made by people, not by the algorithm. ",
            )}
          </p>
        }
      >
        <LineChart
          series={[
            {
              key: "parity",
              label: t("selection-rate gap"),
              color: FG,
              points: gaps.map((g) => ({ x: g.t, y: g.parity })),
            },
            {
              key: "opportunity",
              label: t("TPR gap"),
              color: A,
              points: gaps.map((g) => ({ x: g.t, y: g.opportunity })),
            },
            {
              key: "predictive",
              label: t("precision gap"),
              color: B,
              points: gaps.map((g) => ({ x: g.t, y: g.predictive })),
            },
          ]}
          xLabel={t("Threshold")}
          yLabel="|A − B|"
          vLines={[{ x: threshold, label: "now" }]}
        />
      </MetricSection>

      <CheatSheet
        number="8"
        rows={[
          {
            metric: t("Demographic parity"),
            question: t("Are groups approved at the same rate?"),
            use: t("Outcomes should be equal regardless of labels."),
          },
          {
            metric: t("Disparate impact"),
            question: t("Is the ratio of approval rates ≥ 0.8?"),
            use: t("A quick regulatory screen."),
          },
          {
            metric: t("Equal opportunity"),
            question: t("Are qualified people approved equally?"),
            use: t("Wrongful denials are the main harm."),
          },
          {
            metric: t("Equalized odds"),
            question: t("Are both error rates equal?"),
            use: t("Both kinds of mistake carry harm."),
          },
          {
            metric: t("Predictive parity"),
            question: t("Does a yes mean the same for everyone?"),
            use: t("Decisions rely on the score's meaning."),
          },
        ]}
      />

      <section aria-label={t("Five splits, four models")} className="flex flex-col gap-4">
        <SectionTitle number="9">{t("Five splits, four models")}</SectionTitle>
        <p className="text-fg-secondary">
          {t(
            "The four cards from the top of the page, measured. Four illustrative credit scores are each tested on 5 fresh samples of applicants (5 splits, threshold 0.5). Each dot is one split:",
          )}
        </p>
        <OptionList
          ordered={false}
          items={[
            t("left to right: overall accuracy;"),
            t("bottom to top: the gap between the groups' true-positive rates (unfairness)."),
          ]}
        />
        <ScatterChart
          points={modelVariants.flatMap((v) =>
            splitScores(v).map((score) => ({ x: score.accuracy, y: score.tprGap, series: v.key })),
          )}
          series={modelVariants.map((v, i) => ({
            key: v.key,
            label: t(v.label),
            color: VARIANT_COLORS[i],
          }))}
          xLabel={t("Accuracy")}
          yLabel={t("TPR gap |A − B|")}
          lines={[
            {
              key: "accuracy-line",
              label: "",
              dashed: true,
              points: [
                { x: 0.75, y: 0 },
                { x: 0.75, y: 0.55 },
              ],
            },
            {
              key: "fairness-line",
              label: "",
              dashed: true,
              points: [
                { x: 0.5, y: 0.1 },
                { x: 1, y: 0.1 },
              ],
            },
          ]}
        />
        <p className="text-fg-secondary">
          {t(
            "Each model lands in its own quadrant — but not every split agrees: one split of the fair-but-inaccurate score shows a sizeable gap by chance. A single test split can make a fair model look unfair, or hide an unfair one; score several.",
          )}
        </p>
        <Takeaway>
          {t("Accuracy and fairness are two axes, not one: report both, per group, across splits.")}
        </Takeaway>
      </section>

      <LessonFooter entry={entry} />
    </LessonArticle>
  )
}

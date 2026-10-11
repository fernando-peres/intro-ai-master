import { Link } from "@tanstack/react-router"
import { useMemo } from "react"

import {
  LessonArticle,
  LessonFooter,
  LessonHero,
  LessonLead,
  SectionTitle,
} from "@/components/course/lesson-layout"
import type { LessonEntry } from "@/curriculum"
import { useTranslation } from "@/i18n/use-translation"
import { createNetwork, mulberry32, predict, trainEpoch } from "@/lib/neural-net"
import { accuracyScores, splitTrainSets } from "./generalization-data"
import { GeneralizationScenarios, SCENARIOS } from "./generalization-playground"
import { MetricSection, OptionList, Takeaway } from "./metric-section"

const f2 = (v: number) => v.toFixed(2)
const toInput = (x: number, y: number) => [2 * x - 1, 2 * y - 1]

/** The Good-fit scenario's first split, trained once, for the worked gap example. */
function goodFitScores() {
  const scenario = SCENARIOS.find((s) => s.key === "good") ?? SCENARIOS[0]
  const train = splitTrainSets(scenario.settings)[0]
  const net = createNetwork([2, scenario.settings.neurons, 1], 7, "tanh")
  const rand = mulberry32(99)
  const examples = train.map((p) => ({ input: toInput(p.x, p.y), target: [p.label] }))
  for (let e = 0; e < scenario.epochs; e++) trainEpoch(net, examples, 0.3, { rand })
  return accuracyScores(train, (x, y) => (predict(net, toInput(x, y))[0] >= 0.5 ? 1 : 0))
}

/** Each concept of the Generalization group, and where it is covered in depth. */
const CONNECTIONS = [
  {
    concept: "Bias",
    wrong: "The model is too simple: it underfits.",
    see: "Training and test error both high; the runs agree, all wrong together.",
    lesson: { slug: "bias-and-variance", title: "Bias & Variance →" },
  },
  {
    concept: "Variance",
    wrong: "The model is too flexible: it memorizes its sample, noise included.",
    see: "A big train–test gap; runs trained on different splits disagree.",
    lesson: { slug: "bias-and-variance", title: "Bias & Variance →" },
  },
  {
    concept: "Imbalanced data",
    wrong: "A class or a group is barely represented in the training data.",
    see: "One group's score far below the rest; folds with no examples of it.",
    lesson: { slug: "data-splits", title: "Data Splits →" },
  },
  {
    concept: "Fairness",
    wrong: "Errors are spread unevenly across groups of people.",
    see: "Per-group TPR, FPR and precision; worst-group accuracy.",
    lesson: { slug: "fairness", title: "Bias & Fairness →" },
  },
]

export function GeneralizationLesson({ entry }: { entry: LessonEntry }) {
  const { t } = useTranslation()
  const baseline = useMemo(goodFitScores, [])
  return (
    <LessonArticle entry={entry}>
      <LessonHero line1={t("Generalization")} line2={t("ability")} />
      <LessonLead>
        {t(
          '"The ability to perform well on previously unobserved inputs is called generalization" (Goodfellow, Bengio & Courville, 2016). It is the whole point of learning from data — and it fails in three ways:',
        )}
      </LessonLead>
      <OptionList
        items={[
          <>
            <span className="text-fg">{t("Too simple")}</span>
            {t(" — the model underfits: it misses the pattern even in its training data (bias).")}
          </>,
          <>
            <span className="text-fg">{t("Too flexible")}</span>
            {t(
              " — the model memorizes: it reproduces its training data, noise included, and stumbles on anything new (variance).",
            )}
          </>,
          <>
            <span className="text-fg">{t("Too few of some group")}</span>
            {t(
              " — the model generalizes unevenly: fine on average, failing the people it rarely saw (fairness).",
            )}
          </>,
        ]}
      />
      <Takeaway>
        {t("Training performance is a promise; generalization is whether it is kept.")}
      </Takeaway>

      <section
        aria-label={t("Why generalization ability is important")}
        className="flex flex-col gap-4"
      >
        <SectionTitle number="1">{t("Why generalization ability is important")}</SectionTitle>
        <p className="text-fg-secondary">
          {t(
            "A model is only useful on data it has not seen yet: the next patient, the next payment, the next applicant. Every earlier lesson in this group is one way that can go wrong, and one way to catch it:",
          )}
        </p>
        <div className="overflow-x-auto rounded-[3px] border border-divider">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface">
              <tr className="label-ui text-fg-muted">
                <th className="px-4 py-2 font-normal">{t("Concept")}</th>
                <th className="px-4 py-2 font-normal">{t("What goes wrong")}</th>
                <th className="px-4 py-2 font-normal">{t("How you see it")}</th>
                <th className="px-4 py-2 font-normal">{t("Lesson")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider text-fg-secondary">
              {CONNECTIONS.map((row) => (
                <tr key={row.concept}>
                  <td className="px-4 py-2 text-fg">{t(row.concept)}</td>
                  <td className="px-4 py-2">{t(row.wrong)}</td>
                  <td className="px-4 py-2">{t(row.see)}</td>
                  <td className="px-4 py-2">
                    <Link
                      to="/learn/$chapter/$lesson"
                      params={{ chapter: "machine-learning", lesson: row.lesson.slug }}
                      className="text-brand hover:text-brand-soft"
                    >
                      {t(row.lesson.title)}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-fg-secondary">{t("They are connected:")}</p>
        <OptionList
          ordered={false}
          items={[
            t(
              "bias and variance pull in opposite directions — more capacity lowers one and raises the other;",
            ),
            t(
              "imbalanced data is a variance problem for the rare group: too few examples to learn it reliably;",
            ),
            t(
              "and when the rare group is a group of people, that uneven generalization is exactly what fairness metrics measure.",
            ),
          ]}
        />
        <Takeaway>
          {t(
            "Generalization is what all of these protect: performance that holds on new data — for everyone the model will serve.",
          )}
        </Takeaway>
      </section>

      <MetricSection
        number="2"
        title={t("The generalization gap")}
        what={
          <p>
            {t(
              "The difference between how well a model does on the data it trained on and on new data from the same source.",
            )}
          </p>
        }
        why={
          <p>
            {t(
              "Training scores always flatter the model. The gap is the honest correction: small means the model learned the pattern, large means it learned the examples. Measuring it needs data the model never saw — see ",
            )}
            <Link
              to="/learn/$chapter/$lesson"
              params={{ chapter: "machine-learning", lesson: "data-splits" }}
              className="text-brand hover:text-brand-soft"
            >
              {t("Data Splits →")}
            </Link>
          </p>
        }
        formulas={
          <>
            <p>gap = train accuracy − test accuracy</p>
            <p>gap = test error − train error</p>
          </>
        }
        worked={
          <p>
            {t("Good fit, split 1: ")}
            {f2(baseline.train)} − {f2(baseline.test)} = {f2(baseline.gap)}
          </p>
        }
      >
        <p className="text-fg-secondary">
          {t(
            "The scenarios below use one synthetic, two-group dataset. Group A (the majority, left) follows a wavy boundary; group B (the minority, right) follows the opposite rule. The test set is fixed, clean and balanced: 200 points per group.",
          )}
        </p>
      </MetricSection>

      <section aria-label={t("Scenarios")} className="flex flex-col gap-4">
        <SectionTitle number="3">{t("Scenarios")}</SectionTitle>
        <p className="text-fg-secondary">
          {t(
            "Each tab sets up a neural network to land in one situation, then trains it on 5 different training splits — like the five runs in Bias & Variance. The settings are yours to change. How to read the chart:",
          )}
        </p>
        <OptionList
          ordered={false}
          items={[
            t("shading — what the five networks predict on average;"),
            t("colored lines — each run's decision boundary;"),
            t("dashed line — the true boundary;"),
            t(
              "lines that disagree mean variance; lines that agree but miss the truth mean bias; lines that ignore the right-hand region mean group B is left behind.",
            ),
          ]}
        />
        <GeneralizationScenarios />
      </section>

      <section aria-label={t("Finding the equilibrium")} className="flex flex-col gap-4">
        <SectionTitle number="4">{t("Finding the equilibrium")}</SectionTitle>
        <div className="overflow-x-auto rounded-[3px] border border-divider">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface">
              <tr className="label-ui text-fg-muted">
                <th className="px-4 py-2 font-normal">{t("Symptom")}</th>
                <th className="px-4 py-2 font-normal">{t("Diagnosis")}</th>
                <th className="px-4 py-2 font-normal">{t("Try")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider text-fg-secondary">
              {[
                {
                  symptom: "Training and test scores both poor",
                  diagnosis: "Underfitting (bias)",
                  fix: "More capacity, better features, less regularization",
                },
                {
                  symptom: "Training far better than test (a big gap)",
                  diagnosis: "Memorizing (variance)",
                  fix: "More data, a simpler model (fewer neurons) or more regularization, early stopping, cross-validation",
                },
                {
                  symptom: "One group far behind the others",
                  diagnosis: "Uneven generalization (imbalance → unfairness)",
                  fix: "More data for that group, reweighting or oversampling, group-stratified splits, report worst-group accuracy",
                },
              ].map((row) => (
                <tr key={row.symptom}>
                  <td className="px-4 py-2">{t(row.symptom)}</td>
                  <td className="px-4 py-2 text-fg">{t(row.diagnosis)}</td>
                  <td className="px-4 py-2">{t(row.fix)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Takeaway>
          {t(
            "Good generalization is a balance: enough capacity to learn the rule, not so much that it learns the examples — and enough data from everyone it will serve.",
          )}
        </Takeaway>
        <p className="text-sm text-fg-muted">
          {t(
            "Sources: Goodfellow, Bengio & Courville (2016), Deep Learning, §5.2; Zhang et al. (2017), Understanding deep learning requires rethinking generalization; Sagawa et al. (2020), Distributionally robust neural networks (worst-group accuracy). The data here is synthetic.",
          )}
        </p>
      </section>

      <LessonFooter entry={entry} />
    </LessonArticle>
  )
}

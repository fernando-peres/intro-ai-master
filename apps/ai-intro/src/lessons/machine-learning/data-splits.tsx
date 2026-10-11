import { BarChart } from "@/components/charts/bar-chart"
import {
  LessonArticle,
  LessonFooter,
  LessonHero,
  LessonLead,
} from "@/components/course/lesson-layout"
import type { LessonEntry } from "@/curriculum"
import { useTranslation } from "@/i18n/use-translation"
import { randomFolds, stratifiedFolds } from "@/lib/splits"
import {
  CheatSheet,
  FoldDiagram,
  MetricSection,
  OptionList,
  StatRow,
  Takeaway,
} from "./metric-section"
import { FRAUD_RATE, MINORITY_RATE, PAYMENT_COUNT, payments } from "./payments"

const FOLDS = 5
/** A seed where plain random folds visibly go wrong; the stratified folds are fixed by design. */
const RANDOM_SEED = 5
const random = randomFolds(PAYMENT_COUNT, FOLDS, RANDOM_SEED)
const byClass = stratifiedFolds(
  payments.map((p) => (p.fraud ? "fraud" : "legit")),
  FOLDS,
  RANDOM_SEED,
)
const byClassAndGroup = stratifiedFolds(
  payments.map((p) => `${p.fraud ? "fraud" : "legit"}|${p.group}`),
  FOLDS,
  RANDOM_SEED,
)
const count = (fold: number[], test: (p: (typeof payments)[number]) => boolean) =>
  fold.filter((i) => test(payments[i])).length
const foldLabels = Array.from({ length: FOLDS }, (_, i) => `${i + 1}`)
const minorityFrauds = payments.filter((p) => p.fraud && p.group === "B").length
const minorityCount = payments.filter((p) => p.group === "B").length
const fraudCount = payments.filter((p) => p.fraud).length
const pct = (v: number) => `${Math.round(v * 100)}%`

const HOLDOUT = [
  { name: "Train", share: 0.6, color: "bg-chart-cool", body: "Fits the model's parameters." },
  {
    name: "Validation",
    share: 0.2,
    color: "bg-fg-secondary",
    body: "Chooses between models and settings.",
  },
  { name: "Test", share: 0.2, color: "bg-brand", body: "Reports the final score, once." },
]

/** Rolling-origin evaluation: each round trains on the past and tests on the next period. */
function TimeSplitDiagram() {
  const { t } = useTranslation()
  const periods = 6
  return (
    <div
      className="flex flex-col gap-1"
      role="img"
      aria-label={t(
        "Time-based split: each round trains on earlier periods and tests on the next.",
      )}
    >
      {[2, 3, 4, 5].map((trainUpTo) => (
        <div key={trainUpTo} className="flex items-center gap-1">
          <span className="w-16 font-ui text-[11px] text-fg-muted">
            {t("round ")}
            {trainUpTo - 1}
          </span>
          {Array.from({ length: periods }, (_, period) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: periods are a fixed, ordered sequence
              key={period}
              className={`h-5 flex-1 rounded-[2px] ${
                period < trainUpTo
                  ? "bg-chart-cool/60"
                  : period === trainUpTo
                    ? "bg-brand"
                    : "bg-divider"
              }`}
            />
          ))}
        </div>
      ))}
      <p className="font-ui text-[11px] text-fg-muted">
        {t("time →")} <span className="text-chart-cool">■</span> {t(" train ")}
        <span className="text-brand">■</span> {t("test ")}
        <span className="text-fg-muted">■</span> {t("future, unused")}
      </p>
    </div>
  )
}

/** Grouped split: every row of one customer lands on the same side. */
function GroupSplitDiagram() {
  const { t } = useTranslation()
  const customers = [
    { name: "Ana", rows: 3, test: false },
    { name: "Ben", rows: 2, test: true },
    { name: "Caio", rows: 4, test: false },
    { name: "Dara", rows: 2, test: false },
    { name: "Eli", rows: 3, test: true },
  ]
  return (
    <div
      className="flex flex-col gap-1"
      role="img"
      aria-label={t("Grouped split: all of a customer's payments go to the same side.")}
    >
      {customers.map((c) => (
        <div key={c.name} className="flex items-center gap-1">
          <span className="w-16 font-ui text-[11px] text-fg-muted">{c.name}</span>
          {Array.from({ length: c.rows }, (_, i) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: a customer's rows are interchangeable
              key={i}
              className={`h-5 w-8 rounded-[2px] ${c.test ? "bg-brand" : "bg-chart-cool/60"}`}
            />
          ))}
        </div>
      ))}
      <p className="font-ui text-[11px] text-fg-muted">
        <span className="text-chart-cool">■</span> {t(" train ")}
        <span className="text-brand">■</span> {t("test ")}
      </p>
    </div>
  )
}

export function DataSplitsLesson({ entry }: { entry: LessonEntry }) {
  const { t } = useTranslation()
  return (
    <LessonArticle entry={entry}>
      <LessonHero line1={t("Data")} line2={t("splits")} />
      <LessonLead>
        {t(
          "A model graded on the examples it studied will always look better than it is. So the data is split, and each part has one job:",
        )}
      </LessonLead>
      <OptionList
        items={[
          <>
            <span className="text-fg">{t("Training")}</span>
            {t(" — fits the model's parameters.")}
          </>,
          <>
            <span className="text-fg">{t("Validation")}</span>
            {t(" — chooses between models, features and settings.")}
          </>,
          <>
            <span className="text-fg">{t("Test")}</span>
            {t(" — reports the final score, once, on data nothing was tuned on.")}
          </>,
        ]}
      />
      <Takeaway>
        {t(
          "How you split decides what your metrics mean — especially for rare classes and small groups.",
        )}
      </Takeaway>
      <p className="text-fg-secondary">
        {t("The running example is synthetic: ")}
        {PAYMENT_COUNT}
        {t(" card payments, ")}
        {pct(FRAUD_RATE)}
        {t(" of them fraud (heavily imbalanced), with about ")}
        {pct(MINORITY_RATE)}
        {t(" from a minority customer group B.")}
      </p>

      <MetricSection
        number="1"
        title={t("Train / validation / test holdout")}
        whatLabel="What it is"
        whyLabel="Why it matters"
        what={
          <p>
            {t(
              "Shuffle once and cut the data into three parts, commonly about 60/20/20 (or 80/10/10 with lots of data).",
            )}
          </p>
        }
        why={
          <>
            <p>
              {t(
                "Every decision made while looking at a split leaks a little of it into the model. Keep the test set locked until the very end. Common leaks:",
              )}
            </p>
            <OptionList
              ordered={false}
              items={[
                t("tuning on the test set;"),
                t("scaling or selecting features using all the data before splitting;"),
                t("the same person, item or time period on both sides."),
              ]}
            />
          </>
        }
      >
        <div className="flex h-10 overflow-hidden rounded-[3px]">
          {HOLDOUT.map((h) => (
            <div
              key={h.name}
              className={`flex items-center justify-center overflow-hidden whitespace-nowrap px-1 font-ui text-[11px] text-canvas ${h.color}`}
              style={{ width: `${h.share * 100}%` }}
            >
              {t(h.name)} {pct(h.share)}
            </div>
          ))}
        </div>
        <OptionList
          ordered={false}
          items={HOLDOUT.map((h) => (
            <>
              <span className="text-fg">{t(h.name)}</span> — {t(h.body)}
            </>
          ))}
        />
      </MetricSection>

      <MetricSection
        number="2"
        title={t("k-fold cross-validation")}
        whatLabel="What it is"
        whyLabel="Why it matters"
        what={
          <p>
            {t(
              "Cut the training data into k folds. Train k times, each time validating on a different fold, and average the k scores.",
            )}
          </p>
        }
        why={
          <p>
            {t(
              "Every example gets used for validation once, so the estimate is steadier than a single holdout — essential when data is scarce. The spread across folds also shows how much the score depends on the luck of the split.",
            )}
          </p>
        }
        formulas={<p>CV = (1/k)·Σⱼ score on fold j</p>}
      >
        <FoldDiagram folds={FOLDS} />
      </MetricSection>

      <MetricSection
        number="3"
        worked={
          <p>
            {t("fair share")} = {fraudCount} {t("frauds")} / {FOLDS} {t("folds")} ={" "}
            {fraudCount / FOLDS} {t("per fold")}
          </p>
        }
        title={t("Stratified splits for imbalanced data")}
        whatLabel="What it is"
        whyLabel="Why it matters"
        what={
          <p>
            {t(
              "Deal each class into the folds separately, so every fold keeps the same class proportions as the whole dataset.",
            )}
          </p>
        }
        why={
          <p>
            {t(
              "With a rare class, plain random folds are lumpy. Here one random fold gets no fraud at all — precision, recall and F1 are undefined there, and the average across folds is distorted. Stratified folds get the same number each.",
            )}
          </p>
        }
      >
        <StatRow
          stats={[
            {
              label: t("frauds per random fold"),
              value: `${Math.min(...random.map((f) => count(f, (p) => p.fraud)))}–${Math.max(...random.map((f) => count(f, (p) => p.fraud)))}`,
            },
            {
              label: t("frauds per stratified fold"),
              value: `${Math.min(...byClass.map((f) => count(f, (p) => p.fraud)))}–${Math.max(...byClass.map((f) => count(f, (p) => p.fraud)))}`,
            },
          ]}
        />
        <BarChart
          categories={foldLabels}
          series={[
            {
              key: "random",
              label: t("Random folds"),
              color: "var(--color-fg-muted)",
              values: random.map((f) => count(f, (p) => p.fraud)),
            },
            {
              key: "stratified",
              label: t("Stratified folds"),
              color: "var(--color-brand)",
              values: byClass.map((f) => count(f, (p) => p.fraud)),
            },
          ]}
          xLabel={t("Fold")}
          yLabel={t("Frauds in the fold")}
        />
      </MetricSection>

      <MetricSection
        number="4"
        worked={
          <p>
            {t("group B")}: {minorityCount} / {FOLDS} = {(minorityCount / FOLDS).toFixed(1)}{" "}
            {t("per fold")}; {t("its frauds")}: {minorityFrauds} / {FOLDS} ={" "}
            {(minorityFrauds / FOLDS).toFixed(1)} {t("per fold")}
          </p>
        }
        title={t("Group-aware splits for fairness")}
        whatLabel="What it is"
        whyLabel="Why it matters"
        what={
          <p>
            {t(
              "Stratify on class and group together — e.g. fraud × customer group — so every fold holds a proportional share of each group, positives included.",
            )}
          </p>
        }
        why={
          <>
            <p>
              {t(
                "Fairness is measured per group (TPR, FPR, precision by group), so each split needs enough members of every group to compute them. Random folds give group B anywhere from a handful to a crowd; stratified folds keep it steady. But group B has only ",
              )}
              {minorityFrauds}
              {t(
                " frauds in total — no split can put one in every fold. When a group is that small, collect more data or use fewer folds.",
              )}
            </p>
            <Takeaway>
              {t(
                "A good split makes fairness measurable. It cannot make a model fair — only the per-group metrics can tell you whether it is.",
              )}
            </Takeaway>
          </>
        }
      >
        <BarChart
          categories={foldLabels}
          series={[
            {
              key: "random",
              label: t("Random folds"),
              color: "var(--color-fg-muted)",
              values: random.map((f) => count(f, (p) => p.group === "B")),
            },
            {
              key: "stratified",
              label: t("Stratified by class × group"),
              color: "var(--color-chart-cool)",
              values: byClassAndGroup.map((f) => count(f, (p) => p.group === "B")),
            },
          ]}
          xLabel={t("Fold")}
          yLabel={t("Group B payments in the fold")}
        />
      </MetricSection>

      <MetricSection
        number="5"
        title={t("Time-based and grouped splits")}
        whatLabel="What it is"
        whyLabel="Why it matters"
        what={
          <OptionList
            ordered={false}
            items={[
              <>
                <span className="text-fg">{t("Time-based")}</span>
                {t(": train on the past, test on the period right after (rolling origin).")}
              </>,
              <>
                <span className="text-fg">{t("Grouped")}</span>
                {t(": all rows of one customer, patient or device go to the same side.")}
              </>,
            ]}
          />
        }
        why={
          <p>
            {t(
              "A shuffled split lets the model peek at the future, or memorize a customer it will be tested on. The score looks great and collapses in production. Split the way the model will be used.",
            )}
          </p>
        }
      >
        <TimeSplitDiagram />
        <GroupSplitDiagram />
      </MetricSection>

      <CheatSheet
        number="6"
        rows={[
          {
            metric: t("Holdout"),
            question: t("One honest final score?"),
            use: t("Plenty of data; a quick, simple setup."),
          },
          {
            metric: t("k-fold CV"),
            question: t("A steadier estimate, with its spread?"),
            use: t("Small or medium data; tuning hyperparameters."),
          },
          {
            metric: t("Stratified k-fold"),
            question: t("Every fold has the rare class?"),
            use: t("Imbalanced classes."),
          },
          {
            metric: t("Stratified by class × group"),
            question: t("Every fold can measure each group?"),
            use: t("Fairness evaluation; small groups."),
          },
          {
            metric: t("Time-based"),
            question: t("Does it predict the future?"),
            use: t("Forecasting; any data that drifts over time."),
          },
          {
            metric: t("Grouped"),
            question: t("Does it work on new people or items?"),
            use: t("Several rows per customer, patient or device."),
          },
        ]}
      />

      <LessonFooter entry={entry} />
    </LessonArticle>
  )
}

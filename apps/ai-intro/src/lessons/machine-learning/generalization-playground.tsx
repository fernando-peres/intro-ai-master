import { Link } from "@tanstack/react-router"
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react"

import { BarChart } from "@/components/charts/bar-chart"
import { DecisionChart } from "@/components/charts/decision-chart"
import { LineChart } from "@/components/charts/line-chart"
import { ScatterChart } from "@/components/charts/scatter-chart"
import { useTranslation } from "@/i18n/use-translation"
import {
  cloneNetwork,
  createNetwork,
  mulberry32,
  type Network,
  predict,
  trainEpoch,
} from "@/lib/neural-net"
import { cn } from "@/lib/utils"
import {
  accuracyScores,
  accuracyVerdict,
  fairnessGaps,
  type GroupPoint,
  type GroupReport,
  groupReport,
  meanGroupReport,
  type Scores,
  SPLIT,
  SPLITS,
  splitTrainSets,
  summarize,
  testSet,
  trueLabel,
  type Verdict,
} from "./generalization-data"
import { OptionList, Slider, Takeaway, Worked } from "./metric-section"
import { RUN_COLORS } from "./run-colors"

type Settings = { neurons: number; size: number; labelNoise: number; minorityShare: number }
type Scenario = {
  key: string
  title: string
  description: string
  /** What to notice in the Data tab: the data's part in the outcome. */
  dataNote: string
  /** What to notice in the Algorithm / Performance tab: what went right or wrong, and why. */
  outcomeNote: string
  /** What the per-group results say about fairness in this scenario. */
  fairnessNote: string
  settings: Settings
  epochs: number
}

/** Presets verified to land on their own verdict when averaged over the five runs. */
export const SCENARIOS: Scenario[] = [
  {
    key: "underfit",
    title: "Underfit (high bias)",
    description:
      "One hidden neuron can only draw a single smooth line through the plane — far too simple for group A's wavy boundary. All five runs make the same mistake: low training and test accuracy, and boundaries that agree with each other. That is bias.",
    dataNote:
      "Nothing is wrong with the data: 200 clean points per split, half from each group, both classes well represented. If this scenario fails, the model is to blame.",
    outcomeNote:
      "Underfitting (high bias): one neuron can only draw one smooth curve, but group A's boundary waves. Training and test accuracy are both low and close together — the model isn't memorizing anything, it simply can't represent the rule. More data won't help; more neurons will.",
    fairnessNote:
      "Not fair either. The single curve fits group A's side best; on group B it calls far more points class 1 than it should, so B's false-positive rate is several times A's. A model too simple for everyone tends to fail some groups more than others.",
    settings: { neurons: 1, size: 200, labelNoise: 0, minorityShare: 0.5 },
    epochs: 400,
  },
  {
    key: "good",
    title: "Good fit",
    description:
      "Eight neurons, 200 clean examples per split, both groups equally represented. The five boundaries agree with each other and follow the truth: training and test accuracy are high and close, for both groups.",
    dataNote:
      "Clean, plentiful and balanced: 200 points per split, both groups equally represented, no random labels. Everything a model needs to learn the true rule.",
    outcomeNote:
      "Good fit: enough capacity for the wavy rule, enough data to pin it down. A small gap, five runs that agree, and both groups above 90% — this is what generalization looks like.",
    fairnessNote:
      "Accurate and fair: both groups get similar true- and false-positive rates, and every criterion passes. Enough data from both groups is what makes this possible.",
    settings: { neurons: 8, size: 200, labelNoise: 0, minorityShare: 0.5 },
    epochs: 400,
  },
  {
    key: "overfit",
    title: "Overfit (high variance)",
    description:
      "32 neurons, only 40 examples per split, and 60% of the labels replaced at random. Each network bends its boundary around its own noisy points: high training accuracy, much lower test accuracy, and five runs that disagree. Zhang et al. (2017) showed large networks will even memorize completely random labels — training accuracy alone proves nothing.",
    dataNote:
      "Only 40 points per split, and 60% of the labels replaced by coin flips — so about 30% of the training labels are simply wrong, and each split's wrong labels land in different places.",
    outcomeNote:
      "Overfitting (high variance): 32 neurons can bend around every point, wrong labels included. Training accuracy keeps climbing while test accuracy stalls, and each run follows its own noise — so the five boundaries disagree. The cure is more and cleaner data, fewer neurons or regularization, not more training.",
    fairnessNote:
      "Fair, but inaccurate. The random labels hurt both groups about equally, so the error rates match — yet both are poor. Passing a fairness check does not make a model good; read it next to accuracy.",
    settings: { neurons: 32, size: 40, labelNoise: 0.6, minorityShare: 0.5 },
    epochs: 2000,
  },
  {
    key: "imbalanced",
    title: "Imbalanced (unfair)",
    description:
      "A good model, but group B is only 3% of each training split. Every run learns group A's rule and applies it to group B as well, so B's accuracy collapses while A's stays high. The model generalizes — but not for everyone.",
    dataNote:
      "Group B is only 3% of each split — about 6 points out of 200. Overall the data looks fine; almost all of it is group A, so the model will barely see group B's rule.",
    outcomeNote:
      "Unfairness: the model learns group A's rule well and almost never sees group B, so it applies A's rule there too. Group B's accuracy collapses while overall accuracy still looks acceptable. Collect more of group B, reweight it, use group-stratified splits — and always report per-group or worst-group accuracy.",
    fairnessNote:
      "Accurate for group A, unfair to group B: equal opportunity, equalized odds and predictive parity all fail, and disparate impact drops below 0.8. The overall accuracy hides it; the per-group view shows it.",
    settings: { neurons: 8, size: 200, labelNoise: 0, minorityShare: 0.03 },
    epochs: 400,
  },
]

const VERDICT_COPY: Record<Verdict, string> = {
  underfit: "Underfitting — it can't even fit its own training data. It needs more capacity.",
  good: "Good fit — training and test scores are close, and both groups are served.",
  memorize: "Overfitting — far better on the data it saw than on new data, and the runs disagree.",
  imbalanced: "One group left behind — fine for the majority, failing the group it rarely saw.",
}

const EPOCHS_PER_TICK = 25
const LEARNING_RATE = 0.3
const toInput = (x: number, y: number) => [2 * x - 1, 2 * y - 1]
const probability = (net: Network) => (x: number, y: number) => predict(net, toInput(x, y))[0]
const classify = (net: Network) => (x: number, y: number) => (probability(net)(x, y) >= 0.5 ? 1 : 0)
const freshNetworks = (neurons: number) =>
  Array.from({ length: SPLITS }, (_, run) => createNetwork([2, neurons, 1], 7 + run, "tanh"))
const freshRands = () => Array.from({ length: SPLITS }, (_, run) => mulberry32(99 + run))
/** A third of the fixed test set, so the chart stays readable; scores use all of it. */
const shownPoints = testSet
  .filter((_, i) => i % 3 === 0)
  .map((p) => ({ x: p.x, y: p.y, series: p.label === 1 ? "positive" : "negative" }))
const pct = (v: number) => `${Math.round(v * 100)}%`
const f2 = (v: number) => v.toFixed(2)

type HistoryPoint = { x: number; train: number; test: number; groupA: number; groupB: number }
const emptyHistory = (): HistoryPoint[][] => Array.from({ length: SPLITS }, () => [])
const points = (pts: { x: number; y: number }[]) => pts.map((p) => ({ x: p.x, y: p.y }))
const CLASS_SERIES = [
  { key: "negative", label: "class 0", color: "var(--color-chart-cool)" },
  { key: "positive", label: "class 1", color: "var(--color-brand)" },
]
const asSeries = (pts: GroupPoint[]) =>
  pts.map((p) => ({ x: p.x, y: p.y, series: p.label === 1 ? "positive" : "negative" }))

/** Accuracy over epochs: training, test, and test per group — the run's (or the mean's) learning curve. */
function AccuracyCurves({ history }: { history: HistoryPoint[] }) {
  const { t } = useTranslation()
  if (history.length < 2) {
    return <p className="self-center text-center text-sm text-fg-muted">{t("Training…")}</p>
  }
  const line = (pick: (h: HistoryPoint) => number) =>
    points(history.map((h) => ({ x: h.x, y: pick(h) })))
  return (
    <LineChart
      series={[
        {
          key: "train",
          label: t("training"),
          color: "var(--color-fg)",
          points: line((h) => h.train),
        },
        {
          key: "test",
          label: t("test (all)"),
          color: "var(--color-fg-muted)",
          dashed: true,
          points: line((h) => h.test),
        },
        {
          key: "a",
          label: t("test, group A"),
          color: "var(--color-chart-cool)",
          points: line((h) => h.groupA),
        },
        {
          key: "b",
          label: t("test, group B"),
          color: "var(--color-brand)",
          points: line((h) => h.groupB),
        },
      ]}
      xLabel={t("Epoch")}
      yLabel={t("Accuracy")}
    />
  )
}

/** One sentence naming what a single run shows, from its own numbers. */
function runComment(t: (s: string, v?: (string | number)[]) => string, s: Scores) {
  const points = (v: number) => Math.round(v * 100)
  switch (accuracyVerdict(s)) {
    case "underfit":
      return t("Underfitting — only {0} even on its own training data.", [pct(s.train)])
    case "imbalanced":
      return t("One group left behind — group A {0}, group B {1}.", [pct(s.groupA), pct(s.groupB)])
    case "memorize":
      return t("Overfitting — training {0} vs test {1}: a {2}-point gap.", [
        pct(s.train),
        pct(s.test),
        points(s.gap),
      ])
    default:
      return t("Good fit — a {0}-point gap, both groups at {1} or above.", [
        points(s.gap),
        pct(s.worst),
      ])
  }
}

function RunRow({
  index,
  net,
  train,
  scores,
  history,
  done,
}: {
  index: number
  net: Network
  train: GroupPoint[]
  scores: Scores
  history: HistoryPoint[]
  done: boolean
}) {
  const { t } = useTranslation()
  const color = RUN_COLORS[index]
  return (
    <div className="flex flex-col gap-2 border-t border-divider pt-4">
      <p className="font-display text-xl text-fg">
        <span style={{ color }}>●</span> {t("Run #{0}", [index + 1])}
      </p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <DecisionChart
          points={asSeries(train)}
          series={CLASS_SERIES}
          xLabel="x₁"
          yLabel="x₂"
          valueAt={probability(net)}
          boundaries={[
            { key: "run", valueAt: probability(net), color },
            { key: "truth", valueAt: trueLabel, color: "var(--color-fg)", dashed: true },
          ]}
        />
        <div className="flex flex-col gap-3">
          <AccuracyCurves history={history} />
          <p className="font-ui text-xs text-fg-secondary">
            {t("train")} {pct(scores.train)} · {t("test")} {pct(scores.test)} · {t("gap")}{" "}
            {pct(scores.gap)} · A {pct(scores.groupA)} · B {pct(scores.groupB)}
          </p>
          <p className="border-l-2 pl-3 text-sm text-fg-secondary" style={{ borderColor: color }}>
            {done ? runComment(t, scores) : t("Training…")}
          </p>
        </div>
      </div>
    </div>
  )
}

/** The scenario's one-paragraph reading, set apart from the charts. */
function ScenarioNote({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-1 rounded-[3px] border border-brand/40 bg-brand/5 px-4 py-3">
      <p className="label-ui text-brand">{t("What to notice")}</p>
      <p className="text-sm text-fg-secondary">{children}</p>
    </div>
  )
}

/** Share of `points` in each group × class cell, in a fixed order for the bar chart. */
const CELLS = [
  { group: "A", label: 0 },
  { group: "A", label: 1 },
  { group: "B", label: 0 },
  { group: "B", label: 1 },
] as const
const cellShares = (pts: GroupPoint[]) =>
  CELLS.map(
    (c) => pts.filter((p) => p.group === c.group && p.label === c.label).length / pts.length,
  )
const wrongLabels = (pts: GroupPoint[]) => pts.filter((p) => p.label !== trueLabel(p.x, p.y)).length

/** What the five training splits and the test set contain: who is in them, and which classes. */
function TrainingData({ trainSets }: { trainSets: GroupPoint[][] }) {
  const { t } = useTranslation()
  const meanTrainShares = CELLS.map(
    (_, c) => trainSets.reduce((sum, set) => sum + cellShares(set)[c], 0) / trainSets.length,
  )
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <figure className="flex flex-col gap-1">
          <ScatterChart
            points={asSeries(trainSets[0])}
            series={CLASS_SERIES}
            xLabel="x₁"
            yLabel="x₂"
            lines={[
              {
                key: "groups",
                label: t("A | B"),
                dashed: true,
                points: [
                  { x: SPLIT, y: 0 },
                  { x: SPLIT, y: 1 },
                ],
              },
            ]}
          />
          <figcaption className="text-center font-ui text-xs text-fg-muted">
            {t("Split 1's training data: group A left of the dashed line, group B right.")}
          </figcaption>
        </figure>
        <figure className="flex flex-col gap-1">
          <BarChart
            categories={CELLS.map((c) => `${c.group}·${c.label}`)}
            series={[
              {
                key: "train",
                label: t("training (mean of 5 splits)"),
                color: "var(--color-chart-cool)",
                values: meanTrainShares,
              },
              {
                key: "test",
                label: t("test set"),
                color: "var(--color-brand)",
                values: cellShares(testSet),
              },
            ]}
            xLabel={t("group · class")}
            yLabel={t("Share of the set")}
            showValues
          />
          <figcaption className="text-center font-ui text-xs text-fg-muted">
            {t("Class distribution per group: training splits vs the test set.")}
          </figcaption>
        </figure>
      </div>
      <table className="w-full font-ui text-xs text-fg-secondary">
        <thead>
          <tr className="text-fg-muted">
            <th className="px-1 text-left font-normal">{t("split")}</th>
            <th className="px-1 text-right font-normal">{t("points")}</th>
            <th className="px-1 text-right font-normal">{t("group A")}</th>
            <th className="px-1 text-right font-normal">{t("group B")}</th>
            <th className="px-1 text-right font-normal">{t("class 1")}</th>
            <th className="px-1 text-right font-normal">{t("wrong labels")}</th>
          </tr>
        </thead>
        <tbody>
          {trainSets.map((set, i) => (
            <tr key={RUN_COLORS[i]}>
              <td className="px-1">
                <span style={{ color: RUN_COLORS[i] }}>●</span> {i + 1}
              </td>
              <td className="px-1 text-right">{set.length}</td>
              <td className="px-1 text-right">{set.filter((p) => p.group === "A").length}</td>
              <td className="px-1 text-right">{set.filter((p) => p.group === "B").length}</td>
              <td className="px-1 text-right">
                {pct(set.filter((p) => p.label === 1).length / set.length)}
              </td>
              <td className="px-1 text-right">{pct(wrongLabels(set) / set.length)}</td>
            </tr>
          ))}
          <tr className="border-t border-divider text-fg">
            <td className="px-1">{t("test")}</td>
            <td className="px-1 text-right">{testSet.length}</td>
            <td className="px-1 text-right">{testSet.filter((p) => p.group === "A").length}</td>
            <td className="px-1 text-right">{testSet.filter((p) => p.group === "B").length}</td>
            <td className="px-1 text-right">
              {pct(testSet.filter((p) => p.label === 1).length / testSet.length)}
            </td>
            <td className="px-1 text-right">{pct(0)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

const FAIR_GAP = 0.15
const FOUR_FIFTHS = 0.8

/** Per-group performance on the test set and the Bias & Fairness criteria, mean of the five runs. */
function GroupFairness({
  groups,
  done,
}: {
  groups: Record<"A" | "B", GroupReport>
  done: boolean
}) {
  const { t } = useTranslation()
  const gaps = fairnessGaps(groups)
  const rows = [
    {
      name: "Demographic parity",
      compares: "selection rate (share labelled 1)",
      value: f2(gaps.demographicParity),
      ok: gaps.demographicParity <= FAIR_GAP,
    },
    {
      name: "Disparate impact",
      compares: "lower ÷ higher selection rate, ≥ 0.8 to pass",
      value: f2(gaps.disparateImpact),
      ok: gaps.disparateImpact >= FOUR_FIFTHS,
    },
    {
      name: "Equal opportunity",
      compares: "true-positive rate",
      value: f2(gaps.equalOpportunity),
      ok: gaps.equalOpportunity <= FAIR_GAP,
    },
    {
      name: "Equalized odds",
      compares: "TPR and FPR (larger gap)",
      value: f2(gaps.equalizedOdds),
      ok: gaps.equalizedOdds <= FAIR_GAP,
    },
    {
      name: "Predictive parity",
      compares: "precision",
      value: f2(gaps.predictiveParity),
      ok: gaps.predictiveParity <= FAIR_GAP,
    },
  ]
  const fair = gaps.equalizedOdds <= FAIR_GAP
  const measures = ["Accuracy", "TPR", "FPR", "Precision", "Selection rate"]
  const values = (g: GroupReport) => [g.accuracy, g.tpr, g.fpr, g.precision, g.selectionRate]
  return (
    <div className="flex flex-col gap-3 border-t border-divider pt-4">
      <p className="font-display text-xl text-fg">{t("Per group and fairness")}</p>
      <p className="text-sm text-fg-secondary">
        {t(
          "The same five networks, scored separately for each group on the test set (mean of the runs), and checked against the fairness criteria from ",
        )}
        <Link
          to="/learn/$chapter/$lesson"
          params={{ chapter: "machine-learning", lesson: "fairness" }}
          className="text-brand hover:text-brand-soft"
        >
          {t("Bias & Fairness →")}
        </Link>
      </p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <BarChart
          categories={measures.map((m) => t(m))}
          series={[
            {
              key: "A",
              label: t("Group A"),
              color: "var(--color-chart-cool)",
              values: values(groups.A),
            },
            {
              key: "B",
              label: t("Group B"),
              color: "var(--color-brand)",
              values: values(groups.B),
            },
          ]}
          yLabel={t("Test set, mean of 5 runs")}
          yMax={1}
          showValues
        />
        <div className="flex flex-col gap-3">
          <table className="w-full text-left font-ui text-xs text-fg-secondary">
            <thead>
              <tr className="text-fg-muted">
                <th className="px-1 font-normal">{t("Criterion")}</th>
                <th className="px-1 font-normal">{t("Compares")}</th>
                <th className="px-1 text-right font-normal">{t("Gap")}</th>
                <th className="px-1 text-right font-normal" />
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {rows.map((r) => (
                <tr key={r.name}>
                  <td className="px-1 py-1 text-fg">{t(r.name)}</td>
                  <td className="px-1 py-1">{t(r.compares)}</td>
                  <td className="px-1 py-1 text-right">{r.value}</td>
                  <td
                    className={cn("px-1 py-1 text-right", r.ok ? "text-chart-cool" : "text-brand")}
                  >
                    {r.ok ? "✓" : "✗"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Worked>
            <p>
              {t("equal opportunity")} = |{f2(groups.A.tpr)} − {f2(groups.B.tpr)}| ={" "}
              {f2(gaps.equalOpportunity)}
            </p>
            <p>
              {t("equalized odds")} = max(|{f2(groups.A.tpr)} − {f2(groups.B.tpr)}|, |
              {f2(groups.A.fpr)} − {f2(groups.B.fpr)}|) = {f2(gaps.equalizedOdds)}
            </p>
            <p>
              {t("disparate impact")} ={" "}
              {f2(Math.min(groups.A.selectionRate, groups.B.selectionRate))} ÷{" "}
              {f2(Math.max(groups.A.selectionRate, groups.B.selectionRate))} ={" "}
              {f2(gaps.disparateImpact)}
            </p>
          </Worked>
          <p
            className={cn(
              "rounded-[3px] border px-3 py-2 text-sm text-fg",
              fair ? "border-chart-cool" : "border-brand",
            )}
          >
            {!done
              ? t("Training… the verdict appears when all runs finish.")
              : fair
                ? t(
                    "Fair by equalized odds: both groups get similar error rates (gap {0} ≤ {1}).",
                    [f2(gaps.equalizedOdds), FAIR_GAP],
                  )
                : t(
                    "Unfair by equalized odds: the groups get very different error rates (gap {0} > {1}).",
                    [f2(gaps.equalizedOdds), FAIR_GAP],
                  )}
          </p>
          <p className="text-xs text-fg-muted">
            {t(
              "✓ means a gap of at most 0.15 (or a ratio of at least 0.8). The groups' class-1 rates differ slightly in the test set, so not every criterion can be exactly met at once — see the impossibility result in Bias & Fairness.",
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

function ScenarioPanel({ scenario, active }: { scenario: Scenario; active: boolean }) {
  const { t } = useTranslation()
  const [settings, setSettings] = useState(scenario.settings)
  const [nets, setNets] = useState(() => freshNetworks(scenario.settings.neurons))
  const [epoch, setEpoch] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [started, setStarted] = useState(false)
  const [view, setView] = useState<"data" | "performance">("data")
  const [history, setHistory] = useState(emptyHistory)
  const rands = useRef(freshRands())

  const trainSets = useMemo(() => splitTrainSets(settings), [settings])
  const examples = useMemo(
    () => trainSets.map((set) => set.map((p) => ({ input: toInput(p.x, p.y), target: [p.label] }))),
    [trainSets],
  )
  const runs = useMemo(
    () => nets.map((net, i) => accuracyScores(trainSets[i], classify(net))),
    [nets, trainSets],
  )
  const summary = summarize(runs)
  const meanHistory = history[0].map((point, step) => ({
    x: point.x,
    train: history.reduce((sum, h) => sum + (h[step]?.train ?? 0), 0) / SPLITS,
    test: history.reduce((sum, h) => sum + (h[step]?.test ?? 0), 0) / SPLITS,
    groupA: history.reduce((sum, h) => sum + (h[step]?.groupA ?? 0), 0) / SPLITS,
    groupB: history.reduce((sum, h) => sum + (h[step]?.groupB ?? 0), 0) / SPLITS,
  }))
  const groups = useMemo(
    () => meanGroupReport(nets.map((net) => groupReport(classify(net)))),
    [nets],
  )
  const better = Math.max(summary.groupA, summary.groupB)
  const weakerGroup = summary.groupA < summary.groupB ? "A" : "B"
  /** Same test as the "imbalanced" verdict: one group generalizes, the other fails. */
  const leftBehind = better - summary.worst > 0.25 && summary.train - better < 0.05
  const verdict = accuracyVerdict(summary)
  const done = epoch >= scenario.epochs

  const reset = (next: Settings) => {
    setSettings(next)
    setNets(freshNetworks(next.neurons))
    setEpoch(0)
    setHistory(emptyHistory())
    rands.current = freshRands()
    setPlaying(false)
  }

  // Train automatically the first time the scenario is opened.
  useEffect(() => {
    if (active && !started) {
      setStarted(true)
      setPlaying(true)
    }
  }, [active, started])

  const stepRef = useRef(() => {})
  stepRef.current = () => {
    const next = nets.map((net, i) => {
      const copy = cloneNetwork(net)
      for (let e = 0; e < EPOCHS_PER_TICK; e++) {
        trainEpoch(copy, examples[i], LEARNING_RATE, { rand: rands.current[i] })
      }
      return copy
    })
    const nextEpoch = epoch + EPOCHS_PER_TICK
    setNets(next)
    setEpoch(nextEpoch)
    setHistory((h) =>
      h.map((runHistory, i) => {
        const scores = accuracyScores(trainSets[i], classify(next[i]))
        return [
          ...runHistory,
          {
            x: nextEpoch,
            train: scores.train,
            test: scores.test,
            groupA: scores.groupA,
            groupB: scores.groupB,
          },
        ]
      }),
    )
  }

  useEffect(() => {
    if (!playing) return
    if (epoch >= scenario.epochs) {
      setPlaying(false)
      return
    }
    const timer = setTimeout(() => stepRef.current(), 20)
    return () => clearTimeout(timer)
  }, [playing, epoch, scenario.epochs])

  const update = (patch: Partial<Settings>) => reset({ ...settings, ...patch })

  return (
    <div className="flex flex-col gap-4">
      <p className="text-fg-secondary">{t(scenario.description)}</p>

      <div
        role="tablist"
        aria-label={t("View")}
        className="flex flex-wrap gap-2 border-b border-divider pb-3"
      >
        {(["data", "performance"] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={cn(
              "label-ui rounded-[2px] border px-3 py-1.5 transition-colors",
              view === v ? "border-brand text-brand" : "border-line text-fg-muted hover:text-fg",
            )}
          >
            {v === "data" ? t("Dataset") : t("Algorithm / Performance")}
          </button>
        ))}
      </div>

      {view === "data" ? (
        <>
          <div className="flex flex-col gap-2">
            <p className="label-ui text-fg-muted">{t("Training data")}</p>
            <Slider
              label="Training size"
              value={settings.size}
              min={20}
              max={400}
              step={10}
              onChange={(size) => update({ size })}
            />
            <Slider
              label="Random labels"
              value={settings.labelNoise}
              min={0}
              max={1}
              step={0.05}
              onChange={(labelNoise) => update({ labelNoise })}
              format={pct}
            />
            <Slider
              label="Minority share"
              value={settings.minorityShare}
              min={0}
              max={0.5}
              step={0.01}
              onChange={(minorityShare) => update({ minorityShare })}
              format={pct}
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-fg-secondary">{t("How the data was split into 5:")}</p>
            <OptionList
              ordered={false}
              items={[
                t(
                  "5 training samples of {0} points each, drawn from the same population — they differ only by chance;",
                  [settings.size],
                ),
                t("1 test set of 400 points (200 per group), held out and never trained on;"),
                t("each run trains on its own sample and is scored on that same test set."),
              ]}
            />
            <Takeaway>
              {t(
                "Comparing the 5 runs shows how much the result depends on which data you happened to get.",
              )}
            </Takeaway>
          </div>

          <TrainingData trainSets={trainSets} />
          <ScenarioNote>{t(scenario.dataNote)}</ScenarioNote>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <p className="label-ui text-fg-muted">{t("Neural network, one hidden layer")}</p>
            <Slider
              label="Hidden neurons"
              value={settings.neurons}
              min={1}
              max={32}
              step={1}
              onChange={(neurons) => update({ neurons })}
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                disabled={done}
                className="label-ui rounded-[2px] border border-brand px-3 py-1.5 text-brand disabled:opacity-40"
              >
                {playing ? t("Pause") : t("Train 5 splits")}
              </button>
              <button
                type="button"
                onClick={() => reset(scenario.settings)}
                className="label-ui rounded-[2px] border border-line px-3 py-1.5 text-fg-muted hover:text-fg"
              >
                {t("Reset to scenario")}
              </button>
              <span className="font-ui text-xs text-fg-muted">
                {t("epoch {0} / {1}", [epoch, scenario.epochs])}
              </span>
            </div>
          </div>
          {nets.map((net, i) => (
            <RunRow
              key={RUN_COLORS[i]}
              index={i}
              net={net}
              train={trainSets[i]}
              scores={runs[i]}
              history={history[i]}
              done={done}
            />
          ))}

          <div className="flex flex-col gap-2 border-t border-divider pt-4">
            <p className="font-display text-xl text-fg">{t("All 5 runs")}</p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.2fr_1fr]">
              <DecisionChart
                points={shownPoints}
                series={[
                  { key: "negative", label: "class 0", color: "var(--color-chart-cool)" },
                  { key: "positive", label: "class 1", color: "var(--color-brand)" },
                ]}
                xLabel="x₁"
                yLabel="x₂"
                valueAt={(x, y) =>
                  nets.reduce((sum, net) => sum + probability(net)(x, y), 0) / SPLITS
                }
                boundaries={[
                  ...nets.map((net, i) => ({
                    key: `run-${i}`,
                    valueAt: probability(net),
                    color: RUN_COLORS[i],
                  })),
                  { key: "truth", valueAt: trueLabel, color: "var(--color-fg)", dashed: true },
                ]}
              />
              <div className="flex flex-col gap-3">
                <AccuracyCurves history={meanHistory} />
                <table className="w-full font-ui text-xs text-fg-secondary">
                  <thead>
                    <tr className="text-fg-muted">
                      <th className="px-1 text-left font-normal">{t("run")}</th>
                      <th className="px-1 text-right font-normal">{t("train")}</th>
                      <th className="px-1 text-right font-normal">{t("test")}</th>
                      <th className="px-1 text-right font-normal">{t("gap")}</th>
                      <th className="px-1 text-right font-normal">A</th>
                      <th className="px-1 text-right font-normal">B</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((run, i) => (
                      <tr key={RUN_COLORS[i]}>
                        <td className="px-1">
                          <span style={{ color: RUN_COLORS[i] }}>●</span> {i + 1}
                        </td>
                        <td className="px-1 text-right">{pct(run.train)}</td>
                        <td className="px-1 text-right">{pct(run.test)}</td>
                        <td className="px-1 text-right">{pct(run.gap)}</td>
                        <td className="px-1 text-right">{pct(run.groupA)}</td>
                        <td className="px-1 text-right">{pct(run.groupB)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-divider text-fg">
                      <td className="px-1">{t("mean")}</td>
                      <td className="px-1 text-right">{pct(summary.train)}</td>
                      <td className="px-1 text-right">{pct(summary.test)}</td>
                      <td className="px-1 text-right">{pct(summary.gap)}</td>
                      <td className="px-1 text-right">{pct(summary.groupA)}</td>
                      <td className="px-1 text-right">{pct(summary.groupB)}</td>
                    </tr>
                  </tbody>
                </table>
                <Worked>
                  <p>
                    {t("mean gap")} = ({runs.map((r) => f2(r.gap)).join(" + ")}) / {SPLITS} ={" "}
                    {f2(summary.gap)}
                  </p>
                  <p>
                    {t("test spread")} = {f2(Math.max(...runs.map((r) => r.test)))} −{" "}
                    {f2(Math.min(...runs.map((r) => r.test)))} = {f2(summary.spread)}
                  </p>
                  <p>
                    {t("worst group")} = min({f2(summary.groupA)}, {f2(summary.groupB)}) ={" "}
                    {f2(summary.worst)}
                  </p>
                </Worked>
                {done && (
                  <OptionList
                    ordered={false}
                    items={[
                      summary.train < 0.85
                        ? t(
                            "Bias / underfitting: mean training accuracy {0} — high bias: the model can't fit even the data it saw.",
                            [pct(summary.train)],
                          )
                        : t(
                            "Bias / underfitting: mean training accuracy {0} — low bias: the model fits the data it saw.",
                            [pct(summary.train)],
                          ),
                      leftBehind
                        ? t(
                            "Variance / overfitting: mean gap {0}, test spread {1} — but the gap comes from group B, not memorization: group A scores {2} on new data, as in training.",
                            [pct(summary.gap), pct(summary.spread), pct(better)],
                          )
                        : summary.gap > 0.15
                          ? t(
                              "Variance / overfitting: mean gap {0}, test spread {1} across runs — high variance: each run learned its own sample.",
                              [pct(summary.gap), pct(summary.spread)],
                            )
                          : t(
                              "Variance / overfitting: mean gap {0}, test spread {1} across runs — low variance: the runs agree and hold up on new data.",
                              [pct(summary.gap), pct(summary.spread)],
                            ),
                      leftBehind
                        ? t(
                            "Fairness: group A {0}, group B {1} — group {2} is left behind (worst group {3}).",
                            [
                              pct(summary.groupA),
                              pct(summary.groupB),
                              weakerGroup,
                              pct(summary.worst),
                            ],
                          )
                        : t("Fairness: group A {0}, group B {1} — both groups are served.", [
                            pct(summary.groupA),
                            pct(summary.groupB),
                          ]),
                    ]}
                  />
                )}
                <p
                  className={cn(
                    "rounded-[3px] border px-3 py-2 text-sm text-fg",
                    verdict === "good" ? "border-chart-cool" : "border-brand",
                  )}
                >
                  {done
                    ? t(VERDICT_COPY[verdict])
                    : t("Training… the verdict appears when all runs finish.")}
                </p>
              </div>
            </div>
          </div>
          <GroupFairness groups={groups} done={done} />
          <ScenarioNote>{t(scenario.fairnessNote)}</ScenarioNote>
          <ScenarioNote>{t(scenario.outcomeNote)}</ScenarioNote>
        </>
      )}
    </div>
  )
}

/** One tab per scenario; each trains the same network on five different training splits. */
export function GeneralizationScenarios() {
  const { t } = useTranslation()
  const [tab, setTab] = useState(SCENARIOS[0].key)
  /** Tabs mount on first visit and then stay mounted, so a finished run survives switching. */
  const [visited, setVisited] = useState(() => new Set([SCENARIOS[0].key]))
  const open = (key: string) => {
    setTab(key)
    setVisited((v) => new Set(v).add(key))
  }
  return (
    <div className="flex flex-col gap-4 rounded-[3px] border border-divider bg-surface/40 p-4">
      <div role="tablist" aria-label={t("Scenarios")} className="flex flex-wrap gap-2">
        {SCENARIOS.map((s) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={tab === s.key}
            onClick={() => open(s.key)}
            className={cn(
              "label-ui rounded-[2px] border px-3 py-1.5 transition-colors",
              tab === s.key ? "border-brand text-brand" : "border-line text-fg-muted hover:text-fg",
            )}
          >
            {t(s.title)}
          </button>
        ))}
      </div>
      {SCENARIOS.map((s) => (
        <div key={s.key} role="tabpanel" hidden={tab !== s.key}>
          {visited.has(s.key) && <ScenarioPanel scenario={s} active={tab === s.key} />}
        </div>
      ))}
    </div>
  )
}

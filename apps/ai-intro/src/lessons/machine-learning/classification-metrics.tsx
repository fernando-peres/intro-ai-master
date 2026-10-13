import { Link } from "@tanstack/react-router"
import { PauseIcon, PlayIcon, RotateCcwIcon } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { DecisionChart } from "@/components/charts/decision-chart"
import { LineChart } from "@/components/charts/line-chart"
import {
  LessonArticle,
  LessonFooter,
  LessonHero,
  LessonLead,
} from "@/components/course/lesson-layout"
import { StatStrip } from "@/components/stat-strip"
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
import {
  cloneNetwork,
  createNetwork,
  crossEntropy,
  mulberry32,
  type Network,
  predict,
  trainEpoch,
} from "@/lib/neural-net"
import { cn } from "@/lib/utils"
import {
  classMeta,
  type MachineClass,
  machineReadings,
  riskLabel,
} from "../programming-vs-ml/dataset"
import {
  DEFAULT_ACTIVATION,
  DEFAULT_HIDDEN_LAYERS,
  DEFAULT_LEARNING_RATE,
  EPOCHS_PER_TICK,
  examples,
  MAX_EPOCHS,
  SEED,
  toInput,
} from "../programming-vs-ml/ml-training"
import { RiskColorPicker, RiskColorsProvider } from "../programming-vs-ml/risk-colors"
import { RiskTable } from "../programming-vs-ml/risk-table"
import { ConfusionMatrix } from "./algorithm-card"
import { CheatSheet, MetricSection, OptionList, StatRow, Takeaway } from "./metric-section"

const METRIC_2 = "var(--color-fg-secondary)"
const METRIC_1 = "var(--color-chart-warm)"
const FG = "var(--color-fg)"

const LAYER_SIZES = [2, ...DEFAULT_HIDDEN_LAYERS, 1]
const WARMUP_EPOCHS = 10
/** The three full-training checkpoints the Data & Learning tab can jump to. */
const CHECKPOINTS = [WARMUP_EPOCHS, 40, 100] as const
const REFERENCE_THRESHOLD = 0.5
const CALIBRATION_BINS = 6
const TOTAL = machineReadings.length
const thresholds = Array.from({ length: 19 }, (_, i) => Number((0.05 + i * 0.05).toFixed(2)))

type HistoryEntry = { epoch: number; loss: number; accuracy: number }

function correctCount(net: Network) {
  return examples.filter((ex) => (predict(net, ex.input)[0] >= 0.5 ? 1 : 0) === ex.target[0]).length
}

function snapshot(net: Network, epoch: number): HistoryEntry {
  return {
    epoch,
    loss: crossEntropy(net, examples),
    accuracy: correctCount(net) / TOTAL,
  }
}

/** Trains a fresh, deterministic network up to `targetEpoch`, with the full loss/accuracy history. */
function trainTo(targetEpoch: number): {
  net: Network
  rand: () => number
  history: HistoryEntry[]
} {
  const net = createNetwork(LAYER_SIZES, SEED, DEFAULT_ACTIVATION)
  const rand = mulberry32(SEED + 100)
  const history: HistoryEntry[] = [snapshot(net, 0)]
  for (let epoch = 1; epoch <= targetEpoch; epoch++) {
    trainEpoch(net, examples, DEFAULT_LEARNING_RATE, { rand })
    history.push(snapshot(net, epoch))
  }
  return { net, rand, history }
}

const series = [
  { key: "normal", label: riskLabel("normal"), color: "var(--color-risk-0)" },
  { key: "at-risk", label: riskLabel("at-risk"), color: "var(--color-risk-1)" },
]
const points = machineReadings.map((r) => ({ x: r.temperature, y: r.vibration, series: r.label }))
const toInputXY = (x: number, y: number) => toInput({ temperature: x, vibration: y })

const pct = (v: number) => `${Math.round(v * 100)}%`
const f2 = (v: number) => v.toFixed(2)

function performanceCharts(history: HistoryEntry[], t: (s: string) => string) {
  return (
    <LineChart
      series={[
        {
          key: "loss",
          label: t("loss (cross-entropy)"),
          color: FG,
          points: history.map((h) => ({ x: h.epoch, y: h.loss })),
        },
        {
          key: "accuracy",
          label: t("accuracy"),
          color: METRIC_1,
          points: history.map((h) => ({ x: h.epoch, y: h.accuracy })),
        },
      ]}
      xLabel={t("Epoch")}
      yLabel={t("Loss / accuracy")}
    />
  )
}

export function ClassificationMetricsLesson({ entry }: { entry: LessonEntry }) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<"data" | "evaluation">("data")

  const initial = useRef<ReturnType<typeof trainTo> | undefined>(undefined)
  if (!initial.current) initial.current = trainTo(WARMUP_EPOCHS)
  const warm = initial.current
  const [net, setNet] = useState<Network>(() => warm.net)
  const [history, setHistory] = useState<HistoryEntry[]>(() => warm.history)
  const [target, setTarget] = useState<number>(WARMUP_EPOCHS)
  const [playing, setPlaying] = useState(false)
  const shuffleRand = useRef(warm.rand)

  const epoch = history[history.length - 1].epoch
  const done = epoch >= target

  /** Jumps to a checkpoint: replays from scratch if it's behind the current epoch, else keeps training. */
  const trainUntil = (checkpoint: number) => {
    if (checkpoint < epoch) {
      const fresh = trainTo(checkpoint)
      setNet(fresh.net)
      setHistory(fresh.history)
      shuffleRand.current = fresh.rand
    }
    setTarget(checkpoint)
    setPlaying(true)
  }

  /** Keeps training with no fixed stopping point, until paused or the epoch cap is hit. */
  const trainContinuously = () => {
    setTarget(MAX_EPOCHS)
    setPlaying(true)
  }

  const pauseTraining = () => setPlaying(false)

  /** Back to an untrained, freshly initialized network. */
  const resetTraining = () => {
    const fresh = trainTo(0)
    setNet(fresh.net)
    setHistory(fresh.history)
    shuffleRand.current = fresh.rand
    setTarget(0)
    setPlaying(false)
  }

  const step = (epochs: number) => {
    const next = cloneNetwork(net)
    for (let i = 0; i < epochs; i++) {
      trainEpoch(next, examples, DEFAULT_LEARNING_RATE, { rand: shuffleRand.current })
    }
    setNet(next)
    setHistory((h) => [...h, snapshot(next, epoch + epochs)])
  }

  const stepRef = useRef(step)
  stepRef.current = step

  // biome-ignore lint/correctness/useExhaustiveDependencies: epoch isn't read, but each new epoch schedules the next tick.
  useEffect(() => {
    if (!playing) return
    if (done) {
      setPlaying(false)
      return
    }
    const timer = setTimeout(() => stepRef.current(EPOCHS_PER_TICK), 40)
    return () => clearTimeout(timer)
  }, [playing, done, epoch])

  /** Every classification metric, recomputed live as `net` trains. */
  const liveMetrics = useMemo(() => {
    const nnActual = machineReadings.map((r) => r.label === "at-risk")
    const nnScores = machineReadings.map((r) => predict(net, toInput(r))[0])
    const m = classificationMetrics(nnActual, nnScores, REFERENCE_THRESHOLD)
    const fpr = m.fp / (m.fp + m.tn)
    const byThreshold = thresholds.map((th) => ({
      t: th,
      m: classificationMetrics(nnActual, nnScores, th),
    }))
    const bestF1 = byThreshold.reduce((a, b) => (b.m.f1 > a.m.f1 ? b : a))
    const roc = rocCurve(nnActual, nnScores)
    const pr = precisionRecallCurve(nnActual, nnScores)
    const ap = averagePrecision(nnActual, nnScores)
    const prevalence = nnActual.filter(Boolean).length / nnActual.length
    const modelLogLoss = logLoss(nnActual, nnScores)
    const positives = nnActual.filter(Boolean).length
    const negatives = nnActual.length - positives
    /** The non-zero terms of AP = Σ (Rₙ − Rₙ₋₁)·Pₙ, for the worked example. */
    const apTerms = (() => {
      let previous = 0
      return pr.flatMap((point) => {
        const step = point.x - previous
        previous = point.x
        return step > 0 ? [{ step, precision: point.y }] : []
      })
    })()
    const calBand = calibrationCurve(nnActual, nnScores, CALIBRATION_BINS).find(
      (b) => b.x >= 1 / CALIBRATION_BINS && b.x < 2 / CALIBRATION_BINS,
    )
    const modelBrier = brierScore(nnActual, nnScores)
    const ece = expectedCalibrationError(nnActual, nnScores, CALIBRATION_BINS)
    const calibration = calibrationCurve(nnActual, nnScores, CALIBRATION_BINS).map(({ x, y }) => ({
      x,
      y,
    }))
    return {
      nnScores,
      m,
      fpr,
      byThreshold,
      bestF1,
      roc,
      pr,
      ap,
      prevalence,
      modelLogLoss,
      positives,
      negatives,
      apTerms,
      calBand,
      modelBrier,
      ece,
      calibration,
    }
  }, [net])
  const {
    nnScores,
    m,
    fpr,
    byThreshold,
    bestF1,
    roc,
    pr,
    ap,
    prevalence,
    modelLogLoss,
    positives,
    negatives,
    apTerms,
    calBand,
    modelBrier,
    ece,
    calibration,
  } = liveMetrics
  const firstNormal = { reading: machineReadings[0], p: nnScores[0] }
  const lastAtRisk = {
    reading: machineReadings[machineReadings.length - 1],
    p: nnScores[nnScores.length - 1],
  }

  const riskRows = machineReadings.map((r) => ({
    key: `${r.temperature}-${r.vibration}-${r.label}`,
    temperature: r.temperature,
    vibration: r.vibration,
    actual: r.label,
    predicted: (predict(net, toInputXY(r.temperature, r.vibration))[0] >= 0.5
      ? "at-risk"
      : "normal") as MachineClass,
  }))

  const decisionChart = (
    <DecisionChart
      points={points}
      series={series}
      xLabel={t("Temperature (°C)")}
      yLabel={t("Vibration (mm/s)")}
      valueAt={(x, y) => predict(net, toInputXY(x, y))[0]}
      showBoundaryLine
      positiveColor="var(--color-risk-1)"
      negativeColor="var(--color-risk-0)"
    />
  )

  return (
    <LessonArticle entry={entry}>
      <RiskColorsProvider>
        <LessonHero line1={t("Classification")} line2={t("metrics")} />

        <RiskColorPicker />

        <div
          role="tablist"
          aria-label={t("Sections")}
          className="flex flex-wrap gap-2 border-b border-divider pb-3"
        >
          {(["data", "evaluation"] as const).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                "label-ui rounded-[2px] border px-3 py-1.5 transition-colors",
                tab === key ? "border-brand text-brand" : "border-line text-fg-muted hover:text-fg",
              )}
            >
              {key === "data" ? t("Data & Learning") : t("Evaluation")}
            </button>
          ))}
        </div>

        <div role="tabpanel" hidden={tab !== "data"} className="flex flex-col gap-[26px]">
          <LessonLead>
            {t(
              "The same machine-health problem from Programming vs ML: predict whether a machine is Normal or At Risk from its temperature and vibration.",
            )}{" "}
            <Link
              to="/learn/$chapter/$lesson"
              params={{ chapter: "programming-vs-ml", lesson: "problem" }}
              className="text-brand hover:text-brand-soft"
            >
              {t("See the full dataset →")}
            </Link>
          </LessonLead>
          <div className="flex flex-wrap items-center gap-2">
            {CHECKPOINTS.map((checkpoint) => (
              <button
                key={checkpoint}
                type="button"
                onClick={() => trainUntil(checkpoint)}
                disabled={playing && target === checkpoint}
                className={cn(
                  "label-ui flex items-center gap-1.5 rounded-[2px] border px-3 py-1.5 transition-colors disabled:pointer-events-none disabled:opacity-50",
                  target === checkpoint
                    ? "border-brand text-brand"
                    : "border-line text-fg-muted hover:text-fg",
                )}
              >
                <PlayIcon className="size-3.5" aria-hidden />
                {t("Train to epoch {0}", [checkpoint])}
              </button>
            ))}
            {playing && (
              <button
                type="button"
                onClick={pauseTraining}
                className="label-ui flex items-center gap-1.5 rounded-[2px] border border-brand px-3 py-1.5 text-brand transition-colors"
              >
                <PauseIcon className="size-3.5" aria-hidden /> {t("Pause")}
              </button>
            )}
          </div>
          <StatStrip
            label={t("Performance")}
            stats={[
              { label: t("Epoch"), value: String(epoch) },
              { label: t("Loss"), value: history[history.length - 1].loss.toFixed(3) },
              { label: t("Accuracy"), value: pct(history[history.length - 1].accuracy) },
            ]}
          />
          <div className="grid items-start gap-4 md:grid-cols-2">
            {decisionChart}
            {performanceCharts(history, t)}
          </div>
          <RiskTable rows={riskRows} />
        </div>

        <div role="tabpanel" hidden={tab !== "evaluation"} className="flex flex-col gap-[26px]">
          <LessonLead>
            {t(
              'A classifier answers "which category?" — and every answer is either right or wrong. But not all wrong answers cost the same:',
            )}
          </LessonLead>
          <OptionList
            ordered={false}
            items={[
              t("missing an at-risk machine (a false negative) is one mistake;"),
              t("flagging a healthy machine as at-risk (a false positive) is another."),
            ]}
          />
          <Takeaway>{t("Each metric below counts the mistakes a different way.")}</Takeaway>
          <p className="text-fg-secondary">
            {t(
              "Every number below comes from the same network shown in Data & Learning, currently trained for {0} epochs on the {1} machine readings.",
              [epoch, TOTAL],
            )}
          </p>

          <StatStrip
            label={t("Model configuration")}
            stats={[
              { label: t("Architecture"), value: LAYER_SIZES.join(" → ") },
              { label: t("Activation"), value: DEFAULT_ACTIVATION },
              { label: t("Learning rate"), value: String(DEFAULT_LEARNING_RATE) },
              { label: t("Epoch"), value: String(epoch) },
            ]}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={trainContinuously}
              disabled={playing}
              className="label-ui flex items-center gap-1.5 rounded-[2px] border border-line px-3 py-1.5 text-fg-muted transition-colors hover:text-fg disabled:pointer-events-none disabled:opacity-50"
            >
              <PlayIcon className="size-3.5" aria-hidden /> {t("Train")}
            </button>
            <button
              type="button"
              onClick={pauseTraining}
              disabled={!playing}
              className="label-ui flex items-center gap-1.5 rounded-[2px] border border-line px-3 py-1.5 text-fg-muted transition-colors hover:text-fg disabled:pointer-events-none disabled:opacity-50"
            >
              <PauseIcon className="size-3.5" aria-hidden /> {t("Pause")}
            </button>
            <button
              type="button"
              onClick={resetTraining}
              className="label-ui flex items-center gap-1.5 rounded-[2px] border border-line px-3 py-1.5 text-fg-muted transition-colors hover:text-fg"
            >
              <RotateCcwIcon className="size-3.5" aria-hidden /> {t("Reset")}
            </button>
          </div>

          <div className="grid items-start gap-4 md:grid-cols-2">
            {decisionChart}
            {performanceCharts(history, t)}
          </div>

          <RiskTable rows={riskRows} />

          <section aria-label={t("Performance report")} className="flex flex-col gap-3">
            <h2 className="label-ui text-fg-muted">{t("Performance report")}</h2>
            <StatRow
              stats={[
                { label: t("Accuracy"), value: f2(m.accuracy) },
                { label: t("Precision"), value: f2(m.precision) },
                { label: t("Recall"), value: f2(m.recall) },
                { label: "F1", value: f2(m.f1) },
                { label: t("Specificity"), value: f2(m.specificity) },
                { label: t("Balanced accuracy"), value: f2(m.balancedAccuracy) },
                { label: "MCC", value: f2(m.mcc) },
                { label: "ROC AUC", value: f2(m.auc) },
                { label: t("Average precision"), value: f2(ap) },
                { label: t("Log loss"), value: f2(modelLogLoss) },
                { label: t("Brier score"), value: f2(modelBrier) },
                { label: "ECE", value: f2(ece) },
              ]}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <p className="label-ui text-fg-muted">{t("ROC")}</p>
                <LineChart
                  series={[{ key: "roc", label: "ROC", color: METRIC_1, points: roc }]}
                  xLabel={t("False-positive rate")}
                  yLabel={t("True-positive rate")}
                />
              </div>
              <div className="flex flex-col gap-1">
                <p className="label-ui text-fg-muted">{t("Precision–recall")}</p>
                <LineChart
                  series={[
                    { key: "pr", label: t("precision–recall"), color: METRIC_1, points: pr },
                  ]}
                  xLabel={t("Recall")}
                  yLabel={t("Precision")}
                />
              </div>
              <div className="flex flex-col gap-1">
                <p className="label-ui text-fg-muted">{t("Calibration")}</p>
                <LineChart
                  series={[
                    {
                      key: "calibration",
                      label: t("this model"),
                      color: METRIC_2,
                      points: calibration,
                    },
                  ]}
                  xLabel={t("Predicted probability")}
                  yLabel={t("Observed at-risk rate")}
                />
              </div>
            </div>
            <Takeaway>
              {t("A dashboard of every number; each is explained, with its formula, below.")}
            </Takeaway>
          </section>

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
                  "Every prediction lands in one of four boxes: a true positive (TP, an at-risk machine flagged at-risk), a false negative (FN, an at-risk machine missed), a false positive (FP, a normal machine flagged at-risk) or a true negative (TN, a normal machine correctly left alone). ",
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
            range={
              <p>
                {t(
                  "There's no single good number here — the goal is high TP and TN, low FP and FN.",
                )}
              </p>
            }
          >
            <ConfusionMatrix
              metrics={m}
              positive={t(classMeta["at-risk"].name)}
              negative={t(classMeta.normal.name)}
              positiveColor="var(--color-risk-1)"
              negativeColor="var(--color-risk-0)"
            />
          </MetricSection>

          <MetricSection
            number="2"
            worked={
              <p>
                accuracy = ({m.tp} + {m.tn}) / {TOTAL} = {f2(m.accuracy)}
              </p>
            }
            title={t("Accuracy")}
            what={<p>{t("The share of all predictions that are correct.")}</p>}
            why={
              <p>
                {t(
                  "Easy to read, and fine here because the two classes are close to balanced. With rare classes it can be misleading — see ",
                )}
                <Link
                  to="/learn/$chapter/$lesson"
                  params={{ chapter: "machine-learning", lesson: "classification-fairness" }}
                  className="text-brand hover:text-brand-soft"
                >
                  {t("Classification (Fairness) →")}
                </Link>
                {t(" for the accuracy trap. ")}
              </p>
            }
            formulas={<p>accuracy = (TP + TN) / (TP + TN + FP + FN)</p>}
            range={<p>{t("0 to 1. Closer to 1 is better; 0 means every prediction is wrong.")}</p>}
          >
            <StatRow stats={[{ label: t("accuracy"), value: f2(m.accuracy) }]} />
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
                {t(": of everything predicted at-risk, how much really is. ")}
                <span className="text-fg">{t("Recall")}</span>{" "}
                {t(
                  " (sensitivity, true-positive rate): of everything really at-risk, how much was caught. ",
                )}
              </p>
            }
            why={
              <p>
                {t(
                  "They pull against each other. Raise the cutoff and the model only flags at-risk when sure: precision rises, recall falls. Favour precision when false alarms are costly (unnecessary maintenance), recall when misses are (an at-risk machine running undetected). ",
                )}
              </p>
            }
            formulas={
              <>
                <p>precision = TP / (TP + FP)</p>
                <p>recall = TP / (TP + FN)</p>
              </>
            }
            range={
              <p>
                {t(
                  "Both run 0 to 1. Closer to 1 is better for each; 0 means none of what was flagged (precision) or none of what was really at-risk (recall) was right.",
                )}
              </p>
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
                  color: METRIC_1,
                  points: byThreshold.map(({ t, m }) => ({ x: t, y: m.precision })),
                },
                {
                  key: "recall",
                  label: "recall",
                  color: METRIC_2,
                  points: byThreshold.map(({ t, m }) => ({ x: t, y: m.recall })),
                },
              ]}
              xLabel={t("Threshold")}
              yLabel="Score"
              vLines={[{ x: REFERENCE_THRESHOLD, label: t("0.5 cutoff") }]}
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
                  "One number to compare models or pick a cutoff when you care about both kinds of mistake. Here F1 peaks at a threshold of ",
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
            range={
              <p>{t("0 to 1. Closer to 1 is better; it's 0 whenever precision or recall is 0.")}</p>
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
                { x: REFERENCE_THRESHOLD, label: t("0.5 cutoff") },
                { x: bestF1.t, label: t("best") },
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
                  " (true-negative rate): of everything really normal, how much was correctly left alone. ",
                )}
                <span className="text-fg">{t("Balanced accuracy")}</span>
                {t(": the average of recall and specificity.")}
              </p>
            }
            why={
              <p>
                {t(
                  "Plain accuracy is dominated by whichever class is bigger. Balanced accuracy gives each class an equal vote, so a model that ignores one class scores 0.5 — chance — however lopsided the data.",
                )}
              </p>
            }
            formulas={
              <>
                <p>specificity = TN / (TN + FP)</p>
                <p>balanced accuracy = (recall + specificity) / 2</p>
              </>
            }
            range={
              <p>
                {t(
                  "Both run 0 to 1, but balanced accuracy's chance line is 0.5, not 0 — a model that ignores one class entirely still lands there.",
                )}
              </p>
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
                  color: METRIC_1,
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
              vLines={[{ x: REFERENCE_THRESHOLD, label: t("0.5 cutoff") }]}
            />
          </MetricSection>

          <MetricSection
            number="6"
            worked={
              <>
                <p>
                  MCC = ({m.tp}·{m.tn} − {m.fp}·{m.fn}) / √(({m.tp}+{m.fp})({m.tp}+{m.fn})({m.tn}+
                  {m.fp})({m.tn}+{m.fn}))
                </p>
                <p>
                  = {m.tp * m.tn - m.fp * m.fn} /{" "}
                  {Math.sqrt((m.tp + m.fp) * (m.tp + m.fn) * (m.tn + m.fp) * (m.tn + m.fn)).toFixed(
                    1,
                  )}{" "}
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
                  "F1 ignores true negatives and accuracy can be swamped by the majority class; MCC is high only when the model does well on both classes. That makes it one of the most reliable single numbers when classes are imbalanced or the two kinds of mistake cost differently.",
                )}
              </p>
            }
            formulas={<p>MCC = (TP·TN − FP·FN) / √((TP+FP)(TP+FN)(TN+FP)(TN+FN))</p>}
            range={
              <p>
                {t(
                  "−1 to 1. 1 is perfect, 0 is no better than chance, −1 is always wrong — so near 0 is bad, not just near −1.",
                )}
              </p>
            }
          >
            <StatRow stats={[{ label: "MCC", value: f2(m.mcc) }]} />
            <LineChart
              series={[
                {
                  key: "mcc",
                  label: "MCC",
                  color: METRIC_2,
                  points: byThreshold.map(({ t, m }) => ({ x: t, y: m.mcc })),
                },
              ]}
              xLabel={t("Threshold")}
              yLabel="MCC"
              vLines={[{ x: REFERENCE_THRESHOLD, label: t("0.5 cutoff") }]}
            />
          </MetricSection>

          <MetricSection
            number="7"
            worked={
              <>
                <p>
                  TPR = {m.tp} / ({m.tp} + {m.fn}) = {f2(m.recall)}, FPR = {m.fp} / ({m.fp} + {m.tn}
                  ) = {f2(fpr)}
                </p>
                <p>
                  AUC = {(m.auc * positives * negatives).toFixed(1)} / ({positives}·{negatives}){" "}
                  {t("winning pairs")} = {f2(m.auc)}
                </p>
              </>
            }
            title={t("ROC curve and AUC")}
            what={
              <p>
                {t(
                  "The ROC curve plots the true-positive rate against the false-positive rate for",
                )}{" "}
                <em>{t("every")}</em>{" "}
                {t(
                  " threshold at once. AUC is the area under it: the chance that a random at-risk machine scores higher than a random normal one. ",
                )}
              </p>
            }
            why={
              <p>
                {t(
                  "It judges the scores themselves, before any threshold is picked. 0.5 is a coin flip (the dashed diagonal), 1 is a perfect ranking; this model reaches",
                )}{" "}
                {f2(m.auc)}
                {t(". At the standard 0.5 cutoff, FPR is")} {f2(fpr)}.
              </p>
            }
            formulas={
              <>
                <p>TPR = TP / (TP + FN), FPR = FP / (FP + TN)</p>
                <p>AUC = P(score⁺ &gt; score⁻)</p>
              </>
            }
            range={
              <p>
                {t(
                  "0 to 1. 1 is a perfect ranking, 0.5 is chance (the dashed diagonal); below 0.5 is worse than guessing.",
                )}
              </p>
            }
          >
            <LineChart
              series={[
                { key: "roc", label: "ROC", color: METRIC_1, points: roc },
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
              vLines={[{ x: fpr, label: t("0.5 cutoff") }]}
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
            range={
              <p>
                {t(
                  "0 to 1. Closer to 1 is better; the random baseline sits at the positive rate ({0}), not 0.",
                  [f2(prevalence)],
                )}
              </p>
            }
          >
            <LineChart
              series={[
                { key: "pr", label: t("precision–recall"), color: METRIC_1, points: pr },
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
                  {t("{0}°C / {1} mm/s, normal: ", [
                    firstNormal.reading.temperature,
                    firstNormal.reading.vibration,
                  ])}
                  −ln(1 − {f2(firstNormal.p)}) = {f2(-Math.log(1 - firstNormal.p))}
                </p>
                <p>
                  {t("{0}°C / {1} mm/s, at-risk: ", [
                    lastAtRisk.reading.temperature,
                    lastAtRisk.reading.vibration,
                  ])}
                  −ln({f2(lastAtRisk.p)}) = {f2(-Math.log(lastAtRisk.p))}
                </p>
                <p>
                  log loss = ({t("sum of all")} {TOTAL}) / {TOTAL} ={" "}
                  {(modelLogLoss * TOTAL).toFixed(2)} / {TOTAL} = {f2(modelLogLoss)}
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
            range={
              <p>
                {t(
                  "0 upward, no fixed ceiling. Lower is better; 0 is a perfect, fully confident correct call. Guessing 50% always scores ln 2 ≈ 0.69.",
                )}
              </p>
            }
          >
            <LineChart
              series={[
                {
                  key: "penalty",
                  label: t("penalty for the true class"),
                  color: METRIC_2,
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
                  Brier = ({t("sum of all")} {TOTAL}) / {TOTAL} = {f2(modelBrier)}
                </p>
                {calBand && (
                  <p>
                    {t("bin around {0}: ", [f2(calBand.x)])}
                    {Math.round(calBand.y * calBand.count)} / {calBand.count} {t("were at-risk")} ={" "}
                    {f2(calBand.y)} {t("(gap")} {f2(Math.abs(calBand.x - calBand.y))})
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
                {t("Ranking well and being calibrated are different skills — see ")}
                <Link
                  to="/learn/$chapter/$lesson"
                  params={{ chapter: "machine-learning", lesson: "classification-fairness" }}
                  className="text-brand hover:text-brand-soft"
                >
                  {t("Classification (Fairness) →")}
                </Link>
                {t(
                  " for a model that ranks almost perfectly yet isn't calibrated at all. Calibrate before you treat a score as a probability — and check calibration per group when fairness matters.",
                )}
              </p>
            }
            formulas={
              <>
                <p>Brier = (1/n)·Σ(pᵢ − yᵢ)²</p>
                <p>ECE = Σ_bins (|bin|/n)·|mean p − positive rate|</p>
              </>
            }
            range={
              <p>
                {t(
                  "Both run 0 upward with no fixed ceiling, and lower is better. Brier: 0 is a perfect prediction, 1 is the worst (fully confident and wrong). ECE: 0 is perfectly calibrated.",
                )}
              </p>
            }
          >
            <StatRow
              stats={[
                { label: t("Brier score"), value: f2(modelBrier) },
                { label: "ECE", value: f2(ece) },
              ]}
            />
            <LineChart
              series={[
                {
                  key: "calibration",
                  label: t("this model"),
                  color: METRIC_2,
                  points: calibration,
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
              yLabel={t("Observed at-risk rate")}
            />
          </MetricSection>

          <CheatSheet
            number="11"
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
            {TOTAL}{" "}
            {t(
              " machine readings (temperature, vibration) from Programming vs ML, classified by a small neural network currently trained for {0} epochs. ",
              [epoch],
            )}
          </p>
        </div>

        <LessonFooter entry={entry} />
      </RiskColorsProvider>
    </LessonArticle>
  )
}

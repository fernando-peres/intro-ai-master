import {
  MinusIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  RotateCcwIcon,
  SigmaIcon,
  StepForwardIcon,
} from "lucide-react"
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react"
import { DecisionChart } from "@/components/charts/decision-chart"
import { LineChart } from "@/components/charts/line-chart"
import { ArticleFrame, LessonHero, LessonLead } from "@/components/course/lesson-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Translate } from "@/i18n/translate"
import { useTranslation } from "@/i18n/use-translation"
import {
  type ActivationName,
  cloneNetwork,
  createNetwork,
  crossEntropy,
  mulberry32,
  type Network,
  predict,
  trainEpoch,
} from "@/lib/neural-net"
import { cn } from "@/lib/utils"
import { classMeta, type MachineClass, machineReadings } from "./dataset"
import {
  DEFAULT_ACTIVATION,
  DEFAULT_HIDDEN_LAYERS,
  DEFAULT_LEARNING_RATE,
  EPOCHS_PER_TICK,
  examples,
  LEARNING_RATE_PRESETS,
  MAX_EPOCHS,
  MAX_LAYERS,
  MAX_NEURONS_PER_LAYER,
  MIN_LAYERS,
  MIN_NEURONS_PER_LAYER,
  SEED,
  TARGET_LOSS,
  TEMP_DOMAIN,
  toInput,
  VIB_DOMAIN,
} from "./ml-training"
import { NetworkDiagram } from "./network-diagram"
import { NetworkMath } from "./network-math"
import { classifyByRules } from "./rules"

const ACTIVATIONS: ActivationName[] = ["tanh", "relu", "sigmoid", "linear"]
const TOTAL = machineReadings.length

const rulesCorrect = machineReadings.filter((r) => classifyByRules(r) === r.label).length
const rulesAccuracy = Math.round((rulesCorrect / TOTAL) * 100)

const series = [
  {
    key: "normal",
    label: `${classMeta.normal.code} — ${classMeta.normal.name}`,
    color: "var(--color-chart-cool)",
  },
  {
    key: "at-risk",
    label: `${classMeta["at-risk"].code} — ${classMeta["at-risk"].name}`,
    color: "var(--color-brand)",
  },
]
const points = machineReadings.map((r) => ({ x: r.temperature, y: r.vibration, series: r.label }))
const toInputXY = (x: number, y: number) => toInput({ temperature: x, vibration: y })

type HistoryEntry = { epoch: number; loss: number; accuracy: number }

function correctCount(net: Network) {
  return examples.filter((ex) => (predict(net, ex.input)[0] >= 0.5 ? 1 : 0) === ex.target[0]).length
}

function snapshot(net: Network, epoch: number): HistoryEntry {
  return {
    epoch,
    loss: crossEntropy(net, examples),
    accuracy: Math.round((correctCount(net) / TOTAL) * 100),
  }
}

function ChartNote({ children }: { children: ReactNode }) {
  return <p className="text-sm text-fg-secondary">{children}</p>
}

function toggleButtonClass(active: boolean) {
  return cn(
    "label-ui rounded-[2px] border px-2.5 py-1.5 transition-colors",
    active ? "border-brand text-brand" : "border-line text-fg-muted hover:text-fg",
  )
}

function statusMessage(
  {
    epoch,
    correct,
    hiddenLayers,
    activation,
  }: {
    epoch: number
    correct: number
    hiddenLayers: number[]
    activation: ActivationName
  },
  t: Translate,
) {
  if (correct === TOTAL && epoch > 0) {
    return t(
      "✓ Separated — {0}/{1} correct; the hand-written rules got {2}/{3}. The hidden neurons bent the boundary around the at-risk arch.",
      [TOTAL, TOTAL, rulesCorrect, TOTAL],
    )
  }
  if (epoch === 0) {
    return t(
      "Press Train. Each small square is what one neuron “sees” across temperature × vibration; the big chart is the final decision.",
    )
  }
  if (hiddenLayers.length === 0 && epoch >= 100) {
    return t(
      "No hidden layer = a single neuron: its boundary is a straight line, and no straight line separates these two arches. Add a hidden layer.",
    )
  }
  if (activation === "linear" && epoch >= 100) {
    return t(
      "Linear activation: stacked linear layers collapse into one straight line, so depth adds nothing. The non-linear activation is what lets hidden layers bend the boundary.",
    )
  }
  if (epoch >= MAX_EPOCHS) {
    return t(
      "Still not separated after {0} epochs. Try more neurons, a different activation, or another learning rate.",
      [MAX_EPOCHS],
    )
  }
  return t("Training… watch the loss fall and the boundary bend.")
}

export function MachineLearningLesson() {
  const { t } = useTranslation()
  const [hiddenLayers, setHiddenLayers] = useState<number[]>(DEFAULT_HIDDEN_LAYERS)
  const [activation, setActivation] = useState<ActivationName>(DEFAULT_ACTIVATION)
  const [learningRate, setLearningRate] = useState(DEFAULT_LEARNING_RATE)

  const [net, setNet] = useState<Network>(() =>
    createNetwork([2, ...DEFAULT_HIDDEN_LAYERS, 1], SEED, DEFAULT_ACTIVATION),
  )
  const [history, setHistory] = useState<HistoryEntry[]>(() => [snapshot(net, 0)])
  const [playing, setPlaying] = useState(false)
  const [showMath, setShowMath] = useState(false)
  const shuffleRand = useRef(mulberry32(SEED + 100))

  const [testTemp, setTestTemp] = useState(85)
  const [testVib, setTestVib] = useState(2.5)
  const [classified, setClassified] = useState<{ probability: number; rules: MachineClass } | null>(
    null,
  )

  const epoch = history[history.length - 1].epoch
  const correct = useMemo(() => correctCount(net), [net])
  const current = history[history.length - 1]
  // Keep going past 100% until the loss is low, so the boundary settles with a margin.
  const done = (correct === TOTAL && current.loss < TARGET_LOSS) || epoch >= MAX_EPOCHS

  const restart = (layers: number[], act: ActivationName) => {
    const fresh = createNetwork([2, ...layers, 1], SEED, act)
    shuffleRand.current = mulberry32(SEED + 100)
    setNet(fresh)
    setHistory([snapshot(fresh, 0)])
    setPlaying(false)
    setClassified(null)
  }

  const step = (epochs: number) => {
    const next = cloneNetwork(net)
    for (let i = 0; i < epochs; i++) {
      trainEpoch(next, examples, learningRate, { rand: shuffleRand.current })
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

  const setLayers = (layers: number[]) => {
    setHiddenLayers(layers)
    restart(layers, activation)
  }
  const resizeLayer = (index: number, delta: number) => {
    const next = [...hiddenLayers]
    next[index] = Math.min(
      MAX_NEURONS_PER_LAYER,
      Math.max(MIN_NEURONS_PER_LAYER, next[index] + delta),
    )
    setLayers(next)
  }
  const chooseActivation = (name: ActivationName) => {
    setActivation(name)
    restart(hiddenLayers, name)
  }

  const architecture = [2, ...hiddenLayers, 1].join(" → ")

  return (
    <ArticleFrame>
      <LessonHero line1={t("Learn the rules")} line2={t("from data")} />
      <LessonLead>
        {t(
          "Instead of writing the classification logic ourselves, we give a neural network the same",
        )}{" "}
        {TOTAL}{" "}
        {t(
          " machines the rules were tested on, with their known outcomes. Backpropagation (1986) pushes the error backwards through the hidden layers and nudges every weight — and the hidden neurons learn to bend the boundary where a fixed threshold can't. ",
        )}
      </LessonLead>

      <section
        aria-label={t("Network configuration")}
        className="flex flex-col gap-3 rounded-[3px] border border-divider bg-surface p-[18px]"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-ui text-fg-muted">{t("Hidden layers")}</span>
          <button
            type="button"
            onClick={() => setLayers([...hiddenLayers, 3])}
            className={cn(toggleButtonClass(false), "disabled:opacity-50")}
            disabled={hiddenLayers.length >= MAX_LAYERS}
          >
            <PlusIcon className="size-3.5" aria-hidden /> {t(" layer ")}
          </button>
          <button
            type="button"
            onClick={() => setLayers(hiddenLayers.slice(0, -1))}
            className={cn(toggleButtonClass(false), "disabled:opacity-50")}
            disabled={hiddenLayers.length <= MIN_LAYERS}
          >
            <MinusIcon className="size-3.5" aria-hidden /> {t(" layer ")}
          </button>
          {hiddenLayers.map((count, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: layers are positional, not identified by value.
              key={i}
              className="flex items-center gap-1 rounded-[2px] border border-line px-2 py-1"
            >
              <span className="label-ui text-fg-muted">L{i + 1}</span>
              <button
                type="button"
                onClick={() => resizeLayer(i, -1)}
                aria-label={t("Fewer neurons in layer {0}", [i + 1])}
              >
                <MinusIcon className="size-3 text-fg-muted hover:text-brand" aria-hidden />
              </button>
              <span className="w-4 text-center font-ui text-xs text-fg">{count}</span>
              <button
                type="button"
                onClick={() => resizeLayer(i, 1)}
                aria-label={t("More neurons in layer {0}", [i + 1])}
              >
                <PlusIcon className="size-3 text-fg-muted hover:text-brand" aria-hidden />
              </button>
            </div>
          ))}
          <span className="label-ui ml-auto text-fg-muted">{architecture}</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2">
            <span className="label-ui text-fg-muted">{t("Activation")}</span>
            {ACTIVATIONS.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => chooseActivation(name)}
                className={toggleButtonClass(activation === name)}
              >
                {name}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2">
            <span className="label-ui text-fg-muted">{t("Learning rate")}</span>
            <select
              value={learningRate}
              onChange={(e) => setLearningRate(Number(e.target.value))}
              className="label-ui rounded-[2px] border border-line bg-canvas px-2 py-1.5 text-fg-secondary"
            >
              {LEARNING_RATE_PRESETS.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section aria-label={t("The network")} className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="label-ui text-fg-muted">
            {t("Input → hidden → output: each node shows what it has learned to see ")}
          </h2>
          <button
            type="button"
            onClick={() => setShowMath((v) => !v)}
            aria-pressed={showMath}
            className={cn(toggleButtonClass(showMath), "flex items-center gap-1.5")}
          >
            <SigmaIcon className="size-3.5" aria-hidden />
            {showMath ? t("Hide weights & math") : t("Show weights & math")}
          </button>
        </div>
        <NetworkDiagram
          network={net}
          toInput={toInputXY}
          domain={{
            xMin: TEMP_DOMAIN[0],
            xMax: TEMP_DOMAIN[1],
            yMin: VIB_DOMAIN[0],
            yMax: VIB_DOMAIN[1],
          }}
          inputLabels={[t("Temp"), t("Vib")]}
          outputLabel={t("At Risk?")}
          showWeights={showMath}
        />
        {showMath && (
          <NetworkMath
            network={net}
            input={toInputXY(testTemp, testVib)}
            exampleLabel={t('a machine at {0} °C, {1} mm/s (from "Classify a new example")', [
              testTemp,
              testVib,
            ])}
            learningRate={learningRate}
          />
        )}
      </section>

      <section aria-label={t("Train the network")} className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => step(1)}
            disabled={done}
            className={cn(
              toggleButtonClass(false),
              "flex items-center gap-1.5 disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            <StepForwardIcon className="size-3.5" aria-hidden /> {t(" Step ")}
          </button>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            disabled={done}
            className={cn(
              toggleButtonClass(playing),
              "flex items-center gap-1.5 disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            {playing ? (
              <PauseIcon className="size-3.5" aria-hidden />
            ) : (
              <PlayIcon className="size-3.5" aria-hidden />
            )}
            {playing ? t("Pause") : t("Train")}
          </button>
          <button
            type="button"
            onClick={() => restart(hiddenLayers, activation)}
            className={cn(toggleButtonClass(false), "flex items-center gap-1.5")}
          >
            <RotateCcwIcon className="size-3.5" aria-hidden /> {t(" Reset ")}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: t("Epoch"), value: String(epoch), highlight: false },
            { label: t("Loss"), value: current.loss.toFixed(3), highlight: false },
            {
              label: t("Network accuracy"),
              value: `${current.accuracy}% (${correct}/${TOTAL})`,
              highlight: correct > rulesCorrect,
            },
            {
              label: t("Rules accuracy"),
              value: `${rulesAccuracy}% (${rulesCorrect}/${TOTAL})`,
              highlight: false,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-[2px] border border-divider bg-surface px-3 py-2"
            >
              <p className="label-ui text-fg-muted">{t(stat.label)}</p>
              <p className={cn("font-display text-lg", stat.highlight ? "text-brand" : "text-fg")}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <p aria-live="polite" className="text-sm text-fg-secondary">
          {statusMessage({ epoch, correct, hiddenLayers, activation }, t)}
        </p>

        <DecisionChart
          points={points}
          series={series}
          xLabel={t("Temperature (°C)")}
          yLabel={t("Vibration (mm/s)")}
          valueAt={(x, y) => predict(net, toInputXY(x, y))[0]}
          showBoundaryLine
        />

        {history.length > 1 && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <LineChart
                series={[
                  {
                    key: "network",
                    label: t("neural network"),
                    color: "var(--color-brand)",
                    points: history.map((h) => ({ x: h.epoch, y: h.accuracy })),
                  },
                  {
                    key: "rules",
                    label: t("your rules"),
                    color: "var(--color-fg-muted)",
                    dashed: true,
                    points: [
                      { x: 0, y: rulesAccuracy },
                      { x: epoch, y: rulesAccuracy },
                    ],
                  },
                ]}
                xLabel={t("Epoch")}
                yLabel={t("Accuracy (%)")}
              />
              <ChartNote>
                <span className="text-fg">{t("Accuracy")}</span> {t(" — the share of the ")}
                {TOTAL}{" "}
                {t(
                  " machines whose predicted class (probability above or below 50%) matches the real label.",
                )}{" "}
                {!playing &&
                  t(
                    "After {0} epochs the network is at {1}% ({2}/{3}); the dashed line is the rules' fixed {4}%. {5}",
                    [
                      epoch,
                      current.accuracy,
                      correct,
                      TOTAL,
                      rulesAccuracy,
                      correct > rulesCorrect
                        ? t(
                            "The network beats them because it learned the curved boundary from the data.",
                          )
                        : t("Keep training — or change the architecture — to beat them."),
                    ],
                  )}
              </ChartNote>
            </div>
            <div className="flex flex-col gap-2">
              <LineChart
                series={[
                  {
                    key: "loss",
                    label: t("loss (cross-entropy)"),
                    color: "var(--color-fg)",
                    points: history.map((h) => ({ x: h.epoch, y: h.loss })),
                  },
                ]}
                xLabel={t("Epoch")}
                yLabel={t("Loss")}
              />
              <ChartNote>
                <span className="text-fg">{t("Loss")}</span>{" "}
                {t(
                  " — cross-entropy: how far the predicted probabilities are from the true labels. 0 is confidently right; about 0.69 is a coin-flip guess. It's what backpropagation minimizes.",
                )}{" "}
                {!playing &&
                  t("It fell from {0} to {1}: {2}", [
                    history[0].loss.toFixed(2),
                    current.loss.toFixed(2),
                    current.loss < 0.1
                      ? t("the network is not just right but confident on almost every machine.")
                      : t("it's still unsure about some machines near the boundary."),
                  ])}
              </ChartNote>
            </div>
          </div>
        )}
      </section>

      <section
        aria-label={t("Classify a new example")}
        className="flex flex-col gap-3 rounded-[3px] border border-divider bg-surface p-[26px]"
      >
        <h2 className="label-ui text-fg-muted">{t("Classify a new example")}</h2>
        <div className="flex flex-wrap items-end gap-4">
          <label htmlFor="classify-temperature" className="flex flex-col gap-1.5">
            <span className="label-ui text-fg-muted">{t("Temperature (°C)")}</span>
            <Input
              id="classify-temperature"
              type="number"
              value={testTemp}
              onChange={(e) => setTestTemp(Number(e.target.value))}
              className="w-28"
            />
          </label>
          <label htmlFor="classify-vibration" className="flex flex-col gap-1.5">
            <span className="label-ui text-fg-muted">{t("Vibration (mm/s)")}</span>
            <Input
              id="classify-vibration"
              type="number"
              step="0.1"
              value={testVib}
              onChange={(e) => setTestVib(Number(e.target.value))}
              className="w-28"
            />
          </label>
          <Button
            type="button"
            onClick={() =>
              setClassified({
                probability: predict(net, toInputXY(testTemp, testVib))[0],
                rules: classifyByRules({
                  temperature: testTemp,
                  vibration: testVib,
                  label: "normal",
                }),
              })
            }
          >
            {t("Classify ")}
          </Button>
        </div>
        {classified !== null && (
          <div className="flex flex-col gap-1 font-display text-lg">
            <span>
              {t("Network: ")}
              {Math.round(classified.probability * 100)}
              {t("% at risk —")}{" "}
              <span className={classified.probability >= 0.5 ? "text-brand" : "text-chart-cool"}>
                {classified.probability >= 0.5 ? t("B — At Risk") : t("A — Normal")}
              </span>
            </span>
            <span className="text-fg-secondary">
              {t("Rules:")}{" "}
              <span className={classified.rules === "at-risk" ? "text-brand" : "text-chart-cool"}>
                {classMeta[classified.rules].code} — {t(classMeta[classified.rules].name)}
              </span>
            </span>
          </div>
        )}
      </section>

      <p className="text-sm text-fg-secondary">
        {t(
          "Unlike a manually defined if/else program, the network learns the combination of temperature and vibration from the data itself — and the curved line above shows exactly what it decided. ",
        )}
      </p>
    </ArticleFrame>
  )
}

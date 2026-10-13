import {
  ChevronRightIcon,
  MinusIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  RotateCcwIcon,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { DecisionChart } from "@/components/charts/decision-chart"
import { LineChart } from "@/components/charts/line-chart"
import { ArticleFrame, LessonHero, LessonLead } from "@/components/course/lesson-layout"
import { FloatingPanel } from "@/components/floating-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  CompareBars,
  ConfigRail,
  LegendDot,
  OptionGrid,
  Panel,
  PanelNote,
  RailSection,
  RunToolbar,
  railButtonClass,
  Stepper,
  Switch,
  toolbarButtonClass,
  Workbench,
} from "@/components/workbench"
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
import { classMeta, type MachineClass, machineReadings, riskLabel } from "./dataset"
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
import { RiskColorPicker, RiskColorsProvider } from "./risk-colors"
import { RiskTable } from "./risk-table"
import { classifyByRules } from "./rules"

const ACTIVATIONS: ActivationName[] = ["tanh", "relu", "sigmoid", "linear"]
const TOTAL = machineReadings.length

const rulesCorrect = machineReadings.filter((r) => classifyByRules(r) === r.label).length
const rulesAccuracy = Math.round((rulesCorrect / TOTAL) * 100)

const series = [
  { key: "normal", label: riskLabel("normal"), color: "var(--color-risk-0)" },
  { key: "at-risk", label: riskLabel("at-risk"), color: "var(--color-risk-1)" },
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
  const [showWeights, setShowWeights] = useState(false)
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

  const riskRows = machineReadings.map((r) => ({
    key: `${r.temperature}-${r.vibration}-${r.label}`,
    temperature: r.temperature,
    vibration: r.vibration,
    actual: r.label,
    predicted: (predict(net, toInputXY(r.temperature, r.vibration))[0] >= 0.5
      ? "at-risk"
      : "normal") as MachineClass,
  }))

  const rail = (
    <ConfigRail
      title={t("Network configuration")}
      tip={t("Each small square is what one neuron “sees” across temperature × vibration.")}
    >
      <RailSection label={t("Hidden layers")}>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setLayers([...hiddenLayers, 3])}
            disabled={hiddenLayers.length >= MAX_LAYERS}
            aria-label={t("Add a hidden layer")}
            className={railButtonClass()}
          >
            <PlusIcon className="size-3" aria-hidden /> {t("layer")}
          </button>
          <button
            type="button"
            onClick={() => setLayers(hiddenLayers.slice(0, -1))}
            disabled={hiddenLayers.length <= MIN_LAYERS}
            aria-label={t("Remove a hidden layer")}
            className={railButtonClass()}
          >
            <MinusIcon className="size-3" aria-hidden /> {t("layer")}
          </button>
        </div>
        {hiddenLayers.map((count, i) => (
          <Stepper
            // biome-ignore lint/suspicious/noArrayIndexKey: layers are positional, not identified by value.
            key={i}
            label={`L${i + 1}`}
            value={count}
            onDecrement={() => resizeLayer(i, -1)}
            onIncrement={() => resizeLayer(i, 1)}
            decrementLabel={t("Fewer neurons in layer {0}", [i + 1])}
            incrementLabel={t("More neurons in layer {0}", [i + 1])}
          />
        ))}
      </RailSection>

      <RailSection label={t("Activation")}>
        <OptionGrid
          options={ACTIVATIONS.map((name) => ({ value: name, label: name }))}
          value={activation}
          onChange={chooseActivation}
        />
      </RailSection>

      <label className="flex flex-col gap-2">
        <span className="label-ui text-fg-muted">{t("Learning rate")}</span>
        <select
          value={learningRate}
          onChange={(e) => setLearningRate(Number(e.target.value))}
          className="rounded-[2px] border border-line bg-surface px-2.5 py-1.5 font-display text-[17px] text-fg"
        >
          {LEARNING_RATE_PRESETS.map((rate) => (
            <option key={rate} value={rate}>
              {rate}
            </option>
          ))}
        </select>
      </label>

      <RailSection label={t("Display")}>
        <Switch label={t("Show weights")} checked={showWeights} onChange={setShowWeights} />
        <Switch label={t("Show math")} checked={showMath} onChange={setShowMath} />
      </RailSection>
    </ConfigRail>
  )

  const toolbar = (
    <RunToolbar
      controls={
        <>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={done}
            className={toolbarButtonClass()}
          >
            <ChevronRightIcon className="size-3" aria-hidden /> {t("Step")}
          </button>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            disabled={done}
            className={toolbarButtonClass(true)}
          >
            {playing ? (
              <PauseIcon className="size-3" aria-hidden />
            ) : (
              <PlayIcon className="size-3" aria-hidden />
            )}
            {playing ? t("Pause") : t("Train")}
          </button>
          <button
            type="button"
            onClick={() => restart(hiddenLayers, activation)}
            className={toolbarButtonClass()}
          >
            <RotateCcwIcon className="size-3" aria-hidden /> {t("Reset")}
          </button>
        </>
      }
      architecture={architecture}
      metricsLabel={t("Run metrics")}
      metrics={[
        { label: t("Epoch"), value: String(epoch) },
        { label: t("Loss"), value: current.loss.toFixed(3) },
      ]}
    />
  )

  return (
    <ArticleFrame>
      <RiskColorsProvider>
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

        <RiskColorPicker />

        <Workbench rail={rail}>
          <Panel
            title={t("Network")}
            aside={t("Each node shows what it has learned to see")}
            footer={toolbar}
          >
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
              showWeights={showWeights}
            />
          </Panel>

          <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
            <Panel
              title={t("Decision boundary")}
              aside={
                <span className="flex items-center gap-3">
                  <LegendDot color="var(--color-risk-0)" label={t(riskLabel("normal"))} />
                  <LegendDot color="var(--color-risk-1)" label={t(riskLabel("at-risk"))} />
                </span>
              }
            >
              <DecisionChart
                points={points}
                series={series}
                xLabel={t("Temperature (°C)")}
                yLabel={t("Vibration (mm/s)")}
                valueAt={(x, y) => predict(net, toInputXY(x, y))[0]}
                showBoundaryLine
                showLegend={false}
                fill
                positiveColor="var(--color-risk-1)"
                negativeColor="var(--color-risk-0)"
              />
            </Panel>

            <Panel title={t("Network vs rules")}>
              <CompareBars
                rows={[
                  {
                    label: t("Neural network"),
                    count: `${correct} / ${TOTAL}`,
                    percent: current.accuracy,
                    tone: "brand",
                  },
                  {
                    label: t("Hand-written rules"),
                    count: `${rulesCorrect} / ${TOTAL}`,
                    percent: rulesAccuracy,
                    tone: "muted",
                  },
                ]}
              />
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
                xExtent={[0, 10]}
              />
              <PanelNote>
                <p>{statusMessage({ epoch, correct, hiddenLayers, activation }, t)}</p>
              </PanelNote>
            </Panel>
          </div>
        </Workbench>

        <section aria-label={t("Every machine, scored")} className="flex flex-col gap-3">
          <h2 className="label-ui text-fg-muted">{t("Every machine, scored")}</h2>
          <RiskTable rows={riskRows} />
          <p className="text-xs text-fg-muted">
            {t("Predicted risk is this network's current guess — it updates as you train. ")}
          </p>
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
                <span
                  className={
                    classified.probability >= 0.5
                      ? "text-[var(--color-risk-1)]"
                      : "text-[var(--color-risk-0)]"
                  }
                >
                  {classified.probability >= 0.5 ? t("B — At Risk") : t("A — Normal")}
                </span>
              </span>
              <span className="text-fg-secondary">
                {t("Rules:")}{" "}
                <span
                  className={
                    classified.rules === "at-risk"
                      ? "text-[var(--color-risk-1)]"
                      : "text-[var(--color-risk-0)]"
                  }
                >
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
        {showMath && (
          <FloatingPanel title={t("Weights & math")} onClose={() => setShowMath(false)}>
            <NetworkMath
              network={net}
              input={toInputXY(testTemp, testVib)}
              exampleLabel={t('a machine at {0} °C, {1} mm/s (from "Classify a new example")', [
                testTemp,
                testVib,
              ])}
              learningRate={learningRate}
            />
          </FloatingPanel>
        )}
      </RiskColorsProvider>
    </ArticleFrame>
  )
}

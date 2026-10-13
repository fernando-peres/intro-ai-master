import { Link } from "@tanstack/react-router"
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
import { Expandable } from "@/components/charts/expandable"
import { LineChart } from "@/components/charts/line-chart"
import { ArticleFrame, LessonHero, LessonLead } from "@/components/course/lesson-layout"
import { FloatingPanel } from "@/components/floating-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ConfigRail,
  LegendDot,
  OptionGrid,
  Panel,
  PanelNote,
  RailSection,
  RunToolbar,
  railButtonClass,
  SelectField,
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
import { type DescentRecord, descentRecord } from "./back-propagation-descent"
import { GradientDescentPanels } from "./back-propagation-descent-panels"
import { BackPropagationDiagram } from "./back-propagation-diagram"
import { BackPropagationMath } from "./back-propagation-math"
import {
  BACKPROP_DATASET_IDS,
  BACKPROP_DATASETS,
  type BackPropDatasetId,
  DEFAULT_ACTIVATION,
  DEFAULT_HIDDEN_LAYERS,
  DEFAULT_LEARNING_RATE,
  EPOCHS_PER_TICK,
  isPlateaued,
  LEARNING_RATE_PRESETS,
  MAX_EPOCHS,
  MAX_LAYERS,
  MAX_NEURONS_PER_LAYER,
  MIN_EPOCHS_BEFORE_PLATEAU_CHECK,
  MIN_LAYERS,
  MIN_NEURONS_PER_LAYER,
  PLATEAU_EPSILON,
  PLATEAU_MIN_LAYERS,
  PLATEAU_WINDOW,
  SEED,
  TARGET_LOSS,
  toExamples,
} from "./back-propagation-training"

const ACTIVATIONS: ActivationName[] = ["tanh", "relu", "sigmoid", "linear"]
const SATURATING: ActivationName[] = ["sigmoid", "tanh"]

const CLASS_COLORS = ["var(--color-class-1)", "var(--color-class-2)"] as const
/** What the native color input shows until the student picks one (the dark-theme tokens). */
const CLASS_COLOR_SWATCHES = ["#c084fc", "#34d399"] as const
type ClassColorOverrides = [string | null, string | null]

type HistoryEntry = { epoch: number; loss: number; accuracy: number }

function toDomain(dataset: BackPropDatasetId) {
  const { x, y } = BACKPROP_DATASETS[dataset].domain
  return { xMin: x[0], xMax: x[1], yMin: y[0], yMax: y[1] }
}

function correctCount(net: Network, examples: ReturnType<typeof toExamples>) {
  return examples.filter((ex) => (predict(net, ex.input)[0] >= 0.5 ? 1 : 0) === ex.target[0]).length
}

function snapshot(
  net: Network,
  examples: ReturnType<typeof toExamples>,
  epoch: number,
): HistoryEntry {
  const total = examples.length
  return {
    epoch,
    loss: crossEntropy(net, examples),
    accuracy: Math.round((correctCount(net, examples) / total) * 100),
  }
}

function NotSeparableBadge() {
  const { t } = useTranslation()
  return (
    <span className="rounded-[2px] border border-line px-1.5 py-0.5 text-[10px] normal-case tracking-normal text-fg-secondary">
      {t("Not linearly separable")}
    </span>
  )
}

function statusMessage(
  {
    epoch,
    correct,
    total,
    hiddenLayers,
    activation,
    plateaued,
  }: {
    epoch: number
    correct: number
    total: number
    hiddenLayers: number[]
    activation: ActivationName
    plateaued: boolean
  },
  t: Translate,
) {
  if (
    hiddenLayers.length >= PLATEAU_MIN_LAYERS &&
    SATURATING.includes(activation) &&
    epoch >= MIN_EPOCHS_BEFORE_PLATEAU_CHECK &&
    plateaued
  ) {
    return t(
      "Loss has stalled near a coin flip — this is a vanishing gradient: with {0}, the error shrinks every layer it passes backward through, so the earliest layers barely update. Try relu, or fewer layers.",
      [activation],
    )
  }
  if (correct === total && epoch > 0) {
    return t(
      "✓ Solved — {0} hidden layer(s) and backpropagation found a boundary the Perceptron couldn't.",
      [hiddenLayers.length],
    )
  }
  if (epoch === 0) {
    return t(
      "Press Train. Each small square is what one neuron “sees” across the input plane; the big chart is the final decision.",
    )
  }
  if (hiddenLayers.length === 0 && epoch >= 100) {
    return t(
      "No hidden layer = a single neuron — the same Perceptron you just saw. Its boundary is still one straight line.",
    )
  }
  if (hiddenLayers.length > 0) {
    return t(
      "Training… the hidden layer is learning a curved boundary the single neuron couldn't draw.",
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

export function BackPropagationLabLesson() {
  const { t } = useTranslation()
  const [dataset, setDataset] = useState<BackPropDatasetId>("xor")
  const [hiddenLayers, setHiddenLayers] = useState<number[]>(DEFAULT_HIDDEN_LAYERS)
  const [activation, setActivation] = useState<ActivationName>(DEFAULT_ACTIVATION)
  const [learningRate, setLearningRate] = useState(DEFAULT_LEARNING_RATE)

  const examples = useMemo(() => toExamples(dataset), [dataset])
  const [net, setNet] = useState<Network>(() =>
    createNetwork([2, ...DEFAULT_HIDDEN_LAYERS, 1], SEED, DEFAULT_ACTIVATION),
  )
  const [history, setHistory] = useState<HistoryEntry[]>(() => [snapshot(net, examples, 0)])
  // Every epoch, unlike `history`, which holds one entry per tick (several epochs).
  const [descent, setDescent] = useState<DescentRecord[]>(() => [descentRecord(net, examples, 0)])
  const [playing, setPlaying] = useState(false)
  const [showWeights, setShowWeights] = useState(false)
  const [showMath, setShowMath] = useState(false)
  const [colorOverrides, setColorOverrides] = useState<ClassColorOverrides>([null, null])
  const shuffleRand = useRef(mulberry32(SEED + 100))

  const [testX1, setTestX1] = useState(BACKPROP_DATASETS.xor.sample[0])
  const [testX2, setTestX2] = useState(BACKPROP_DATASETS.xor.sample[1])
  const [classified, setClassified] = useState<{ probability: number } | null>(null)

  const epoch = history[history.length - 1].epoch
  const correct = useMemo(() => correctCount(net, examples), [net, examples])
  const current = history[history.length - 1]
  const total = examples.length
  // Keep going past 100% until the loss is low, so the boundary settles with a margin.
  const done = (correct === total && current.loss < TARGET_LOSS) || epoch >= MAX_EPOCHS
  const plateaued = isPlateaued(history, PLATEAU_WINDOW, PLATEAU_EPSILON)

  const restart = (
    nextDataset: BackPropDatasetId,
    layers: number[],
    act: ActivationName,
    nextExamples = toExamples(nextDataset),
  ) => {
    const fresh = createNetwork([2, ...layers, 1], SEED, act)
    shuffleRand.current = mulberry32(SEED + 100)
    setNet(fresh)
    setHistory([snapshot(fresh, nextExamples, 0)])
    setDescent([descentRecord(fresh, nextExamples, 0)])
    setPlaying(false)
    setClassified(null)
  }

  const step = (epochs: number) => {
    const next = cloneNetwork(net)
    const records: DescentRecord[] = []
    for (let i = 0; i < epochs; i++) {
      trainEpoch(next, examples, learningRate, { rand: shuffleRand.current })
      records.push(descentRecord(next, examples, epoch + i + 1))
    }
    setNet(next)
    setDescent((d) => [...d, ...records])
    setHistory((h) => [...h, snapshot(next, examples, epoch + epochs)])
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

  const chooseDataset = (id: BackPropDatasetId) => {
    setDataset(id)
    setTestX1(BACKPROP_DATASETS[id].sample[0])
    setTestX2(BACKPROP_DATASETS[id].sample[1])
    restart(id, hiddenLayers, activation, toExamples(id))
  }
  const setLayers = (layers: number[]) => {
    setHiddenLayers(layers)
    restart(dataset, layers, activation, examples)
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
    restart(dataset, hiddenLayers, name, examples)
  }
  /** Retrains from the initial weights; the configuration stays as chosen. */
  const resetTraining = () => restart(dataset, hiddenLayers, activation, examples)

  const data = BACKPROP_DATASETS[dataset]
  const points = data.points.map((p) => ({
    x: p.x1,
    y: p.x2,
    series: String(p.y),
  }))
  const classColors = CLASS_COLORS.map((token, i) => colorOverrides[i] ?? token)
  const series = data.classes.map((label, i) => ({
    key: String(i),
    label,
    color: classColors[i],
  }))
  const domain = toDomain(dataset)
  const toInputXY = data.toInput

  const architecture = [2, ...hiddenLayers, 1].join(" → ")

  const rail = (
    <ConfigRail
      title={t("Network configuration")}
      tip={t("Each small square is what one neuron “sees” across the input plane x₁ × x₂.")}
    >
      <RailSection label={t("Dataset")}>
        <SelectField
          label={t("Dataset")}
          options={BACKPROP_DATASET_IDS.map((id) => ({
            value: id,
            label: t(BACKPROP_DATASETS[id].label),
            description: t(BACKPROP_DATASETS[id].description),
            badge: BACKPROP_DATASETS[id].separable ? undefined : <NotSeparableBadge />,
          }))}
          value={dataset}
          onChange={chooseDataset}
        />
      </RailSection>

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

      <RailSection label={t("Class colors")}>
        {data.classes.map((label, i) => (
          <label key={label} className="flex items-center justify-between gap-2">
            <span className="text-sm text-fg-secondary">{t(label)}</span>
            <input
              type="color"
              value={colorOverrides[i] ?? CLASS_COLOR_SWATCHES[i]}
              onChange={(e) => {
                const color = e.target.value
                setColorOverrides((prev) => (i === 0 ? [color, prev[1]] : [prev[0], color]))
              }}
              aria-label={t("Color for {0}", [t(label)])}
              className="size-7 cursor-pointer rounded-[2px] border border-divider bg-transparent p-0.5"
            />
          </label>
        ))}
        <button
          type="button"
          onClick={() => setColorOverrides([null, null])}
          disabled={colorOverrides[0] === null && colorOverrides[1] === null}
          className={railButtonClass()}
        >
          <RotateCcwIcon className="size-3" aria-hidden /> {t("Reset colors")}
        </button>
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
          <button type="button" onClick={resetTraining} className={toolbarButtonClass()}>
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
      <LessonHero line1={t("Backpropagation")} line2={t("training lab")} />
      <LessonLead>
        {t(
          "Build a network, pick a dataset, and press Train: watch backpropagation bend the decision boundary epoch by epoch.",
        )}
      </LessonLead>

      <Workbench rail={rail}>
        <Panel
          title={t("Network")}
          aside={t("Each node shows what it has learned to see")}
          footer={toolbar}
        >
          <Expandable title={t("Network")}>
            <BackPropagationDiagram
              network={net}
              toInput={toInputXY}
              domain={domain}
              inputLabels={dataset === "machines" ? [t("Temp"), t("Vib")] : [t("x₁"), t("x₂")]}
              outputLabel={t(data.classes[1])}
              showWeights={showWeights}
            />
          </Expandable>
        </Panel>

        <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
          <Panel
            title={t("Decision boundary")}
            aside={
              <span className="flex items-center gap-3">
                {series.map((s) => (
                  <LegendDot key={s.key} color={s.color} label={t(s.label)} />
                ))}
              </span>
            }
          >
            <Expandable title={t("Decision boundary")} className="flex flex-1 flex-col">
              <DecisionChart
                points={points}
                series={series}
                xLabel={t(data.axes[0])}
                yLabel={t(data.axes[1])}
                valueAt={(x, y) => predict(net, toInputXY(x, y))[0]}
                negativeColor={classColors[0]}
                positiveColor={classColors[1]}
                showBoundaryLine
                showLegend={false}
                fill
              />
            </Expandable>
          </Panel>

          <Panel title={t("Performance")} aside={`${current.accuracy}% (${correct}/${total})`}>
            <Expandable title={t("Performance")}>
              <LineChart
                series={[
                  {
                    key: "network",
                    label: t("training accuracy"),
                    color: "var(--color-brand)",
                    points: history.map((h) => ({ x: h.epoch, y: h.accuracy })),
                  },
                ]}
                xLabel={t("Epoch")}
                yLabel={t("Accuracy (%)")}
                xExtent={[0, 10]}
              />
            </Expandable>
            <PanelNote>
              <p>
                {statusMessage({ epoch, correct, total, hiddenLayers, activation, plateaued }, t)}
              </p>
            </PanelNote>
          </Panel>
        </div>

        <GradientDescentPanels
          net={net}
          examples={examples}
          learningRate={learningRate}
          epoch={epoch}
          history={descent}
        />
      </Workbench>

      <section
        aria-label={t("Classify a new example")}
        className="flex flex-col gap-3 rounded-[3px] border border-divider bg-surface p-[26px]"
      >
        <h2 className="label-ui text-fg-muted">{t("Classify a new example")}</h2>
        <div className="flex flex-wrap items-end gap-4">
          <label htmlFor="classify-x1" className="flex flex-col gap-1.5">
            <span className="label-ui text-fg-muted">{t(data.axes[0])}</span>
            <Input
              id="classify-x1"
              type="number"
              step="0.1"
              value={testX1}
              onChange={(e) => setTestX1(Number(e.target.value))}
              className="w-28"
            />
          </label>
          <label htmlFor="classify-x2" className="flex flex-col gap-1.5">
            <span className="label-ui text-fg-muted">{t(data.axes[1])}</span>
            <Input
              id="classify-x2"
              type="number"
              step="0.1"
              value={testX2}
              onChange={(e) => setTestX2(Number(e.target.value))}
              className="w-28"
            />
          </label>
          <Button
            type="button"
            onClick={() =>
              setClassified({ probability: predict(net, toInputXY(testX1, testX2))[0] })
            }
          >
            {t("Classify")}
          </Button>
        </div>
        {classified !== null && (
          <div className="flex flex-col gap-1 font-display text-lg">
            <span>
              {t("Network:")} {Math.round(classified.probability * 100)}
              {t("% → predicted ")}
              <span style={{ color: classColors[classified.probability >= 0.5 ? 1 : 0] }}>
                {t(data.classes[classified.probability >= 0.5 ? 1 : 0])}
              </span>
            </span>
          </div>
        )}
      </section>

      <section
        aria-label={t("Limitation")}
        className="flex flex-col gap-3 border-t border-divider pt-4"
      >
        <p className="font-display text-xl text-fg-secondary">
          {t(
            "Backpropagation can learn any boundary a hidden layer is wide enough to represent — but push the network deep with a saturating activation and the gradient reaching the earliest layers shrinks to almost nothing. Training stalls, not because the boundary is too simple, but because the signal that would fix it barely arrives.",
          )}
        </p>
        <Link
          to="/learn/$chapter/$lesson"
          params={{ chapter: "neural-networks", lesson: "forward-and-backward" }}
          className="label-ui self-start text-brand transition-colors hover:text-brand-soft"
        >
          {t("Next: step by step")} →
        </Link>
      </section>

      {showMath && (
        <FloatingPanel title={t("Weights & math")} onClose={() => setShowMath(false)}>
          <BackPropagationMath
            network={net}
            input={toInputXY(testX1, testX2)}
            exampleLabel={t('x = ({0}, {1}) (from "Classify a new example")', [testX1, testX2])}
            learningRate={learningRate}
          />
        </FloatingPanel>
      )}
    </ArticleFrame>
  )
}

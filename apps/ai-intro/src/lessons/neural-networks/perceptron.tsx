import { Link } from "@tanstack/react-router"
import { PauseIcon, PlayIcon, RotateCcwIcon, SigmaIcon, StepForwardIcon } from "lucide-react"
import { useEffect, useMemo, useReducer } from "react"
import { LineChart } from "@/components/charts/line-chart"
import { ArticleFrame, LessonHero, LessonLead } from "@/components/course/lesson-layout"
import type { Translate } from "@/i18n/translate"
import { useTranslation } from "@/i18n/use-translation"
import {
  classOf,
  LEARNING_RATE,
  MAX_EPOCHS,
  type PerceptronActivation,
  score,
  sigmoid,
} from "@/lib/perceptron"
import { cn } from "@/lib/utils"
import { PerceptronConcepts } from "./perceptron-concepts"
import { DATASET_IDS, DATASETS, type DatasetId } from "./perceptron-data"
import { PerceptronDiagram } from "./perceptron-diagram"
import { signed } from "./perceptron-format"
import { PerceptronMath } from "./perceptron-math"
import { PerceptronPlot } from "./perceptron-plot"
import { initialRunState, isTerminal, type RunState, runReducer } from "./perceptron-run"

const TICK_MS = 140

const DATASET_LABEL: Record<DatasetId, string> = {
  or: "OR",
  and: "AND",
  clusters: "2 clusters",
  xor: "XOR",
  moons: "Moons",
}
const ACTIVATION_LABEL: Record<PerceptronActivation, string> = {
  step: "Step — perceptron",
  sigmoid: "Sigmoid — logistic regression",
}

function toggleButtonClass(active: boolean) {
  return cn(
    "label-ui flex items-center gap-1.5 rounded-[2px] border px-2.5 py-1.5 transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-50",
    active ? "border-brand text-brand" : "border-line text-fg-muted hover:text-fg",
  )
}

function NotSeparableBadge() {
  const { t } = useTranslation()
  return (
    <span className="rounded-[2px] border border-line px-1.5 py-0.5 text-[10px] normal-case tracking-normal text-fg-secondary">
      {t("Not linearly separable")}
    </span>
  )
}

/** Learning status first, then the dataset's geometry — the two are never conflated. */
function explanations(state: RunState, t: Translate): string[] {
  const errors = state.history[state.history.length - 1].errors
  const lines: string[] = []
  if (state.status === "capped") lines.push(t("Epoch limit reached."))
  if (errors === 0) {
    lines.push(
      state.activation === "step"
        ? t("All training points are correctly classified. This line separates this dataset.")
        : t(
            "All training points are correctly classified. Probabilities and loss can still change.",
          ),
    )
  } else if (state.epoch === 0) {
    lines.push(t("Press Play or Step 1 epoch to watch the line move."))
  }
  if (state.dataset === "xor") {
    lines.push(
      t(
        "Opposite corners have the same label. Every straight boundary leaves at least one mistake.",
      ),
    )
  } else if (state.dataset === "moons") {
    lines.push(t("These two curves interlock. A straight boundary cannot separate this fixture."))
  } else if (errors > 0 && state.epoch > 0) {
    lines.push(t("A separating line exists. The current weights have not found one yet."))
  }
  return lines
}

/** Changes only on pause, completion and configuration changes — never once per epoch. */
function announcement(state: RunState, t: Translate) {
  const config = `${t(DATASET_LABEL[state.dataset])}, ${t(ACTIVATION_LABEL[state.activation])}`
  if (state.status === "playing") return t("Training: {0}.", [config])
  if (state.status === "solved")
    return t("Finished: all points classified correctly. {0}.", [config])
  if (state.status === "capped") return t("Finished: epoch limit reached. {0}.", [config])
  return t("Paused: {0}.", [config])
}

export function PerceptronLesson() {
  const { t } = useTranslation()
  const [state, dispatch] = useReducer(runReducer, undefined, () => initialRunState())
  const { points, domain, separable } = DATASETS[state.dataset]
  const current = state.history[state.history.length - 1]
  const terminal = isTerminal(state.status)
  const misclassified = useMemo(() => new Set(state.misclassifiedIds), [state.misclassifiedIds])
  const selected = points.find((p) => p.id === state.selectedId) ?? points[0]
  const selectedZ = score(state.params, selected)

  // One pending tick at most; `runId` lets the reducer drop a tick from an earlier run.
  // biome-ignore lint/correctness/useExhaustiveDependencies: epoch isn't read, but each new epoch schedules the next tick.
  useEffect(() => {
    if (state.status !== "playing") return
    const runId = state.runId
    const timer = setTimeout(() => dispatch({ type: "tick", runId }), TICK_MS)
    return () => clearTimeout(timer)
  }, [state.status, state.runId, state.epoch])

  const stats = [
    { label: t("Epoch"), value: String(state.epoch) },
    { label: t("Misclassified"), value: `${current.errors} / ${points.length}` },
    { label: t("Training accuracy"), value: `${Math.round(current.accuracy * 100)}%` },
    ...(state.activation === "sigmoid"
      ? [{ label: t("Binary cross-entropy"), value: current.bce.toFixed(3) }]
      : []),
  ]

  return (
    <ArticleFrame>
      <LessonHero line1={t("Perceptron:")} line2={t("one neuron, one line")} />
      <LessonLead>
        <strong className="font-bold text-fg">
          {t("The problem: separate the blue class from the orange class.")}
        </strong>{" "}
        {t(
          "One neuron combines two inputs and a bias, then makes a prediction. Train it and watch its decision boundary move.",
        )}
      </LessonLead>
      <p className="text-sm text-fg-secondary">
        {t("Start with OR. Then try XOR: can one straight line separate all four points?")}
      </p>

      <section
        aria-label={t("Configuration")}
        className="flex flex-col gap-3 rounded-[3px] border border-divider bg-surface p-[18px]"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-ui text-fg-muted">{t("Dataset")}</span>
          {DATASET_IDS.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={state.dataset === id}
              onClick={() => dispatch({ type: "selectDataset", dataset: id })}
              className={toggleButtonClass(state.dataset === id)}
            >
              {t(DATASET_LABEL[id])}
              {!DATASETS[id].separable && <NotSeparableBadge />}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-ui text-fg-muted">{t("Activation")}</span>
          {(["step", "sigmoid"] as const).map((activation) => (
            <button
              key={activation}
              type="button"
              aria-pressed={state.activation === activation}
              onClick={() => dispatch({ type: "selectActivation", activation })}
              className={toggleButtonClass(state.activation === activation)}
            >
              {t(ACTIVATION_LABEL[activation])}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-ui text-fg-muted">{t("Training")}</span>
          <button
            type="button"
            disabled={terminal}
            onClick={() => dispatch({ type: state.status === "playing" ? "pause" : "play" })}
            className={toggleButtonClass(state.status === "playing")}
          >
            {state.status === "playing" ? (
              <PauseIcon className="size-3.5" aria-hidden />
            ) : (
              <PlayIcon className="size-3.5" aria-hidden />
            )}
            {state.status === "playing" ? t("Pause") : t("Play")}
          </button>
          <button
            type="button"
            disabled={terminal}
            onClick={() => dispatch({ type: "step" })}
            className={toggleButtonClass(false)}
          >
            <StepForwardIcon className="size-3.5" aria-hidden />
            {t("Step 1 epoch")}
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: "reset" })}
            className={toggleButtonClass(false)}
          >
            <RotateCcwIcon className="size-3.5" aria-hidden />
            {t("Reset")}
          </button>
          <span className="label-ui text-fg-muted">{t("Limit: {0} epochs", [MAX_EPOCHS])}</span>
        </div>
        <p aria-live="polite" className="sr-only">
          {announcement(state, t)}
        </p>

        <p className="text-xs text-fg-muted">
          {t("Changing dataset or activation restarts training.")}{" "}
          {t("The activation also selects its learning rule (η = {0}).", [
            LEARNING_RATE[state.activation],
          ])}
        </p>
      </section>

      <section aria-label={t("The model")} className="grid items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="label-ui text-fg-muted">{t("Network")}</h2>
            <button
              type="button"
              aria-pressed={state.showWeights}
              onClick={() => dispatch({ type: "toggleWeights" })}
              className={toggleButtonClass(state.showWeights)}
            >
              {t("Show weights")}
            </button>
          </div>
          <PerceptronDiagram
            params={state.params}
            activation={state.activation}
            showWeights={state.showWeights}
          />
        </div>
        <div className="order-first flex flex-col gap-3 lg:order-none">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="label-ui text-fg-muted">{t("Decision plot")}</h2>
            {!separable && <NotSeparableBadge />}
          </div>
          <PerceptronPlot
            points={points}
            domain={domain}
            params={state.params}
            activation={state.activation}
            misclassifiedIds={misclassified}
            selectedId={selected.id}
            onSelect={(id) => dispatch({ type: "selectPoint", id })}
          />
          <label className="flex flex-wrap items-center gap-2">
            <span className="label-ui text-fg-muted">{t("Inspect point")}</span>
            <select
              value={selected.id}
              onChange={(e) => dispatch({ type: "selectPoint", id: e.target.value })}
              className="label-ui rounded-[2px] border border-line bg-canvas px-2 py-1.5 text-fg-secondary focus-visible:outline-2 focus-visible:outline-brand"
            >
              {points.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} ({signed(p.x1)}, {signed(p.x2)}) — {t("class {0}", [p.y])}
                </option>
              ))}
            </select>
          </label>
          <p className="font-ui text-xs text-fg-secondary">
            x = ({signed(selected.x1)}, {signed(selected.x2)}) · {t("target")} {selected.y} · z ={" "}
            {signed(selectedZ, 3)} · {t("prediction")} {classOf(selectedZ)}
            {state.activation === "sigmoid" && ` · p = ${sigmoid(selectedZ).toFixed(3)}`}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="label-ui text-fg-muted">{t("Performance")}</h2>
          <dl
            aria-label={t("Performance")}
            className={cn("grid gap-2", stats.length === 4 ? "grid-cols-2" : "grid-cols-3")}
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[2px] border border-divider bg-surface px-3 py-2"
              >
                <dt className="label-ui text-fg-muted">{stat.label}</dt>
                <dd className="font-display text-lg text-fg">{stat.value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-col gap-4">
            <LineChart
              series={[
                {
                  key: "errors",
                  label: t("misclassified points"),
                  color: "var(--color-brand)",
                  points: state.history.map((h) => ({ x: h.epoch, y: h.errors })),
                },
              ]}
              xLabel={t("Epoch")}
              yLabel={t("Misclassified")}
              xExtent={[0, 5]}
            />
            {state.activation === "sigmoid" && (
              <LineChart
                series={[
                  {
                    key: "bce",
                    label: t("binary cross-entropy"),
                    color: "var(--color-fg)",
                    points: state.history.map((h) => ({ x: h.epoch, y: h.bce })),
                  },
                ]}
                xLabel={t("Epoch")}
                yLabel={t("Loss")}
                xExtent={[0, 5]}
              />
            )}
          </div>
          <p className="text-xs text-fg-muted">
            {t(
              "Evaluated on the same points used for training; this does not measure performance on unseen data.",
            )}
          </p>

          <div className="flex flex-col gap-1 text-sm text-fg-secondary">
            {explanations(state, t).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      </section>

      <section aria-label={t("The math")} className="flex flex-col gap-3">
        <button
          type="button"
          aria-pressed={state.showMath}
          aria-expanded={state.showMath}
          onClick={() => dispatch({ type: "toggleMath" })}
          className={cn(toggleButtonClass(state.showMath), "self-start")}
        >
          <SigmaIcon className="size-3.5" aria-hidden />
          {t("Show math")}
        </button>
        {state.showMath && (
          <PerceptronMath
            activation={state.activation}
            params={state.params}
            selected={selected}
            lastTrace={state.lastTrace}
            points={points}
          />
        )}
      </section>

      <section aria-label={t("Key concepts")} className="flex flex-col gap-3">
        <h2 className="font-display text-3xl font-bold text-fg">{t("Key concepts")}</h2>
        <PerceptronConcepts
          params={state.params}
          activation={state.activation}
          selected={selected}
          pointCount={points.length}
          epoch={state.epoch}
          separable={separable}
          domain={domain}
        />
      </section>

      <section
        aria-label={t("Limitation")}
        className="flex flex-col gap-3 border-t border-divider pt-4"
      >
        <p className="font-display text-xl text-fg-secondary">
          {t(
            "One neuron with these raw inputs can only separate classes with a straight boundary. A network with nonlinear hidden layers can learn more flexible features.",
          )}
        </p>
        <Link
          to="/learn/$chapter/$lesson"
          params={{ chapter: "neural-networks", lesson: "back-propagation" }}
          className="label-ui self-start text-brand transition-colors hover:text-brand-soft"
        >
          {t("Next: hidden layers and back-propagation")} →
        </Link>
      </section>
    </ArticleFrame>
  )
}

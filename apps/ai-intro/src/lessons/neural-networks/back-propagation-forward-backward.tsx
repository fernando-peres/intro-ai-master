import { Maximize2Icon, PauseIcon, PlayIcon, RotateCcwIcon, SkipForwardIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import {
  LessonArticle,
  LessonFooter,
  LessonHero,
  LessonLead,
} from "@/components/course/lesson-layout"
import { Stepper } from "@/components/course/stepper"
import { ZoomDialog } from "@/components/course/zoom-dialog"
import { Button } from "@/components/ui/button"
import type { LessonEntry } from "@/curriculum"
import { useTranslation } from "@/i18n/use-translation"
import { Takeaway } from "@/lessons/machine-learning/metric-section"
import { DATASETS, type DatasetId, trainRounds } from "./back-propagation-step-by-step-math"
import { StepCharts, StepData } from "./back-propagation-step-data"
import { buildSteps, MathStack } from "./back-propagation-step-math"
import { StepNetwork, stepNetwork } from "./back-propagation-step-network"

const STEP_TITLES = [
  "Forward weights",
  "Activation function",
  "Loss",
  "Backward",
  "Update",
] as const

const TRAIN_TICK_MS = 150

/** Back-propagation, page 2: online training on four rows, one row and one step at a time. */
export function BackPropagationForwardBackwardLesson({ entry }: { entry: LessonEntry }) {
  const { t } = useTranslation()
  const [round, setRound] = useState(0)
  const [step, setStep] = useState(0)
  const [dataset, setDataset] = useState<DatasetId>("and")
  const rows = DATASETS[dataset]
  const { rounds, initial } = useMemo(() => trainRounds(undefined, rows), [rows])
  const current = rounds[round]
  const p = current.pass
  const lastRound = rounds.length - 1
  const lastStep = STEP_TITLES.length - 1
  const atStart = round === 0 && step === 0
  const atEnd = round === lastRound && step === lastStep

  // Index 0 is the untrained network; index e is the network after epoch e.
  const epochNets = useMemo(
    () => [
      stepNetwork(rounds[0].pass, 0),
      ...rounds.filter((_, i) => (i + 1) % rows.length === 0).map((r) => stepNetwork(r.pass, 4)),
    ],
    [rounds, rows],
  )

  const steps = useMemo(() => buildSteps(p, t), [p, t])
  const panel = steps[step]
  const completed = step === lastStep ? round + 1 : round

  const [training, setTraining] = useState(false)
  const [zoom, setZoom] = useState(false)
  const stepTitles = STEP_TITLES.map((title) => t(title))
  // Train completes one row per tick, landing on its Update step so the charts and network follow.
  useEffect(() => {
    if (!training) return
    if (atEnd) {
      setTraining(false)
      return
    }
    const id = setTimeout(() => {
      if (step === lastStep) setRound(round + 1)
      else setStep(lastStep)
    }, TRAIN_TICK_MS)
    return () => clearTimeout(id)
  }, [training, atEnd, round, step, lastStep])
  const lastEpoch = rounds[lastRound].epoch
  // The first row of the next epoch: every remaining row of this one has been trained on.
  const nextEpoch = () => {
    setTraining(false)
    setRound(current.epoch * rows.length)
    setStep(0)
  }
  const reset = () => {
    setTraining(false)
    setRound(0)
    setStep(0)
  }

  const next = () => {
    setTraining(false)
    if (step < lastStep) setStep(step + 1)
    else {
      setRound(round + 1)
      setStep(0)
    }
  }
  const previous = () => {
    setTraining(false)
    if (step > 0) setStep(step - 1)
    else {
      setRound(round - 1)
      setStep(lastStep)
    }
  }

  return (
    <LessonArticle entry={entry}>
      <LessonHero line1={t("Forward pass,")} line2={t("backward pass")} />
      <LessonLead>
        {t(
          "Training a network is one loop: guess, measure the mistake, trace the blame backwards, adjust.",
        )}
      </LessonLead>

      <StepData
        dataset={dataset}
        onDataset={(id) => {
          setDataset(id)
          reset()
        }}
        rows={rows}
        active={current.row}
        pass={p}
        step={step}
        epochNets={epochNets}
        epochsDone={Math.floor(completed / rows.length)}
      />

      <section
        aria-label={t("Step by step")}
        className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-[1.4fr_1fr]"
      >
        <div className="flex flex-col gap-4 rounded border border-line p-4">
          <Stepper
            label={t("Steps")}
            steps={STEP_TITLES.map((title) => t(title))}
            current={step}
            onSelect={(i) => {
              setTraining(false)
              setStep(i)
            }}
          />
          <StepNetwork pass={p} step={step} />
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-2xl font-bold uppercase text-fg">
              {t(STEP_TITLES[step])}
            </h2>
            {step === 0 && round > 0 && (
              <p className="label-ui text-brand">
                {t("Network updated by row {0}", [String(rounds[round - 1].row + 1)])}
              </p>
            )}
            <p className="text-fg-secondary">{panel.analogy}</p>
          </div>
          <div className="mt-auto flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <Button variant="outline" disabled={atStart} onClick={previous}>
                ‹ {t("Previous")}
              </Button>
              <span className="label-ui text-center text-fg-muted">
                {t("Row {0}", [String(current.row + 1)])} ·{" "}
                {t("Epoch {0}", [String(current.epoch)])} · {step + 1} / {STEP_TITLES.length}
              </span>
              <Button variant="outline" disabled={atEnd} onClick={next}>
                {step === lastStep && !atEnd ? t("Next row") : t("Next")} ›
              </Button>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" disabled={current.epoch === lastEpoch} onClick={nextEpoch}>
                <SkipForwardIcon aria-hidden /> {t("Next epoch")}
              </Button>
              <Button
                variant="outline"
                disabled={atEnd}
                aria-pressed={training}
                onClick={() => setTraining(!training)}
              >
                {training ? <PauseIcon aria-hidden /> : <PlayIcon aria-hidden />}
                {training ? t("Pause") : t("Train")}
              </Button>
              <Button variant="outline" disabled={atStart && !training} onClick={reset}>
                <RotateCcwIcon aria-hidden /> {t("Reset")}
              </Button>
            </div>
          </div>
        </div>

        <section
          aria-label={t("Math")}
          className="relative max-h-96 overflow-y-auto rounded border border-line md:max-h-none md:overflow-visible"
        >
          <div className="flex flex-col items-stretch p-4 md:absolute md:inset-0 md:overflow-y-auto">
            <div className="mb-3 flex items-center justify-between">
              <p className="label-ui text-brand">{t("Math")}</p>
              <button
                type="button"
                onClick={() => setZoom(true)}
                aria-label={t("Zoom math")}
                title={t("Zoom math")}
                className="rounded-[2px] border border-line p-1 text-fg-muted hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
              >
                <Maximize2Icon className="size-3.5" aria-hidden />
              </button>
            </div>
            <MathStack steps={steps} titles={stepTitles} step={step} />
          </div>
        </section>
        {zoom && (
          <ZoomDialog title={t("Math")} onClose={() => setZoom(false)}>
            <MathStack steps={steps} titles={stepTitles} step={step} large />
          </ZoomDialog>
        )}
      </section>

      <StepCharts
        points={[initial, ...rounds.slice(0, completed).map((r) => r.after)]}
        pass={p}
        step={step}
      />

      <Takeaway>
        {t(
          "Backpropagation is the chain rule run from the loss back to the first layer, reusing every result once.",
        )}
      </Takeaway>

      <LessonFooter entry={entry} />
    </LessonArticle>
  )
}

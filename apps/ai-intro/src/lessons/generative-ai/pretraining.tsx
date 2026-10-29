import { useMutation, useQuery } from "@tanstack/react-query"
import { PauseIcon, PlayIcon, RotateCcwIcon, ZapIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { ArticleFrame, LessonHero, LessonLead } from "@/components/course/lesson-layout"
import {
  ConfigRail,
  OptionGrid,
  PanelNote,
  RailSection,
  SelectField,
  Stepper,
  toolbarButtonClass,
  Workbench,
} from "@/components/workbench"
import { useTranslation } from "@/i18n/use-translation"
import { cn } from "@/lib/utils"
import {
  type CreateRunRequest,
  createRun,
  generateRun,
  type ProbeResponse,
  probeRun,
  type RunState,
  type Step,
  statusOf,
  toyCorpora,
  trainRun,
} from "./api"
import {
  DatasetPanel,
  ProbePanel,
  TRY_PRESETS,
  TrainingPanel,
  TryPanel,
} from "./pretraining-panels"
import { RequestError, ServerNotice } from "./stages"

const DEFAULT_PROBE = "The capital of France is Paris."
const STEP_OPTIONS = [10, 50, 200] as const
type StepsPerClick = (typeof STEP_OPTIONS)[number]
type Start = "scratch" | "pretrained"

export function PretrainingLesson() {
  const { t } = useTranslation()
  return (
    <ArticleFrame>
      <LessonHero line1={t("Pretraining")} line2={t("a GPT learns to predict")} />
      <LessonLead>
        {t(
          "A decoder-only Transformer, small enough to train on this laptop, learns one thing: the next token. Watch its loss fall, its guesses sharpen, and where it starts to memorise.",
        )}
      </LessonLead>
      <ServerNotice quiet />
      <PretrainingLab />
    </ArticleFrame>
  )
}

function PretrainingLab() {
  const { t } = useTranslation()
  const corpora = useQuery({ queryKey: ["toy-corpora"], queryFn: toyCorpora })
  const [corpus, setCorpus] = useState("all")
  const [start, setStart] = useState<Start>("scratch")
  const [seed, setSeed] = useState(0)
  const [stepsPerClick, setStepsPerClick] = useState<StepsPerClick>(50)
  const [run, setRun] = useState<RunState | null>(null)
  const [probeText, setProbeText] = useState(DEFAULT_PROBE)
  const [probeData, setProbeData] = useState<ProbeResponse | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [prompt, setPrompt] = useState(TRY_PRESETS[0].prompt)
  const [generated, setGenerated] = useState<Step[] | null>(null)

  const info = corpora.data?.find((c) => c.id === corpus)
  const pretrained = start === "pretrained"
  // The checkpoint fixes the weights, so the seed only matters for random ones.
  const config: CreateRunRequest = { corpus, seed: pretrained ? 0 : seed, pretrained }
  const configKey = JSON.stringify(config)
  const startedKey = useRef<string | null>(null)

  const probe = useMutation({
    mutationFn: ({ runId, text }: { runId: string; text: string }) => probeRun(runId, text),
    onSuccess: setProbeData,
    onError: (error) => lost(error),
  })
  const create = useMutation({
    mutationFn: createRun,
    onSuccess: (state) => {
      setRun(state)
      setProbeData(null)
      setGenerated(null)
      setSelected(null)
      probe.mutate({ runId: state.run_id, text: probeText })
    },
  })
  const train = useMutation({
    mutationFn: ({ runId, steps }: { runId: string; steps: number }) => trainRun(runId, steps),
    onSuccess: (state) => {
      setRun(state)
      probe.mutate({ runId: state.run_id, text: probeText })
    },
    onError: (error) => {
      setPlaying(false)
      lost(error)
    },
  })
  const generate = useMutation({
    mutationFn: ({ runId, text }: { runId: string; text: string }) =>
      generateRun(runId, { prompt: text, max_tokens: 12, temperature: 0 }),
    onSuccess: (reply) => setGenerated(reply.steps),
    onError: (error) => lost(error),
  })

  /** A 404 means the server forgot the run (restart or eviction): start a fresh one. */
  function lost(error: Error) {
    if (statusOf(error) !== 404) return
    setPlaying(false)
    setNotice(
      t("The previous run was lost (the server no longer has it), so a new one was started."),
    )
    create.mutate(config)
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: one run per configuration
  useEffect(() => {
    if (startedKey.current === configKey) return
    startedKey.current = configKey
    setPlaying(false)
    setNotice(null)
    create.mutate(config)
  }, [configKey])

  const busy = create.isPending || train.isPending || probe.isPending
  const remaining = run ? run.max_steps - run.step : 0
  const atCap = run !== null && remaining <= 0
  const stepsToSend = Math.min(stepsPerClick, remaining)
  const trainOnce = () => run && !atCap && train.mutate({ runId: run.run_id, steps: stepsToSend })

  // biome-ignore lint/correctness/useExhaustiveDependencies: chains one training call per settled run
  useEffect(() => {
    if (!playing || !run || busy) return
    if (atCap) {
      setPlaying(false)
      return
    }
    train.mutate({ runId: run.run_id, steps: stepsToSend })
  }, [playing, run, busy, atCap, stepsToSend])

  const chooseCorpus = (id: string) => {
    setCorpus(id)
    if (!corpora.data?.find((c) => c.id === id)?.has_checkpoint) setStart("scratch")
  }
  const reset = () => {
    startedKey.current = configKey
    setPlaying(false)
    setNotice(null)
    create.mutate(config)
  }

  const rail = (
    <ConfigRail
      title={t("Configuration")}
      tip={t(
        "Train a few hundred steps and watch “Paris” climb in the training example. Then keep going: training loss keeps falling, but validation loss turns up. That is memorisation.",
      )}
    >
      <RailSection label={t("Corpus")}>
        <SelectField
          label={t("Corpus")}
          value={corpus}
          onChange={chooseCorpus}
          options={(corpora.data ?? []).map((c) => ({
            value: c.id,
            label: t(c.title),
            description: t(c.purpose),
            badge: c.has_checkpoint ? (
              <span className="label-ui text-chart-amber">{t("checkpoint available")}</span>
            ) : undefined,
          }))}
        />
      </RailSection>
      <RailSection label={t("Start from")}>
        <OptionGrid
          columns={1}
          options={[
            { value: "scratch" as Start, label: t("Random weights") },
            ...(info?.has_checkpoint
              ? [{ value: "pretrained" as Start, label: t("Pretrained checkpoint") }]
              : []),
          ]}
          value={start}
          onChange={setStart}
        />
      </RailSection>
      <RailSection label={t("Training")}>
        <Stepper
          label={t("Seed")}
          value={seed}
          onDecrement={() => setSeed((s) => Math.max(0, s - 1))}
          onIncrement={() => setSeed((s) => s + 1)}
          decrementLabel={t("Previous seed")}
          incrementLabel={t("Next seed")}
        />
        {pretrained && (
          <p className="text-xs text-fg-muted">
            {t("The checkpoint fixes the weights; the seed only applies to random weights.")}
          </p>
        )}
        <OptionGrid
          columns={1}
          options={STEP_OPTIONS.map((n) => ({ value: String(n), label: t("{0} steps", [n]) }))}
          value={String(stepsPerClick)}
          onChange={(v) => setStepsPerClick(Number(v) as StepsPerClick)}
        />
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={trainOnce}
            disabled={!run || busy || playing || atCap}
            className={cn(toolbarButtonClass(true), "justify-center")}
          >
            <ZapIcon className="size-3" aria-hidden />
            {t("Train")}
          </button>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            disabled={!run || atCap}
            aria-pressed={playing}
            className={cn(toolbarButtonClass(), "justify-center")}
          >
            {playing ? (
              <PauseIcon className="size-3" aria-hidden />
            ) : (
              <PlayIcon className="size-3" aria-hidden />
            )}
            {playing ? t("Pause") : t("Auto")}
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={create.isPending}
            className={cn(toolbarButtonClass(), "justify-center")}
          >
            <RotateCcwIcon className="size-3" aria-hidden />
            {t("Reset")}
          </button>
        </div>
        {atCap && (
          <p className="text-xs text-chart-amber">{t("This run reached its step limit.")}</p>
        )}
      </RailSection>
    </ConfigRail>
  )

  const selectedRow = selected ?? Math.max(0, (probeData?.positions.length ?? 1) - 2)

  return (
    <Workbench rail={rail}>
      {notice && (
        <p role="status" className="text-sm text-chart-amber">
          {notice}
        </p>
      )}
      <RequestError error={create.error ?? train.error} />
      <DatasetPanel corpus={info} />
      <ProbePanel
        probe={probeData}
        selected={selectedRow}
        onSelect={setSelected}
        text={probeText}
        onText={setProbeText}
        onProbe={() => run && probe.mutate({ runId: run.run_id, text: probeText })}
        pending={probe.isPending}
        error={probe.error}
      />
      <TrainingPanel run={run} />
      <TryPanel
        prompt={prompt}
        onPrompt={setPrompt}
        onGenerate={() => run && generate.mutate({ runId: run.run_id, text: prompt })}
        steps={generated}
        pending={generate.isPending}
        error={generate.error}
      />
      <PanelNote>
        {t(
          "This toy model has about 50 thousand parameters and reads a few thousand tokens; GPT-3 had 175 billion parameters and read hundreds of billions. The mechanism is the same. The capabilities are not.",
        )}
      </PanelNote>
    </Workbench>
  )
}

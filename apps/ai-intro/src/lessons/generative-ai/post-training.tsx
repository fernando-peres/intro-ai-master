import { useMutation, useQuery } from "@tanstack/react-query"
import { RotateCcwIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { ArticleFrame, LessonHero, LessonLead } from "@/components/course/lesson-layout"
import {
  ConfigRail,
  OptionGrid,
  PanelNote,
  RailSection,
  toolbarButtonClass,
  Workbench,
} from "@/components/workbench"
import { useTranslation } from "@/i18n/use-translation"
import { cn } from "@/lib/utils"
import {
  addPreferences,
  alignment,
  type Bias,
  type CreateRunRequest,
  createRun,
  dpoRun,
  generateRun,
  type PpoSettings,
  type ProbeResponse,
  ppoRun,
  probeRun,
  type RunState,
  type SftAdapter,
  type Stage,
  sftRun,
  statusOf,
  trainRewardModel,
} from "./api"
import {
  ComparePanel,
  DpoPanel,
  ITALY_PROBE,
  OtherTechniques,
  PpoPanel,
  PreferencesPanel,
  SftPanel,
  SPAIN_PROBE,
  type StageOutputs,
} from "./post-training-panels"
import { RequestError, ServerNotice } from "./stages"

const STARTS: { value: Stage; label: string }[] = [
  { value: "pretrained", label: "Pretrained checkpoint" },
  { value: "sft", label: "SFT checkpoint" },
  { value: "rlhf", label: "RLHF checkpoint" },
]
const DEFAULT_PPO: PpoSettings = { iterations: 5, lr: 0.0005, clip: 0.2, kl_beta: 0.1 }

/** The checkpoints a run can show: the SFT weights are frozen only once PPO has started. */
export function stagesFor(stage: Stage): (keyof StageOutputs)[] {
  if (stage === "rlhf" || stage === "dpo") return ["pretrained", "sft", "current"]
  if (stage === "sft") return ["pretrained", "current"]
  return ["current"]
}

export function PostTrainingLesson() {
  const { t } = useTranslation()
  return (
    <ArticleFrame>
      <LessonHero line1={t("Post-training")} line2={t("from GPT to assistant")} />
      <LessonLead>
        {t(
          "The pretrained toy GPT continues text. Three training stages, the ones InstructGPT and ChatGPT published, turn it into something that answers: demonstrations, human preferences, and reinforcement learning against a reward model.",
        )}
      </LessonLead>
      <ServerNotice quiet />
      <PostTrainingLab />
    </ArticleFrame>
  )
}

function PostTrainingLab() {
  const { t } = useTranslation()
  const align = useQuery({ queryKey: ["toy-alignment"], queryFn: alignment })
  const [start, setStart] = useState<Stage>("pretrained")
  const [run, setRun] = useState<RunState | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [probes, setProbes] = useState<[ProbeResponse, ProbeResponse] | null>(null)
  const [promptId, setPromptId] = useState("france")
  const [ranking, setRanking] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [bias, setBias] = useState<Bias>("none")
  const [scores, setScores] = useState<Record<string, Record<string, number>> | null>(null)
  const [ppoSettings, setPpoSettings] = useState<PpoSettings>(DEFAULT_PPO)
  const [beta, setBeta] = useState(0.1)
  const [adapter, setAdapter] = useState<SftAdapter>("full")
  const [comparePrompt, setComparePrompt] = useState(ITALY_PROBE.replace(" Rome.", ""))
  const [outputs, setOutputs] = useState<StageOutputs | null>(null)

  const config: CreateRunRequest = { corpus: "all", seed: 0, pretrained: true, stage: start }
  const configKey = JSON.stringify(config)
  const startedKey = useRef<string | null>(null)

  const probe = useMutation({
    mutationFn: (runId: string) =>
      Promise.all([probeRun(runId, SPAIN_PROBE), probeRun(runId, ITALY_PROBE)]),
    onSuccess: (both) => setProbes(both as [ProbeResponse, ProbeResponse]),
    onError: (error) => lost(error),
  })
  const create = useMutation({
    mutationFn: createRun,
    onSuccess: (state) => {
      setRun(state)
      setProbes(null)
      setScores(null)
      setOutputs(null)
      setRanking([])
      setSubmitted(false)
      probe.mutate(state.run_id)
    },
  })
  const sft = useMutation({
    mutationFn: (runId: string) => sftRun(runId, 50, adapter),
    onSuccess: (state) => {
      setRun(state)
      setOutputs(null)
      probe.mutate(state.run_id)
    },
    onError: (error) => lost(error),
  })
  const preferences = useMutation({
    mutationFn: ({ runId, pid, order }: { runId: string; pid: string; order: string[] }) =>
      addPreferences(runId, pid, order),
    onSuccess: (state) => {
      setRun(state)
      setSubmitted(true)
    },
    onError: (error) => lost(error),
  })
  const rm = useMutation({
    mutationFn: ({ runId, b }: { runId: string; b: Bias }) => trainRewardModel(runId, 100, b),
    onSuccess: (reply) => {
      setRun(reply.run)
      setScores(reply.candidate_scores)
    },
    onError: (error) => lost(error),
  })
  const ppo = useMutation({
    mutationFn: ({ runId, settings }: { runId: string; settings: PpoSettings }) =>
      ppoRun(runId, settings),
    onSuccess: (state) => {
      setRun(state)
      setOutputs(null)
    },
    onError: (error) => lost(error),
  })
  const dpoMutation = useMutation({
    mutationFn: ({ runId, b }: { runId: string; b: number }) => dpoRun(runId, 50, b),
    onSuccess: (state) => {
      setRun(state)
      setOutputs(null)
    },
    onError: (error) => lost(error),
  })
  const generate = useMutation({
    mutationFn: async ({ runId, prompt }: { runId: string; prompt: string }) => {
      const stages = stagesFor(run?.stage ?? "pretrained")
      const settled = await Promise.allSettled(
        stages.map((stage) => generateRun(runId, { prompt, max_tokens: 6, temperature: 0, stage })),
      )
      const result: StageOutputs = { pretrained: null, sft: null, current: null }
      stages.forEach((stage, i) => {
        const r = settled[i]
        result[stage] = r.status === "fulfilled" ? r.value.steps : null
      })
      return result
    },
    onSuccess: setOutputs,
  })

  /** A 404 means the server forgot the run (restart or eviction): start a fresh one. */
  function lost(error: Error) {
    if (statusOf(error) !== 404) return
    setNotice(
      t("The previous run was lost (the server no longer has it), so a new one was started."),
    )
    create.mutate(config)
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: one run per configuration
  useEffect(() => {
    if (startedKey.current === configKey) return
    startedKey.current = configKey
    setNotice(null)
    create.mutate(config)
  }, [configKey])

  const reset = () => {
    setNotice(null)
    create.mutate(config)
  }
  const prompts = align.data?.prompts ?? []
  const comparePrompts = [
    ...prompts.map((p) => p.prompt),
    ...(align.data?.held_out ?? []).map((d) => d.prompt),
  ]

  const rail = (
    <ConfigRail
      title={t("Configuration")}
      tip={t(
        "Go down the page in order: SFT, then rank answers and train the reward model, then PPO. Try β = 0 to see the policy drift, and the longer-answers switch to see a reward model learn a bias.",
      )}
    >
      <RailSection label={t("Start from")}>
        <OptionGrid
          columns={1}
          options={STARTS.map((s) => ({ value: s.value, label: t(s.label) }))}
          value={start}
          onChange={setStart}
        />
      </RailSection>
      <RailSection label={t("Run")}>
        <button
          type="button"
          onClick={reset}
          disabled={create.isPending}
          className={cn(toolbarButtonClass(), "justify-center")}
        >
          <RotateCcwIcon className="size-3" aria-hidden />
          {t("Reset")}
        </button>
        {run && (
          <p className="text-xs text-fg-muted">
            {t("Stage: {0} · {1} SFT steps · {2} PPO iterations", [
              run.stage,
              run.sft_history.length,
              run.ppo_history.length,
            ])}
          </p>
        )}
      </RailSection>
    </ConfigRail>
  )

  return (
    <Workbench rail={rail}>
      {notice && (
        <p role="status" className="text-sm text-chart-amber">
          {notice}
        </p>
      )}
      <RequestError error={create.error} />
      <SftPanel
        alignment={align.data}
        run={run}
        spain={probes?.[0] ?? null}
        italy={probes?.[1] ?? null}
        onSft={() => run && sft.mutate(run.run_id)}
        adapter={adapter}
        onAdapter={setAdapter}
        pending={sft.isPending || probe.isPending}
        closed={run?.stage === "rlhf" || run?.stage === "dpo"}
        error={sft.error}
      />
      <PreferencesPanel
        prompts={prompts}
        promptId={promptId}
        onPromptId={(id) => {
          setPromptId(id)
          setRanking([])
          setSubmitted(false)
        }}
        ranking={ranking}
        onRank={(id) => setRanking((r) => (r.includes(id) ? r : [...r, id]))}
        onResetRanking={() => {
          setRanking([])
          setSubmitted(false)
        }}
        onSubmit={() =>
          run && preferences.mutate({ runId: run.run_id, pid: promptId, order: ranking })
        }
        submitted={submitted}
        studentPairs={run?.student_pairs ?? 0}
        bias={bias}
        onBias={setBias}
        onTrainRm={() => run && rm.mutate({ runId: run.run_id, b: bias })}
        rmPending={rm.isPending}
        run={run}
        scores={scores}
        error={preferences.error ?? rm.error}
      />
      <PpoPanel
        run={run}
        settings={ppoSettings}
        onSettings={setPpoSettings}
        onRun={() => run && ppo.mutate({ runId: run.run_id, settings: ppoSettings })}
        pending={ppo.isPending}
        enabled={(run?.has_reward_model ?? false) && (run?.sft_history.length ?? 0) > 0}
        needsSft={(run?.sft_history.length ?? 0) === 0}
        dpoBranch={run?.stage === "dpo"}
        error={ppo.error}
      />
      <DpoPanel
        run={run}
        beta={beta}
        onBeta={setBeta}
        onRun={() => run && dpoMutation.mutate({ runId: run.run_id, b: beta })}
        pending={dpoMutation.isPending}
        needsSft={(run?.sft_history.length ?? 0) === 0}
        ppoBranch={run?.stage === "rlhf"}
        error={dpoMutation.error}
      />
      <ComparePanel
        prompts={comparePrompts}
        prompt={comparePrompt}
        onPrompt={setComparePrompt}
        onGenerate={() => run && generate.mutate({ runId: run.run_id, prompt: comparePrompt })}
        outputs={outputs}
        currentStage={run?.stage ?? "pretrained"}
        pending={generate.isPending}
        error={generate.error}
      />
      <OtherTechniques />
      <PanelNote>
        {t(
          "What changed and what did not: pretraining gave the toy its facts and its grammar; SFT gave it a format; the reward model turned rankings into a score; PPO moved the policy toward that score. None of these stages added knowledge. At GPT-3's scale the same recipe made existing capabilities reachable through plain instructions, which is why GPT-3.5 felt new.",
        )}
      </PanelNote>
    </Workbench>
  )
}

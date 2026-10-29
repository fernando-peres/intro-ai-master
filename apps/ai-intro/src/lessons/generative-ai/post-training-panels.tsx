import { CheckIcon, PlayIcon, RotateCcwIcon, ZapIcon } from "lucide-react"
import type { ReactNode } from "react"
import { LineChart } from "@/components/charts/line-chart"
import { Panel, PanelNote, SelectField, Switch, toolbarButtonClass } from "@/components/workbench"
import { useTranslation } from "@/i18n/use-translation"
import { cn } from "@/lib/utils"
import type {
  Alignment,
  Bias,
  PpoSettings,
  PreferencePrompt,
  ProbeResponse,
  RunState,
  SftAdapter,
  Stage,
  Step,
} from "./api"
import { stagesFor } from "./post-training"
import { ModeBadge, RequestError, tokenLabel } from "./stages"

const TOY = "toy model"
export const SPAIN_PROBE = "Question: What is the capital of Spain? Answer: Madrid."
export const ITALY_PROBE = "Question: What is the capital of Italy? Answer: Rome."

const percent = (p: number) => `${Math.round(p * 100)}%`

function target(probe: ProbeResponse | null, token: string) {
  return probe?.positions.find((p) => p.target === token) ?? null
}

function Formula({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-[2px] border border-line bg-surface px-3 py-2 font-ui text-[13px] text-fg">
      {children}
    </p>
  )
}

function Table({ head, rows }: { head: ReactNode[]; rows: { key: string; cells: ReactNode[] }[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="label-ui text-fg-muted">
            {head.map((cell, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed header cells
              <th key={i} className="px-2 py-1.5 text-left font-normal">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-divider align-top">
              {row.cells.map((cell, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed columns
                <td key={i} className="px-2 py-1.5 text-fg-secondary">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SftPanel({
  alignment,
  run,
  spain,
  italy,
  onSft,
  pending,
  closed,
  adapter,
  onAdapter,
  error,
}: {
  alignment: Alignment | undefined
  run: RunState | null
  spain: ProbeResponse | null
  italy: ProbeResponse | null
  onSft: () => void
  pending: boolean
  /** PPO or DPO has run: more SFT would rewrite the lineage, so the stage is closed. */
  closed: boolean
  adapter: SftAdapter
  onAdapter: (adapter: SftAdapter) => void
  error: Error | null
}) {
  const { t } = useTranslation()
  const demos = alignment?.demonstrations ?? []
  const madrid = target(spain, " Madrid")
  const rome = target(italy, " Rome")
  const history = run?.sft_history ?? []
  const fixed = run?.sft_adapter ?? null
  const adapters: { id: SftAdapter; label: string; note: string }[] = [
    { id: "full", label: t("Full fine-tuning"), note: t("every weight moves") },
    {
      id: "lora",
      label: t("LoRA adapter (rank 4)"),
      note: t("base frozen; small added matrices train"),
    },
  ]
  return (
    <Panel title={t("1 · Supervised fine-tuning")} aside={<ModeBadge mode="real" note={t(TOY)} />}>
      <p className="text-sm text-fg-secondary">
        {t(
          "Demonstrations pair a prompt with the answer a person wrote. The model is trained to continue the prompt with that answer; the loss counts only the answer's tokens, never the prompt's.",
        )}
      </p>
      {demos.length > 0 && (
        <>
          <Table
            head={[t("Prompt"), t("Human demonstration")]}
            rows={demos.slice(0, 6).map((d) => ({
              key: d.prompt,
              cells: [
                <span key="p" className="text-fg-muted">
                  {d.prompt}
                </span>,
                <span key="c" className="font-display text-fg">
                  {d.completion}
                </span>,
              ],
            }))}
          />
          {demos.length > 6 && (
            <p className="text-xs text-fg-muted">{t("and {0} more", [demos.length - 6])}</p>
          )}
          <p className="font-display text-[15px] leading-snug">
            <span className="label-ui mr-2 text-fg-muted">{t("Loss mask")}</span>
            <span className="text-fg-muted line-through decoration-fg-muted/40">
              {demos[0].prompt}
            </span>
            <span className="rounded-[2px] bg-brand/15 px-1 text-brand">
              {demos[0].completion}↵
            </span>
          </p>
        </>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1 rounded-[2px] border border-line p-3">
          <span className="label-ui text-fg-muted">{t("Demonstrated question")}</span>
          <span className="font-display text-[15px] text-fg-secondary">{SPAIN_PROBE}</span>
          <span className="font-display text-[22px] leading-none text-brand">
            {madrid ? percent(madrid.prob) : "—"}
          </span>
          <span className="text-xs text-fg-muted">{t("p(“Madrid”) after “Answer:”")}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-[2px] border border-line p-3">
          <span className="label-ui text-fg-muted">
            {t("Held-out question (never demonstrated)")}
          </span>
          <span className="font-display text-[15px] text-fg-secondary">{ITALY_PROBE}</span>
          <span className="font-display text-[22px] leading-none text-fg">
            {rome ? `“${tokenLabel(rome.top_k[0]?.token ?? "").trim()}”` : "—"}
          </span>
          <span className="text-xs text-fg-muted">
            {t("the model's top guess; p(“Rome”) = {0}", [rome ? percent(rome.prob) : "—"])}
          </span>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {adapters.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={adapter === option.id}
            aria-label={option.label}
            disabled={fixed !== null && fixed !== option.id}
            onClick={() => onAdapter(option.id)}
            className={cn(
              "flex flex-col items-start gap-0.5 rounded-[2px] border px-3 py-2 text-left disabled:opacity-50",
              adapter === option.id ? "border-brand text-brand" : "border-line text-fg-secondary",
            )}
          >
            <span className="label-ui">{option.label}</span>
            <span className="text-xs text-fg-muted">{option.note}</span>
          </button>
        ))}
      </div>
      {run?.sft_trainable_params != null && (
        <p className="label-ui text-fg-muted">
          {t("{0} of {1} parameters trained ({2}%)", [
            run.sft_trainable_params.toLocaleString("en-US"),
            run.params.toLocaleString("en-US"),
            Math.round((100 * run.sft_trainable_params) / run.params),
          ])}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSft}
          disabled={pending || !run || closed}
          className={toolbarButtonClass(true)}
        >
          <ZapIcon className="size-3" aria-hidden />
          {t("Run 50 SFT steps")}
        </button>
        <span className="label-ui text-fg-muted">
          {t("{0} SFT steps so far", [history.length])}
        </span>
        {closed && (
          <span className="label-ui text-chart-amber">
            {t("Closed after PPO or DPO: reset the run to fine-tune again.")}
          </span>
        )}
      </div>
      <RequestError error={error} />
      {history.length > 0 && (
        <LineChart
          xLabel={t("SFT step")}
          yLabel={t("loss on answer tokens")}
          series={[
            {
              key: "demo",
              label: t("demonstrations"),
              color: "var(--color-chart-warm)",
              points: history.map((p) => ({ x: p.step, y: p.loss })),
            },
            {
              key: "held",
              label: t("held-out questions"),
              color: "var(--color-fg-secondary)",
              points: history.map((p) => ({ x: p.step, y: p.held_out_loss })),
            },
          ]}
        />
      )}
      <PanelNote>
        {t(
          "Pretraining already knows “The capital of Italy is Rome.” SFT teaches the question format from fifteen demonstrations, and the demonstrated questions are answered. Whether a held-out question reaches that knowledge is what scale buys: this toy mostly cannot, GPT-3 could. A pretraining batch is mixed into every SFT step so the model does not forget what it knew. With LoRA the base weights never move: rank-4 adapters on every block's linears learn the format with about a tenth of the parameters and are folded back into the weights afterwards. Even the new words' embeddings stay random; the adapters learn around them.",
        )}
      </PanelNote>
    </Panel>
  )
}

const ORDINALS = ["1st", "2nd", "3rd", "4th"]

export function PreferencesPanel({
  prompts,
  promptId,
  onPromptId,
  ranking,
  onRank,
  onResetRanking,
  onSubmit,
  submitted,
  studentPairs,
  bias,
  onBias,
  onTrainRm,
  rmPending,
  run,
  scores,
  error,
}: {
  prompts: PreferencePrompt[]
  promptId: string
  onPromptId: (id: string) => void
  ranking: string[]
  onRank: (id: string) => void
  onResetRanking: () => void
  onSubmit: () => void
  submitted: boolean
  studentPairs: number
  bias: Bias
  onBias: (bias: Bias) => void
  onTrainRm: () => void
  rmPending: boolean
  run: RunState | null
  scores: Record<string, Record<string, number>> | null
  error: Error | null
}) {
  const { t } = useTranslation()
  const prompt = prompts.find((p) => p.id === promptId) ?? prompts[0]
  const rmHistory = run?.rm_history ?? []
  const promptScores = prompt && scores ? scores[prompt.id] : undefined
  const rmBest = promptScores
    ? Object.entries(promptScores).sort((a, b) => b[1] - a[1])[0]?.[0]
    : undefined
  return (
    <Panel title={t("2 · Human preferences")} aside={<ModeBadge mode="real" note={t(TOY)} />}>
      <p className="text-sm text-fg-secondary">
        {t(
          "You are the annotator. Rank the four answers from best to worst; every ordered pair becomes a (chosen, rejected) example. The reward model then learns to predict your preferences, not the truth.",
        )}
      </p>
      {prompt && (
        <>
          <SelectField
            label={t("Prompt")}
            value={prompt.id}
            onChange={onPromptId}
            options={prompts.map((p) => ({ value: p.id, label: p.prompt }))}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            {prompt.candidates.map((c) => {
              const rank = ranking.indexOf(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onRank(c.id)}
                  disabled={rank >= 0}
                  className={cn(
                    "flex items-start gap-2 rounded-[2px] border px-3 py-2 text-left font-display text-[15px] leading-snug",
                    rank >= 0
                      ? "border-brand text-fg"
                      : "border-line text-fg-secondary hover:text-fg",
                  )}
                >
                  <span className="label-ui mt-0.5 w-7 shrink-0 text-brand">
                    {rank >= 0 ? t(ORDINALS[rank]) : ""}
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span>{c.text.trim()}</span>
                    {submitted && <span className="text-xs text-fg-muted">{t(c.note)}</span>}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onResetRanking} className={toolbarButtonClass()}>
              <RotateCcwIcon className="size-3" aria-hidden />
              {t("Reset ranking")}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={ranking.length !== prompt.candidates.length || !run}
              className={toolbarButtonClass(true)}
            >
              <CheckIcon className="size-3" aria-hidden />
              {t("Submit ranking")}
            </button>
            <span className="label-ui text-fg-muted">
              {t("{0} pairs from you", [studentPairs])}
            </span>
          </div>
        </>
      )}
      <Formula>L_RM = −log σ( r(x, y_chosen) − r(x, y_rejected) )</Formula>
      <Switch
        label={t("Prefer longer answers")}
        checked={bias === "length"}
        onChange={(on) => onBias(on ? "length" : "none")}
      />
      <p className="text-xs text-fg-muted">
        {t(
          "The built-in rankings prefer concise, correct answers. The switch replaces them with an annotator who always ranks the longest answer first; your own pairs stay.",
        )}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onTrainRm}
          disabled={rmPending || !run}
          className={toolbarButtonClass(true)}
        >
          <ZapIcon className="size-3" aria-hidden />
          {t("Train reward model (100 steps)")}
        </button>
        {rmHistory.length > 0 && (
          <span className="label-ui text-fg-muted">
            {t("{0} steps · agrees with {1}% of the pairs", [
              rmHistory.length,
              Math.round(rmHistory[rmHistory.length - 1].accuracy * 100),
            ])}
          </span>
        )}
      </div>
      <RequestError error={error} />
      {rmHistory.length > 1 && (
        <LineChart
          xLabel={t("reward-model step")}
          yLabel={t("pairs ranked like the annotator")}
          series={[
            {
              key: "acc",
              label: t("accuracy"),
              color: "var(--color-chart-warm)",
              points: rmHistory.map((p) => ({ x: p.step, y: p.accuracy })),
            },
          ]}
        />
      )}
      {prompt && promptScores && (
        <Table
          head={[t("Answer"), t("Why"), t("Reward-model score")]}
          rows={prompt.candidates.map((c) => ({
            key: c.id,
            cells: [
              <span key="t" className="font-display text-fg">
                {c.text.trim()}
              </span>,
              t(c.note),
              <span key="s" className="flex items-center gap-2 font-ui tabular-nums">
                {c.id === rmBest && (
                  <span
                    role="img"
                    aria-label={
                      c.id === prompt.honest[0]
                        ? t("the reward model's favourite is the honest best")
                        : t("the reward model's favourite is not the honest best")
                    }
                    className={cn(
                      "size-2 rounded-full",
                      c.id === prompt.honest[0] ? "bg-success" : "bg-error",
                    )}
                  />
                )}
                {promptScores[c.id].toFixed(2)}
              </span>,
            ],
          }))}
        />
      )}
      <PanelNote>
        {t(
          "Scores are relative: only differences between answers to the same prompt mean anything. A reward model trained on a biased annotator is a faithful model of that bias.",
        )}
      </PanelNote>
    </Panel>
  )
}

const LR_OPTIONS = ["0.0001", "0.0005", "0.002"]
const CLIP_OPTIONS = ["0.1", "0.2", "0.5"]
const KL_OPTIONS = ["0", "0.1", "0.5", "2"]

const ILLUSTRATIVE_REWARDS = [
  ["Clear, accurate, exactly two sentences", "+0.9"],
  ["Correct but excessively long", "+0.3"],
  ["Inaccurate but confident", "−0.7"],
  ["Irrelevant answer", "−0.9"],
]

/** A completion that repeats one token three times or more: the classic reward-hacking symptom. */
export function repeatsItself(text: string) {
  const counts = new Map<string, number>()
  for (const word of text.split(/\W+/).filter(Boolean)) {
    counts.set(word, (counts.get(word) ?? 0) + 1)
  }
  return [...counts.values()].some((n) => n >= 3)
}

export function PpoPanel({
  run,
  settings,
  onSettings,
  onRun,
  pending,
  enabled,
  needsSft,
  dpoBranch,
  error,
}: {
  run: RunState | null
  settings: PpoSettings
  onSettings: (settings: PpoSettings) => void
  onRun: () => void
  pending: boolean
  enabled: boolean
  needsSft: boolean
  /** The run took the DPO branch instead; PPO is closed until Reset. */
  dpoBranch: boolean
  error: Error | null
}) {
  const { t } = useTranslation()
  const history = run?.ppo_history ?? []
  const latest = history[history.length - 1]
  const hacking = latest !== undefined && repeatsItself(latest.sample_completion)
  return (
    <Panel title={t("3 · RLHF with PPO")} aside={<ModeBadge mode="real" note={t(TOY)} />}>
      <p className="text-sm text-fg-secondary">
        {t(
          "Each iteration the policy answers the six prompts, the reward model scores the answers, and PPO nudges the policy toward higher scores while a KL penalty keeps it close to the SFT weights.",
        )}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <SelectField
          label={t("Learning rate")}
          value={String(settings.lr)}
          onChange={(v) => onSettings({ ...settings, lr: Number(v) })}
          options={LR_OPTIONS.map((v) => ({ value: v, label: `${t("learning rate")} ${v}` }))}
        />
        <SelectField
          label={t("Clip ε")}
          value={String(settings.clip)}
          onChange={(v) => onSettings({ ...settings, clip: Number(v) })}
          options={CLIP_OPTIONS.map((v) => ({ value: v, label: `${t("clip ε")} ${v}` }))}
        />
        <SelectField
          label={t("KL penalty β")}
          value={String(settings.kl_beta)}
          onChange={(v) => onSettings({ ...settings, kl_beta: Number(v) })}
          options={KL_OPTIONS.map((v) => ({ value: v, label: `${t("KL β")} ${v}` }))}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRun}
          disabled={!enabled || pending}
          className={toolbarButtonClass(true)}
        >
          <PlayIcon className="size-3" aria-hidden />
          {t("Run 5 PPO iterations")}
        </button>
        {!enabled && (
          <span className="label-ui text-chart-amber">
            {dpoBranch
              ? t("This run took the DPO branch; reset it to try PPO.")
              : needsSft
                ? t("Run SFT first: PPO needs those weights as its reference.")
                : t("Train a reward model first.")}
          </span>
        )}
      </div>
      <RequestError error={error} />
      {history.length > 1 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <LineChart
            xLabel={t("PPO iteration")}
            yLabel={t("mean reward-model score")}
            series={[
              {
                key: "reward",
                label: t("reward"),
                color: "var(--color-chart-warm)",
                points: history.map((p) => ({ x: p.iteration, y: p.reward })),
              },
            ]}
          />
          <LineChart
            xLabel={t("PPO iteration")}
            yLabel={t("KL to the SFT policy")}
            series={[
              {
                key: "kl",
                label: t("KL"),
                color: "var(--color-chart-amber)",
                points: history.map((p) => ({ x: p.iteration, y: p.kl })),
              },
            ]}
          />
        </div>
      )}
      {history.length > 0 && (
        <Table
          head={[
            t("Iteration"),
            t("Reward"),
            t("KL"),
            t("Clipped"),
            t("Sample answer to “{0}”", [history[0].sample_prompt]),
          ]}
          rows={history.slice(-8).map((p) => ({
            key: String(p.iteration),
            cells: [
              p.iteration,
              p.reward.toFixed(2),
              p.kl.toFixed(3),
              percent(p.clip_fraction),
              <span key="s" className="font-display text-fg">
                {p.sample_completion.trim()}
              </span>,
            ],
          }))}
        />
      )}
      {(hacking || settings.kl_beta === 0) && (
        <p role="status" className="text-sm text-chart-amber">
          {hacking
            ? t(
                "The latest sample repeats itself: the policy found an answer the reward model over-rates. That is reward hacking; the KL penalty is what limits it.",
              )
            : t("With β = 0 nothing holds the policy near its reference: watch the KL climb.")}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="label-ui text-fg-muted">
            {t("What a reward model is meant to capture")}
          </span>
          <ModeBadge mode="historical" />
        </div>
        <Table
          head={[t("Response behaviour"), t("Illustrative reward")]}
          rows={ILLUSTRATIVE_REWARDS.map(([b, r]) => ({ key: b, cells: [t(b), r] }))}
        />
        <p className="text-xs text-fg-muted">
          {t(
            "Invented teaching scores. Real reward-model scores are learned and not calibrated to this scale; the table above the chart shows the real ones here.",
          )}
        </p>
      </div>
      <PanelNote>
        {t(
          "Simplifications in this toy, stated plainly: one reward per whole answer, sequence-level PPO ratios, no value network, advantages standardised per batch, and the KL penalty added to the loss. InstructGPT scored the whole answer once as well, but subtracted a per-token KL penalty from the reward and learned a value head with GAE.",
        )}
      </PanelNote>
    </Panel>
  )
}

const BETA_OPTIONS = ["0.1", "0.5", "1"]

export function DpoPanel({
  run,
  beta,
  onBeta,
  onRun,
  pending,
  needsSft,
  ppoBranch,
  error,
}: {
  run: RunState | null
  beta: number
  onBeta: (beta: number) => void
  onRun: () => void
  pending: boolean
  needsSft: boolean
  /** The run took the PPO branch; DPO is closed until Reset. */
  ppoBranch: boolean
  error: Error | null
}) {
  const { t } = useTranslation()
  const history = run?.dpo_history ?? []
  const enabled = !needsSft && !ppoBranch
  const last = history[history.length - 1]
  return (
    <Panel
      title={t("3b · Direct Preference Optimization")}
      aside={<ModeBadge mode="real" note={t(TOY)} />}
    >
      <p className="text-sm text-fg-secondary">
        {t(
          "The modern shortcut: skip the reward model and PPO, and train the policy on the same preference pairs directly. The policy's own log-probabilities, relative to the SFT reference, act as the reward.",
        )}
      </p>
      <Formula>
        L_DPO = −log σ( β · [ (log π(y_chosen) − log π_ref(y_chosen)) − (log π(y_rejected) − log
        π_ref(y_rejected)) ] )
      </Formula>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-44">
          <SelectField
            label={t("β")}
            value={String(beta)}
            onChange={(v) => onBeta(Number(v))}
            options={BETA_OPTIONS.map((v) => ({ value: v, label: `β ${v}` }))}
          />
        </div>
        <button
          type="button"
          onClick={onRun}
          disabled={!enabled || pending || !run}
          className={toolbarButtonClass(true)}
        >
          <ZapIcon className="size-3" aria-hidden />
          {t("Run 50 DPO steps")}
        </button>
        {!enabled && (
          <span className="label-ui text-chart-amber">
            {ppoBranch
              ? t("This run took the PPO branch; reset it to try DPO.")
              : t("Run SFT first: DPO needs those weights as its reference.")}
          </span>
        )}
        {last && (
          <span className="label-ui text-fg-muted">
            {t("{0} steps · agrees with {1}% of the pairs · margin {2}", [
              history.length,
              Math.round(last.accuracy * 100),
              last.margin.toFixed(2),
            ])}
          </span>
        )}
      </div>
      <RequestError error={error} />
      {history.length > 1 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <LineChart
            xLabel={t("DPO step")}
            yLabel={t("DPO loss")}
            series={[
              {
                key: "loss",
                label: t("loss"),
                color: "var(--color-chart-warm)",
                points: history.map((p) => ({ x: p.step, y: p.loss })),
              },
            ]}
          />
          <LineChart
            xLabel={t("DPO step")}
            yLabel={t("pairs ranked like the annotator")}
            series={[
              {
                key: "acc",
                label: t("accuracy"),
                color: "var(--color-fg-secondary)",
                points: history.map((p) => ({ x: p.step, y: p.accuracy })),
              },
            ]}
          />
        </div>
      )}
      <PanelNote>
        {t(
          "Same data as the reward model, no separate model, no sampling loop: that is why DPO replaced PPO in many recipes after 2023. The catch: DPO raises the chosen answer relative to the rejected one, and the probability of both can fall, so a third answer sometimes wins greedy decoding. A run takes one branch, PPO or DPO; reset to try the other.",
        )}
      </PanelNote>
    </Panel>
  )
}

export type StageOutputs = Record<"pretrained" | "sft" | "current", Step[] | null>

export function ComparePanel({
  prompts,
  prompt,
  onPrompt,
  onGenerate,
  outputs,
  currentStage,
  pending,
  error,
}: {
  prompts: string[]
  prompt: string
  onPrompt: (p: string) => void
  onGenerate: () => void
  outputs: StageOutputs | null
  currentStage: Stage
  pending: boolean
  error: Error | null
}) {
  const { t } = useTranslation()
  const labels: Record<keyof StageOutputs, string> = {
    pretrained: t("Pretrained"),
    sft: t("After SFT"),
    current: {
      rlhf: t("After RLHF (current)"),
      dpo: t("After DPO (current)"),
      sft: t("After SFT (current)"),
      pretrained: t("Pretrained (current)"),
    }[currentStage],
  }
  const columns = stagesFor(currentStage).map((key) => ({ key, label: labels[key] }))
  return (
    <Panel title={t("4 · Compare the checkpoints")} aside={<ModeBadge mode="real" note={t(TOY)} />}>
      <SelectField
        label={t("Prompt")}
        value={prompt}
        onChange={onPrompt}
        options={prompts.map((p) => ({ value: p, label: p }))}
      />
      <button
        type="button"
        onClick={onGenerate}
        disabled={pending}
        className={cn(toolbarButtonClass(true), "self-start")}
      >
        <PlayIcon className="size-3" aria-hidden />
        {t("Generate from all stages")}
      </button>
      <RequestError error={error} />
      {outputs && (
        <div className="grid gap-3 sm:grid-cols-3">
          {columns.map((col) => {
            const steps = outputs[col.key]
            return (
              <div
                key={col.key}
                className="flex flex-col gap-1 rounded-[2px] border border-line p-3"
              >
                <span className="label-ui text-fg-muted">{col.label}</span>
                {steps ? (
                  <span className="font-display text-[17px] leading-snug text-fg">
                    {steps
                      .map((s, i) => ({ key: `${i}-${s.token}`, s, i }))
                      .map(({ key, s, i }) => (
                        <span key={key} title={percent(s.prob)}>
                          {i === 0 ? s.token.trim() : s.token}
                        </span>
                      ))}
                  </span>
                ) : (
                  <span className="text-sm text-fg-muted">{t("not reached yet")}</span>
                )}
              </div>
            )
          })}
        </div>
      )}
      <PanelNote>
        {t(
          "One model at three points of its training, nothing else changed. Greedy decoding, so differences come from training, not sampling. Compare with GPT-2 against a real assistant in GPT → ChatGPT.",
        )}
      </PanelNote>
    </Panel>
  )
}

const OTHER_TECHNIQUES: [string, string, string][] = [
  [
    "DPO",
    "Optimises the policy directly on preference pairs",
    "Replaces the reward model + PPO pair; same data as the reward model. Runnable above, in 3b",
  ],
  [
    "LoRA / PEFT",
    "Trains small added matrices while the base weights stay frozen",
    "An efficiency method usable with SFT and with preference methods",
  ],
  [
    "Continued pretraining",
    "Keeps next-token training on more text",
    "A separate adaptation stage, not instruction tuning",
  ],
  [
    "Rejection sampling",
    "Keeps the best of several sampled answers for further training",
    "A data-selection step that can feed SFT",
  ],
]

export function OtherTechniques() {
  const { t } = useTranslation()
  return (
    <Panel
      title={t("Other techniques you will hear about")}
      aside={<ModeBadge mode="historical" />}
    >
      <Table
        head={[t("Technique"), t("What it does"), t("Relationship to the recipe above")]}
        rows={OTHER_TECHNIQUES.map(([name, what, rel]) => ({
          key: name,
          cells: [
            <span key="n" className="text-fg">
              {name}
            </span>,
            t(what),
            t(rel),
          ],
        }))}
      />
      <p className="text-xs text-fg-muted">
        {t(
          "None of these were stages of the original InstructGPT or ChatGPT pipeline, which was SFT → reward model → PPO.",
        )}
      </p>
    </Panel>
  )
}

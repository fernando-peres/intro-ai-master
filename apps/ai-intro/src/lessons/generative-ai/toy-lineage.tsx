import { useMutation, useQuery } from "@tanstack/react-query"
import { PlayIcon } from "lucide-react"
import { useRef, useState } from "react"
import { Panel, PanelNote, SelectField, toolbarButtonClass } from "@/components/workbench"
import { useTranslation } from "@/i18n/use-translation"
import { alignment, createRun, generateRun, type Stage, type Step, statusOf } from "./api"
import { ModeBadge, RequestError } from "./stages"

const STAGES: { stage: Stage; label: string }[] = [
  { stage: "pretrained", label: "Toy base" },
  { stage: "sft", label: "Toy after SFT" },
  { stage: "rlhf", label: "Toy after RLHF" },
]
const DEFAULT_PROMPT = "Question: What is the capital of France? Answer:"

/** GPT → ChatGPT at toy scale: three committed checkpoints that share every unchanged weight. */
export function ToyLineage() {
  const { t } = useTranslation()
  const align = useQuery({ queryKey: ["toy-alignment"], queryFn: alignment })
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [ran, setRan] = useState<string | null>(null)
  // The three checkpoints are loaded once per page; a lost run (404) reloads them.
  const runIds = useRef<string[] | null>(null)
  const runs = useMutation({
    mutationFn: async (text: string) => {
      const generate = async (ids: string[]) =>
        Promise.all(
          ids.map((id) => generateRun(id, { prompt: text, max_tokens: 6, temperature: 0 })),
        )
      const create = async () => {
        const created = await Promise.all(
          STAGES.map((s) =>
            createRun({ corpus: "all", seed: 0, pretrained: true, stage: s.stage }),
          ),
        )
        runIds.current = created.map((run) => run.run_id)
        return runIds.current
      }
      let outputs: { steps: Step[] }[]
      try {
        outputs = await generate(runIds.current ?? (await create()))
      } catch (error) {
        if (statusOf(error) !== 404) throw error
        outputs = await generate(await create())
      }
      return outputs.map((o) => o.steps)
    },
    onSuccess: (_, text) => setRan(text),
  })
  const prompts = [
    ...(align.data?.prompts ?? []).map((p) => p.prompt),
    ...(align.data?.held_out ?? []).map((d) => d.prompt),
  ]
  const options = (prompts.length ? prompts : [DEFAULT_PROMPT]).map((p) => ({ value: p, label: p }))

  return (
    <Panel
      title={t("Same lineage, toy scale")}
      aside={<ModeBadge mode="real" note={t("toy model")} />}
    >
      <p className="text-sm text-fg-secondary">
        {t(
          "The three panels above compare different models. These three are one model at three points of its training: the Pretraining lesson's toy GPT before post-training, after SFT, and after a reward model plus PPO.",
        )}
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[260px] flex-1">
          <SelectField
            label={t("Toy prompt")}
            value={prompt}
            onChange={setPrompt}
            options={options}
          />
        </div>
        <button
          type="button"
          onClick={() => runs.mutate(prompt)}
          disabled={runs.isPending}
          className={toolbarButtonClass(true)}
        >
          <PlayIcon className="size-3" aria-hidden />
          {runs.isPending ? t("Running…") : t("Run the toy lineage")}
        </button>
      </div>
      <RequestError error={runs.error} />
      {runs.data && ran && (
        <div className="grid gap-3 sm:grid-cols-3">
          {STAGES.map((s, i) => (
            <div key={s.stage} className="flex flex-col gap-1 rounded-[2px] border border-line p-3">
              <span className="label-ui text-fg-muted">{t(s.label)}</span>
              <span className="font-display text-[15px] text-fg-muted">{ran}</span>
              <span className="font-display text-[19px] leading-snug text-fg">
                {(runs.data[i] as Step[])
                  .map((step, j) => ({ key: `${j}-${step.token}`, step, j }))
                  .map(({ key, step, j }) => (
                    <span key={key} title={`${Math.round(step.prob * 100)}%`}>
                      {j === 0 ? step.token.trim() : step.token}
                    </span>
                  ))}
              </span>
            </div>
          ))}
        </div>
      )}
      <PanelNote>
        {t(
          "Train these stages yourself in Transformers › Post-training. The toy knows a few dozen facts, so ask it about those; a real assistant's breadth comes from pretraining at scale, not from post-training.",
        )}
      </PanelNote>
    </Panel>
  )
}

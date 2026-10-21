import { useMutation } from "@tanstack/react-query"
import {
  ArrowDownIcon,
  CheckIcon,
  DownloadIcon,
  LockIcon,
  PlusIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react"
import { useId, useState } from "react"
import { ArticleFrame, LessonHero, LessonLead } from "@/components/course/lesson-layout"
import {
  CompareBars,
  ConfigRail,
  OptionGrid,
  Panel,
  PanelNote,
  RailSection,
  toolbarButtonClass,
  Workbench,
} from "@/components/workbench"
import { useTranslation } from "@/i18n/use-translation"
import { cn } from "@/lib/utils"
import { AdaptationTheory } from "./adaptation-theory"
import { type FewShotResponse, fewShot, fewShotPrompt, type ModelKind, useHealth } from "./api"
import { RequestError, ServerNotice } from "./stages"

export type Method = "zero-shot" | "few-shot" | "fine-tuned"

export const LABELS = ["Positive", "Negative", "Mixed"] as const
type Label = (typeof LABELS)[number]

export const INSTRUCTION =
  "Classify the sentiment of each customer review as Positive, Negative or Mixed."
export const INPUT_NAME = "Review"
export const OUTPUT_NAME = "Sentiment"

type Row = { id: number; input: string; output: Label }

const START: Row[] = [
  { id: 1, input: "I love this product!", output: "Positive" },
  { id: 2, input: "The delivery was terrible.", output: "Negative" },
]
/** Offered, in order, by "Add example"; the first one teaches the Mixed label. */
const SUGGESTIONS: Omit<Row, "id">[] = [
  { input: "Great price, but it broke after a week.", output: "Mixed" },
  { input: "Fast shipping and it works perfectly.", output: "Positive" },
  { input: "Nice design, though the battery is weak.", output: "Mixed" },
  { input: "It stopped working on day one.", output: "Negative" },
  { input: "Exactly what I needed.", output: "Positive" },
  { input: "Friendly support, but the refund took a month.", output: "Mixed" },
]
const MAX_EXAMPLES = 8
const DEFAULT_QUERY = "The product is excellent, but shipping was slow."
const DEFAULT_ASSISTANT = "gpt-5.4-mini"

type Run = {
  id: number
  method: Method
  model: ModelKind
  examples: number
  query: string
  result: FewShotResponse
  /** The label the student confirmed as right, once reviewed. */
  verdict?: Label
}

/** One record of the post-training dataset, in the shape SFT and DPO trainers read. */
export type Observation =
  | { type: "demonstration"; prompt: string; completion: string }
  | { type: "preference"; prompt: string; chosen: string; rejected: string }

/** A confirmed label is a demonstration; a corrected one is also a chosen-vs-rejected pair. */
export function observationsFor(prompt: string, predicted: string | null, right: Label) {
  const out: Observation[] = [{ type: "demonstration", prompt, completion: right }]
  if (predicted && predicted !== right) {
    out.push({ type: "preference", prompt, chosen: right, rejected: predicted })
  }
  return out
}

export const toJsonl = (observations: Observation[]) =>
  observations.map((o) => JSON.stringify(o)).join("\n")

type Tab = "theory" | "lab"

export function AdaptationLabLesson() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>("theory")
  const tabs: { key: Tab; label: string }[] = [
    { key: "theory", label: t("Theory") },
    { key: "lab", label: t("Lab") },
  ]
  return (
    <ArticleFrame>
      <LessonHero line1={t("Adaptation")} />
      <LessonLead>
        {t(
          "A foundation model can only continue text. Adaptation shapes that skill for a task. Read how it works in Theory, then adapt GPT-2 yourself in the Lab.",
        )}
      </LessonLead>
      <div
        role="tablist"
        aria-label={t("Sections")}
        className="flex flex-wrap gap-2 border-b border-divider pb-3"
      >
        {tabs.map(({ key, label }) => (
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
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" hidden={tab !== "theory"} className="flex flex-col gap-[26px]">
        <AdaptationTheory onOpenLab={() => setTab("lab")} />
      </div>
      <div role="tabpanel" hidden={tab !== "lab"} className="flex flex-col gap-[26px]">
        <AdaptationTool />
      </div>
    </ArticleFrame>
  )
}

function AdaptationTool() {
  const { t } = useTranslation()
  const queryId = useId()
  const health = useHealth()
  const assistantName = health.data?.assistant_model ?? DEFAULT_ASSISTANT
  const [method, setMethod] = useState<Method>("few-shot")
  const [model, setModel] = useState<ModelKind>("base")
  const [rows, setRows] = useState<Row[]>(START)
  const [nextId, setNextId] = useState(START.length + 1)
  const [query, setQuery] = useState(DEFAULT_QUERY)
  const [runs, setRuns] = useState<Run[]>([])
  const [dataset, setDataset] = useState<Observation[]>([])

  const classify = useMutation({ mutationFn: fewShot })
  const usesExamples = method === "few-shot"
  const examples = usesExamples
    ? rows.filter((r) => r.input.trim()).map((r) => ({ input: r.input.trim(), output: r.output }))
    : []
  const prompt = fewShotPrompt(INSTRUCTION, examples, query.trim(), INPUT_NAME, OUTPUT_NAME)
  const latest = runs[0]

  const submit = () =>
    classify.mutate(
      {
        instruction: INSTRUCTION,
        examples,
        query: query.trim(),
        input_name: INPUT_NAME,
        output_name: OUTPUT_NAME,
        model,
        labels: [...LABELS],
      },
      {
        onSuccess: (result) =>
          setRuns((prev) =>
            [
              {
                id: (prev[0]?.id ?? 0) + 1,
                method,
                model,
                examples: examples.length,
                query: query.trim(),
                result,
              },
              ...prev,
            ].slice(0, 6),
          ),
      },
    )

  /** The observation keeps only the task and the review, not the few-shot examples. */
  const review = (run: Run, right: Label) => {
    const taskPrompt = fewShotPrompt(INSTRUCTION, [], run.query, INPUT_NAME, OUTPUT_NAME)
    setRuns((prev) => prev.map((r) => (r.id === run.id ? { ...r, verdict: right } : r)))
    setDataset((d) => [...d, ...observationsFor(taskPrompt, run.result.label, right)])
  }

  const addRow = () => {
    const used = new Set(rows.map((r) => r.input))
    const suggestion = SUGGESTIONS.find((s) => !used.has(s.input)) ?? {
      input: "",
      output: "Positive",
    }
    setRows((r) => [...r, { id: nextId, ...suggestion }])
    setNextId((n) => n + 1)
  }
  const update = (id: number, patch: Partial<Row>) =>
    setRows((r) => r.map((row) => (row.id === id ? { ...row, ...patch } : row)))

  const rail = (
    <ConfigRail
      title={t("Configuration")}
      tip={t(
        "Classify with Zero-shot, then with Few-shot, on the base model. Review each prediction to build the post-training dataset.",
      )}
    >
      <RailSection label={t("Adaptation method")}>
        <OptionGrid
          columns={1}
          options={[
            { value: "zero-shot", label: t("Zero-shot") },
            { value: "few-shot", label: t("Few-shot") },
            { value: "fine-tuned", label: t("Fine-tuned") },
          ]}
          value={method}
          onChange={setMethod}
        />
        <p className="text-xs text-fg-muted">
          {method === "zero-shot" && t("Instruction only. Weights unchanged.")}
          {method === "few-shot" &&
            t("Instruction plus examples in the prompt. Weights unchanged.")}
          {method === "fine-tuned" && t("Examples train new weights. Explained, not run live.")}
        </p>
      </RailSection>
      <RailSection label={t("Model")}>
        <OptionGrid
          columns={1}
          options={[
            { value: "base", label: t("Base · GPT-2") },
            { value: "assistant", label: `${t("Assistant")} · ${assistantName}` },
          ]}
          value={model}
          onChange={setModel}
        />
        <p className="text-xs text-fg-muted">
          {model === "base"
            ? t("GPT-2 (124M, OpenAI 2019), run locally. A foundation model, never post-trained.")
            : t("An OpenAI chat model, already post-trained. Set OPENAI_MODEL to change it.")}
        </p>
      </RailSection>
      <RailSection label={t("Task")}>
        <p className="font-display text-[15px] leading-snug text-fg-secondary">
          {t("Sentiment: Positive, Negative or Mixed")}
        </p>
      </RailSection>
    </ConfigRail>
  )

  return (
    <>
      <ServerNotice />
      <Workbench rail={rail}>
        {method === "fine-tuned" ? (
          <FineTuningPanel
            demonstrations={dataset.filter((o) => o.type === "demonstration").length}
          />
        ) : (
          <>
            <Panel
              title={t("1 · Demonstrations")}
              aside={usesExamples ? t("{0} in the prompt", [examples.length]) : t("not used")}
            >
              <ul className={cn("flex flex-col gap-2", !usesExamples && "opacity-40")}>
                {rows.map((row, i) => (
                  <li
                    key={row.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2"
                  >
                    <input
                      aria-label={t("Example {0} text", [i + 1])}
                      value={row.input}
                      disabled={!usesExamples}
                      maxLength={200}
                      onChange={(e) => update(row.id, { input: e.target.value })}
                      className="min-w-0 rounded-[2px] border border-line bg-canvas px-2.5 py-1.5 font-display text-[16px] text-fg"
                    />
                    <select
                      aria-label={t("Example {0} label", [i + 1])}
                      value={row.output}
                      disabled={!usesExamples}
                      onChange={(e) => update(row.id, { output: e.target.value as Label })}
                      className="label-ui rounded-[2px] border border-line bg-canvas px-2 py-2 text-fg-secondary"
                    >
                      {LABELS.map((label) => (
                        <option key={label} value={label}>
                          {t(label)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      aria-label={t("Remove example {0}", [i + 1])}
                      disabled={!usesExamples}
                      onClick={() => setRows((r) => r.filter((x) => x.id !== row.id))}
                      className="text-fg-muted transition-colors hover:text-brand disabled:pointer-events-none"
                    >
                      <XIcon className="size-3.5" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
              {usesExamples ? (
                <button
                  type="button"
                  onClick={addRow}
                  disabled={rows.length >= MAX_EXAMPLES}
                  className={cn(toolbarButtonClass(), "self-start")}
                >
                  <PlusIcon className="size-3" aria-hidden />
                  {t("Add example")}
                </button>
              ) : (
                <p className="text-sm text-fg-muted">
                  {t("Zero-shot sends the instruction alone.")}
                </p>
              )}
            </Panel>

            <div className="grid gap-5 lg:grid-cols-2">
              <Panel title={t("2 · Classify and review")}>
                <label htmlFor={queryId} className="sr-only">
                  {t("Review to classify")}
                </label>
                <textarea
                  id={queryId}
                  value={query}
                  rows={3}
                  maxLength={400}
                  onChange={(e) => setQuery(e.target.value)}
                  className="resize-y rounded-[2px] border border-line bg-canvas px-3 py-2 font-display text-[19px] leading-snug text-fg"
                />
                <button
                  type="button"
                  className={cn(toolbarButtonClass(true), "self-start")}
                  onClick={submit}
                  disabled={classify.isPending || !query.trim()}
                >
                  <SparklesIcon className="size-3" aria-hidden />
                  {classify.isPending ? t("Classifying…") : t("Classify")}
                </button>
                <RequestError error={classify.error} />
                {latest && (
                  <Result
                    key={latest.id}
                    run={latest}
                    onReview={(right) => review(latest, right)}
                  />
                )}
              </Panel>

              <Panel title={t("Prompt sent to the model")} aside={t("live preview")}>
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-[2px] bg-canvas p-3 font-ui text-[12px] leading-relaxed text-fg-secondary">
                  {prompt}
                </pre>
                <PanelNote>
                  {model === "base"
                    ? t(
                        "GPT-2 scores how likely each label is as the next word after “Sentiment:”. The highest wins.",
                      )
                    : t(
                        "The assistant receives this text and replies; its reply is matched to a label.",
                      )}
                </PanelNote>
              </Panel>
            </div>

            {runs.length > 0 && <RunsTable runs={runs} />}
            <DatasetPanel observations={dataset} />
          </>
        )}
      </Workbench>
    </>
  )
}

function Result({ run, onReview }: { run: Run; onReview: (right: Label) => void }) {
  const { t } = useTranslation()
  const { result } = run
  const [fixing, setFixing] = useState(false)
  const predicted = LABELS.find((l) => l === result.label)
  return (
    <div aria-live="polite" className="flex flex-col gap-3 border-t border-divider pt-3">
      <span className="label-ui text-fg-muted">{t("Prediction")}</span>
      <p className="font-display text-4xl font-bold text-fg">
        {result.label ? t(result.label) : t("No label")}
      </p>
      {result.scores ? (
        <CompareBars
          rows={LABELS.map((label) => ({
            label: t(label),
            count: "",
            percent: Math.round((result.scores?.[label] ?? 0) * 100),
            tone: label === result.label ? "brand" : "muted",
          }))}
        />
      ) : (
        <p className="text-sm text-fg-secondary">
          {t("Reply")}: <span className="font-display text-fg">“{result.output}”</span>
        </p>
      )}
      <div className="flex flex-col gap-2 border-t border-divider pt-3">
        <span className="label-ui text-fg-muted">{t("3 · Review")}</span>
        {run.verdict ? (
          <p className="text-sm text-fg-secondary">
            {run.verdict === predicted
              ? t("Confirmed as {0}. Added to the dataset.", [t(run.verdict)])
              : t("Corrected to {0}. Added to the dataset.", [t(run.verdict)])}
          </p>
        ) : fixing || !predicted ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-fg-secondary">{t("The right label is")}</span>
            {LABELS.filter((l) => l !== predicted).map((label) => (
              <button
                key={label}
                type="button"
                className={toolbarButtonClass()}
                onClick={() => onReview(label)}
              >
                {t(label)}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={toolbarButtonClass()}
              onClick={() => onReview(predicted)}
            >
              <CheckIcon className="size-3" aria-hidden />
              {t("Correct")}
            </button>
            <button type="button" className={toolbarButtonClass()} onClick={() => setFixing(true)}>
              <XIcon className="size-3" aria-hidden />
              {t("Wrong")}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const METHOD_LABELS: Record<Method, string> = {
  "zero-shot": "Zero-shot",
  "few-shot": "Few-shot",
  "fine-tuned": "Fine-tuned",
}

function RunsTable({ runs }: { runs: Run[] }) {
  const { t } = useTranslation()
  return (
    <Panel title={t("Your runs")} aside={t("newest first")}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="label-ui text-fg-muted">
              <th className="py-1.5 pr-3 font-normal">{t("Method")}</th>
              <th className="py-1.5 pr-3 font-normal">{t("Model")}</th>
              <th className="py-1.5 pr-3 font-normal">{t("Examples")}</th>
              <th className="py-1.5 pr-3 font-normal">{t("Review")}</th>
              <th className="py-1.5 pr-3 font-normal">{t("Prediction")}</th>
              <th className="py-1.5 font-normal">{t("Your review")}</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run, i) => {
              const confidence = run.result.label && run.result.scores?.[run.result.label]
              return (
                <tr
                  key={run.id}
                  className={cn(
                    "border-t border-divider",
                    i === 0 ? "text-fg" : "text-fg-secondary",
                  )}
                >
                  <td className="py-2 pr-3">{t(METHOD_LABELS[run.method])}</td>
                  <td className="py-2 pr-3">{run.result.model}</td>
                  <td className="py-2 pr-3">{run.examples}</td>
                  <td className="max-w-[14rem] truncate py-2 pr-3">{run.query}</td>
                  <td className="py-2 pr-3 font-display text-[16px]">
                    {run.result.label ? t(run.result.label) : "—"}
                    {confidence ? (
                      <span className="ml-2 font-ui text-xs text-fg-muted">
                        {Math.round(confidence * 100)}%
                      </span>
                    ) : null}
                  </td>
                  <td className="py-2">
                    {!run.verdict
                      ? "—"
                      : run.verdict === run.result.label
                        ? "✓"
                        : `✗ → ${t(run.verdict)}`}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function download(observations: Observation[]) {
  const url = URL.createObjectURL(new Blob([toJsonl(observations)], { type: "application/jsonl" }))
  const a = document.createElement("a")
  a.href = url
  a.download = "post-training-dataset.jsonl"
  a.click()
  URL.revokeObjectURL(url)
}

/** What the reviews add up to: the observations a post-training job would train on. */
function DatasetPanel({ observations }: { observations: Observation[] }) {
  const { t } = useTranslation()
  const demos = observations.filter((o) => o.type === "demonstration").length
  const pairs = observations.length - demos
  return (
    <Panel
      title={t("Post-training dataset")}
      aside={t("{0} demonstrations · {1} preference pairs", [demos, pairs])}
    >
      {observations.length === 0 ? (
        <p className="text-sm text-fg-muted">
          {t(
            "Review a prediction to add your first observation. A confirmed label becomes a demonstration; a corrected one also becomes a preference pair.",
          )}
        </p>
      ) : (
        <>
          <pre
            data-testid="dataset-jsonl"
            className="max-h-64 overflow-auto whitespace-pre rounded-[2px] bg-canvas p-3 font-ui text-[12px] leading-relaxed text-fg-secondary"
          >
            {toJsonl(observations)}
          </pre>
          <button
            type="button"
            onClick={() => download(observations)}
            className={cn(toolbarButtonClass(), "self-start")}
          >
            <DownloadIcon className="size-3" aria-hidden />
            {t("Download .jsonl")}
          </button>
        </>
      )}
      <p className="text-sm text-fg-secondary">
        {t(
          "Nothing here changed the model's weights. A post-training job would: supervised fine-tuning (SFT) trains on the demonstrations, and RLHF or DPO trains on the preference pairs. The result is a new set of weights that answers correctly without examples in the prompt.",
        )}
      </p>
      <PanelNote>
        {t(
          "Real post-training uses thousands to millions of observations; InstructGPT started with about 13,000 demonstration prompts. You have collected {0}.",
          [observations.length],
        )}
      </PanelNote>
    </Panel>
  )
}

/** One stage of a flow: boxes top to bottom, joined by arrows. */
function Flow({
  caption,
  steps,
}: {
  caption: string
  steps: { text: string; tone?: string; locked?: boolean }[]
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="label-ui text-fg-muted">{caption}</span>
      {steps.map((step, i) => (
        <div key={step.text} className="flex flex-col items-center gap-1.5">
          {i > 0 && <ArrowDownIcon className="size-3.5 text-fg-muted" aria-hidden />}
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-[2px] border px-3 py-1.5 text-center font-display text-[15px] text-fg",
              step.tone ?? "border-line",
            )}
          >
            {step.locked && <LockIcon className="size-3 text-fg-muted" aria-hidden />}
            {step.text}
          </span>
        </div>
      ))}
    </div>
  )
}

/** Not run live: contrasts where prompting and fine-tuning put the examples. */
function FineTuningPanel({ demonstrations }: { demonstrations: number }) {
  const { t } = useTranslation()
  return (
    <Panel title={t("Fine-tuning")} aside={t("explained, not run live")}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-[3px] border border-divider p-4">
          <span className="label-ui text-chart-amber">{t("Few-shot prompting")}</span>
          <Flow
            caption={t("every request")}
            steps={[
              { text: t("examples + review"), tone: "border-chart-amber" },
              { text: t("same weights"), locked: true },
              { text: t("label") },
            ]}
          />
          <p className="mt-auto text-sm text-fg-secondary">
            {t("The examples travel with every request. Remove them and the behaviour is gone.")}
          </p>
        </div>
        <div className="flex flex-col gap-4 rounded-[3px] border border-divider p-4">
          <span className="label-ui text-chart-warm">{t("Fine-tuning")}</span>
          <div className="grid grid-cols-2 gap-3">
            <Flow
              caption={t("once")}
              steps={[
                {
                  text: t("your {0} demonstrations", [demonstrations]),
                  tone: "border-chart-warm",
                },
                { text: t("training"), tone: "border-chart-warm" },
                { text: t("new weights") },
              ]}
            />
            <Flow
              caption={t("every request")}
              steps={[
                { text: t("review alone") },
                { text: t("new weights"), locked: true },
                { text: t("label") },
              ]}
            />
          </div>
          <p className="mt-auto text-sm text-fg-secondary">
            {t("The examples are learned once. Later requests need no examples at all.")}
          </p>
        </div>
      </div>
      <PanelNote>
        {t(
          "Fine-tuning is a separate training job that produces a new model, for example through OpenAI's Fine-tuning API (availability depends on the model and account). It usually needs hundreds of examples, so this lab explains it rather than running it.",
        )}
      </PanelNote>
    </Panel>
  )
}

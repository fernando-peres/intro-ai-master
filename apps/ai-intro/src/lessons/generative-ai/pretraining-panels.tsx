import { Link } from "@tanstack/react-router"
import { PlayIcon, SearchIcon } from "lucide-react"
import { useId } from "react"
import { LineChart } from "@/components/charts/line-chart"
import { StatStrip } from "@/components/stat-strip"
import { CompareBars, Panel, PanelNote, toolbarButtonClass } from "@/components/workbench"
import { useTranslation } from "@/i18n/use-translation"
import { cn } from "@/lib/utils"
import type { ProbeResponse, RunState, Step, ToyCorpus } from "./api"
import { ModeBadge, RequestError, tokenLabel } from "./stages"

const TOY = "toy model"
const percent = (p: number) => `${Math.round(p * 100)}%`
const textareaClass =
  "resize-y rounded-[2px] border border-line bg-surface px-2.5 py-2 font-display text-[15px] leading-snug text-fg"

export function DatasetPanel({ corpus }: { corpus: ToyCorpus | undefined }) {
  const { t } = useTranslation()
  return (
    <Panel title={t("Dataset")} aside={<ModeBadge mode="real" note={t(TOY)} />}>
      {corpus ? (
        <>
          <StatStrip
            label={t("Dataset statistics")}
            stats={[
              { label: t("Documents"), value: String(corpus.documents) },
              { label: t("Duplicates removed"), value: String(corpus.duplicates_removed) },
              { label: t("Tokens"), value: corpus.tokens.toLocaleString("en-US") },
              { label: t("Vocabulary"), value: String(corpus.vocab_size) },
              {
                label: t("Train / validation"),
                value: `${corpus.train_tokens.toLocaleString("en-US")} / ${corpus.val_tokens}`,
              },
              { label: t("Context"), value: t("{0} tokens", [corpus.context_len]) },
            ]}
          />
          <p className="font-display text-[15px] leading-snug text-fg-secondary">
            “{corpus.sample}”
          </p>
          <details className="text-sm text-fg-muted">
            <summary className="label-ui cursor-pointer text-fg-muted hover:text-fg">
              {t("How the text is prepared")}
            </summary>
            <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5 marker:text-brand">
              <li>{t("Cleaning: whitespace is normalised and empty documents dropped.")}</li>
              <li>
                {t("Deduplication: exact duplicates are removed, so no sentence counts twice.")}
              </li>
              <li>
                {t(
                  "Tokenization: words and punctuation become tokens; a word keeps its leading space, like GPT-2's tokens.",
                )}
              </li>
              <li>
                {t(
                  "Split: every tenth document goes to validation and is never trained on, so its loss measures generalisation.",
                )}
              </li>
              <li>
                {t(
                  "Context windows: training samples random windows of {0} tokens; each window gives {0} next-token targets at once.",
                  [corpus.context_len],
                )}
              </li>
            </ol>
          </details>
        </>
      ) : (
        <p className="text-sm text-fg-muted">{t("Loading the corpora…")}</p>
      )}
    </Panel>
  )
}

export function ProbePanel({
  probe,
  selected,
  onSelect,
  text,
  onText,
  onProbe,
  pending,
  error,
}: {
  probe: ProbeResponse | null
  selected: number
  onSelect: (index: number) => void
  text: string
  onText: (text: string) => void
  onProbe: () => void
  pending: boolean
  error: Error | null
}) {
  const { t } = useTranslation()
  const id = useId()
  const row = probe?.positions[selected]
  return (
    <Panel title={t("Training example")} aside={<ModeBadge mode="real" note={t(TOY)} />}>
      <p className="text-sm text-fg-secondary">
        {t(
          "Every position is a training example: the tokens so far are the context, the next token is the target. One causal forward pass scores all of them at once.",
        )}
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <label htmlFor={id} className="sr-only">
          {t("Text to probe")}
        </label>
        <textarea
          id={id}
          value={text}
          rows={1}
          maxLength={300}
          onChange={(e) => onText(e.target.value)}
          className={cn(textareaClass, "min-w-[260px] flex-1")}
        />
        <button
          type="button"
          onClick={onProbe}
          disabled={pending || !text.trim()}
          className={toolbarButtonClass()}
        >
          <SearchIcon className="size-3" aria-hidden />
          {t("Probe")}
        </button>
      </div>
      <RequestError error={error} />
      {probe && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="overflow-x-auto">
            <table aria-label={t("Training example")} className="w-full border-collapse text-sm">
              <thead>
                <tr className="label-ui text-fg-muted">
                  <th className="px-2 py-1.5 text-left font-normal">{t("Context")}</th>
                  <th className="px-2 py-1.5 text-left font-normal">{t("Target")}</th>
                  <th className="px-2 py-1.5 text-left font-normal">{t("p(target)")}</th>
                  <th className="px-2 py-1.5 text-right font-normal">{t("Loss")}</th>
                </tr>
              </thead>
              <tbody>
                {probe.positions.map((position, i) => (
                  <tr
                    key={position.index}
                    className={cn("border-t border-divider", i === selected && "bg-brand/10")}
                  >
                    <td className="px-2 py-1.5 whitespace-pre text-fg-muted">
                      {position.context.map(tokenLabel).join("")}
                    </td>
                    <td className="px-2 py-1.5">
                      <button
                        type="button"
                        aria-pressed={i === selected}
                        aria-label={position.target.trim() || tokenLabel(position.target)}
                        onClick={() => onSelect(i)}
                        className={cn(
                          "rounded-[2px] border px-1.5 py-0.5 font-display whitespace-pre",
                          i === selected
                            ? "border-brand text-brand"
                            : "border-line text-fg hover:text-brand",
                        )}
                      >
                        {tokenLabel(position.target)}
                      </button>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        <div aria-hidden className="h-1.5 w-20 rounded-[3px] bg-elevated">
                          <div
                            className="h-full rounded-[3px] bg-chart-warm"
                            style={{ width: `${Math.max(1, position.prob * 100)}%` }}
                          />
                        </div>
                        <span className="font-ui text-xs tabular-nums text-fg-secondary">
                          {position.prob.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-right font-ui text-xs tabular-nums text-fg-secondary">
                      {position.loss.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {probe.truncated && (
              <p className="mt-2 text-xs text-chart-amber">
                {t("Showing the last {0} tokens: the toy model's context window.", [
                  probe.positions.length + 1,
                ])}
              </p>
            )}
          </div>
          {row && (
            <div className="flex flex-col gap-2">
              <span className="label-ui text-fg-muted">
                {t("After “{0}”, the model expects", [row.context.map(tokenLabel).join("").trim()])}
              </span>
              <CompareBars
                rows={row.top_k.map((c, i) => ({
                  label: `“${tokenLabel(c.token)}”`,
                  count: c.token === row.target ? t("target") : "",
                  percent: Math.round(c.prob * 100),
                  tone: i === 0 ? "brand" : "muted",
                }))}
              />
              <p className="text-xs text-fg-muted">
                {t("Target “{0}”: p = {1}, loss = −ln p = {2}", [
                  tokenLabel(row.target).trim(),
                  row.prob.toFixed(3),
                  row.loss.toFixed(2),
                ])}
              </p>
            </div>
          )}
        </div>
      )}
    </Panel>
  )
}

/** Over the last `window` points: validation rising while training falls means memorisation. */
export function memorising(history: RunState["history"], window = 20) {
  if (history.length < window) return false
  const recent = history.slice(-window)
  const first = recent[0]
  const last = recent[recent.length - 1]
  return last.val_loss > first.val_loss && last.train_loss < first.train_loss
}

export function TrainingPanel({ run }: { run: RunState | null }) {
  const { t } = useTranslation()
  const last = run?.history[run.history.length - 1]
  const baseline = run?.random_guess_loss ?? 0
  const xEnd = Math.max(100, run?.step ?? 0)
  return (
    <Panel title={t("Training")} aside={<ModeBadge mode="real" note={t(TOY)} />}>
      <StatStrip
        label={t("Training progress")}
        stats={[
          {
            label: t("Step"),
            value: run ? `${run.step} / ${run.max_steps}` : "—",
            highlight: true,
          },
          { label: t("Train loss"), value: last ? last.train_loss.toFixed(3) : "—" },
          { label: t("Validation loss"), value: last ? last.val_loss.toFixed(3) : "—" },
          { label: t("Perplexity"), value: last ? Math.exp(last.val_loss).toFixed(1) : "—" },
          { label: t("Parameters"), value: run ? run.params.toLocaleString("en-US") : "—" },
        ]}
      />
      {run && (
        <LineChart
          xLabel={t("step")}
          yLabel={t("cross-entropy loss")}
          xExtent={[0, xEnd]}
          series={[
            {
              key: "train",
              label: t("training loss"),
              color: "var(--color-chart-warm)",
              points: run.history.map((p) => ({ x: p.step, y: p.train_loss })),
            },
            {
              key: "val",
              label: t("validation loss"),
              color: "var(--color-fg-secondary)",
              points: run.history.map((p) => ({ x: p.step, y: p.val_loss })),
            },
            {
              key: "guess",
              label: t("random guess, ln V"),
              color: "var(--color-fg-muted)",
              dashed: true,
              points: [
                { x: 0, y: baseline },
                { x: xEnd, y: baseline },
              ],
            },
          ]}
        />
      )}
      <PanelNote>
        {run && memorising(run.history)
          ? t(
              "Validation loss is rising while training loss keeps falling: the model is memorising its training tokens instead of learning patterns that transfer. More data, not more steps, is the cure.",
            )
          : t(
              "Perplexity is e to the validation loss: roughly how many tokens the model is choosing between, while it stays below the vocabulary size V. Above V the model is confidently wrong on unseen text. A random guess scores ln V, the dashed line.",
            )}
      </PanelNote>
    </Panel>
  )
}

export const TRY_PRESETS: { id: string; label: string; prompt: string }[] = [
  { id: "story", label: "Story", prompt: "Once upon a time, a dragon" },
  { id: "fact", label: "Fact", prompt: "The capital of Japan is" },
  { id: "code", label: "Code", prompt: "def square(x):" },
]

export function TryPanel({
  prompt,
  onPrompt,
  onGenerate,
  steps,
  pending,
  error,
}: {
  prompt: string
  onPrompt: (prompt: string) => void
  onGenerate: () => void
  steps: Step[] | null
  pending: boolean
  error: Error | null
}) {
  const { t } = useTranslation()
  const id = useId()
  return (
    <Panel title={t("Try the model")} aside={<ModeBadge mode="real" note={t(TOY)} />}>
      <div className="flex flex-wrap gap-2">
        {TRY_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            aria-pressed={prompt === preset.prompt}
            onClick={() => onPrompt(preset.prompt)}
            className={cn(
              "label-ui rounded-[2px] border px-2 py-1",
              prompt === preset.prompt ? "border-brand text-brand" : "border-line text-fg-muted",
            )}
          >
            {t(preset.label)}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label htmlFor={id} className="sr-only">
          {t("Prompt")}
        </label>
        <textarea
          id={id}
          value={prompt}
          rows={1}
          maxLength={300}
          onChange={(e) => onPrompt(e.target.value)}
          className={cn(textareaClass, "min-w-[260px] flex-1")}
        />
        <button
          type="button"
          onClick={onGenerate}
          disabled={pending || !prompt.trim()}
          className={toolbarButtonClass(true)}
        >
          <PlayIcon className="size-3" aria-hidden />
          {pending ? t("Generating…") : t("Generate")}
        </button>
      </div>
      <RequestError error={error} />
      {steps && (
        <p
          data-testid="generated-text"
          className="whitespace-pre-wrap font-display text-[19px] leading-snug"
        >
          <span className="text-fg-muted">{prompt}</span>
          {steps
            .map((step, i) => ({ key: `${i}-${step.token}`, step }))
            .map(({ key, step }) => (
              <span
                key={key}
                title={percent(step.prob)}
                className="text-fg underline decoration-chart-warm/60 underline-offset-4"
              >
                {step.token}
              </span>
            ))}
        </p>
      )}
      <PanelNote>
        {t(
          "Greedy decoding, up to 12 tokens. This measures behaviour, not loss: a model can have a low loss on its corpus and still answer a question badly. Compare with GPT-2 in",
        )}{" "}
        <Link
          to="/learn/$chapter/$lesson"
          params={{ chapter: "generative-ai", lesson: "next-token-lab" }}
          className="text-brand underline-offset-4 hover:underline"
        >
          {t("Next Token")}
        </Link>
        .
      </PanelNote>
    </Panel>
  )
}

import { useMutation, useQuery } from "@tanstack/react-query"
import { PlayIcon, PlusIcon, XIcon } from "lucide-react"
import { useState } from "react"
import {
  ConfigRail,
  OptionGrid,
  Panel,
  PanelNote,
  RailSection,
  SelectField,
  Switch,
  toolbarButtonClass,
  Workbench,
} from "@/components/workbench"
import { useTranslation } from "@/i18n/use-translation"
import { cn } from "@/lib/utils"
import { ModeBadge, RequestError } from "../generative-ai/stages"
import { embeddingModels, inspect, pca, sentences, words } from "./api"
import { BANK_SENTENCES, SENTENCE_GROUPS } from "./embeddings-presets"
import {
  BankPanel,
  InspectPanel,
  METRIC_LABELS,
  type Pooling,
  sentenceLabel,
  type TextMetric,
  type TextRun,
  TextView,
} from "./embeddings-text-view"
import { PoolingToy } from "./pooling-toy"

const MIN_SENTENCES = 2
const MAX_SENTENCES = 20
/** The server's `/inspect` text limit; also applied to `/sentences` so every row can be inspected. */
const MAX_CHARS = 200

const ALL = [...new Set(SENTENCE_GROUPS.flatMap((g) => g.sentences))]
const PRESETS = [
  ...SENTENCE_GROUPS.map((g) => ({ id: g.id as string, label: g.label, sentences: g.sentences })),
  { id: "all", label: "All nine", sentences: ALL },
  { id: "bank", label: "Bank context", sentences: [BANK_SENTENCES.river, BANK_SENTENCES.money] },
]

const signature = (texts: string[], normalize: boolean) => JSON.stringify([texts, normalize])

/** Sentence vectors, then their PCA map; a failed PCA keeps the matrix drawable. */
async function embed({ texts, normalize }: { texts: string[]; normalize: boolean }) {
  const reply = await sentences({ sentences: texts, normalize })
  const vectors = reply.items.map((item) => item.vector)
  const run: TextRun = {
    texts,
    vectors,
    normalized: reply.normalized,
    points: [],
    projection: null,
    pcaError: null,
  }
  try {
    const reduced = await pca({ rows: vectors, dimensions: 2 })
    run.points = reduced.points.map(([x, y], i) => ({
      id: `s${i}`,
      label: sentenceLabel(i),
      x,
      y,
      series: "sentences",
    }))
    run.projection = {
      ratios: reduced.explained_variance_ratio,
      inputDims: reduced.input_dimensions,
    }
  } catch (error) {
    run.pcaError = error as Error
  }
  return { run, signature: signature(texts, normalize) }
}

async function bankExperiment() {
  const [river, money, glove] = await Promise.all([
    inspect(BANK_SENTENCES.river),
    inspect(BANK_SENTENCES.money),
    words(["bank", "river", "money"]),
  ])
  return { river, money, glove }
}

/** The loaded sentence model, its size and its trained pooling, from the shared models query. */
function SentenceModelStatus() {
  const { t } = useTranslation()
  const models = useQuery({
    queryKey: ["embeddings-models"],
    queryFn: embeddingModels,
    retry: false,
  })
  const model = models.data?.models.find((m) => m.family === "sentence")
  if (!model) return null
  return (
    <p role="status" className="label-ui text-fg-muted">
      {t("Sentence model: {0} · {1} dims · {2} pooling", [
        model.name,
        model.dimensions,
        model.pooling,
      ])}
    </p>
  )
}

const textareaClass =
  "w-full min-w-0 resize-y rounded-[2px] border border-line bg-surface px-2 py-1.5 font-display text-[15px] text-fg"

/** MiniLM sentence vectors: a similarity matrix, a map, the pooling pipeline and the bank experiment. */
export function TextLab() {
  const { t } = useTranslation()
  const [preset, setPreset] = useState(PRESETS[0].id)
  const [list, setList] = useState(PRESETS[0].sentences)
  const [normalize, setNormalize] = useState(true)
  const [metric, setMetric] = useState<TextMetric>("cosine")
  const [pooling, setPooling] = useState<Pooling>("mean")
  const [target, setTarget] = useState(0)

  const lab = useMutation({ mutationFn: embed })
  const inspector = useMutation({
    mutationFn: async ({ text, index }: { text: string; index: number }) => ({
      text,
      index,
      reply: await inspect(text),
    }),
  })
  const bank = useMutation({ mutationFn: bankExperiment })

  const texts = list.map((s) => s.trim()).filter(Boolean)
  const ready = texts.length >= MIN_SENTENCES
  const stale = lab.data !== undefined && lab.data.signature !== signature(texts, normalize)
  const index = Math.min(target, list.length - 1)
  const selected = list[index].trim()
  const inspected = inspector.data

  const choosePreset = (id: string) => {
    setPreset(id)
    const p = PRESETS.find((x) => x.id === id)
    if (p) setList(p.sentences)
  }
  const editList = (next: string[]) => {
    setList(next)
    setPreset("custom")
  }

  const rail = (
    <ConfigRail
      title={t("Configuration")}
      tip={t(
        "Try Negation: “I love this phone” and “I do not love this phone” land close together, although they mean the opposite.",
      )}
    >
      <RailSection label={t("Sentence set")}>
        <OptionGrid
          options={[
            ...PRESETS.map((p) => ({ value: p.id, label: t(p.label) })),
            { value: "custom", label: t("Custom") },
          ]}
          value={preset}
          onChange={choosePreset}
        />
      </RailSection>
      <RailSection label={t("Sentences")}>
        <ol className="flex flex-col gap-1.5">
          {list.map((sentence, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: rows are edited in place; position is the identity
            <li key={i} className="flex items-start gap-1.5">
              <span className="label-ui w-6 shrink-0 pt-2 text-chart-warm">{sentenceLabel(i)}</span>
              <textarea
                aria-label={t("Sentence {0}", [i + 1])}
                value={sentence}
                rows={2}
                maxLength={MAX_CHARS}
                onChange={(e) => editList(list.map((s, k) => (k === i ? e.target.value : s)))}
                className={textareaClass}
              />
              <button
                type="button"
                aria-label={t("Remove sentence {0}", [i + 1])}
                disabled={list.length <= MIN_SENTENCES}
                onClick={() => editList(list.filter((_, k) => k !== i))}
                className="pt-2 text-fg-muted hover:text-brand disabled:opacity-40"
              >
                <XIcon className="size-3" aria-hidden />
              </button>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() => editList([...list, ""])}
          disabled={list.length >= MAX_SENTENCES}
          className={cn(toolbarButtonClass(), "justify-center")}
        >
          <PlusIcon className="size-3" aria-hidden />
          {t("Add sentence")}
        </button>
      </RailSection>
      <RailSection label={t("Embed")}>
        <SelectField
          label={t("Metric")}
          options={(Object.keys(METRIC_LABELS) as TextMetric[]).map((m) => ({
            value: m,
            label: t(METRIC_LABELS[m]),
          }))}
          value={metric}
          onChange={setMetric}
        />
        <Switch label={t("Normalize")} checked={normalize} onChange={setNormalize} />
        <button
          type="button"
          onClick={() => lab.mutate({ texts, normalize })}
          disabled={lab.isPending || !ready}
          className={cn(toolbarButtonClass(true), "justify-center")}
        >
          <PlayIcon className="size-3" aria-hidden />
          {lab.isPending ? t("Embedding…") : t("Embed")}
        </button>
        {!ready && <p className="text-xs text-fg-muted">{t("Write at least two sentences.")}</p>}
        {stale && <p className="text-xs text-chart-amber">{t("Changed: press Embed.")}</p>}
      </RailSection>
      <RailSection label={t("Inspect")}>
        <SelectField
          label={t("Inspect sentence")}
          options={list.map((s, i) => ({ value: String(i), label: `${sentenceLabel(i)} · ${s}` }))}
          value={String(index)}
          onChange={(v) => setTarget(Number(v))}
        />
        <OptionGrid
          columns={1}
          options={[
            { value: "mean" as const, label: t("Mean (trained)") },
            { value: "cls" as const, label: t("CLS (experiment)") },
            { value: "max" as const, label: t("Max (experiment)") },
          ]}
          value={pooling}
          onChange={setPooling}
        />
        <button
          type="button"
          onClick={() => inspector.mutate({ text: selected, index })}
          disabled={inspector.isPending || !selected}
          className={cn(toolbarButtonClass(true), "justify-center")}
        >
          <PlayIcon className="size-3" aria-hidden />
          {inspector.isPending ? t("Inspecting…") : t("Inspect")}
        </button>
      </RailSection>
      <RailSection label={t("Bank experiment")}>
        <button
          type="button"
          onClick={() => bank.mutate()}
          disabled={bank.isPending}
          className={cn(toolbarButtonClass(true), "justify-center")}
        >
          <PlayIcon className="size-3" aria-hidden />
          {t("Run bank experiment")}
        </button>
      </RailSection>
    </ConfigRail>
  )

  return (
    <>
      <SentenceModelStatus />
      <Workbench rail={rail}>
        {lab.data ? (
          <TextView
            key={lab.data.run.texts.join("\n")}
            run={lab.data.run}
            metric={metric}
            stale={stale}
          />
        ) : (
          <Panel title={t("Similarity matrix")} aside={<ModeBadge mode="real" />}>
            <p className={cn("text-sm text-fg-muted", lab.isPending && "animate-pulse")}>
              {lab.isPending
                ? t("Running MiniLM…")
                : t("Press Embed to run MiniLM on the sentences.")}
            </p>
          </Panel>
        )}
        <RequestError error={lab.error} />
        {inspected ? (
          <InspectPanel
            key={inspected.text}
            result={inspected.reply}
            label={sentenceLabel(inspected.index)}
            pooling={pooling}
            stale={inspected.text !== selected}
          />
        ) : (
          <Panel title={t("Inspect")} aside={<ModeBadge mode="real" />}>
            <p className={cn("text-sm text-fg-muted", inspector.isPending && "animate-pulse")}>
              {inspector.isPending
                ? t("Tokenizing and encoding…")
                : t("Pick a sentence and press Inspect to see its tokens and pooling.")}
            </p>
          </Panel>
        )}
        <RequestError error={inspector.error} />
        <PoolingToy />
        <BankPanel run={bank.data} pending={bank.isPending} error={bank.error} />
        <PanelNote>
          {t(
            "MiniLM reads the whole sentence, so each token vector depends on its neighbors; mean pooling, the way it was trained, averages them into one 384-dimension vector. High similarity means related, not identical in meaning.",
          )}
        </PanelNote>
      </Workbench>
    </>
  )
}

import { useMutation, useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { PlayIcon } from "lucide-react"
import { useState } from "react"
import {
  ConfigRail,
  OptionGrid,
  Panel,
  PanelNote,
  RailSection,
  Stepper,
  toolbarButtonClass,
  Workbench,
} from "@/components/workbench"
import { useTranslation } from "@/i18n/use-translation"
import { cn } from "@/lib/utils"
import { ModeBadge, RequestError } from "../generative-ai/stages"
import { corpus, search } from "./api"
import { SEARCH_QUERIES } from "./embeddings-presets"
import { explainSearch } from "./explain"
import { RagPipelineDiagram } from "./rag-pipeline-diagram"

const MAX_QUERY = 500
const MIN_K = 1
const MAX_K = 10

const inputClass =
  "w-full min-w-0 rounded-[2px] border border-line bg-surface px-2 py-1.5 font-display text-[15px] text-fg"

type Hit = { id: string; title: string; category: string; score: number; shared?: string[] }

function Ranking({
  title,
  hits,
  empty,
  bars,
  tone,
  note,
}: {
  title: string
  hits: Hit[]
  empty: string
  bars: boolean
  tone: string
  note?: string
}) {
  const { t } = useTranslation()
  return (
    <Panel title={title} aside={<ModeBadge mode="real" />}>
      {hits.length === 0 ? (
        <p className="text-sm text-fg-muted">{empty}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {hits.map((hit, i) => (
            <li key={hit.id} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-fg">
                  <span className="label-ui text-fg-muted">{i + 1}.</span> <span>{hit.title}</span>{" "}
                  <span className="label-ui text-fg-muted">({hit.category})</span>
                </span>
                <span className={cn("font-display text-[15px]", tone)}>{hit.score.toFixed(2)}</span>
              </div>
              {bars && (
                <div aria-hidden className="h-1.5 rounded-[3px] bg-elevated">
                  <div
                    className="h-full rounded-[3px] bg-chart-warm"
                    style={{ width: `${Math.max(0, Math.min(1, hit.score)) * 100}%` }}
                  />
                </div>
              )}
              {hit.shared && (
                <span className="label-ui text-fg-muted">
                  {t("shared: {0}", [hit.shared.join(", ")])}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
      {note && hits.length > 0 && <p className="text-xs text-fg-muted">{note}</p>}
    </Panel>
  )
}

/** Semantic against keyword search over the server's corpus, and the RAG pipeline around it. */
export function ApplicationsLab() {
  const { t } = useTranslation()
  const [preset, setPreset] = useState<string>("0")
  const [query, setQuery] = useState(SEARCH_QUERIES[0])
  const [topK, setTopK] = useState(5)
  const lab = useMutation({
    mutationFn: async ({ text, k }: { text: string; k: number }) => ({
      text,
      k,
      reply: await search(text, k),
    }),
  })
  const documents = useQuery({ queryKey: ["embeddings-corpus"], queryFn: corpus, retry: false })

  const run = lab.data
  const trimmed = query.trim()
  const stale = run !== undefined && (run.text !== trimmed || run.k !== topK)

  const rail = (
    <ConfigRail title={t("Configuration")}>
      <RailSection label={t("Query preset")}>
        <OptionGrid
          columns={1}
          options={[
            ...SEARCH_QUERIES.map((q, i) => ({ value: String(i), label: t(q) })),
            { value: "custom", label: t("Custom") },
          ]}
          value={preset}
          onChange={(v) => {
            setPreset(v)
            if (v !== "custom") setQuery(SEARCH_QUERIES[Number(v)])
          }}
        />
      </RailSection>
      <RailSection label={t("Search")}>
        <input
          aria-label={t("Query")}
          value={query}
          maxLength={MAX_QUERY}
          onChange={(e) => {
            setQuery(e.target.value)
            setPreset("custom")
          }}
          className={inputClass}
        />
        <Stepper
          label={t("Top-k")}
          value={topK}
          onDecrement={() => setTopK((k) => Math.max(MIN_K, k - 1))}
          onIncrement={() => setTopK((k) => Math.min(MAX_K, k + 1))}
          decrementLabel={t("Fewer results")}
          incrementLabel={t("More results")}
        />
        <button
          type="button"
          onClick={() => lab.mutate({ text: trimmed, k: topK })}
          disabled={lab.isPending || !trimmed}
          className={cn(toolbarButtonClass(true), "justify-center")}
        >
          <PlayIcon className="size-3" aria-hidden />
          {lab.isPending ? t("Searching…") : t("Search")}
        </button>
        {stale && <p className="text-xs text-chart-amber">{t("Changed: press Search.")}</p>}
      </RailSection>
      <RailSection label={t("Corpus")}>
        {documents.data ? (
          <details className="text-sm text-fg-secondary">
            <summary className="label-ui cursor-pointer text-fg-muted">
              {t("{0} documents", [documents.data.documents.length])}
            </summary>
            <ol className="mt-2 flex flex-col gap-1.5">
              {documents.data.documents.map((doc) => (
                <li key={doc.id} className="flex flex-col">
                  <span className="text-fg">
                    {doc.title} <span className="label-ui text-fg-muted">({doc.category})</span>
                  </span>
                  <span className="text-xs text-fg-muted">{doc.text}</span>
                </li>
              ))}
            </ol>
          </details>
        ) : (
          <p className="text-xs text-fg-muted">
            {documents.isError ? t("The corpus is unavailable until the server runs.") : "…"}
          </p>
        )}
      </RailSection>
    </ConfigRail>
  )

  const reply = run?.reply
  return (
    <Workbench rail={rail}>
      <div className="grid min-w-0 gap-3 lg:grid-cols-2">
        <Ranking
          title={t("Semantic search")}
          hits={reply?.semantic ?? []}
          bars
          tone="text-chart-warm"
          empty={
            lab.isPending
              ? t("Searching…")
              : t("Press Search to compare the two rankings over the server's corpus.")
          }
        />
        <Ranking
          title={t("Keyword search")}
          hits={reply?.keyword ?? []}
          bars={false}
          tone="text-fg-secondary"
          note={t(
            "Score: the share of distinct words in common (Jaccard, 0–1); not comparable with cosine.",
          )}
          empty={
            reply
              ? t(
                  "No document shares a token with the query — keyword search returns nothing, semantic search still ranks.",
                )
              : t("Ranked by the tokens a document shares with the query.")
          }
        />
      </div>
      <RequestError error={lab.error} />
      {reply && (
        <Panel title={t("Reading the result")} aside={<ModeBadge mode="real" />}>
          <p className="label-ui text-fg-muted">
            {t("Query tokens: {0}", [reply.query_tokens.join(" · ")])}
          </p>
          <p className="text-sm text-fg-secondary">
            {explainSearch(t, {
              semanticIds: reply.semantic.map((h) => h.id),
              keywordIds: reply.keyword.map((h) => h.id),
              topShared: reply.keyword.find((h) => h.id === reply.semantic[0]?.id)?.shared ?? [],
            })}
          </p>
        </Panel>
      )}
      <Panel title={t("RAG pipeline")} aside={<ModeBadge mode="conceptual" />}>
        <RagPipelineDiagram />
        <PanelNote>
          {t(
            "Retrieval works without an LLM: the ranking above is the whole retrieval step. RAG only adds the last box, pasting the top results into a prompt. To see how a model is adapted to follow such a prompt, open",
          )}{" "}
          <Link
            to="/learn/$chapter/$lesson"
            params={{ chapter: "generative-ai", lesson: "adaptation-lab" }}
            className="text-brand underline-offset-4 hover:underline"
          >
            {t("Adaptation")}
          </Link>
          .
        </PanelNote>
      </Panel>
    </Workbench>
  )
}

import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { CompareBars, Panel, SelectField } from "@/components/workbench"
import { useTranslation } from "@/i18n/use-translation"
import { cn } from "@/lib/utils"
import { ModeBadge, RequestError } from "../generative-ai/stages"
import { StatRow } from "../machine-learning/metric-section"
import type { InspectResponse, WordsResponse } from "./api"
import { type EmbeddingPoint, EmbeddingScatter } from "./embedding-scatter"
import {
  cosine,
  fmt,
  metrics,
  nearest,
  normalize,
  similarityMatrix,
  type Vector,
} from "./embeddings-math"
import { BANK_SENTENCES, SENTENCE_GROUPS } from "./embeddings-presets"
import { explainBank, explainPair, explainPca } from "./explain"
import { SimilarityHeatmap } from "./similarity-heatmap"
import { VectorInspector } from "./vector-inspector"

export type TextMetric = "cosine" | "dot" | "euclidean"
export type Pooling = "mean" | "cls" | "max"

export type TextRun = {
  texts: string[]
  vectors: Vector[]
  normalized: boolean
  points: EmbeddingPoint[]
  projection: { ratios: number[]; inputDims: number } | null
  pcaError: Error | null
}

export type BankRun = { river: InspectResponse; money: InspectResponse; glove: WordsResponse }

export const METRIC_LABELS: Record<TextMetric, string> = {
  cosine: "Cosine",
  dot: "Dot",
  euclidean: "Euclidean",
}

const SERIES = [{ key: "sentences", label: "sentences", color: "var(--color-chart-warm)" }]
const NEAREST_K = 5
const STRIP_DIMS = 16

export const sentenceLabel = (i: number) => `s${i + 1}`
const short = (text: string, n = 48) => (text.length > n ? `${text.slice(0, n - 1)}…` : text)

/** The preset kind whose two sentences are exactly `a` and `b`, else "custom". */
function kindOf(a: string, b: string) {
  const group = SENTENCE_GROUPS.find(
    (g) =>
      g.sentences.length === 2 && g.sentences.includes(a) && g.sentences.includes(b) && a !== b,
  )
  return group?.kind ?? "custom"
}

/** One Embed's panels; keyed by its texts, so the pair and the nearest choice reset with new data. */
export function TextView({
  run,
  metric,
  stale,
}: {
  run: TextRun
  metric: TextMetric
  stale: boolean
}) {
  const { t } = useTranslation()
  const [pair, setPair] = useState<[number, number]>([0, 1])
  const [anchor, setAnchor] = useState(0)
  const labels = run.texts.map((_, i) => sentenceLabel(i))
  const matrix = similarityMatrix(run.vectors, metric)
  const [i, j] = pair
  const values = metrics(run.vectors[i], run.vectors[j], { normalized: false })
  const select = (row: number, col: number) => {
    if (row !== col) setPair([row, col])
  }
  const selectPoint = (id: string) => {
    const index = Number(id.slice(1))
    if (index !== i && index !== j) setPair([j, index])
  }

  return (
    <>
      <Panel
        title={
          metric === "euclidean"
            ? t("Distance matrix · {0} × {0}", [run.texts.length])
            : t("Similarity matrix · {0} × {0}", [run.texts.length])
        }
        aside={<ModeBadge mode="real" />}
      >
        {stale && (
          <p className="text-xs text-chart-amber">{t("Sentences changed: press Embed.")}</p>
        )}
        <SimilarityHeatmap
          labels={labels}
          matrix={matrix}
          selected={pair}
          onSelect={select}
          distance={metric === "euclidean"}
          ariaLabel={t("{0} between every pair of sentences", [t(METRIC_LABELS[metric])])}
        />
        <ol className="flex flex-col gap-1 text-sm text-fg-secondary">
          {run.texts.map((text, k) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: sentences may repeat; position is the identity
            <li key={k}>
              <span className="label-ui pr-2 text-chart-warm">{labels[k]}</span>
              {text}
            </li>
          ))}
        </ol>
      </Panel>

      <Panel title={t("Pair: {0} × {1}", [labels[i], labels[j]])} aside={<ModeBadge mode="real" />}>
        <p className="text-sm text-fg-secondary">
          {`${labels[i]}: ${run.texts[i]}`}
          <br />
          {`${labels[j]}: ${run.texts[j]}`}
        </p>
        <p className="font-display text-[22px] text-brand">
          {`${t(METRIC_LABELS[metric])} ${fmt(values[metric])}`}
        </p>
        <StatRow
          stats={[
            { label: "Cosine", value: fmt(values.cosine) },
            { label: "Dot", value: fmt(values.dot) },
            { label: "Euclidean", value: fmt(values.euclidean) },
          ]}
        />
        <p className="text-sm text-fg-secondary">
          {explainPair(t, kindOf(run.texts[i], run.texts[j]), values.cosine)}
        </p>
        {run.normalized && (
          <p className="text-xs text-fg-muted">
            {t("The vectors are normalized, so dot equals cosine.")}
          </p>
        )}
      </Panel>

      <Panel
        title={t("Map · PCA of {0} sentences", [run.texts.length])}
        aside={<ModeBadge mode="real" />}
      >
        <RequestError error={run.pcaError} />
        {run.projection && (
          <EmbeddingScatter
            points={run.points}
            series={SERIES}
            selected={[`s${i}`, `s${j}`]}
            onSelect={selectPoint}
            ariaLabel={t("Sentence map")}
            caption={explainPca(t, { ...run.projection, frozen: false })}
          />
        )}
      </Panel>

      <Panel
        title={t("Nearest sentences to {0}", [labels[anchor]])}
        aside={<ModeBadge mode="real" />}
      >
        <SelectField
          label={t("Nearest to")}
          options={run.texts.map((text, k) => ({
            value: String(k),
            label: `${labels[k]} · ${short(text)}`,
          }))}
          value={String(anchor)}
          onChange={(v) => setAnchor(Number(v))}
        />
        <CompareBars
          rows={nearest(anchor, run.vectors, NEAREST_K).map((n, k) => ({
            label: `${labels[n.index]} · ${short(run.texts[n.index], 36)}`,
            count: t("cosine {0}", [fmt(n.score)]),
            percent: Math.round(Math.max(0, n.score) * 100),
            value: fmt(n.score),
            tone: k === 0 ? "brand" : "muted",
          }))}
        />
      </Panel>
    </>
  )
}

const POOLING_NAMES: Record<Pooling, string> = {
  mean: "Mean (trained)",
  cls: "CLS (experiment)",
  max: "Max (experiment)",
}

/** Tokens with ids and mask, their vectors as a strip, then the pooled and normalized vector. */
export function InspectPanel({
  result,
  label,
  pooling,
  stale,
}: {
  result: InspectResponse
  label: string
  pooling: Pooling
  stale: boolean
}) {
  const { t } = useTranslation()
  const strip = result.token_vectors.map((v) => v.slice(0, STRIP_DIMS))
  const scale = Math.max(1e-9, ...strip.flat().map(Math.abs))
  const pooled = result.pooled[pooling]
  const unit = pooling === "mean" ? result.pooled.mean_normalized : normalize(pooled)
  const step = "label-ui text-fg-muted"

  return (
    <Panel
      title={t("Inspect “{0}”", [label])}
      aside={<ModeBadge mode="real" note={pooling === "mean" ? t("trained") : t("experiment")} />}
    >
      {stale && <p className="text-xs text-chart-amber">{t("Sentence changed: press Inspect.")}</p>}
      {result.truncated && (
        <p className="text-xs text-chart-amber">
          {t("The sentence was truncated to fit the model.")}
        </p>
      )}
      <p className={step}>{t("1 · Tokens, ids and attention mask")}</p>
      <ol className="flex flex-col gap-1 overflow-x-auto font-ui text-xs">
        {result.tokens.map((token, k) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: tokens repeat; position is the identity
          <li key={k} className="flex items-center gap-2">
            <span className="w-20 shrink-0 truncate font-display text-[14px] text-fg">{token}</span>
            <span className="w-12 shrink-0 text-fg-muted tabular-nums">{result.ids[k]}</span>
            <span className="w-8 shrink-0 text-fg-muted">{result.attention_mask[k]}</span>
            <span
              role="img"
              aria-label={t("First {0} dimensions of “{1}”", [strip[k].length, token])}
              className="flex"
            >
              {strip[k].map((v, d) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: the dimension index is the identity
                  key={d}
                  className="size-3 border border-surface"
                  style={{
                    backgroundColor: v < 0 ? "var(--color-chart-amber)" : "var(--color-chart-warm)",
                    opacity: Math.abs(v) / scale,
                  }}
                />
              ))}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-xs text-fg-muted">
        {t(
          "Columns: token, id, mask (1 = attended). Each square is one of the first {0} dimensions; orange is positive, amber negative, stronger means larger.",
          [STRIP_DIMS],
        )}
      </p>
      <p className={step}>{t("2 · Pooled: {0}", [t(POOLING_NAMES[pooling])])}</p>
      <VectorInspector
        key={`p-${pooling}`}
        label={t(POOLING_NAMES[pooling])}
        vector={pooled}
        normalized={false}
        preview={8}
      />
      <p className={step}>{t("3 · Normalized to length 1")}</p>
      <VectorInspector
        key={`n-${pooling}`}
        label={t("Unit vector")}
        vector={unit}
        normalized
        preview={8}
      />
      {pooling !== "mean" && (
        <p className="text-xs text-fg-muted">
          {t(
            "MiniLM was trained with mean pooling; CLS and max are experiments, so their similarities are not calibrated.",
          )}
        </p>
      )}
    </Panel>
  )
}

const bankVector = (reply: InspectResponse) => {
  const k = reply.tokens.indexOf("bank")
  return k < 0 ? null : reply.token_vectors[k]
}

/** Two contextual “bank” token vectors compared; the static GloVe vector shown beside, never compared. */
export function BankPanel({
  run,
  pending,
  error,
}: {
  run: BankRun | undefined
  pending: boolean
  error: Error | null
}) {
  const { t } = useTranslation()
  let body = (
    <p className={cn("text-sm text-fg-muted", pending && "animate-pulse")}>
      {pending
        ? t("Inspecting both sentences…")
        : t("Press Run bank experiment to compare “bank” in two sentences.")}
    </p>
  )
  if (run) {
    const [river, money] = [bankVector(run.river), bankVector(run.money)]
    const glove = Object.fromEntries(run.glove.found.map((w) => [w.word, w.vector]))
    if (!river || !money || !glove.bank) {
      body = <p className="text-sm text-fg-muted">{t("“bank” was not found as a single token.")}</p>
    } else {
      const contextual = cosine(river, money)
      const gloveRiver = glove.river ? cosine(glove.bank, glove.river) : 0
      const gloveMoney = glove.money ? cosine(glove.bank, glove.money) : 0
      body = (
        <>
          <StatRow
            stats={[
              { label: "MiniLM bank × bank", value: fmt(contextual) },
              { label: "GloVe bank × river", value: fmt(gloveRiver) },
              { label: "GloVe bank × money", value: fmt(gloveMoney) },
            ]}
          />
          <p className="text-sm text-fg-secondary">
            {explainBank(t, { contextual, river: gloveRiver, money: gloveMoney })}
          </p>
          <VectorInspector
            label={t("GloVe “bank” · static, a different space")}
            vector={glove.bank}
            normalized={false}
            preview={8}
          />
        </>
      )
    }
  }
  return (
    <Panel title={t("Bank experiment")} aside={<ModeBadge mode="real" />}>
      <ul className="flex flex-col gap-1 text-sm text-fg-secondary">
        <li>{BANK_SENTENCES.river}</li>
        <li>{BANK_SENTENCES.money}</li>
      </ul>
      {body}
      <RequestError error={error} />
      <p className="text-xs text-fg-muted">
        {t("Attention is what moves the two vectors apart: see the bank example in")}{" "}
        <Link
          to="/learn/$chapter/$lesson"
          params={{ chapter: "generative-ai", lesson: "transformer-architecture" }}
          className="text-brand underline-offset-4 hover:underline"
        >
          {t("Architecture")}
        </Link>
        .
      </p>
    </Panel>
  )
}

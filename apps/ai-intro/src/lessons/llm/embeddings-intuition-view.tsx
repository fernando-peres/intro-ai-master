import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { CompareBars, OptionGrid, Panel, Switch } from "@/components/workbench"
import { useTranslation } from "@/i18n/use-translation"
import { cn } from "@/lib/utils"
import { ModeBadge, RequestError } from "../generative-ai/stages"
import { StatRow } from "../machine-learning/metric-section"
import {
  type AnalogyResponse,
  type MissingWord,
  MissingWordsError,
  type Neighbor,
  neighbors,
} from "./api"
import {
  type EmbeddingArrow,
  type EmbeddingPoint,
  EmbeddingScatter,
  type EmbeddingSeries,
} from "./embedding-scatter"
import { fmt, type Metric, metrics, normalize, type Vector } from "./embeddings-math"
import type { WordSet } from "./embeddings-presets"
import { explainAnalogy, explainPca } from "./explain"
import { VectorInspector } from "./vector-inspector"

/** Point id of the analogy result; not a GloVe token, so it never collides with a word. */
export const TARGET_ID = "target:analogy"

export type IntuitionRun = {
  id: number
  signature: string
  formula: { a: string; b: string; c: string; expected: string; label: string }
  topK: number
  analogy: AnalogyResponse | null
  analogyError: Error | null
  wordsError: Error | null
  /** Every vector this run can compare: the map words, the analogy neighbors and the target. */
  vectors: Record<string, Vector>
  words: string[]
  missing: MissingWord[]
  clusters: WordSet["clusters"]
  /** Empty when fewer than three words have vectors. */
  points: EmbeddingPoint[]
  projection: { ratios: number[]; inputDims: number; frozen: boolean; recomputed: boolean } | null
}

const SERIES: EmbeddingSeries[] = [
  { key: "words", label: "words", color: "var(--color-chart-warm)" },
  { key: "class-1", label: "animals", color: "var(--color-class-1)" },
  { key: "class-2", label: "vehicles", color: "var(--color-class-2)" },
  { key: "results", label: "analogy results", color: "var(--color-fg-secondary)" },
  { key: "target", label: "analogy target", color: "var(--color-chart-amber)" },
]

const METRICS: Metric[] = ["cosine", "dot", "euclidean", "manhattan"]
const METRIC_LABELS: Record<Metric, string> = {
  cosine: "Cosine",
  dot: "Dot",
  euclidean: "Euclidean",
  manhattan: "Manhattan",
}

const toBars = (list: Neighbor[], highlight: string, t: (s: string, v?: string[]) => string) =>
  list.map((n, i) => ({
    label: n.word,
    count: t("cosine {0}", [fmt(n.score)]),
    percent: Math.round(Math.max(0, n.score) * 100),
    value: fmt(n.score),
    tone: (highlight ? n.word === highlight : i === 0) ? ("brand" as const) : ("muted" as const),
  }))

/** One Run's panels; keyed by the run, so the pair and the chosen word reset with each Run. */
export function IntuitionView({
  run,
  stale,
  showArrows,
  showLabels,
}: {
  run: IntuitionRun
  stale: boolean
  showArrows: boolean
  showLabels: boolean
}) {
  const { t } = useTranslation()
  const { formula } = run
  const ids = Object.keys(run.vectors)
  const labelOf = (id: string) => (id === TARGET_ID ? formula.label : id)
  const [pair, setPair] = useState<[string, string]>(() => {
    if (run.vectors[formula.a] && run.vectors[formula.expected])
      return [formula.a, formula.expected]
    return [ids[0] ?? "", ids[1] ?? ids[0] ?? ""]
  })
  const [metric, setMetric] = useState<Metric>("cosine")
  const [normalized, setNormalized] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const nearest = useMutation({ mutationFn: neighbors })

  const select = (id: string) =>
    setPair(([first, second]) => (id === first || id === second ? [first, second] : [second, id]))
  const pick = (word: string) => {
    setChosen(word)
    nearest.mutate({ word, top_k: run.topK })
  }

  const list = run.analogy?.neighbors ?? []
  const rank = list.findIndex((n) => n.word === formula.expected)
  const at = (id: string) => run.points.find((p) => p.id === id)
  const [pa, pb, pc, target] = [at(formula.a), at(formula.b), at(formula.c), at(TARGET_ID)]
  const arrows: EmbeddingArrow[] =
    showArrows && pa && pb && pc && target
      ? [
          { from: pb, to: pa, label: `${formula.b} → ${formula.a}` },
          { from: pc, to: target, label: t("{0} → target", [formula.c]), dashed: true },
        ]
      : []
  const used = new Set(run.points.map((p) => p.series))
  const [va, vb] = [run.vectors[pair[0]], run.vectors[pair[1]]]
  const values = va && vb ? metrics(va, vb, { normalized }) : null

  return (
    <>
      <Panel title={t("Analogy")} aside={<ModeBadge mode="real" />}>
        <p className="font-display text-[19px] text-fg">{`${formula.label} = ?`}</p>
        {run.analogyError instanceof MissingWordsError ? (
          <p role="alert" className="text-sm text-error">
            {t("Not in the GloVe vocabulary: {0}", [
              run.analogyError.missing.map((m) => m.word).join(", "),
            ])}
          </p>
        ) : run.analogyError ? (
          <RequestError error={run.analogyError} />
        ) : (
          <>
            <CompareBars rows={toBars(list, formula.expected, t)} />
            {list.length > 0 && (
              <p className="text-sm text-fg-secondary">
                {explainAnalogy(t, {
                  positive: [formula.a, formula.c],
                  negative: [formula.b],
                  expected: formula.expected,
                  rank: rank < 0 ? null : rank + 1,
                  topK: run.topK,
                  top: list[0],
                })}
              </p>
            )}
          </>
        )}
      </Panel>

      <Panel
        title={chosen ? t("Nearest words to “{0}”", [chosen]) : t("Nearest words")}
        aside={<ModeBadge mode="real" />}
      >
        <div className="flex flex-wrap gap-1.5">
          {run.words.map((w) => (
            <button
              key={w}
              type="button"
              aria-pressed={chosen === w}
              onClick={() => pick(w)}
              className={cn(
                "label-ui rounded-[2px] border px-2 py-1 transition-colors",
                chosen === w
                  ? "border-brand text-brand"
                  : "border-line text-fg-muted hover:text-fg",
              )}
            >
              {w}
            </button>
          ))}
        </div>
        {nearest.data ? (
          <CompareBars rows={toBars(nearest.data.neighbors, "", t)} />
        ) : (
          <p className={cn("text-sm text-fg-muted", nearest.isPending && "animate-pulse")}>
            {nearest.isPending
              ? t("Searching the vocabulary…")
              : t("Pick a word to list its nearest neighbors among the 100,000 most common words.")}
          </p>
        )}
        <RequestError error={nearest.error} />
      </Panel>

      <Panel
        title={t("Metrics between “{0}” and “{1}”", [labelOf(pair[0]), labelOf(pair[1])])}
        aside={<ModeBadge mode="real" />}
      >
        <div className="flex flex-wrap gap-2">
          {[0, 1].map((side) => (
            <select
              key={side}
              aria-label={side === 0 ? t("First word") : t("Second word")}
              value={pair[side]}
              onChange={(e) =>
                setPair((p) => (side === 0 ? [e.target.value, p[1]] : [p[0], e.target.value]))
              }
              className="rounded-[2px] border border-line bg-surface px-2 py-1 font-display text-[15px] text-fg"
            >
              {ids.map((id) => (
                <option key={id} value={id}>
                  {labelOf(id)}
                </option>
              ))}
            </select>
          ))}
        </div>
        <OptionGrid
          options={METRICS.map((m) => ({ value: m, label: t(METRIC_LABELS[m]) }))}
          value={metric}
          onChange={setMetric}
        />
        <Switch label={t("Normalized")} checked={normalized} onChange={setNormalized} />
        {values ? (
          <>
            <p data-testid="metric-headline" className="font-display text-[22px] text-brand">
              {`${t(METRIC_LABELS[metric])} ${fmt(values[metric])}`}
            </p>
            <StatRow
              stats={[
                { label: "Cosine", value: fmt(values.cosine) },
                { label: "Dot", value: fmt(values.dot) },
                { label: "Euclidean", value: fmt(values.euclidean) },
                { label: "Manhattan", value: fmt(values.manhattan) },
                { label: "Norms", value: `${fmt(values.norms[0])} / ${fmt(values.norms[1])}` },
              ]}
            />
            <VectorInspector
              key={`${pair[0]}-${normalized}`}
              label={labelOf(pair[0])}
              vector={normalized ? normalize(va) : va}
              normalized={normalized}
            />
          </>
        ) : (
          <p className="text-sm text-fg-muted">{t("Pick two words to compare.")}</p>
        )}
      </Panel>

      <Panel
        title={t("Map · PCA of {0} points", [run.points.length])}
        aside={<ModeBadge mode="real" />}
      >
        {stale && <p className="text-xs text-chart-amber">{t("Words changed: press Run.")}</p>}
        <RequestError error={run.wordsError} />
        {run.projection?.recomputed && (
          <p className="text-xs text-chart-amber">
            {t("Axes were recomputed: positions may not match the previous map.")}
          </p>
        )}
        {run.points.length === 0 || !run.projection ? (
          <p className="text-sm text-fg-muted">{t("Add at least three words to draw a map.")}</p>
        ) : (
          <EmbeddingScatter
            points={run.points}
            series={SERIES.filter((s) => used.has(s.key))}
            selected={pair}
            onSelect={select}
            arrows={arrows}
            showLabels={showLabels}
            ariaLabel={t("Word map")}
            caption={explainPca(t, run.projection)}
          />
        )}
        <p className="text-xs text-fg-muted">{t("Click two points to compare them in Metrics.")}</p>
      </Panel>
    </>
  )
}

import { useMutation } from "@tanstack/react-query"
import { PlayIcon, PlusIcon, XIcon } from "lucide-react"
import { useRef, useState } from "react"
import {
  ConfigRail,
  OptionGrid,
  Panel,
  PanelNote,
  RailSection,
  Stepper,
  Switch,
  toolbarButtonClass,
  Workbench,
} from "@/components/workbench"
import { useTranslation } from "@/i18n/use-translation"
import { cn } from "@/lib/utils"
import { ModeBadge, RequestError } from "../generative-ai/stages"
import {
  type AnalogyResponse,
  analogy,
  type MissingWord,
  MissingWordsError,
  pca,
  words,
} from "./api"
import { type IntuitionRun, IntuitionView, TARGET_ID } from "./embeddings-intuition-view"
import { projectIntoBasis, type Vector } from "./embeddings-math"
import { ANALOGY_PRESETS, WORD_SETS, type WordSet } from "./embeddings-presets"

type Basis = { mean: Vector; components: Vector[]; ratios: number[]; inputDims: number }
type Config = {
  a: string
  b: string
  c: string
  expected: string
  topK: number
  words: string[]
  clusters: WordSet["clusters"]
}

const MAX_TOP_K = 10
const MIN_MAP_WORDS = 3
const MAX_WORD = 40

const clean = (word: string) => word.trim().toLowerCase()

/** Order-preserving, case-insensitive; blanks dropped. */
function unique(list: string[]) {
  return [...new Set(list.map(clean).filter(Boolean))]
}

const mapWordsOf = (config: Config) => unique([config.a, config.b, config.c, ...config.words])
const signature = (config: Config) => JSON.stringify([mapWordsOf(config), config.topK])

/** Analogy, then the uncached vectors, then the map; a failed request keeps the rest drawable. */
async function runLab(
  config: Config,
  cache: Map<string, Vector>,
  unknown: Map<string, MissingWord>,
  basis: Basis | null,
  frozen: boolean,
): Promise<{ run: Omit<IntuitionRun, "id" | "signature">; basis: Basis | null }> {
  const [a, b, c] = [config.a, config.b, config.c].map(clean)
  let reply: AnalogyResponse | null = null
  let analogyError: Error | null = null
  try {
    reply = await analogy({ positive: [a, c], negative: [b], top_k: config.topK })
  } catch (error) {
    analogyError = error as Error
    if (error instanceof MissingWordsError) {
      for (const m of error.missing) unknown.set(clean(m.word), m)
    }
  }
  const mapWords = mapWordsOf(config)
  const neighbourWords = (reply?.neighbors ?? []).map((n) => n.word)
  const uncached = unique([...mapWords, ...neighbourWords]).filter(
    (w) => !cache.has(w) && !unknown.has(w),
  )
  let wordsError: Error | null = null
  if (uncached.length > 0) {
    try {
      const fetched = await words(uncached)
      for (const found of fetched.found) cache.set(clean(found.word), found.vector)
      for (const m of fetched.missing) unknown.set(clean(m.word), m)
    } catch (error) {
      wordsError = error as Error
    }
  }

  const missing = mapWords.flatMap((w) => unknown.get(w) ?? [])
  const vectors: Record<string, Vector> = {}
  for (const w of unique([...mapWords, ...neighbourWords])) {
    const vector = cache.get(w)
    if (vector) vectors[w] = vector
  }
  const onMap = unique([...mapWords, ...neighbourWords]).filter((w) => vectors[w])
  const formula = `${a} − ${b} + ${c}`
  const entries = onMap.map((w) => ({ id: w, label: w, vector: vectors[w] }))
  if (reply) {
    entries.push({ id: TARGET_ID, label: formula, vector: reply.vector })
    vectors[TARGET_ID] = reply.vector
  }
  const base = {
    formula: { a, b, c, expected: clean(config.expected), label: formula },
    topK: config.topK,
    analogy: reply,
    analogyError,
    wordsError,
    vectors,
    words: onMap,
    missing,
    clusters: config.clusters,
  }
  if (onMap.length < MIN_MAP_WORDS) return { run: { ...base, points: [], projection: null }, basis }

  const series = (id: string) => {
    if (id === TARGET_ID) return "target"
    if (!mapWords.includes(id)) return "results"
    return config.clusters?.[id] ?? "words"
  }
  if (frozen && basis) {
    const points = entries.map((e) => {
      const [x, y] = projectIntoBasis(e.vector, basis.mean, basis.components)
      return { id: e.id, label: e.label, x, y, series: series(e.id) }
    })
    const projection = {
      ratios: basis.ratios,
      inputDims: basis.inputDims,
      frozen,
      recomputed: false,
    }
    return { run: { ...base, points, projection }, basis }
  }
  const reduced = await pca({ rows: entries.map((e) => e.vector), dimensions: 2 })
  const points = entries.map((e, i) => ({
    id: e.id,
    label: e.label,
    x: reduced.points[i][0],
    y: reduced.points[i][1],
    series: series(e.id),
  }))
  const next: Basis = {
    mean: reduced.mean,
    components: reduced.components,
    ratios: reduced.explained_variance_ratio,
    inputDims: reduced.input_dimensions,
  }
  const projection = {
    ratios: next.ratios,
    inputDims: next.inputDims,
    frozen,
    recomputed: basis !== null,
  }
  return { run: { ...base, points, projection }, basis: next }
}

const inputClass =
  "w-full min-w-0 rounded-[2px] border border-line bg-surface px-2 py-1.5 font-display text-[15px] text-fg"

/** GloVe word vectors: an analogy, a word set on a PCA map, nearest words and pair metrics. */
export function IntuitionLab() {
  const { t } = useTranslation()
  const first = ANALOGY_PRESETS[0]
  const [preset, setPreset] = useState(first.id)
  const [a, setA] = useState(first.positive[0])
  const [b, setB] = useState(first.negative[0])
  const [c, setC] = useState(first.positive[1])
  const [expected, setExpected] = useState(first.expected)
  const [topK, setTopK] = useState(5)
  const [setId, setSetId] = useState(WORD_SETS[0].id)
  const [list, setList] = useState(WORD_SETS[0].words)
  const [draft, setDraft] = useState("")
  const [frozen, setFrozen] = useState(false)
  const [arrows, setArrows] = useState(false)
  const [labels, setLabels] = useState(true)
  const cache = useRef(new Map<string, Vector>())
  const unknown = useRef(new Map<string, MissingWord>())
  const basis = useRef<Basis | null>(null)
  const runs = useRef(0)

  const clusters = WORD_SETS.find((s) => s.id === setId)?.clusters
  const config: Config = { a, b, c, expected, topK, words: list, clusters }
  const lab = useMutation({
    mutationFn: async ({ input, freeze }: { input: Config; freeze: boolean }) => {
      const { run, basis: next } = await runLab(
        input,
        cache.current,
        unknown.current,
        basis.current,
        freeze,
      )
      basis.current = next
      runs.current += 1
      return { ...run, id: runs.current, signature: signature(input) }
    },
  })
  const result = lab.data
  const stale = result !== undefined && result.signature !== signature(config)

  const choosePreset = (id: string) => {
    setPreset(id)
    const p = ANALOGY_PRESETS.find((x) => x.id === id)
    if (!p) return
    setA(p.positive[0])
    setB(p.negative[0])
    setC(p.positive[1])
    setExpected(p.expected)
  }
  const editAnalogy = (set: (v: string) => void) => (value: string) => {
    set(value)
    setPreset("custom")
  }
  const chooseSet = (id: string) => {
    setSetId(id)
    setList(WORD_SETS.find((s) => s.id === id)?.words ?? [])
  }
  const editList = (next: string[]) => {
    setList(unique(next))
    setSetId("custom")
  }
  const addDraft = () => {
    if (!clean(draft)) return
    editList([...list, draft])
    setDraft("")
  }
  const replace = (from: string, to: string) => {
    const swap = (w: string) => (clean(w) === from ? to : w)
    if ([a, b, c, expected].some((w) => clean(w) === from)) {
      setA(swap(a))
      setB(swap(b))
      setC(swap(c))
      setExpected(swap(expected))
      setPreset("custom")
    }
    if (list.some((w) => clean(w) === from)) editList(list.map(swap))
  }

  const current = new Set(mapWordsOf(config))
  const missing = (result?.missing ?? []).filter((m) => current.has(clean(m.word)))
  const ready = [a, b, c].every((w) => clean(w))

  const rail = (
    <ConfigRail
      title={t("Configuration")}
      tip={t(
        "Pick the Bias word set, then compare “doctor” with “man” and with “woman” in Metrics: the vectors learned who the text usually pairs with whom.",
      )}
    >
      <RailSection label={t("Analogy")}>
        <OptionGrid
          columns={1}
          options={[
            ...ANALOGY_PRESETS.map((p) => ({ value: p.id, label: t(p.label) })),
            { value: "custom", label: t("Custom") },
          ]}
          value={preset}
          onChange={choosePreset}
        />
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1">
          <input
            aria-label={t("Word A")}
            maxLength={MAX_WORD}
            value={a}
            onChange={(e) => editAnalogy(setA)(e.target.value)}
            className={inputClass}
          />
          <span className="text-fg-muted">−</span>
          <input
            aria-label={t("Word B")}
            maxLength={MAX_WORD}
            value={b}
            onChange={(e) => editAnalogy(setB)(e.target.value)}
            className={inputClass}
          />
          <span className="text-fg-muted">+</span>
          <input
            aria-label={t("Word C")}
            maxLength={MAX_WORD}
            value={c}
            onChange={(e) => editAnalogy(setC)(e.target.value)}
            className={inputClass}
          />
        </div>
        <label className="flex items-center gap-2">
          <span className="label-ui shrink-0 text-fg-muted">{t("Expected")}</span>
          <input
            maxLength={MAX_WORD}
            value={expected}
            onChange={(e) => editAnalogy(setExpected)(e.target.value)}
            className={inputClass}
          />
        </label>
        <Stepper
          label={t("Top-k")}
          value={topK}
          onDecrement={() => setTopK((k) => Math.max(1, k - 1))}
          onIncrement={() => setTopK((k) => Math.min(MAX_TOP_K, k + 1))}
          decrementLabel={t("Fewer neighbors")}
          incrementLabel={t("More neighbors")}
        />
      </RailSection>
      <RailSection label={t("Word set")}>
        <OptionGrid
          columns={1}
          options={WORD_SETS.map((s) => ({ value: s.id, label: t(s.label) }))}
          value={setId}
          onChange={chooseSet}
        />
        <ul className="flex flex-wrap gap-1.5">
          {list.map((w) => (
            <li
              key={w}
              className="flex items-center gap-1 rounded-[2px] border border-line py-0.5 pr-1 pl-2 font-display text-sm text-fg"
            >
              {w}
              <button
                type="button"
                aria-label={t("Remove {0}", [w])}
                onClick={() => editList(list.filter((x) => x !== w))}
                className="text-fg-muted hover:text-brand"
              >
                <XIcon className="size-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-1.5">
          <input
            aria-label={t("Add a word")}
            value={draft}
            placeholder={t("Add a word")}
            maxLength={MAX_WORD}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addDraft()
            }}
            className={inputClass}
          />
          <button
            type="button"
            aria-label={t("Add word")}
            onClick={addDraft}
            className={toolbarButtonClass()}
          >
            <PlusIcon className="size-3" aria-hidden />
          </button>
        </div>
      </RailSection>
      <RailSection label={t("Map")}>
        <Switch label={t("Freeze projection")} checked={frozen} onChange={setFrozen} />
        <Switch label={t("Show arrows")} checked={arrows} onChange={setArrows} />
        <Switch label={t("Show labels")} checked={labels} onChange={setLabels} />
        <button
          type="button"
          onClick={() => lab.mutate({ input: config, freeze: frozen })}
          disabled={lab.isPending || !ready}
          className={cn(toolbarButtonClass(true), "justify-center")}
        >
          <PlayIcon className="size-3" aria-hidden />
          {lab.isPending ? t("Running…") : t("Run")}
        </button>
        {stale && <p className="text-xs text-chart-amber">{t("Changed: press Run.")}</p>}
      </RailSection>
    </ConfigRail>
  )

  return (
    <Workbench rail={rail}>
      {result ? (
        <IntuitionView
          key={result.id}
          run={result}
          stale={stale}
          showArrows={arrows}
          showLabels={labels}
        />
      ) : (
        <Panel title={t("Map")} aside={<ModeBadge mode="real" />}>
          <p className={cn("text-sm text-fg-muted", lab.isPending && "animate-pulse")}>
            {lab.isPending ? t("Fetching vectors…") : t("Press Run to fetch GloVe vectors.")}
          </p>
        </Panel>
      )}
      <RequestError error={lab.error} />
      {missing.length > 0 && (
        <Panel title={t("Missing words")}>
          <ul className="flex flex-col gap-2 text-sm text-fg-secondary">
            {missing.map((m) => (
              <li key={m.word} className="flex flex-wrap items-center gap-2">
                <span>{t("“{0}” is not in the vocabulary.", [m.word])}</span>
                {m.suggestions.length > 0 ? (
                  <>
                    <span className="text-fg-muted">{t("Try:")}</span>
                    {m.suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => replace(clean(m.word), s)}
                        className="label-ui rounded-[2px] border border-line px-2 py-0.5 text-fg-secondary hover:text-brand"
                      >
                        {s}
                      </button>
                    ))}
                  </>
                ) : (
                  <span className="text-fg-muted">{t("No close spelling found.")}</span>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}
      <PanelNote>
        {t(
          "GloVe learned these vectors from how often words appear together in Wikipedia and news text: they mirror that text, biases included. A two-dimensional map can only hint at 300 dimensions.",
        )}
      </PanelNote>
    </Workbench>
  )
}

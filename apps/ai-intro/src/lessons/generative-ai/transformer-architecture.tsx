import { useMutation } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { PlayIcon } from "lucide-react"
import { useId, useState } from "react"
import { ArticleFrame, LessonHero, LessonLead } from "@/components/course/lesson-layout"
import {
  CompareBars,
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
import { type AttentionModelId, type AttentionResponse, attention } from "./api"
import { AttentionCalculator } from "./attention-calculator"
import { AttentionHeatmap } from "./attention-heatmap"
import { meanHeads, topAttended } from "./attention-math"
import { ModeBadge, RequestError, ServerNotice, tokenLabel } from "./stages"
import { TransformerTheory } from "./transformer-theory"

type ExampleId = "bank" | "cat" | "custom"
type Preset = { label: string; a: string; b: string }

/**
 * For the decoder the disambiguating word must come before "bank" (causal attention cannot look
 * ahead); the encoder gets the classic sentences, where it comes after.
 */
const EXAMPLES: Record<AttentionModelId, Record<Exclude<ExampleId, "custom">, Preset>> = {
  gpt2: {
    bank: {
      label: "River bank vs. money bank",
      a: "He fished from the river bank",
      b: "She deposited money at the bank",
    },
    cat: { label: "The cat sat on the", a: "The cat sat on the", b: "" },
  },
  "bert-small": {
    bank: {
      label: "River bank vs. money bank",
      a: "The bank is beside the river.",
      b: "She deposited money at the bank.",
    },
    cat: { label: "The cat sat on the mat", a: "The cat sat on the mat.", b: "" },
  },
}

const MODELS: Record<
  AttentionModelId,
  { label: string; layers: number; defaultLayer: number; tip: string }
> = {
  gpt2: {
    label: "GPT-2 · decoder",
    layers: 12,
    defaultLayer: 5,
    tip: "Select “bank” in both texts and step through the heads: at layer 5, head 6 ties “bank” to “river”. Averaged, most heads pile onto the first token, a known attention sink. The money sentence only links “bank” to “money” late, at layer 11.",
  },
  "bert-small": {
    label: "BERT small · encoder",
    layers: 4,
    defaultLayer: 0,
    tip: "No mask: “bank” can look ahead at “river”. At layer 0, head 4 ties it to “river” in one sentence and to “money” in the other, the same head doing both. Every row sums to 1 over the whole sentence, [CLS] and [SEP] included.",
  },
}
const TOP_K = 5

/** The token worth looking at first: "bank" when the text has one, else the last token. */
function defaultSelected(tokens: string[]) {
  const bank = tokens.findIndex((token) => token.trim().toLowerCase() === "bank")
  return bank >= 0 ? bank : tokens.length - 1
}

type Tab = "theory" | "lab"

export function TransformerArchitectureLesson() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>("theory")
  const tabs: { key: Tab; label: string }[] = [
    { key: "theory", label: t("Theory") },
    { key: "lab", label: t("Lab") },
  ]
  return (
    <ArticleFrame>
      <LessonHero line1={t("Transformers")} line2={t("the architecture")} />
      <LessonLead>
        {t(
          "GPT-2, GPT-3 and ChatGPT are all Transformers. Read what that architecture is in Theory, then watch GPT-2's attention at work in the Lab.",
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
        <TransformerTheory onOpenLab={() => setTab("lab")} />
      </div>
      <div role="tabpanel" hidden={tab !== "lab"} className="flex flex-col gap-[26px]">
        <AttentionLab />
      </div>
    </ArticleFrame>
  )
}

function AttentionLab() {
  const { t } = useTranslation()
  const idA = useId()
  const idB = useId()
  const [model, setModel] = useState<AttentionModelId>("gpt2")
  const [example, setExample] = useState<ExampleId>("bank")
  const [textA, setTextA] = useState(EXAMPLES.gpt2.bank.a)
  const [textB, setTextB] = useState(EXAMPLES.gpt2.bank.b)
  const [layer, setLayer] = useState(MODELS.gpt2.defaultLayer)
  const [head, setHead] = useState(0)
  const [mean, setMean] = useState(false)

  const a = useMutation({ mutationFn: attention })
  const b = useMutation({ mutationFn: attention })
  const pending = a.isPending || b.isPending
  const heads = a.data?.heads ?? 12
  const layers = MODELS[model].layers

  const choose = (id: ExampleId, which: AttentionModelId = model) => {
    setExample(id)
    if (id === "custom") return
    setTextA(EXAMPLES[which][id].a)
    setTextB(EXAMPLES[which][id].b)
  }
  const chooseModel = (id: AttentionModelId) => {
    setModel(id)
    setLayer(MODELS[id].defaultLayer)
    setHead(0)
    a.reset()
    b.reset()
    if (example !== "custom") choose(example, id)
  }
  const edit = (set: (v: string) => void) => (value: string) => {
    set(value)
    setExample("custom")
  }
  const inspect = () => {
    if (!textA.trim()) return
    a.mutate({ text: textA.trim(), layer, top_k: TOP_K, model })
    if (textB.trim()) b.mutate({ text: textB.trim(), layer, top_k: TOP_K, model })
    else b.reset()
  }
  const stale = a.data !== undefined && a.data.layer !== layer

  const rail = (
    <ConfigRail title={t("Configuration")} tip={t(MODELS[model].tip)}>
      <RailSection label={t("Model")}>
        <OptionGrid
          columns={1}
          options={(Object.keys(MODELS) as AttentionModelId[]).map((id) => ({
            value: id,
            label: t(MODELS[id].label),
          }))}
          value={model}
          onChange={chooseModel}
        />
      </RailSection>
      <RailSection label={t("Example")}>
        <OptionGrid
          columns={1}
          options={[
            ...(Object.keys(EXAMPLES[model]) as Exclude<ExampleId, "custom">[]).map((id) => ({
              value: id as ExampleId,
              label: t(EXAMPLES[model][id].label),
            })),
            { value: "custom" as ExampleId, label: t("Custom") },
          ]}
          value={example}
          onChange={choose}
        />
      </RailSection>
      <RailSection label={t("Text A")}>
        <label htmlFor={idA} className="sr-only">
          {t("Text A")}
        </label>
        <textarea
          id={idA}
          value={textA}
          rows={2}
          maxLength={200}
          onChange={(e) => edit(setTextA)(e.target.value)}
          className="resize-y rounded-[2px] border border-line bg-surface px-2.5 py-2 font-display text-[15px] leading-snug text-fg"
        />
      </RailSection>
      <RailSection label={t("Text B (optional)")}>
        <label htmlFor={idB} className="sr-only">
          {t("Text B")}
        </label>
        <textarea
          id={idB}
          value={textB}
          rows={2}
          maxLength={200}
          onChange={(e) => edit(setTextB)(e.target.value)}
          className="resize-y rounded-[2px] border border-line bg-surface px-2.5 py-2 font-display text-[15px] leading-snug text-fg"
        />
      </RailSection>
      <RailSection label={t("Where to look")}>
        <Stepper
          label={t("Layer")}
          value={layer}
          onDecrement={() => setLayer((l) => (l + layers - 1) % layers)}
          onIncrement={() => setLayer((l) => (l + 1) % layers)}
          decrementLabel={t("Previous layer")}
          incrementLabel={t("Next layer")}
        />
        <Stepper
          label={t("Head")}
          value={head}
          onDecrement={() => setHead((h) => (h + heads - 1) % heads)}
          onIncrement={() => setHead((h) => (h + 1) % heads)}
          decrementLabel={t("Previous head")}
          incrementLabel={t("Next head")}
        />
        <Switch label={t("Mean of heads")} checked={mean} onChange={setMean} />
        <button
          type="button"
          onClick={inspect}
          disabled={pending || !textA.trim()}
          className={cn(toolbarButtonClass(true), "justify-center")}
        >
          <PlayIcon className="size-3" aria-hidden />
          {pending ? t("Inspecting…") : t("Inspect")}
        </button>
        {stale && <p className="text-xs text-chart-amber">{t("Layer changed: press Inspect.")}</p>}
      </RailSection>
    </ConfigRail>
  )

  const views = [
    { key: "a", data: a.data, error: a.error, pending: a.isPending },
    ...(textB.trim() || b.data
      ? [{ key: "b", data: b.data, error: b.error, pending: b.isPending }]
      : []),
  ]

  return (
    <>
      <ServerNotice />
      <Workbench rail={rail}>
        <div className={cn("grid items-start gap-5", views.length > 1 && "lg:grid-cols-2")}>
          {views.map((view) => (
            <div key={view.key} className="flex min-w-0 flex-col gap-5">
              {view.data ? (
                <AttentionView
                  key={view.data.tokens.join("|")}
                  data={view.data}
                  head={head % view.data.heads}
                  mean={mean}
                />
              ) : (
                <Panel title={t("Attention")} aside={<ModeBadge mode="real" />}>
                  <p className={cn("text-sm text-fg-muted", view.pending && "animate-pulse")}>
                    {view.pending
                      ? t("Running {0}…", [MODELS[model].label])
                      : t("Press Inspect to run {0} on the text.", [MODELS[model].label])}
                  </p>
                  <RequestError error={view.error} />
                </Panel>
              )}
            </div>
          ))}
        </div>
        <AttentionCalculator />
        <PanelNote>
          {t(
            "Attention weights are one window into the model, not an explanation of its reasoning: a head can put weight on a token for reasons that have nothing to do with meaning, and the feed-forward layers do work the heatmap cannot show.",
          )}
        </PanelNote>
      </Workbench>
    </>
  )
}

/** One text: its heatmap for the chosen head, what the selected token attends to, and the next-token guesses. */
function AttentionView({
  data,
  head,
  mean,
}: {
  data: AttentionResponse
  head: number
  mean: boolean
}) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState(() => defaultSelected(data.tokens))
  const weights = mean ? meanHeads(data.weights) : data.weights[head]
  const token = tokenLabel(data.tokens[selected] ?? "").trim()
  // GPT-2 tokens carry their own spaces; WordPiece tokens do not.
  const text = data.causal ? data.tokens.join("") : data.tokens.join(" ")
  const attended = topAttended(data.tokens, weights[selected] ?? [], TOP_K).filter(
    (x) => x.weight > 0,
  )

  return (
    <>
      <Panel
        title={t("Attention · layer {0} · {1}", [
          data.layer,
          mean ? t("mean of heads") : t("head {0}", [head]),
        ])}
        aside={<ModeBadge mode="real" />}
      >
        <p className="font-display text-[15px] text-fg-secondary">“{text}”</p>
        <AttentionHeatmap
          tokens={data.tokens}
          weights={weights}
          selected={selected}
          onSelect={setSelected}
          masked={data.causal}
          label={`“${text}”`}
        />
        <p className="text-xs text-fg-muted">
          {data.causal
            ? t(
                "Rows are the token looking (query); columns are the tokens looked at (key). Hatched cells are the future, masked out.",
              )
            : t(
                "Rows are the token looking (query); columns are the tokens looked at (key). No mask: an encoder's tokens see the whole sentence, both ways.",
              )}
        </p>
      </Panel>
      <Panel title={t("What “{0}” attends to", [token])}>
        <CompareBars
          rows={attended.map((x, i) => ({
            label: `“${tokenLabel(x.token)}”`,
            count: t("position {0}", [x.index + 1]),
            percent: Math.round(x.weight * 100),
            tone: i === 0 ? "brand" : "muted",
          }))}
        />
      </Panel>
      {data.next_tokens.length > 0 && (
        <Panel title={t("Next token after the last position")} aside={<ModeBadge mode="real" />}>
          <CompareBars
            rows={data.next_tokens.map((c, i) => ({
              label: `“${tokenLabel(c.token)}”`,
              count: "",
              percent: Math.round(c.prob * 100),
              tone: i === 0 ? "brand" : "muted",
            }))}
          />
          <p className="text-xs text-fg-muted">
            {t(
              "The last block's output for the final token, turned into probabilities. Generate from them in",
            )}{" "}
            <Link
              to="/learn/$chapter/$lesson"
              params={{ chapter: "generative-ai", lesson: "next-token-lab" }}
              className="text-brand underline-offset-4 hover:underline"
            >
              {t("Next Token")}
            </Link>
            .
          </p>
        </Panel>
      )}
    </>
  )
}

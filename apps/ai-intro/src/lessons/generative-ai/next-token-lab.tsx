import { useMutation } from "@tanstack/react-query"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DicesIcon,
  PauseIcon,
  PlayIcon,
  SkipForwardIcon,
  SparklesIcon,
} from "lucide-react"
import { useEffect, useId, useState } from "react"
import { ArticleFrame, LessonHero, LessonLead } from "@/components/course/lesson-layout"
import {
  ConfigRail,
  OptionGrid,
  Panel,
  PanelNote,
  RailSection,
  RunToolbar,
  Stepper,
  toolbarButtonClass,
  Workbench,
} from "@/components/workbench"
import { useTranslation } from "@/i18n/use-translation"
import { cn } from "@/lib/utils"
import { type Candidate, complete, type Step } from "./api"
import { RequestError, ServerNotice, tokenLabel } from "./stages"

type PresetId = "story" | "fact" | "question" | "instruction"

export const PROMPT_PRESETS: Record<PresetId, { label: string; prompt: string }> = {
  story: { label: "Story", prompt: "Once upon a time, in a small village," },
  fact: { label: "Fact", prompt: "The capital of France is" },
  question: { label: "Question", prompt: "What is the capital of France?" },
  instruction: {
    label: "Instruction",
    prompt:
      "Summarize in one sentence: The meeting covered budget cuts, a hiring freeze and the new office in Lisbon.\n",
  },
}

/** A generated token; `forced` when the student picked it instead of the model. */
type GenStep = Step & { forced?: boolean }

const TICK_MS = 280
const MAX_TOKENS = { min: 10, max: 60, step: 10 }

const stepButtonClass =
  "flex size-6 items-center justify-center rounded-[2px] border border-line text-fg-secondary transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-40"

const percent = (p: number) => `${(p * 100).toFixed(p < 0.1 ? 1 : 0)}%`

export function NextTokenLabLesson() {
  const { t } = useTranslation()
  const promptId = useId()
  const [preset, setPreset] = useState<PresetId>("story")
  const [prompt, setPrompt] = useState(PROMPT_PRESETS.story.prompt)
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(30)
  const [seed, setSeed] = useState(0)

  /** The prompt the current steps continue (the textarea may have been edited since). */
  const [runPrompt, setRunPrompt] = useState<string | null>(null)
  const [steps, setSteps] = useState<GenStep[]>([])
  const [cursor, setCursor] = useState(0)
  const [playing, setPlaying] = useState(false)

  const generate = useMutation({ mutationFn: complete })
  const pending = generate.isPending

  const run = (nextSeed = seed) => {
    setPlaying(false)
    generate.mutate(
      { prompt, max_tokens: maxTokens, temperature, top_k: 5, seed: nextSeed },
      {
        onSuccess: (res) => {
          setRunPrompt(prompt)
          setSteps(res.steps)
          setCursor(0)
          setPlaying(true)
        },
      },
    )
  }

  const done = steps.length > 0 && cursor >= steps.length
  /** The decision on screen: the next token to reveal, or the last one once all are shown. */
  const view = steps.length === 0 ? -1 : Math.min(cursor, steps.length - 1)

  /** Keep the tokens before `view`, put `candidate` there, and let the model continue from it. */
  const force = (candidate: Candidate) => {
    if (runPrompt === null || view < 0) return
    const kept = steps.slice(0, view)
    const chosen: GenStep = {
      token: candidate.token,
      prob: candidate.prob,
      top_k: steps[view].top_k,
      forced: true,
    }
    const prefix = runPrompt + [...kept, chosen].map((s) => s.token).join("")
    const remaining = maxTokens - kept.length - 1
    setPlaying(false)
    if (remaining <= 0) {
      setSteps([...kept, chosen])
      setCursor(kept.length + 1)
      return
    }
    generate.mutate(
      { prompt: prefix, max_tokens: remaining, temperature, top_k: 5, seed },
      {
        onSuccess: (res) => {
          setSteps([...kept, chosen, ...res.steps])
          setCursor(kept.length + 1)
          setPlaying(true)
        },
      },
    )
  }

  useEffect(() => {
    if (!playing) return
    if (cursor >= steps.length) {
      setPlaying(false)
      return
    }
    const id = setTimeout(() => setCursor((c) => c + 1), TICK_MS)
    return () => clearTimeout(id)
  }, [playing, cursor, steps.length])

  /** Put prediction `i` on screen; the last one shows the finished text. */
  const showToken = (i: number) => {
    setPlaying(false)
    setCursor(i >= steps.length - 1 ? steps.length : Math.max(0, i))
  }

  const choosePreset = (id: PresetId) => {
    setPreset(id)
    setPrompt(PROMPT_PRESETS[id].prompt)
  }

  const current = view >= 0 ? steps[view] : undefined
  const pickInTop = current?.top_k.some((c) => c.token === current.token)
  const candidates = current
    ? pickInTop
      ? current.top_k
      : [...current.top_k, { token: current.token, prob: current.prob }]
    : []
  const shown = steps.slice(0, cursor)
  const meanProb = shown.length ? shown.reduce((sum, s) => sum + s.prob, 0) / shown.length : 0

  const rail = (
    <ConfigRail
      title={t("Configuration")}
      tip={t(
        "Try the Instruction preset: a foundation model does not follow the request, it continues the document.",
      )}
    >
      <RailSection label={t("Prompt")}>
        <OptionGrid
          options={(Object.keys(PROMPT_PRESETS) as PresetId[]).map((id) => ({
            value: id,
            label: t(PROMPT_PRESETS[id].label),
          }))}
          value={preset}
          onChange={choosePreset}
        />
        <label htmlFor={promptId} className="sr-only">
          {t("Prompt text")}
        </label>
        <textarea
          id={promptId}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          maxLength={600}
          className="resize-y rounded-[2px] border border-line bg-surface px-2.5 py-2 font-display text-[15px] leading-snug text-fg"
        />
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={cn(toolbarButtonClass(true), "justify-center")}
            onClick={() => run()}
            disabled={pending || !prompt.trim()}
          >
            <SparklesIcon className="size-3" aria-hidden />
            {pending ? t("Generating…") : t("Generate")}
          </button>
          <button
            type="button"
            className={cn(toolbarButtonClass(), "justify-center")}
            onClick={() => {
              const next = seed + 1
              setSeed(next)
              run(next)
            }}
            disabled={pending || !prompt.trim() || temperature === 0}
            title={t("Sample again with a new random seed")}
          >
            <DicesIcon className="size-3" aria-hidden />
            {t("Resample")}
          </button>
        </div>
      </RailSection>
      <RailSection label={t("Temperature")}>
        <div className="flex items-center gap-3">
          <input
            type="range"
            aria-label={t("Temperature")}
            min={0}
            max={1.5}
            step={0.1}
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="w-full accent-brand"
          />
          <span className="w-8 text-right font-display text-[17px] text-brand">
            {temperature.toFixed(1)}
          </span>
        </div>
        <p className="text-xs text-fg-muted">
          {temperature === 0
            ? t("0 always picks the most likely token: the same text every time.")
            : t(
                "Higher values flatten the probabilities, so less likely tokens get picked more often.",
              )}
        </p>
      </RailSection>
      <RailSection label={t("Length")}>
        <Stepper
          label={t("Max tokens")}
          value={maxTokens}
          onDecrement={() => setMaxTokens((n) => Math.max(MAX_TOKENS.min, n - MAX_TOKENS.step))}
          onIncrement={() => setMaxTokens((n) => Math.min(MAX_TOKENS.max, n + MAX_TOKENS.step))}
          decrementLabel={t("Fewer tokens")}
          incrementLabel={t("More tokens")}
        />
      </RailSection>
    </ConfigRail>
  )

  const toolbar = (
    <RunToolbar
      controls={
        <>
          <button
            type="button"
            className={toolbarButtonClass()}
            onClick={() => {
              setPlaying(false)
              setCursor((c) => Math.max(0, c - 1))
            }}
            disabled={cursor === 0}
            aria-label={t("Previous token")}
          >
            <ChevronLeftIcon className="size-3" aria-hidden />
          </button>
          <button
            type="button"
            className={toolbarButtonClass()}
            onClick={() => setPlaying((p) => !p)}
            disabled={steps.length === 0 || done}
          >
            {playing ? (
              <PauseIcon className="size-3" aria-hidden />
            ) : (
              <PlayIcon className="size-3" aria-hidden />
            )}
            {playing ? t("Pause") : t("Play")}
          </button>
          <button
            type="button"
            className={toolbarButtonClass()}
            onClick={() => {
              setPlaying(false)
              setCursor((c) => Math.min(steps.length, c + 1))
            }}
            disabled={steps.length === 0 || done}
          >
            {t("Next token")}
            <ChevronRightIcon className="size-3" aria-hidden />
          </button>
          <button
            type="button"
            className={toolbarButtonClass()}
            onClick={() => {
              setPlaying(false)
              setCursor(steps.length)
            }}
            disabled={steps.length === 0 || done}
            aria-label={t("Show all tokens")}
          >
            <SkipForwardIcon className="size-3" aria-hidden />
          </button>
        </>
      }
      architecture="GPT-2 · 124M"
      metricsLabel={t("Generation metrics")}
      metrics={[
        { label: t("Tokens"), value: `${cursor}/${steps.length}` },
        { label: t("Avg. probability"), value: shown.length ? percent(meanProb) : "—" },
        { label: t("Temperature"), value: temperature.toFixed(1), highlight: true },
      ]}
    />
  )

  return (
    <ArticleFrame>
      <LessonHero line1={t("Next")} line2={t("token")} />
      <LessonLead>
        {t(
          "A foundation model does one thing: given some text, it scores every possible next token. Generate a continuation, then step through it one token at a time.",
        )}
      </LessonLead>
      <ServerNotice />

      <Workbench rail={rail}>
        <Panel title={t("Generation")} aside={t("prompt + generated tokens")} footer={toolbar}>
          {runPrompt === null ? (
            <p className="font-display text-[17px] text-fg-muted">
              {t("Press Generate to let GPT-2 continue the prompt.")}
            </p>
          ) : (
            <p
              data-testid="generated-text"
              className="whitespace-pre-wrap break-words font-display text-[21px] leading-[1.7]"
            >
              <span className="text-fg-muted">{runPrompt}</span>
              {shown.map((s, i) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: tokens are an ordered sequence
                  key={i}
                  title={`${percent(s.prob)}${s.forced ? ` · ${t("your pick")}` : ""}`}
                  className={cn(
                    "border-b-2 transition-colors",
                    s.forced
                      ? "border-brand text-brand"
                      : i % 2
                        ? "border-fg-muted/70 text-fg"
                        : "border-line text-fg",
                    i === cursor - 1 && "bg-elevated",
                  )}
                >
                  {tokenLabel(s.token)}
                </span>
              ))}
              {!done && steps.length > 0 && (
                <span
                  aria-hidden
                  className="ml-0.5 inline-block h-5 w-2 animate-pulse bg-brand align-middle"
                />
              )}
            </p>
          )}
          <RequestError error={generate.error} />
        </Panel>

        <Panel
          title={t("Next-token probabilities")}
          aside={
            current ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={stepButtonClass}
                  onClick={() => showToken(view - 1)}
                  disabled={view <= 0}
                  aria-label={t("Previous prediction")}
                >
                  <ChevronLeftIcon className="size-3.5" aria-hidden />
                </button>
                <span className="tabular-nums">
                  {t("token {0} of {1}", [view + 1, steps.length])}
                </span>
                <button
                  type="button"
                  className={stepButtonClass}
                  onClick={() => showToken(view + 1)}
                  disabled={view >= steps.length - 1}
                  aria-label={t("Next prediction")}
                >
                  <ChevronRightIcon className="size-3.5" aria-hidden />
                </button>
              </div>
            ) : undefined
          }
        >
          {current ? (
            <>
              <p className="text-sm text-fg-secondary">
                {done
                  ? t(
                      "The last choice the model made. Click another candidate to rewrite the ending.",
                    )
                  : t(
                      "The model's top candidates for the next token. Click one to choose it yourself.",
                    )}
              </p>
              <ul className="flex flex-col gap-2" aria-label={t("Candidates")}>
                {candidates.map((c) => {
                  const pick = c.token === current.token
                  return (
                    <li key={c.token}>
                      <button
                        type="button"
                        onClick={() => !pick && force(c)}
                        disabled={pending}
                        aria-label={t("Choose {0}", [JSON.stringify(c.token)])}
                        className={cn(
                          "grid w-full grid-cols-[minmax(0,9rem)_1fr_3.5rem] items-center gap-3 rounded-[2px] px-1.5 py-1 text-left transition-colors hover:bg-elevated disabled:opacity-60",
                          pick && "cursor-default hover:bg-transparent",
                        )}
                      >
                        <span
                          className={cn(
                            "truncate whitespace-pre font-display text-[17px]",
                            pick ? "text-brand" : "text-fg-secondary",
                          )}
                        >
                          “{tokenLabel(c.token)}”
                        </span>
                        <span aria-hidden className="h-1.5 rounded-[3px] bg-elevated">
                          <span
                            className={cn(
                              "block h-full rounded-[3px]",
                              pick ? "bg-brand" : "bg-fg-muted/50",
                            )}
                            style={{ width: `${Math.max(1, c.prob * 100)}%` }}
                          />
                        </span>
                        <span className="text-right font-ui text-xs text-fg-muted">
                          {percent(c.prob)}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              <p className="label-ui text-fg-muted">
                <span className="text-brand">■</span>{" "}
                {t(current.forced ? "your pick" : "model's pick")}
                {!pickInTop && ` · ${t("sampled from outside the top 5")}`}
              </p>
            </>
          ) : (
            <p className="text-sm text-fg-muted">
              {t("Candidates appear here once text is generated.")}
            </p>
          )}
          <PanelNote>
            {t(
              "GPT-2 was only trained to continue text. It is not trying to help you; it picks tokens that usually come next.",
            )}
          </PanelNote>
        </Panel>
      </Workbench>
    </ArticleFrame>
  )
}

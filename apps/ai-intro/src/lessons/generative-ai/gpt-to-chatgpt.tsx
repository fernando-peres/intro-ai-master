import { useMutation } from "@tanstack/react-query"
import { PlayIcon } from "lucide-react"
import { type ReactNode, useId, useState } from "react"
import { ArticleFrame, LessonHero, LessonLead } from "@/components/course/lesson-layout"
import {
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
import { chat, complete, type Example, fewShot, fewShotPrompt } from "./api"
import { RequestError, ServerNotice, type StageId, stage } from "./stages"
import { ToyLineage } from "./toy-lineage"

type TaskId = "continuation" | "question" | "sentiment"

type Task = {
  label: string
  input: string
  /** Put before the input for the base model and the assistant; the adapted model gets examples. */
  ask: string
  /** The adapted output finishes the input, so it is shown after it. */
  continues?: boolean
  adapt: {
    instruction: string
    examples: Example[]
    inputName: string
    outputName: string
    labels?: string[]
  }
}

export const TASKS: Record<TaskId, Task> = {
  continuation: {
    label: "Text continuation",
    input: "Once upon a time, in a small village,",
    ask: "",
    continues: true,
    adapt: {
      instruction: "Finish each story opening with one short sentence for children.",
      examples: [
        {
          input: "The old lighthouse keeper climbed the stairs",
          output: "and lit the lamp so the fishing boats could find their way home.",
        },
        {
          input: "Deep in the forest, a small fox",
          output: "found a lost kitten and walked it home.",
        },
      ],
      inputName: "Opening",
      outputName: "Ending",
    },
  },
  question: {
    label: "Question answering",
    input: "What is the capital of France?",
    ask: "",
    adapt: {
      instruction: "Answer each question in a few words.",
      examples: [
        { input: "What is the capital of Spain?", output: "Madrid" },
        { input: "What is the capital of Japan?", output: "Tokyo" },
      ],
      inputName: "Q",
      outputName: "A",
    },
  },
  sentiment: {
    label: "Sentiment classification",
    input: "The product is excellent, but shipping was slow.",
    ask: "Classify the sentiment of this review as Positive, Negative or Mixed:\n",
    adapt: {
      instruction: "Classify the sentiment of each customer review as Positive, Negative or Mixed.",
      examples: [
        { input: "I love this product!", output: "Positive" },
        { input: "The delivery was terrible.", output: "Negative" },
        { input: "Great price, but it broke after a week.", output: "Mixed" },
      ],
      inputName: "Review",
      outputName: "Sentiment",
      labels: ["Positive", "Negative", "Mixed"],
    },
  },
}

const ASSISTANT_SYSTEM = "You are a helpful assistant. Keep every reply under 60 words."

export function GptToChatGptLesson() {
  const { t } = useTranslation()
  const inputId = useId()
  const [taskId, setTaskId] = useState<TaskId>("question")
  const [input, setInput] = useState(TASKS.question.input)
  /** The inputs the shown answers belong to, so editing the box doesn't mislabel them. */
  const [ran, setRan] = useState<{ task: Task; input: string } | null>(null)

  const base = useMutation({ mutationFn: complete })
  const adapted = useMutation({ mutationFn: fewShot })
  const assistant = useMutation({ mutationFn: chat })
  const pending = base.isPending || adapted.isPending || assistant.isPending

  const task = TASKS[taskId]
  const choose = (id: TaskId) => {
    setTaskId(id)
    setInput(TASKS[id].input)
  }

  const runAll = () => {
    const text = input.trim()
    if (!text) return
    setRan({ task, input: text })
    const asked = task.ask + text
    base.mutate({ prompt: asked, max_tokens: 30, temperature: 0, top_k: 1 })
    adapted.mutate({
      instruction: task.adapt.instruction,
      examples: task.adapt.examples,
      query: text,
      input_name: task.adapt.inputName,
      output_name: task.adapt.outputName,
      model: "base",
      labels: task.adapt.labels,
    })
    assistant.mutate([
      { role: "system", content: ASSISTANT_SYSTEM },
      { role: "user", content: asked },
    ])
  }

  const rail = (
    <ConfigRail
      title={t("Configuration")}
      tip={t("Same input, three stages. Edit the input and run again to test your own ideas.")}
    >
      <RailSection label={t("Example")}>
        <OptionGrid
          columns={1}
          options={(Object.keys(TASKS) as TaskId[]).map((id) => ({
            value: id,
            label: t(TASKS[id].label),
          }))}
          value={taskId}
          onChange={choose}
        />
      </RailSection>
      <RailSection label={t("Input")}>
        <label htmlFor={inputId} className="sr-only">
          {t("Input text")}
        </label>
        <textarea
          id={inputId}
          value={input}
          rows={4}
          maxLength={400}
          onChange={(e) => setInput(e.target.value)}
          className="resize-y rounded-[2px] border border-line bg-surface px-2.5 py-2 font-display text-[15px] leading-snug text-fg"
        />
        <button
          type="button"
          onClick={runAll}
          disabled={pending || !input.trim()}
          className={cn(toolbarButtonClass(true), "justify-center")}
        >
          <PlayIcon className="size-3" aria-hidden />
          {pending ? t("Running…") : t("Run all three")}
        </button>
      </RailSection>
    </ConfigRail>
  )

  const askedPrompt = ran ? ran.task.ask + ran.input : ""
  const adaptedPrompt = ran
    ? fewShotPrompt(
        ran.task.adapt.instruction,
        ran.task.adapt.examples,
        ran.input,
        ran.task.adapt.inputName,
        ran.task.adapt.outputName,
      )
    : ""

  return (
    <ArticleFrame>
      <LessonHero line1={t("From GPT")} line2={t("to ChatGPT")} />
      <LessonLead>
        {t(
          "One input, three versions of the same technology: a raw foundation model, the same model adapted with examples, and a post-trained assistant.",
        )}
      </LessonLead>
      <ServerNotice needsAssistant />

      <Workbench rail={rail}>
        <div className="grid items-stretch gap-5 lg:grid-cols-3">
          <StagePanel
            id="foundation"
            method={t("GPT-2, raw text continuation")}
            received={askedPrompt}
            error={base.error}
            pending={base.isPending}
          >
            {base.data && ran && (
              <p className="whitespace-pre-wrap break-words font-display text-[19px] leading-snug">
                <span className="text-fg-muted">{askedPrompt}</span>
                <span className="text-fg">{base.data.steps.map((s) => s.token).join("")}</span>
              </p>
            )}
          </StagePanel>
          <StagePanel
            id="adaptation"
            method={t("GPT-2 + few-shot prompt")}
            received={adaptedPrompt}
            error={adapted.error}
            pending={adapted.isPending}
          >
            {adapted.data && (
              <div className="flex flex-col gap-1.5">
                <p className="font-display text-[19px] leading-snug text-fg">
                  {ran?.task.continues && <span className="text-fg-muted">{ran.input} </span>}
                  {adapted.data.output || "—"}
                </p>
                {adapted.data.label && adapted.data.scores && (
                  <p className="label-ui text-fg-muted">
                    {t("probability")} {Math.round(adapted.data.scores[adapted.data.label] * 100)}%
                  </p>
                )}
              </div>
            )}
          </StagePanel>
          <StagePanel
            id="assistant"
            method={
              assistant.data
                ? t("{0}, chat model", [assistant.data.model])
                : t("Instruction-tuned chat model")
            }
            received={ran ? `system: ${ASSISTANT_SYSTEM}\nuser: ${askedPrompt}` : ""}
            error={assistant.error}
            pending={assistant.isPending}
          >
            {assistant.data && (
              <p className="whitespace-pre-wrap font-display text-[19px] leading-snug text-fg">
                {assistant.data.reply}
              </p>
            )}
          </StagePanel>
        </div>
        <ToyLineage />
        <Panel title={t("What to notice")}>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-fg-secondary marker:text-brand">
            <li>
              {t("The foundation model continues the text. A question may get more questions.")}
            </li>
            <li>
              {t(
                "A few examples in the prompt are enough to make the same GPT-2 answer in the right format.",
              )}
            </li>
            <li>
              {t("The assistant needs no examples: post-training taught it to follow requests.")}
            </li>
          </ul>
          <PanelNote>
            {t(
              "These are live outputs. Real models vary, and a foundation model sometimes answers correctly by chance: a continuation that happens to be an answer.",
            )}
          </PanelNote>
        </Panel>
      </Workbench>
    </ArticleFrame>
  )
}

function StagePanel({
  id,
  method,
  received,
  error,
  pending,
  children,
}: {
  id: StageId
  method: string
  received: string
  error: Error | null
  pending: boolean
  children: ReactNode
}) {
  const { t } = useTranslation()
  const s = stage(id)
  return (
    <Panel title={`${s.number} ${t(s.title)}`} className={cn("border-t-2", s.top)}>
      <span className="label-ui text-fg-muted">{method}</span>
      <div aria-live="polite" className="max-h-80 min-h-24 overflow-y-auto">
        {pending ? (
          <p className="label-ui animate-pulse text-fg-muted">{t("Thinking…")}</p>
        ) : (
          (children ?? <p className="text-sm text-fg-muted">{t("Press Run all three.")}</p>)
        )}
        <RequestError error={error} />
      </div>
      {received && (
        <details className="mt-auto border-t border-divider pt-3">
          <summary className="label-ui cursor-pointer text-fg-muted hover:text-fg">
            {t("What the model received")}
          </summary>
          <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-[2px] bg-canvas p-2.5 font-ui text-[11.5px] leading-relaxed text-fg-secondary">
            {received}
          </pre>
        </details>
      )}
    </Panel>
  )
}

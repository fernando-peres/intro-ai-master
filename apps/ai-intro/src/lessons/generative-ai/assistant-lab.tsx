import { useMutation } from "@tanstack/react-query"
import { RotateCcwIcon, SendIcon } from "lucide-react"
import { useEffect, useId, useRef, useState } from "react"
import { ArticleFrame, LessonHero, LessonLead } from "@/components/course/lesson-layout"
import {
  ConfigRail,
  Panel,
  PanelNote,
  RailSection,
  railButtonClass,
  Switch,
  toolbarButtonClass,
  Workbench,
} from "@/components/workbench"
import { useTranslation } from "@/i18n/use-translation"
import { cn } from "@/lib/utils"
import { type ChatMessage, chat } from "./api"
import { RequestError, ServerNotice } from "./stages"

export const DEFAULT_SYSTEM =
  "You are a helpful tutor for students. Answer in at most three sentences."

/** Tasks to try in order; the follow-up only works while the history is sent. */
const TASKS = [
  { label: "Ask", text: "What is the capital of France?" },
  { label: "Follow up", text: "And what is its population?" },
  {
    label: "Summarize",
    text: "Summarize in one sentence: The meeting covered budget cuts, a hiring freeze and the new office in Lisbon.",
  },
  { label: "Translate", text: "Translate your last answer into Portuguese." },
]

/** What the request carried, so the context panel can show it next to the conversation. */
type Turn = { message: ChatMessage; sent?: ChatMessage[]; dropped?: boolean }

/** Builds the request: instruction, then the earlier turns only when history is on, then the new message. */
export function contextFor(
  system: string,
  history: ChatMessage[],
  text: string,
  withHistory: boolean,
) {
  const messages: ChatMessage[] = system.trim() ? [{ role: "system", content: system.trim() }] : []
  return [
    ...messages,
    ...(withHistory ? history : []),
    { role: "user", content: text } as ChatMessage,
  ]
}

export function AssistantLabLesson() {
  const { t } = useTranslation()
  const systemId = useId()
  const inputId = useId()
  const [system, setSystem] = useState(DEFAULT_SYSTEM)
  const [withHistory, setWithHistory] = useState(true)
  const [turns, setTurns] = useState<Turn[]>([])
  const [text, setText] = useState(TASKS[0].text)
  const endRef = useRef<HTMLLIElement>(null)

  const send = useMutation({ mutationFn: chat })
  const lastSent = [...turns].reverse().find((turn) => turn.sent)?.sent

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll whenever a turn is added
  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: "nearest" })
  }, [turns.length])

  const submit = () => {
    const content = text.trim()
    if (!content || send.isPending) return
    const history = turns.map((turn) => turn.message)
    const messages = contextFor(system, history, content, withHistory)
    setTurns((prev) => [
      ...prev,
      {
        message: { role: "user", content },
        sent: messages,
        dropped: !withHistory && history.length > 0,
      },
    ])
    setText("")
    send.mutate(messages, {
      onSuccess: (res) =>
        setTurns((prev) => [...prev, { message: { role: "assistant", content: res.reply } }]),
    })
  }

  const rail = (
    <ConfigRail
      title={t("Configuration")}
      tip={t("Ask a question, then the follow-up. Turn history off and ask the follow-up again.")}
    >
      <RailSection label={t("System instruction")}>
        <label htmlFor={systemId} className="sr-only">
          {t("System instruction")}
        </label>
        <textarea
          id={systemId}
          value={system}
          rows={4}
          maxLength={600}
          onChange={(e) => setSystem(e.target.value)}
          className="resize-y rounded-[2px] border border-line bg-surface px-2.5 py-2 font-display text-[15px] leading-snug text-fg"
        />
      </RailSection>
      <RailSection label={t("Context")}>
        <Switch label={t("Send history")} checked={withHistory} onChange={setWithHistory} />
      </RailSection>
      <RailSection label={t("Try a task")}>
        <div className="grid grid-cols-2 gap-2">
          {TASKS.map((task) => (
            <button
              key={task.label}
              type="button"
              className={railButtonClass(text === task.text)}
              onClick={() => setText(task.text)}
            >
              {t(task.label)}
            </button>
          ))}
        </div>
      </RailSection>
    </ConfigRail>
  )

  return (
    <ArticleFrame>
      <LessonHero line1={t("Assistant")} line2={t("lab")} />
      <LessonLead>
        {t(
          "A post-trained model follows instructions, remembers the conversation and switches between tasks. The memory is not inside the model: the whole conversation is sent again with every message.",
        )}
      </LessonLead>
      <ServerNotice needsAssistant />

      <Workbench rail={rail}>
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Panel
            title={t("Conversation")}
            aside={
              <button
                type="button"
                onClick={() => {
                  setTurns([])
                  send.reset()
                }}
                disabled={turns.length === 0}
                className="flex items-center gap-1.5 transition-colors hover:text-brand disabled:opacity-50"
              >
                <RotateCcwIcon className="size-3" aria-hidden />
                {t("New chat")}
              </button>
            }
          >
            <ul aria-label={t("Messages")} className="flex min-h-64 flex-col gap-3">
              {turns.length === 0 && (
                <li className="text-sm text-fg-muted">
                  {t("Pick a task on the left, or type your own message.")}
                </li>
              )}
              {turns.map((turn, i) => (
                <li
                  // biome-ignore lint/suspicious/noArrayIndexKey: the conversation only grows
                  key={i}
                  className={cn(
                    "flex max-w-[85%] flex-col gap-1",
                    turn.message.role === "user" ? "self-end items-end" : "self-start",
                  )}
                >
                  <span className="label-ui text-fg-muted">
                    {turn.message.role === "user" ? t("You") : t("Assistant")}
                    {turn.dropped && (
                      <span className="ml-2 text-error">{t("sent without history")}</span>
                    )}
                  </span>
                  <p
                    className={cn(
                      "whitespace-pre-wrap rounded-[3px] border px-3 py-2 font-display text-[17px] leading-snug",
                      turn.message.role === "user"
                        ? "border-line bg-elevated text-fg"
                        : "border-divider bg-canvas text-fg-secondary",
                    )}
                  >
                    {turn.message.content}
                  </p>
                </li>
              ))}
              {send.isPending && (
                <li className="label-ui self-start text-fg-muted" aria-live="polite">
                  {t("Assistant is typing…")}
                </li>
              )}
              <li ref={endRef} aria-hidden />
            </ul>
            <RequestError error={send.error} />
            <form
              className="flex items-end gap-2 border-t border-divider pt-3"
              onSubmit={(e) => {
                e.preventDefault()
                submit()
              }}
            >
              <label htmlFor={inputId} className="sr-only">
                {t("Message")}
              </label>
              <textarea
                id={inputId}
                value={text}
                rows={2}
                maxLength={2000}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    submit()
                  }
                }}
                placeholder={t("Type a message")}
                className="min-w-0 flex-1 resize-y rounded-[2px] border border-line bg-canvas px-3 py-2 font-display text-[17px] text-fg"
              />
              <button
                type="submit"
                className={toolbarButtonClass(true)}
                disabled={send.isPending || !text.trim()}
              >
                <SendIcon className="size-3" aria-hidden />
                {t("Send")}
              </button>
            </form>
          </Panel>

          <Panel
            title={t("Context sent")}
            aside={lastSent ? t("{0} messages", [lastSent.length]) : undefined}
          >
            {lastSent ? (
              <ol className="flex flex-col gap-2">
                {lastSent.map((m, i) => (
                  <li
                    // biome-ignore lint/suspicious/noArrayIndexKey: a fixed, ordered request
                    key={i}
                    className="rounded-[2px] border border-divider bg-canvas px-3 py-2"
                  >
                    <span
                      className={cn(
                        "label-ui",
                        m.role === "system"
                          ? "text-chart-amber"
                          : m.role === "user"
                            ? "text-brand"
                            : "text-fg-muted",
                      )}
                    >
                      {m.role}
                    </span>
                    <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-sm text-fg-secondary">
                      {m.content}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-fg-muted">
                {t("Every request you send is shown here, message by message.")}
              </p>
            )}
            <PanelNote>
              {withHistory
                ? t(
                    "History is on: earlier turns travel with each request, so follow-ups make sense.",
                  )
                : t("History is off: the model only sees the instruction and your newest message.")}
            </PanelNote>
          </Panel>
        </div>
      </Workbench>
    </ArticleFrame>
  )
}

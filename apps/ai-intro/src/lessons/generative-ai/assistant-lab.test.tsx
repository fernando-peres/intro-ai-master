import { cleanup, fireEvent, screen } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import type { ChatMessage } from "./api"
import { AssistantLabLesson, contextFor, DEFAULT_SYSTEM } from "./assistant-lab"
import { fakeServer, HEALTH, renderLesson } from "./test-utils"

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const history: ChatMessage[] = [
  { role: "user", content: "Capital of France?" },
  { role: "assistant", content: "Paris." },
]

test("context is the instruction, the history when enabled, then the new message", () => {
  expect(contextFor("Be brief.", history, "Its population?", true)).toEqual([
    { role: "system", content: "Be brief." },
    ...history,
    { role: "user", content: "Its population?" },
  ])
  expect(contextFor("  ", history, "Its population?", false)).toEqual([
    { role: "user", content: "Its population?" },
  ])
})

test("a follow-up carries the history until history is switched off", async () => {
  const replies = [
    "The capital of France is Paris.",
    "About 2.1 million.",
    "Which place do you mean?",
  ]
  const server = fakeServer({
    "/health": () => HEALTH,
    "/genai/chat": () => ({ model: "gpt-test", reply: replies.shift() }),
  })
  await renderLesson(AssistantLabLesson)
  const send = () => fireEvent.click(screen.getByRole("button", { name: "Send" }))

  fireEvent.click(screen.getByRole("button", { name: "Ask" }))
  send()
  await screen.findByText("The capital of France is Paris.")
  fireEvent.click(screen.getByRole("button", { name: "Follow up" }))
  send()
  await screen.findByText("About 2.1 million.")
  fireEvent.click(screen.getByRole("switch", { name: "Send history" }))
  fireEvent.click(screen.getByRole("button", { name: "Follow up" }))
  send()
  await screen.findByText("Which place do you mean?")

  const sent = server.posts("/genai/chat") as { messages: ChatMessage[] }[]
  expect(sent.map((s) => s.messages.length)).toEqual([2, 4, 2])
  expect(sent[1].messages[0]).toEqual({ role: "system", content: DEFAULT_SYSTEM })
  expect(sent[2].messages.map((m) => m.role)).toEqual(["system", "user"])
  expect(screen.getByText("sent without history")).toBeTruthy()
  expect(screen.getByText("2 messages")).toBeTruthy()
})

test("a missing API key is explained in the conversation", async () => {
  fakeServer({
    "/health": () => ({ ...HEALTH, assistant_model: null }),
    "/genai/chat": () =>
      new Response(JSON.stringify({ detail: "OPENAI_API_KEY is not set in the repo-root .env" }), {
        status: 503,
      }),
  })
  await renderLesson(AssistantLabLesson)
  expect(await screen.findByText("unavailable: set OPENAI_API_KEY in .env")).toBeTruthy()
  fireEvent.click(screen.getByRole("button", { name: "Send" }))
  expect((await screen.findByRole("alert")).textContent).toContain("OPENAI_API_KEY")
})

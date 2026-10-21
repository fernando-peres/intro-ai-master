import { afterEach, expect, test, vi } from "vitest"
import { chat, fewShotPrompt, OFFLINE } from "./api"

afterEach(() => vi.unstubAllGlobals())

// Same expectations as packages/genai/tests/test_prompts.py: the preview must match the server.
test("zero-shot is the instruction then the open query", () => {
  expect(fewShotPrompt("Classify the review.", [], "Great!", "Review", "Sentiment")).toBe(
    "Classify the review.\n\nReview: Great!\nSentiment:",
  )
})

test("few-shot puts the examples between the instruction and the query", () => {
  const examples = [
    { input: "I love it", output: "Positive" },
    { input: "Awful", output: "Negative" },
  ]
  expect(fewShotPrompt("Classify.", examples, "Meh", "Review", "Sentiment")).toBe(
    "Classify.\n\n" +
      "Review: I love it\nSentiment: Positive\n\n" +
      "Review: Awful\nSentiment: Negative\n\n" +
      "Review: Meh\nSentiment:",
  )
})

test("a blank instruction is left out", () => {
  expect(fewShotPrompt("  ", [], "Paris?", "Q", "A")).toBe("Q: Paris?\nA:")
})

test("an unreachable server reads as offline", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")))
  await expect(chat([{ role: "user", content: "Hi" }])).rejects.toThrow(OFFLINE)
})

test("Vite's proxy error page (no JSON) reads as offline", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("proxy error", { status: 500 })))
  await expect(chat([{ role: "user", content: "Hi" }])).rejects.toThrow(OFFLINE)
})

test("the server's own error detail is passed on", async () => {
  const body = JSON.stringify({ detail: "OPENAI_API_KEY is not set in the repo-root .env" })
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status: 503 })))
  await expect(chat([{ role: "user", content: "Hi" }])).rejects.toThrow("OPENAI_API_KEY")
})

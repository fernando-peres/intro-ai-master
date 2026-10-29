import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { GptToChatGptLesson } from "./gpt-to-chatgpt"
import { fakeServer, HEALTH, renderLesson } from "./test-utils"

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function server() {
  return fakeServer({
    "/health": () => HEALTH,
    "/genai/complete": () => ({
      model: "gpt2",
      steps: [" I", " ordered", " it."].map((token) => ({ token, prob: 0.5, top_k: [] })),
    }),
    "/genai/few-shot": () => ({
      model: "gpt2",
      prompt: "",
      output: "Mixed",
      label: "Mixed",
      scores: { Positive: 0.3, Negative: 0.11, Mixed: 0.59 },
    }),
    "/genai/chat": () => ({ model: "gpt-test", reply: "Mixed: great product, slow shipping." }),
  })
}

const panel = (name: string) => within(screen.getByRole("region", { name }))

test("one run sends the same input to all three stages", async () => {
  const fake = server()
  await renderLesson(GptToChatGptLesson)
  fireEvent.click(screen.getByRole("button", { name: "Sentiment classification" }))
  fireEvent.click(screen.getByRole("button", { name: "Run all three" }))

  expect(
    await panel("03 Assistant").findByText("Mixed: great product, slow shipping."),
  ).toBeTruthy()
  expect(await panel("01 Foundation").findByText("I ordered it.")).toBeTruthy()
  expect(panel("02 Adaptation").getByText("Mixed")).toBeTruthy()
  expect(panel("02 Adaptation").getByText("probability 59%")).toBeTruthy()

  const review = "The product is excellent, but shipping was slow."
  const asked = `Classify the sentiment of this review as Positive, Negative or Mixed:\n${review}`
  expect(fake.posts("/genai/complete")).toEqual([
    { prompt: asked, max_tokens: 30, temperature: 0, top_k: 1 },
  ])
  expect(fake.posts("/genai/few-shot")[0]).toMatchObject({
    query: review,
    model: "base",
    input_name: "Review",
    output_name: "Sentiment",
  })
  const [{ messages }] = fake.posts("/genai/chat") as {
    messages: { role: string; content: string }[]
  }[]
  expect(messages[1]).toEqual({ role: "user", content: asked })
})

test("the answers stay with the input that produced them", async () => {
  server()
  await renderLesson(GptToChatGptLesson)
  fireEvent.click(screen.getByRole("button", { name: "Run all three" }))
  await panel("01 Foundation").findByText("I ordered it.")
  fireEvent.change(screen.getByLabelText("Input text"), { target: { value: "Something else" } })
  expect(
    panel("01 Foundation").getAllByText("What is the capital of France?").length,
  ).toBeGreaterThan(0)
  expect(panel("01 Foundation").queryByText(/Something else/)).toBeNull()
})

const toyRun = (stage: string) => ({
  run_id: `r-${stage}`,
  corpus: "all",
  step: 800,
  max_steps: 2000,
  params: 48000,
  vocab_size: 560,
  context_len: 32,
  random_guess_loss: 6.3,
  history: [],
  stage,
  sft_history: [],
  rm_history: [],
  ppo_history: [],
  student_pairs: 0,
  has_reward_model: false,
  execution_mode: "real",
})

test("the toy lineage row generates one prompt from the three committed checkpoints", async () => {
  const fake = fakeServer({
    "/health": () => HEALTH,
    "/genai/toy/alignment": () => ({
      demonstrations: [],
      held_out: [
        { prompt: "Question: What is the capital of Italy? Answer:", completion: " Rome." },
      ],
      prompts: [
        {
          id: "france",
          prompt: "Question: What is the capital of France? Answer:",
          candidates: [],
          honest: [],
        },
      ],
    }),
    "/genai/toy/runs": (body) => toyRun((body as { stage: string }).stage),
    "/genai/toy/runs/r-pretrained/generate": () => ({
      model: "toy-gpt",
      steps: [{ token: " noite", prob: 0.3, top_k: [] }],
    }),
    "/genai/toy/runs/r-sft/generate": () => ({
      model: "toy-gpt",
      steps: [{ token: " Paris", prob: 0.9, top_k: [] }],
    }),
    "/genai/toy/runs/r-rlhf/generate": () => ({
      model: "toy-gpt",
      steps: [{ token: " Paris", prob: 0.95, top_k: [] }],
    }),
  })
  await renderLesson(GptToChatGptLesson)
  fireEvent.click(await screen.findByRole("button", { name: "Run the toy lineage" }))
  const lineage = panel("Same lineage, toy scale")
  expect(await lineage.findByText("noite")).toBeTruthy()
  expect(lineage.getAllByText("Paris")).toHaveLength(2)
  expect(fake.posts("/genai/toy/runs").map((b) => (b as { stage: string }).stage)).toEqual([
    "pretrained",
    "sft",
    "rlhf",
  ])
  // A second click reuses the three runs instead of loading three more checkpoints.
  fireEvent.click(screen.getByRole("button", { name: "Run the toy lineage" }))
  await waitFor(() => expect(fake.posts("/genai/toy/runs/r-rlhf/generate")).toHaveLength(2))
  expect(fake.posts("/genai/toy/runs")).toHaveLength(3)
})

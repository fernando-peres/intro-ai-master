import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { AdaptationLabLesson, INSTRUCTION, observationsFor, toJsonl } from "./adaptation-lab"
import { fakeServer, HEALTH, renderLesson } from "./test-utils"

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const button = (name: string | RegExp) => screen.getByRole("button", { name })
const preview = () =>
  within(screen.getByRole("region", { name: "Prompt sent to the model" })).getByText(/Classify/)
    .textContent

/** Renders the lesson and opens its Lab tab. */
async function openLab() {
  await renderLesson(AdaptationLabLesson)
  fireEvent.click(screen.getByRole("tab", { name: "Lab" }))
}

function server() {
  return fakeServer({
    "/health": () => HEALTH,
    "/genai/few-shot": (body) => {
      const { examples, model } = body as { examples: unknown[]; model: string }
      if (model === "assistant") {
        return { model: "gpt-test", prompt: "", output: "Mixed.", label: "Mixed", scores: null }
      }
      const mixed = examples.length > 0
      return {
        model: "gpt2",
        prompt: "",
        output: mixed ? "Mixed" : "Positive",
        label: mixed ? "Mixed" : "Positive",
        scores: mixed
          ? { Positive: 0.3, Negative: 0.11, Mixed: 0.59 }
          : { Positive: 0.79, Negative: 0.19, Mixed: 0.02 },
      }
    },
  })
}

test("the live prompt preview gains and loses the examples with the method", async () => {
  server()
  await openLab()
  expect(preview()).toContain("Review: I love this product!\nSentiment: Positive")
  fireEvent.click(button("Zero-shot"))
  expect(preview()).toBe(
    `${INSTRUCTION}\n\nReview: The product is excellent, but shipping was slow.\nSentiment:`,
  )
})

test("classifies on GPT-2 and keeps each run for comparison", async () => {
  const fake = server()
  await openLab()

  fireEvent.click(button("Zero-shot"))
  fireEvent.click(button("Classify"))
  expect(await screen.findByText("Positive", { selector: "p" })).toBeTruthy()

  fireEvent.click(button("Few-shot"))
  fireEvent.click(button("Add example"))
  expect((screen.getByLabelText("Example 3 text") as HTMLInputElement).value).toBe(
    "Great price, but it broke after a week.",
  )
  fireEvent.click(button("Classify"))
  expect(await screen.findByText("Mixed", { selector: "p" })).toBeTruthy()

  const [zero, few] = fake.posts("/genai/few-shot") as {
    examples: unknown[]
    model: string
    labels: string[]
  }[]
  expect(zero.examples).toEqual([])
  expect(few.examples).toHaveLength(3)
  expect(few).toMatchObject({ model: "base", labels: ["Positive", "Negative", "Mixed"] })

  const rows = within(screen.getByRole("region", { name: "Your runs" }))
    .getAllByRole("row")
    .slice(1)
  expect(rows.map((r) => r.textContent)).toEqual([
    expect.stringMatching(/^Few-shotgpt23.*Mixed59%—$/),
    expect.stringMatching(/^Zero-shotgpt20.*Positive79%—$/),
  ])
})

test("the assistant's reply is shown instead of label probabilities", async () => {
  server()
  await openLab()
  fireEvent.click(await screen.findByRole("button", { name: "Assistant · gpt-test" }))
  fireEvent.click(button("Classify"))
  expect(await screen.findByText("“Mixed.”")).toBeTruthy()
})

test("fine-tuning is explained, not sent", async () => {
  const fake = server()
  await openLab()
  fireEvent.click(button("Fine-tuned"))
  expect(screen.getByText(/explained, not run live/)).toBeTruthy()
  expect(screen.queryByRole("button", { name: "Classify" })).toBeNull()
  expect(fake.posts("/genai/few-shot")).toEqual([])
})

test("Theory is the default tab and groups the methods by whether they change the weights", async () => {
  server()
  await renderLesson(AdaptationLabLesson)
  expect(screen.getByRole("tab", { name: "Theory" }).getAttribute("aria-selected")).toBe("true")
  expect(screen.getByRole("columnheader", { name: "Changes the weights" })).toBeTruthy()
  expect(screen.getByRole("columnheader", { name: "Does not change the weights" })).toBeTruthy()
  expect(
    screen.getByRole("rowheader", { name: "Retrieval-augmented generation (RAG)" }),
  ).toBeTruthy()
  expect(screen.queryByRole("button", { name: "Classify" })).toBeNull()

  fireEvent.click(button("Open the lab"))
  expect(screen.getByRole("tab", { name: "Lab" }).getAttribute("aria-selected")).toBe("true")
  expect(button("Classify")).toBeTruthy()
})

test("reviews turn predictions into a post-training dataset", async () => {
  server()
  await openLab()
  const dataset = () => screen.getByRole("region", { name: "Post-training dataset" })
  expect(within(dataset()).getByText("0 demonstrations · 0 preference pairs")).toBeTruthy()

  fireEvent.click(button("Zero-shot"))
  fireEvent.click(button("Classify"))
  await screen.findByText("Positive", { selector: "p" })
  fireEvent.click(button("Wrong"))
  fireEvent.click(button("Mixed"))
  expect(screen.getByText("Corrected to Mixed. Added to the dataset.")).toBeTruthy()
  expect(within(dataset()).getByText("1 demonstrations · 1 preference pairs")).toBeTruthy()

  const lines = screen
    .getByTestId("dataset-jsonl")
    .textContent?.split("\n")
    .map((l) => JSON.parse(l))
  const prompt = `${INSTRUCTION}\n\nReview: The product is excellent, but shipping was slow.\nSentiment:`
  expect(lines).toEqual([
    { type: "demonstration", prompt, completion: "Mixed" },
    { type: "preference", prompt, chosen: "Mixed", rejected: "Positive" },
  ])

  fireEvent.click(button("Few-shot"))
  fireEvent.click(button("Classify"))
  await waitFor(() => expect(button("Correct")).toBeTruthy())
  fireEvent.click(button("Correct"))
  expect(within(dataset()).getByText("2 demonstrations · 1 preference pairs")).toBeTruthy()
})

test("the rail names the live assistant model", async () => {
  server()
  await openLab()
  fireEvent.click(await screen.findByRole("button", { name: "Assistant · gpt-test" }))
  expect(screen.getByText(/already post-trained/)).toBeTruthy()
})

test("a confirmed label is only a demonstration; JSONL has one record per line", () => {
  const ok = observationsFor("p", "Mixed", "Mixed")
  expect(ok).toEqual([{ type: "demonstration", prompt: "p", completion: "Mixed" }])
  expect(toJsonl([...ok, ...observationsFor("q", null, "Negative")]).split("\n")).toHaveLength(2)
})

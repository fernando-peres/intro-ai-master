import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { fakeServer, HEALTH, renderLesson } from "./test-utils"
import { TransformerArchitectureLesson } from "./transformer-architecture"

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const button = (name: string | RegExp) => screen.getByRole("button", { name })
/** The GPT-2 heatmaps (their name quotes the text), not the calculator's toy one. */
const labHeatmaps = () => screen.getAllByRole("img", { name: /attention of .* in “/i })
const waitForHeatmaps = async (count: number) => {
  await waitFor(() => expect(labHeatmaps()).toHaveLength(count))
  return labHeatmaps()
}

/** Three tokens; head 0 looks at the previous token, head 1 at the first token. */
const HEAD_0 = [
  [1, 0, 0],
  [0.3, 0.7, 0],
  [0.1, 0.6, 0.3],
]
const HEAD_1 = [
  [1, 0, 0],
  [0.9, 0.1, 0],
  [0.8, 0.1, 0.1],
]

function server() {
  return fakeServer({
    "/health": () => HEALTH,
    "/genai/attention": (body) => {
      const { text, layer, model } = body as { text: string; layer: number; model?: string }
      const words = text.split(" ")
      if (model === "bert-small") {
        // An encoder: WordPiece tokens with [CLS]/[SEP], full rows, no next token.
        return {
          model: "bert-small",
          causal: false,
          layers: 4,
          tokens: ["[CLS]", "bank", "[SEP]"],
          layer,
          heads: 1,
          weights: [
            [
              [0.2, 0.5, 0.3],
              [0.1, 0.1, 0.8],
              [0.3, 0.3, 0.4],
            ],
          ],
          next_tokens: [],
        }
      }
      // Three tokens, to match the 3×3 heads: the first two words and the last one.
      return {
        model: "gpt2",
        causal: true,
        layers: 12,
        tokens: [words[0], ` ${words[1]}`, ` ${words[words.length - 1]}`],
        layer,
        heads: 2,
        weights: [HEAD_0, HEAD_1],
        next_tokens: [
          { token: " mat", prob: 0.4 },
          { token: " floor", prob: 0.2 },
        ],
      }
    },
  })
}

async function openLab() {
  await renderLesson(TransformerArchitectureLesson)
  fireEvent.click(screen.getByRole("tab", { name: "Lab" }))
}

test("Theory opens first and its button switches to the Lab", async () => {
  server()
  await renderLesson(TransformerArchitectureLesson)
  expect(screen.getByRole("tab", { name: "Theory" }).getAttribute("aria-selected")).toBe("true")
  expect(screen.getByText("An architecture, not a model")).toBeTruthy()
  fireEvent.click(button("Open the lab"))
  expect(screen.getByRole("tab", { name: "Lab" }).getAttribute("aria-selected")).toBe("true")
})

test("Inspect asks GPT-2 for both texts at the chosen layer and draws the causal mask", async () => {
  const fake = server()
  await openLab()
  fireEvent.click(button("Inspect"))
  const heatmaps = await waitForHeatmaps(2)
  expect(fake.posts("/genai/attention")).toEqual([
    { text: "He fished from the river bank", layer: 5, top_k: 5, model: "gpt2" },
    { text: "She deposited money at the bank", layer: 5, top_k: 5, model: "gpt2" },
  ])
  // Each fake reply has 3 tokens: 9 cells, 3 of them masked (the future).
  expect(within(heatmaps[0]).getAllByTestId("attention-cell")).toHaveLength(9)
  expect(within(heatmaps[0]).getAllByTestId("masked-cell")).toHaveLength(3)
})

test("changing the head or averaging heads needs no new request", async () => {
  const fake = server()
  await openLab()
  fireEvent.click(button("Inspect"))
  const [heatmap] = await waitForHeatmaps(2)
  const cell = () => within(heatmap).getAllByTestId("attention-cell")[7].getAttribute("data-weight")

  expect(cell()).toBe("0.6") // head 0, query 2 → key 1
  fireEvent.click(button("Next head"))
  expect(cell()).toBe("0.1") // head 1
  fireEvent.click(screen.getByRole("switch", { name: "Mean of heads" }))
  expect(cell()).toBe("0.35")
  expect(fake.posts("/genai/attention")).toHaveLength(2)
})

test("selecting a token lists what it attends to, and the last token's next-token guesses show", async () => {
  server()
  await openLab()
  fireEvent.click(button("Inspect"))
  await waitForHeatmaps(2)

  const attended = screen.getAllByRole("region", { name: /attends to/ })[0]
  // Default selection is the last token ("river bank" → " bank"): strongest key is " fished".
  expect(attended.getAttribute("aria-label")).toContain("bank")
  expect(within(attended).getAllByText(/%/)[0].textContent).toBe("60%")

  fireEvent.click(screen.getAllByRole("button", { name: "fished" })[0])
  expect(within(attended).getAllByText(/%/)[0].textContent).toBe("70%")

  const [next] = screen.getAllByRole("region", { name: "Next token after the last position" })
  expect(within(next).getByText("“ mat”")).toBeTruthy()
})

test("the calculator recomputes the toy weights when a vector changes or the mask toggles", async () => {
  server()
  await openLab()
  const calculator = screen.getByRole("region", { name: "Q · K · V calculator" })
  const weights = () =>
    within(calculator)
      .getAllByTestId("attention-cell")
      .map((c) => c.getAttribute("data-weight"))

  // Causal by default: the first row attends only to itself.
  expect(weights().slice(0, 3)).toEqual(["1", "0", "0"])
  fireEvent.click(within(calculator).getByRole("switch", { name: "Causal mask" }))
  expect(weights()[1]).not.toBe("0")

  const before = weights()[0]
  fireEvent.change(within(calculator).getByLabelText("The, dimension 1"), {
    target: { value: "3" },
  })
  expect(weights()[0]).not.toBe(before)
})

test("switching to the encoder asks BERT small, drops the mask and the next-token panel", async () => {
  const fake = server()
  await openLab()
  fireEvent.click(button("BERT small · encoder"))
  fireEvent.click(button("Inspect"))
  const heatmaps = await waitForHeatmaps(2)
  expect(fake.posts("/genai/attention")).toEqual([
    { text: "The bank is beside the river.", layer: 0, top_k: 5, model: "bert-small" },
    { text: "She deposited money at the bank.", layer: 0, top_k: 5, model: "bert-small" },
  ])
  expect(within(heatmaps[0]).getAllByTestId("attention-cell")).toHaveLength(9)
  expect(within(heatmaps[0]).queryAllByTestId("masked-cell")).toHaveLength(0)
  expect(screen.queryByRole("region", { name: "Next token after the last position" })).toBeNull()
  // "bank" is selected by default for the encoder example.
  expect(screen.getAllByRole("button", { name: "bank", pressed: true })).toHaveLength(2)
})

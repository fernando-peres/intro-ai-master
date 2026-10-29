import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { fakeServer, HEALTH, renderLesson } from "../generative-ai/test-utils"
import { EmbeddingsLesson } from "./embeddings"
import { BANK_SENTENCES, SENTENCE_GROUPS } from "./embeddings-presets"

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const MODELS = {
  models: [
    { id: "glove-6b-300d", name: "GloVe 6B 300d", family: "word", dimensions: 300, loaded: true },
    {
      id: "minilm-l6-v2",
      name: "all-MiniLM-L6-v2",
      family: "sentence",
      dimensions: 384,
      pooling: "mean",
      loaded: true,
    },
  ],
}

const PARAPHRASE = SENTENCE_GROUPS[0].sentences
const NEGATION = SENTENCE_GROUPS.find((g) => g.kind === "negation")?.sentences ?? []

const SENTENCE_VECTORS: Record<string, number[]> = {
  [PARAPHRASE[0]]: [1, 0, 0],
  [PARAPHRASE[1]]: [0.6, 0.8, 0],
  [NEGATION[0]]: [1, 0, 0],
  [NEGATION[1]]: [0.96, 0.28, 0],
}

const words = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z ]/g, "")
    .split(" ")
    .filter(Boolean)

function inspectReply(text: string) {
  const tokens = ["[CLS]", ...words(text), "[SEP]"]
  const bank = text === BANK_SENTENCES.river ? [1, 0, 0, 0] : [0.6, 0.8, 0, 0]
  return {
    model: "minilm-l6-v2",
    execution_mode: "real",
    trained_pooling: "mean",
    tokens,
    ids: tokens.map((_, i) => 100 + i),
    attention_mask: tokens.map(() => 1),
    token_vectors: tokens.map((tok) => (tok === "bank" ? bank : [0.1, 0.1, 0.1, 0.1])),
    pooled: {
      mean: [0.5, 0.5, 0, 0],
      mean_normalized: [0.6, 0.8, 0, 0],
      cls: [0.1, 0.9, 0, 0],
      max: [0.9, 0.9, 0, 0],
    },
    truncated: false,
  }
}

const GLOVE: Record<string, number[]> = { bank: [1, 0, 0], river: [1, 1, 0], money: [0, 1, 0] }

function lab() {
  return fakeServer({
    "/health": () => HEALTH,
    "/embeddings/models": () => MODELS,
    "/embeddings/sentences": (body) => {
      const { sentences, normalize } = body as { sentences: string[]; normalize: boolean }
      return {
        model: "minilm-l6-v2",
        execution_mode: "real",
        dimensions: 3,
        normalized: normalize,
        pooling: "mean",
        items: sentences.map((text) => ({
          text,
          vector: SENTENCE_VECTORS[text] ?? [1, 1, 1],
          tokens: words(text).length + 2,
          truncated: false,
        })),
      }
    },
    "/embeddings/pca": (body) => {
      const rows = (body as { rows: number[][] }).rows
      return {
        model: "numpy-svd",
        points: rows.map((r) => [r[0], r[1]]),
        explained_variance_ratio: [0.7, 0.3],
        mean: [0, 0, 0],
        components: [
          [1, 0, 0],
          [0, 1, 0],
        ],
        input_dimensions: 3,
        output_dimensions: 2,
        rows: rows.length,
      }
    },
    "/embeddings/inspect": (body) => inspectReply((body as { text: string }).text),
    "/embeddings/words": (body) => {
      const list = (body as { words: string[] }).words
      return {
        model: "glove-6b-300d",
        execution_mode: "real",
        dimensions: 3,
        normalized: false,
        found: list.map((w, i) => ({ word: w, rank: i + 1, vector: GLOVE[w], norm: 1 })),
        missing: [],
      }
    },
  })
}

async function openText() {
  await renderLesson(EmbeddingsLesson)
  fireEvent.click(screen.getByRole("tab", { name: "Text" }))
}

const button = (name: string | RegExp) => screen.getByRole("button", { name })
const region = (name: RegExp) => screen.getByRole("region", { name })
const cells = () => screen.getAllByTestId("similarity-cell")

test("Embed posts the sentence list and draws an n×n similarity matrix", async () => {
  const fake = lab()
  await openText()
  expect(screen.getByText("Press Embed to run MiniLM on the sentences.")).toBeTruthy()
  fireEvent.click(button("Embed"))
  await waitFor(() => expect(cells()).toHaveLength(4))
  expect(fake.posts("/embeddings/sentences")).toEqual([{ sentences: PARAPHRASE, normalize: true }])
  expect(fake.posts("/embeddings/pca")).toEqual([
    {
      rows: [
        [1, 0, 0],
        [0.6, 0.8, 0],
      ],
      dimensions: 2,
    },
  ])
  expect(screen.getAllByTestId("embedding-point")).toHaveLength(2)
})

test("clicking a matrix cell shows that pair's cosine, dot and euclidean distance", async () => {
  lab()
  await openText()
  fireEvent.click(button("Add sentence"))
  fireEvent.change(screen.getByRole("textbox", { name: "Sentence 3" }), {
    target: { value: "Simmer the sauce." },
  })
  fireEvent.click(button("Embed"))
  await waitFor(() => expect(cells()).toHaveLength(9))
  expect(region(/^Pair: s1 × s2/).textContent).toContain("0.60")
  fireEvent.click(button(/^s1 × s3/))
  const pair = region(/^Pair: s1 × s3/)
  const stats = pair.textContent ?? ""
  expect(stats).toContain("0.58Cosine")
  expect(stats).toContain("1.00Dot")
  expect(stats).toContain("1.41Euclidean")
})

test("switching mean, cls and max pooling needs no new request", async () => {
  const fake = lab()
  await openText()
  fireEvent.click(button("Inspect"))
  const panel = await screen.findByRole("region", { name: /^Inspect “s1”/ })
  await waitFor(() => expect(within(panel).getAllByTestId("vector-dim").length).toBeGreaterThan(0))
  const firstDim = () => within(panel).getAllByTestId("vector-dim")[0].textContent
  const requests = fake.calls.length
  expect(firstDim()).toContain("0.500")
  expect(panel.textContent).toContain("trained")
  fireEvent.click(button("CLS (experiment)"))
  expect(firstDim()).toContain("0.100")
  fireEvent.click(button("Max (experiment)"))
  expect(firstDim()).toContain("0.900")
  expect(panel.textContent).toContain("experiment")
  expect(fake.calls.length).toBe(requests)
})

test("Inspect posts only the selected sentence and lists its tokens", async () => {
  const fake = lab()
  await openText()
  fireEvent.change(screen.getByRole("combobox", { name: "Inspect sentence" }), {
    target: { value: "1" },
  })
  fireEvent.click(button("Inspect"))
  const panel = await screen.findByRole("region", { name: /^Inspect “s2”/ })
  await waitFor(() => expect(panel.textContent).toContain("feline"))
  expect(fake.posts("/embeddings/inspect")).toEqual([{ text: PARAPHRASE[1] }])
  expect(fake.posts("/embeddings/sentences")).toEqual([])
  expect(panel.textContent).toContain("[CLS]")
  fireEvent.change(screen.getByRole("textbox", { name: "Sentence 2" }), {
    target: { value: "A cat was resting." },
  })
  expect(screen.getByText("Sentence changed: press Inspect.")).toBeTruthy()
})

test("the bank experiment compares the static vector with two contextual token vectors", async () => {
  const fake = lab()
  await openText()
  fireEvent.click(button("Run bank experiment"))
  const panel = region(/^Bank experiment/)
  await waitFor(() =>
    expect(panel.textContent).toContain("The two contextual “bank” vectors have cosine 0.60"),
  )
  expect(fake.posts("/embeddings/inspect")).toEqual([
    { text: BANK_SENTENCES.river },
    { text: BANK_SENTENCES.money },
  ])
  expect(fake.posts("/embeddings/words")).toEqual([{ words: ["bank", "river", "money"] }])
  expect(panel.textContent).toContain("cosine to “river” 0.71, to “money” 0.00")
  expect(panel.textContent).toContain("shown, not compared")
  expect(within(panel).getAllByTestId("vector-dim").length).toBeGreaterThan(0)
})

test("the negation preset shows the high-similarity-is-not-same-meaning note", async () => {
  lab()
  await openText()
  fireEvent.click(button("Negation"))
  fireEvent.click(button("Embed"))
  const pair = await screen.findByRole("region", { name: /^Pair: s1 × s2/ })
  await waitFor(() => expect(pair.textContent).toContain("high similarity ≠ same meaning"))
})

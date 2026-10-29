import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { fakeServer, HEALTH, renderLesson } from "../generative-ai/test-utils"
import { lessonPages } from "../index"
import { EmbeddingsLesson } from "./embeddings"

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const MODELS = {
  models: [
    { id: "glove-6b-300d", name: "GloVe 6B 300d", loaded: true },
    { id: "minilm-l6-v2", name: "MiniLM-L6-v2", loaded: false },
  ],
}

function server() {
  return fakeServer({ "/health": () => HEALTH, "/embeddings/models": () => MODELS })
}

const tab = (name: string) => screen.getByRole("tab", { name })

test("Theory opens first and Open the lab switches to Intuition", async () => {
  server()
  await renderLesson(EmbeddingsLesson)
  expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Embeddings")
  expect(tab("Theory").getAttribute("aria-selected")).toBe("true")
  expect(screen.getByText("What an embedding is")).toBeTruthy()
  fireEvent.click(screen.getByRole("button", { name: /open the lab/i }))
  expect(tab("Intuition").getAttribute("aria-selected")).toBe("true")
  expect(tab("Theory").getAttribute("aria-selected")).toBe("false")
})

test("offers the four tabs in order and keeps every panel mounted", async () => {
  server()
  await renderLesson(EmbeddingsLesson)
  expect(screen.getAllByRole("tab").map((el) => el.textContent)).toEqual([
    "Theory",
    "Intuition",
    "Text",
    "Applications",
  ])
  expect(document.querySelectorAll("[role=tabpanel]")).toHaveLength(4)
  fireEvent.click(tab("Applications"))
  expect(document.querySelectorAll("[role=tabpanel]:not([hidden])")).toHaveLength(1)
})

test("lists the embedding models and whether each is loaded", async () => {
  server()
  await renderLesson(EmbeddingsLesson)
  const status = await screen.findByText(/GloVe 6B 300d/)
  expect(status.closest("[role=status]")?.textContent).toContain("MiniLM-L6-v2")
})

test("the offline notice appears when the server is down", async () => {
  fakeServer({})
  await renderLesson(EmbeddingsLesson)
  await waitFor(() => expect(screen.getByText(/model server isn't running/i)).toBeTruthy())
})

test("is registered as the lesson page for /learn/llm/embeddings", () => {
  expect(lessonPages["llm/embeddings"]).toBe(EmbeddingsLesson)
})

const VECTORS: Record<string, number[]> = {
  king: [1, 0.2, 0, 0],
  queen: [0.9, 0.3, 0.1, 0],
  man: [0.1, 1, 0, 0],
  woman: [0, 0.9, 0.3, 0],
  prince: [0.8, 0.1, 0, 0.2],
  princess: [0.7, 0.2, 0.2, 0.2],
  monarch: [0.85, 0.1, 0.1, 0.1],
  throne: [0.5, 0, 0, 0.6],
  blorp: [0, 0, 1, 1],
}

function lab(overrides: Parameters<typeof fakeServer>[0] = {}) {
  return fakeServer({
    "/health": () => HEALTH,
    "/embeddings/models": () => MODELS,
    "/embeddings/analogy": () => ({
      model: "glove-6b-300d",
      execution_mode: "real",
      positive: ["king", "woman"],
      negative: ["man"],
      vector: [0.9, 0.1, 0.3, 0],
      neighbors: [
        { word: "queen", rank: 1, score: 0.7118 },
        { word: "monarch", rank: 2, score: 0.6189 },
      ],
    }),
    "/embeddings/words": (body) => {
      const list = (body as { words: string[] }).words
      return {
        model: "glove-6b-300d",
        execution_mode: "real",
        dimensions: 4,
        normalized: false,
        found: list
          .filter((w) => VECTORS[w])
          .map((w, i) => ({ word: w, rank: i + 1, vector: VECTORS[w], norm: 1 })),
        missing: list.filter((w) => !VECTORS[w]).map((w) => ({ word: w, suggestions: ["blorp"] })),
      }
    },
    "/embeddings/pca": (body) => {
      const rows = (body as { rows: number[][] }).rows
      return {
        model: "numpy-svd",
        points: rows.map((r) => [r[0], r[1]]),
        explained_variance_ratio: [0.6, 0.2],
        mean: [0, 0, 0, 0],
        components: [
          [1, 0, 0, 0],
          [0, 1, 0, 0],
        ],
        input_dimensions: 4,
        output_dimensions: 2,
        rows: rows.length,
      }
    },
    "/embeddings/neighbors": (body) => ({
      model: "glove-6b-300d",
      execution_mode: "real",
      word: (body as { word: string }).word,
      vector: [0, 0, 0, 0],
      neighbors: [{ word: "princess", rank: 1, score: 0.8123 }],
    }),
    ...overrides,
  })
}

async function openIntuition() {
  await renderLesson(EmbeddingsLesson)
  fireEvent.click(tab("Intuition"))
}

const run = () => fireEvent.click(screen.getByRole("button", { name: "Run" }))
const points = () =>
  screen.getAllByTestId("embedding-point").map((p) => p.getAttribute("data-label"))
const panel = (name: RegExp) => screen.getByRole("region", { name })

async function addWord(word: string) {
  fireEvent.change(screen.getByRole("textbox", { name: "Add a word" }), {
    target: { value: word },
  })
  fireEvent.click(screen.getByRole("button", { name: "Add word" }))
}

test("Run posts the analogy and fetches only the words missing from the cache (second Run with one added word posts only that word)", async () => {
  const fake = lab()
  await openIntuition()
  expect(screen.getByText("Press Run to fetch GloVe vectors.")).toBeTruthy()
  run()
  await screen.findAllByTestId("embedding-point")
  expect(fake.posts("/embeddings/analogy")).toEqual([
    { positive: ["king", "woman"], negative: ["man"], top_k: 5 },
  ])
  const first = (fake.posts("/embeddings/words")[0] as { words: string[] }).words
  expect([...first].sort()).toEqual(
    ["king", "man", "monarch", "prince", "princess", "queen", "woman"].sort(),
  )
  await addWord("Throne")
  expect(screen.getByText("Words changed: press Run.")).toBeTruthy()
  run()
  await waitFor(() => expect(points()).toContain("throne"))
  expect(fake.posts("/embeddings/words")[1]).toEqual({ words: ["throne"] })
})

test("the analogy panel lists the neighbours with their cosine and the rank of the expected word", async () => {
  lab()
  await openIntuition()
  run()
  const analogy = await screen.findByRole("region", { name: /^Analogy/ })
  await waitFor(() => expect(analogy.textContent).toContain("monarch"))
  expect(analogy.textContent).toContain("king − man + woman = ?")
  expect(analogy.textContent).toContain("cosine 0.71")
  expect(analogy.textContent).not.toContain("%")
  expect(analogy.textContent).toContain("“queen” is ranked 1 of 5")
})

test("the PCA map draws one labelled point per word plus the target and the explained-variance caption", async () => {
  lab()
  await openIntuition()
  run()
  await screen.findAllByTestId("embedding-point")
  expect(points()).toEqual([
    "king",
    "man",
    "woman",
    "queen",
    "prince",
    "princess",
    "monarch",
    "king − man + woman",
  ])
  expect(document.querySelectorAll("text[data-point-label]").length).toBe(8)
  expect(panel(/^Map/).textContent).toContain("PC1 + PC2 explain 80% of the variance")
})

test("switching the metric or the normalized switch recomputes the pair numbers without a new request", async () => {
  const fake = lab()
  await openIntuition()
  run()
  await screen.findAllByTestId("embedding-point")
  const metrics = panel(/^Metrics/)
  const headline = () => within(metrics).getByTestId("metric-headline").textContent
  const requests = fake.calls.length
  expect(headline()).toContain("Cosine 0.99")
  fireEvent.click(within(metrics).getByRole("button", { name: "Euclidean" }))
  expect(headline()).toContain("Euclidean 0.17")
  fireEvent.click(within(metrics).getByRole("button", { name: "Dot" }))
  expect(headline()).toContain("Dot 0.96")
  fireEvent.click(within(metrics).getByRole("switch", { name: "Normalized" }))
  expect(headline()).toContain("Dot 0.99")
  expect(fake.calls.length).toBe(requests)
})

test("an out-of-vocabulary word shows the server's suggestions instead of a point", async () => {
  lab()
  await openIntuition()
  fireEvent.click(screen.getByRole("button", { name: "Out of vocabulary" }))
  run()
  await screen.findAllByTestId("embedding-point")
  expect(points()).not.toContain("blorptastic")
  expect(screen.getByText(/“blorptastic” is not in the vocabulary/)).toBeTruthy()
  fireEvent.click(screen.getByRole("button", { name: "blorp" }))
  expect(screen.queryByText(/“blorptastic” is not in the vocabulary/)).toBeNull()
  expect(screen.getByRole("button", { name: "Remove blorp" })).toBeTruthy()
})

test("adding a word with the projection frozen projects it locally without calling PCA", async () => {
  const fake = lab()
  await openIntuition()
  run()
  await screen.findAllByTestId("embedding-point")
  fireEvent.click(screen.getByRole("switch", { name: "Freeze projection" }))
  await addWord("throne")
  run()
  await waitFor(() => expect(points()).toContain("throne"))
  expect(fake.posts("/embeddings/pca")).toHaveLength(1)
  expect(panel(/^Map/).textContent).toContain("The projection is frozen")
})

test("clicking a nearest-word chip posts neighbors for that word", async () => {
  const fake = lab()
  await openIntuition()
  run()
  const nearest = await screen.findByRole("region", { name: /^Nearest words/ })
  fireEvent.click(within(nearest).getByRole("button", { name: "queen" }))
  await waitFor(() => expect(nearest.textContent).toContain("princess"))
  expect(fake.posts("/embeddings/neighbors")).toEqual([{ word: "queen", top_k: 5 }])
  expect(within(nearest).getByRole("button", { name: "queen" }).getAttribute("aria-pressed")).toBe(
    "true",
  )
})

test("an unknown analogy word is named in plain text with its suggestions, never as JSON", async () => {
  lab({
    "/embeddings/analogy": () =>
      new Response(
        JSON.stringify({
          detail: {
            message: "Not in the vocabulary",
            missing: [{ word: "man", suggestions: ["men"] }],
          },
        }),
        { status: 400, headers: { "content-type": "application/json" } },
      ),
  })
  await openIntuition()
  run()
  await screen.findAllByTestId("embedding-point")
  const alert = within(panel(/^Analogy/)).getByRole("alert").textContent ?? ""
  expect(alert).toContain("Not in the GloVe vocabulary: man")
  expect(alert).not.toContain("{")
  expect(screen.getByText(/“man” is not in the vocabulary/)).toBeTruthy()
  expect(points()).toHaveLength(5)
})

test("a failed words request keeps the analogy neighbours and shows the error on the map", async () => {
  lab({
    "/embeddings/words": () =>
      new Response(JSON.stringify({ detail: "Vectors unavailable" }), { status: 500 }),
  })
  await openIntuition()
  run()
  const map = await screen.findByRole("region", { name: /^Map ·/ })
  await waitFor(() => expect(within(map).getByRole("alert").textContent).toContain("unavailable"))
  expect(panel(/^Analogy/).textContent).toContain("monarch")
})

test("a second Run does not post an out-of-vocabulary word again", async () => {
  const fake = lab()
  await openIntuition()
  fireEvent.click(screen.getByRole("button", { name: "Out of vocabulary" }))
  run()
  await screen.findAllByTestId("embedding-point")
  run()
  await waitFor(() => expect(fake.posts("/embeddings/pca")).toHaveLength(2))
  expect(fake.posts("/embeddings/words")).toHaveLength(1)
  expect(screen.getByText(/“blorptastic” is not in the vocabulary/)).toBeTruthy()
})

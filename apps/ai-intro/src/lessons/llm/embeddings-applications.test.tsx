import { cleanup, fireEvent, screen, within } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { fakeServer, HEALTH, renderLesson } from "../generative-ai/test-utils"
import { EmbeddingsLesson } from "./embeddings"
import { SEARCH_QUERIES } from "./embeddings-presets"

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const MODELS = {
  models: [
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

const CORPUS = {
  documents: [
    {
      id: "d1",
      title: "Remote work policy",
      category: "HR",
      text: "Employees may work from home.",
    },
    { id: "d2", title: "Laptop troubleshooting", category: "IT", text: "Hold the power button." },
  ],
}

function search(keyword: unknown[]) {
  return {
    model: "minilm-l6-v2",
    execution_mode: "real",
    dimensions: 384,
    normalized: true,
    query_tokens: ["how", "many", "days"],
    query_vector: [0.1, 0.2],
    semantic: [
      { id: "d1", title: "Remote work policy", category: "HR", score: 0.71 },
      { id: "d2", title: "Laptop troubleshooting", category: "IT", score: 0.12 },
    ],
    keyword,
  }
}

function lab(keyword: unknown[]) {
  return fakeServer({
    "/health": () => HEALTH,
    "/embeddings/models": () => MODELS,
    "/embeddings/corpus": () => CORPUS,
    "/embeddings/search": () => search(keyword),
  })
}

async function openApplications() {
  await renderLesson(EmbeddingsLesson)
  fireEvent.click(screen.getByRole("tab", { name: "Applications" }))
}

test("Search posts the query and renders the semantic and keyword rankings side by side", async () => {
  const server = lab([
    {
      id: "d2",
      title: "Laptop troubleshooting",
      category: "IT",
      score: 0.2,
      shared: ["days", "many"],
    },
  ])
  await openApplications()
  expect(screen.getByText(/Press Search to compare the two rankings/)).toBeTruthy()
  fireEvent.click(screen.getByRole("button", { name: /^Search$/ }))
  const semantic = await screen.findByRole("region", { name: "Semantic search" })
  expect(server.posts("/embeddings/search")).toEqual([{ query: SEARCH_QUERIES[0], top_k: 5 }])
  expect(within(semantic).getByText("Remote work policy")).toBeTruthy()
  expect(within(semantic).getByText("0.71")).toBeTruthy()
  const keyword = screen.getByRole("region", { name: "Keyword search" })
  expect(within(keyword).getByText("Laptop troubleshooting")).toBeTruthy()
  expect(within(keyword).getByText(/days, many/)).toBeTruthy()
})

test("the keyword column explains an empty result when no token is shared", async () => {
  lab([])
  await openApplications()
  fireEvent.click(screen.getByRole("button", { name: /^Search$/ }))
  await screen.findByText(/No document shares a token with the query/)
})

test("every lab shows the start command when the server is offline", async () => {
  fakeServer({})
  await renderLesson(EmbeddingsLesson)
  fireEvent.click(screen.getByRole("tab", { name: "Applications" }))
  await screen.findByText(/uv run/)
})

test("the RAG diagram is labelled and links to the Adaptation lesson", async () => {
  lab([])
  await openApplications()
  expect(screen.getByRole("img", { name: /documents/i })).toBeTruthy()
  expect(screen.getByRole("link", { name: /Adaptation/ }).getAttribute("href")).toBe(
    "/learn/generative-ai/adaptation-lab",
  )
})

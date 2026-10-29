import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router"
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import type { ReactNode } from "react"
import { findLesson } from "@/curriculum"
import { LanguageProvider } from "@/i18n/language"
import { lessonPages } from "@/lessons"
import {
  GPT3_BASE_COMPLETION,
  INSTRUCT_COMPLETION,
  pairsFromRanking,
  TOY_FRANCE_PROMPT,
} from "./training-intuition-data"
import { TrainingIntuitionDpoLesson } from "./training-intuition-dpo"
import { TrainingIntuitionPretrainingLesson } from "./training-intuition-pretraining"
import { TrainingIntuitionRlhfLesson } from "./training-intuition-rlhf"

const fetchSpy = vi.fn()
beforeEach(() => vi.stubGlobal("fetch", fetchSpy))
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function entryOf(slug: string) {
  const entry = findLesson("generative-ai", slug)
  if (!entry) throw new Error(`${slug} missing`)
  return entry
}

async function renderPage(page: ReactNode) {
  const rootRoute = createRootRoute({
    component: () => <LanguageProvider>{page}</LanguageProvider>,
  })
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  })
  await router.load()
  render(<RouterProvider router={router} />)
  await screen.findByRole("heading", { level: 1 })
}

const region = (name: string | RegExp) => screen.getByRole("region", { name })
const footerLinks = () =>
  within(screen.getByRole("navigation", { name: "Lesson navigation" }))
    .getAllByRole("link")
    .map((link) => link.textContent)

test("the three pages are registered and need no server", async () => {
  expect(lessonPages["generative-ai/intuition-pretraining"]).toBe(
    TrainingIntuitionPretrainingLesson,
  )
  expect(lessonPages["generative-ai/intuition-rlhf"]).toBe(TrainingIntuitionRlhfLesson)
  expect(lessonPages["generative-ai/intuition-dpo"]).toBe(TrainingIntuitionDpoLesson)
  await renderPage(<TrainingIntuitionPretrainingLesson entry={entryOf("intuition-pretraining")} />)
  cleanup()
  await renderPage(<TrainingIntuitionRlhfLesson entry={entryOf("intuition-rlhf")} />)
  cleanup()
  await renderPage(<TrainingIntuitionDpoLesson entry={entryOf("intuition-dpo")} />)
  expect(fetchSpy).not.toHaveBeenCalled()
})

test("Pretraining shows the raw data, GPT-3's mix and the slicer's training examples", async () => {
  await renderPage(<TrainingIntuitionPretrainingLesson entry={entryOf("intuition-pretraining")} />)
  expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Pretraining")

  const data = region("The data: text as it was found")
  expect(within(data).getAllByRole("article")).toHaveLength(4)
  const mix = within(data).getByRole("table")
  expect(within(mix).getAllByRole("row")).toHaveLength(6)
  expect(within(mix).getByText("60%")).toBeTruthy()
  expect(within(data).getByText("historical illustration")).toBeTruthy()

  const slicer = region("Where the label comes from")
  expect(within(slicer).getByTestId("slicer-target").textContent).toBe("Paris")
  fireEvent.click(within(slicer).getByRole("button", { name: "France" }))
  expect(within(slicer).getByTestId("slicer-target").textContent).toBe("France")
  expect(within(slicer).getByRole("button", { name: "France" }).getAttribute("aria-pressed")).toBe(
    "true",
  )
  const current = within(slicer).getByRole("listitem", { current: true })
  expect(current.textContent).toContain("The capital of")
  expect(within(slicer).getByRole("button", { name: "The" }).hasAttribute("disabled")).toBe(true)

  expect(screen.getByText(GPT3_BASE_COMPLETION)).toBeTruthy()
  expect(
    screen.getByRole("link", { name: "Transformers › Pretraining" }).getAttribute("href"),
  ).toBe("/learn/generative-ai/pretraining")
  expect(
    within(region("Three kinds of data, three techniques")).getAllByRole("article"),
  ).toHaveLength(3)
  expect(footerLinks()).toEqual(["← GPT → ChatGPT", "RLHF →"])
})

test("RLHF walks demonstrations, comparisons and RL with the InstructGPT figures", async () => {
  await renderPage(<TrainingIntuitionRlhfLesson entry={entryOf("intuition-rlhf")} />)
  expect(within(region(/Demonstrations/)).getAllByRole("article")).toHaveLength(3)

  const comparisons = region(/Comparisons/)
  expect(within(comparisons).getByRole("list", { name: "Ranked answers" }).children).toHaveLength(4)
  expect(within(comparisons).getByText("0.92")).toBeTruthy()

  const rl = region(/Reinforcement learning: practise/)
  for (const figure of ["~40", "13 k", "33 k", "31 k"]) {
    expect(within(rl).getByText(figure)).toBeTruthy()
  }

  expect(screen.getByText(GPT3_BASE_COMPLETION)).toBeTruthy()
  expect(screen.getByText(INSTRUCT_COMPLETION)).toBeTruthy()
  const table = within(region("Three steps, three kinds of data")).getByRole("table")
  expect(within(table).getAllByRole("columnheader")).toHaveLength(5)
  expect(within(table).getAllByRole("row")).toHaveLength(4)
  expect(
    screen.getByRole("link", { name: "Transformers › Post-training" }).getAttribute("href"),
  ).toBe("/learn/generative-ai/post-training")
  expect(footerLinks()).toEqual(["← Pretraining", "DPO →"])
})

test("pairsFromRanking turns a ranking of four into six ordered pairs", () => {
  expect(pairsFromRanking(["a", "b", "c", "d"])).toEqual([
    { chosen: "a", rejected: "b" },
    { chosen: "a", rejected: "c" },
    { chosen: "a", rejected: "d" },
    { chosen: "b", rejected: "c" },
    { chosen: "b", rejected: "d" },
    { chosen: "c", rejected: "d" },
  ])
})

test("DPO shows the pairs, the shift, the comparison table and the toy prompt", async () => {
  await renderPage(<TrainingIntuitionDpoLesson entry={entryOf("intuition-dpo")} />)
  const pairs = region("The same data, as pairs")
  expect(within(pairs).getByRole("group", { name: "One pair" })).toBeTruthy()
  expect(within(pairs).getByRole("list", { name: "Six pairs" }).children).toHaveLength(6)

  expect(
    within(region("The update: chosen up, rejected down"))
      .getByRole("img")
      .getAttribute("aria-label"),
  ).toContain("58%")
  const table = within(region("RLHF or DPO")).getByRole("table")
  expect(within(table).getAllByRole("row")).toHaveLength(6)

  const toy = region("Toy scale")
  expect(within(toy).getByText(TOY_FRANCE_PROMPT.prompt)).toBeTruthy()
  expect(within(toy).getAllByRole("article")).toHaveLength(5)

  const summary = region("Three kinds of data, three techniques")
  expect(within(summary).getByRole("article", { current: true }).getAttribute("aria-label")).toBe(
    "DPO",
  )
  expect(within(summary).getAllByRole("link")).toHaveLength(2)
  expect(footerLinks()).toEqual(["← RLHF", "Architecture →"])
})

test("the toy prompt mirrors the lab's France preference prompt", () => {
  const here = dirname(fileURLToPath(import.meta.url))
  const corpus = readFileSync(
    join(here, "..", "..", "..", "..", "..", "packages", "genai", "src", "genai", "toy_corpus.py"),
    "utf8",
  )
  expect(corpus).toContain('"What is the capital of France?"')
  for (const candidate of TOY_FRANCE_PROMPT.candidates) {
    const bare = candidate.text.trim()
    const spellings = [`"${bare}"`, `"${bare.replace(/\.$/, "")}"`]
    expect(spellings.some((quoted) => corpus.includes(quoted))).toBe(true)
    expect(corpus).toContain(`"${candidate.note}"`)
  }
})

import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router"
import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { translator } from "@/i18n/translate"
import { routeTree } from "@/routeTree.gen"
import { fairnessMetrics } from "./classification-fairness-metrics"

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(window, "scrollTo").mockImplementation(() => {})
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

async function openLesson() {
  const router = createRouter({
    routeTree,
    defaultPendingMinMs: 0,
    history: createMemoryHistory({
      initialEntries: ["/learn/machine-learning/classification-fairness"],
    }),
  })
  await router.load()
  render(<RouterProvider router={router} />)
  return screen.findByRole("heading", { level: 1 })
}

test("shows the exact candidate matrix and comparison before the takeaways", async () => {
  await openLesson()
  expect(
    screen.getByRole("img", {
      name: "Confusion matrix: 14 true positives, 6 false negatives, 40 false positives, 940 true negatives.",
    }),
  ).toBeTruthy()
  const comparison = screen.getByRole("table", { name: "Model comparison" })
  expect(
    within(comparison).getByRole("columnheader", { name: "Performance" }).getAttribute("colspan"),
  ).toBe("2")
  expect(within(comparison).getByRole("row", { name: /^Accuracy / }).textContent).toContain(
    "98.00%95.40%",
  )
  expect(within(comparison).getByRole("row", { name: /^Precision / }).textContent).toContain(
    "—25.93%",
  )
  expect(within(comparison).getByRole("row", { name: /^Brier score / }).textContent).toContain(
    "0.01960.0282",
  )
  const takeaways = screen.getByRole("region", { name: "Main takeaways" })
  expect(
    comparison.compareDocumentPosition(takeaways) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy()
  expect(within(comparison).getAllByRole("row")).toHaveLength(17)
  expect(screen.getByRole("table", { name: "Choosing classification metrics" })).toBeTruthy()
})

test("Portuguese covers the revised story, comparison, and all metric descriptions", async () => {
  localStorage.setItem("ai-intro-language", "pt-BR")
  expect((await openLesson()).textContent).toContain("Classificação")
  expect(screen.getByRole("table", { name: "Comparação dos modelos" })).toBeTruthy()
  expect(screen.getByRole("region", { name: "Principais conclusões" })).toBeTruthy()
  const t = translator("pt-BR")
  for (const metric of fairnessMetrics) {
    for (const key of [
      "name",
      "what",
      "why",
      "good",
      "note",
      "balanced",
      "imbalanced",
      "fairness",
    ] as const) {
      expect(t(metric[key]), `${metric.key}.${key}`).not.toBe(metric[key])
    }
  }
})

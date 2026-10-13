import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router"
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { routeTree } from "@/routeTree.gen"

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(window, "scrollTo").mockImplementation(() => {})
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

async function openLesson() {
  const router = createRouter({
    routeTree,
    defaultPendingMinMs: 0,
    history: createMemoryHistory({
      initialEntries: ["/learn/machine-learning/classification-metrics"],
    }),
  })
  await router.load()
  render(<RouterProvider router={router} />)
  await screen.findByRole("button", { name: "Train to epoch 10" })
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
  return router
}

const epoch = () =>
  within(screen.getByLabelText("Performance"))
    .getByText("Epoch", { selector: "dt" })
    .parentElement?.querySelector("dd")?.textContent
const button = (name: string | RegExp) => screen.getByRole("button", { name })
/** One act per tick: React schedules the next tick only after committing the previous one. */
const playTicks = (count: number) => {
  for (let i = 0; i < count; i++) act(() => vi.advanceTimersByTime(40))
}

test("opens already trained to epoch 10, with the three checkpoints on offer", async () => {
  await openLesson()
  expect(epoch()).toBe("10")
  for (const label of ["Train to epoch 10", "Train to epoch 40", "Train to epoch 100"]) {
    expect(button(label)).toBeTruthy()
  }
})

test("training to a later checkpoint continues from the current weights", async () => {
  await openLesson()
  fireEvent.click(button("Train to epoch 40"))
  playTicks(20)
  expect(epoch()).toBe("40")
})

test("training to an earlier checkpoint than the current epoch replays from scratch", async () => {
  await openLesson()
  fireEvent.click(button("Train to epoch 100"))
  playTicks(50)
  expect(epoch()).toBe("100")
  fireEvent.click(button("Train to epoch 10"))
  expect(epoch()).toBe("10")
}, 10_000)

test("Pause stops the run and can be resumed from the same checkpoint", async () => {
  await openLesson()
  fireEvent.click(button("Train to epoch 100"))
  playTicks(5)
  fireEvent.click(button("Pause"))
  const paused = epoch()
  playTicks(5)
  expect(epoch()).toBe(paused)
  fireEvent.click(button("Train to epoch 100"))
  playTicks(50)
  expect(epoch()).toBe("100")
}, 10_000)

const goToEvaluation = () => fireEvent.click(screen.getByRole("tab", { name: "Evaluation" }))
const modelEpoch = () =>
  within(screen.getByLabelText("Model configuration"))
    .getByText("Epoch", { selector: "dt" })
    .parentElement?.querySelector("dd")?.textContent

test("Evaluation shows the model configuration and a performance report before the confusion matrix", async () => {
  await openLesson()
  goToEvaluation()
  const config = screen.getByLabelText("Model configuration")
  expect(within(config).getByText("2 → 4 → 2 → 1")).toBeTruthy()
  expect(modelEpoch()).toBe("10")
  const report = screen.getByLabelText("Performance report")
  const confusion = screen.getByRole("heading", { name: /Confusion matrix/ })
  expect(report.compareDocumentPosition(confusion) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})

test("Train/Pause/Reset in Evaluation share state with Data & Learning", async () => {
  await openLesson()
  goToEvaluation()
  fireEvent.click(button("Train"))
  playTicks(10)
  fireEvent.click(button("Pause"))
  const trained = modelEpoch()
  expect(Number(trained)).toBeGreaterThan(10)
  fireEvent.click(button("Reset"))
  expect(modelEpoch()).toBe("0")
  fireEvent.click(screen.getByRole("tab", { name: "Data & Learning" }))
  expect(epoch()).toBe("0")
}, 10_000)

test("both tabs show the actual-vs-predicted risk table below their charts", async () => {
  await openLesson()
  expect(screen.getByRole("columnheader", { name: "Predicted risk" })).toBeTruthy()
  goToEvaluation()
  expect(screen.getByRole("columnheader", { name: "Predicted risk" })).toBeTruthy()
})

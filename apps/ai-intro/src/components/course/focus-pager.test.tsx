import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

import { routeTree } from "@/routeTree.gen"

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null)
  vi.spyOn(window, "scrollTo").mockImplementation(() => {})
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

async function openLesson(path: string) {
  const router = createRouter({
    routeTree,
    defaultPendingMinMs: 0,
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  await router.load()
  render(<RouterProvider router={router} />)
  await screen.findByRole("button", { name: "Focus mode" })
  return router
}

// Rendering the full route tree loads every lesson; under parallel test load this exceeds 5s.
test("hides the course chrome and pages through lessons while staying focused", async () => {
  const router = await openLesson("/learn/programming-vs-ml/programming")
  expect(screen.getByRole("banner")).toBeTruthy()
  expect(screen.queryByRole("navigation", { name: "Lesson navigation" })).toBeNull()

  fireEvent.click(screen.getByRole("button", { name: "Focus mode" }))
  expect(screen.queryByRole("banner")).toBeNull()
  expect(screen.queryByRole("navigation", { name: "Topics" })).toBeNull()

  fireEvent.click(screen.getByRole("link", { name: "Next: Machine Learning" }))
  await waitFor(() =>
    expect(router.state.location.pathname).toBe("/learn/programming-vs-ml/machine-learning"),
  )
  expect(screen.getByRole("button", { name: "Exit focus mode" })).toBeTruthy()
  expect(screen.getByRole("link", { name: "Previous: Programming" })).toBeTruthy()

  fireEvent.click(screen.getByRole("button", { name: "Exit focus mode" }))
  expect(screen.getByRole("banner")).toBeTruthy()
}, 15_000)

test("offers no previous link on the first lesson", async () => {
  await openLesson("/learn/programming-vs-ml/problem")
  fireEvent.click(screen.getByRole("button", { name: "Focus mode" }))
  expect(screen.queryByRole("link", { name: /^Previous/ })).toBeNull()
  expect(screen.getByRole("link", { name: "Next: Programming" })).toBeTruthy()
}, 15_000)

test("offers no next link on the last lesson", async () => {
  await openLesson("/learn/agents/multi-agent-systems")
  fireEvent.click(screen.getByRole("button", { name: "Focus mode" }))
  expect(screen.queryByRole("link", { name: /^Next/ })).toBeNull()
  expect(screen.getByRole("link", { name: "Previous: Planning Loops" })).toBeTruthy()
}, 15_000)

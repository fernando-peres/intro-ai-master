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
import { BackPropagationForwardBackwardLesson } from "./back-propagation-forward-backward"
import { BackPropagationOverviewLesson } from "./back-propagation-overview"
import { BackPropagationUnderTheHoodLesson } from "./back-propagation-theory"

afterEach(cleanup)

function entryOf(slug: string) {
  const entry = findLesson("neural-networks", slug)
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

test("Overview explains what backpropagation is and why, with its two-pass diagram", async () => {
  await renderPage(<BackPropagationOverviewLesson entry={entryOf("back-propagation")} />)
  expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Backpropagation")
  expect(screen.getByRole("img", { name: /Backpropagation in two steps/ })).toBeTruthy()
  expect(screen.queryByRole("button", { name: "Train" })).toBeNull()
  const concepts = screen.getByRole("region", { name: "Key concepts" })
  expect(within(concepts).getAllByRole("article")).toHaveLength(6)
})

test("Forward and Backward explains the four beats on a worked example", async () => {
  await renderPage(<BackPropagationForwardBackwardLesson entry={entryOf("forward-and-backward")} />)
  expect(screen.getByText(/Forward Pass \(The Attempt\)/)).toBeTruthy()
  expect(screen.getAllByRole("region", { name: "Backpropagation" }).length).toBeGreaterThan(0)
})

test("Key concepts holds seven numbered explainers", async () => {
  await renderPage(<BackPropagationUnderTheHoodLesson entry={entryOf("under-the-hood")} />)
  expect(screen.queryByRole("region", { name: "Key concepts" })).toBeNull()
  for (const name of [
    "Loss function",
    "Gradient descent",
    "Learning rate",
    "Vanishing and exploding gradients",
    "Optimizers",
    "Hidden-layer activation",
    "Output activation",
  ]) {
    expect(screen.getAllByRole("region", { name }).length).toBeGreaterThan(0)
  }
})

test("the gradient descent sliders move the plot's readout", async () => {
  await renderPage(<BackPropagationUnderTheHoodLesson entry={entryOf("under-the-hood")} />)
  fireEvent.change(screen.getByLabelText("Learning rate η"), { target: { value: "1.2" } })
  expect(screen.getByText("> 99")).toBeTruthy()
})

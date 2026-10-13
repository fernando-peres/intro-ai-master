import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router"
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { routeTree } from "@/routeTree.gen"

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
      initialEntries: ["/learn/neural-networks/activation-functions"],
    }),
  })
  await router.load()
  render(<RouterProvider router={router} />)
  return screen.findByRole("heading", { level: 1, name: "Activation functions" })
}

const section = (name: string) => screen.getByRole("region", { name })

test("covers every output and hidden-layer activation, then compares them", async () => {
  await openLesson()
  for (const name of [
    "Linear (no activation)",
    "Sigmoid",
    "Softmax",
    "Hyperbolic tangent (tanh)",
    "Rectified Linear Unit (ReLU)",
    "Leaky ReLU",
    "GELU and SiLU",
    "Side by side",
    "In a nutshell",
    "Cheat sheet",
  ]) {
    expect(section(name)).toBeTruthy()
  }
})

test("moving the bias pushes z through the activation to a new output", async () => {
  await openLesson()
  const relu = section("Rectified Linear Unit (ReLU)")
  expect(
    within(relu).getByRole("img", { name: "relu(z): z = 1.00 becomes output 1.00." }),
  ).toBeTruthy()
  fireEvent.change(within(relu).getByLabelText("Bias b"), { target: { value: "-1.5" } })
  expect(
    within(relu).getByRole("img", { name: "relu(z): z = −2.00 becomes output 0.00." }),
  ).toBeTruthy()

  const leaky = section("Leaky ReLU")
  fireEvent.change(within(leaky).getByLabelText("Bias b"), { target: { value: "-1.5" } })
  expect(
    within(leaky).getByRole("img", { name: "leaky_relu(z): z = −2.00 becomes output −0.20." }),
  ).toBeTruthy()
})

test("softmax probabilities always sum to 100%", async () => {
  await openLesson()
  const softmax = section("Softmax")
  fireEvent.change(within(softmax).getByLabelText("Logit z (class B)"), {
    target: { value: "3" },
  })
  expect(within(softmax).getByText("100%")).toBeTruthy()
})

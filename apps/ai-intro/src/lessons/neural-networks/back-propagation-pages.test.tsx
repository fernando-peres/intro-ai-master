import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router"
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
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

const line = (re: RegExp) =>
  screen.queryAllByText((_, el) => el?.tagName === "P" && re.test(el.textContent ?? ""))[0]

const heading = () => screen.getByRole("heading", { level: 2 }).textContent
const nextButton = () =>
  screen.getByRole("button", { name: /^Next( row)? ›$/ }) as HTMLButtonElement
const previousButton = () => screen.getByRole("button", { name: /Previous/ }) as HTMLButtonElement
const activeRow = () => screen.getByRole("row", { current: true }).textContent
const datasetSelect = () => screen.getByLabelText("Dataset") as HTMLSelectElement

async function renderStepByStep() {
  await renderPage(<BackPropagationForwardBackwardLesson entry={entryOf("forward-and-backward")} />)
}

test("Step by Step walks the five steps of a row with Previous and Next", async () => {
  await renderStepByStep()
  expect(heading()).toContain("Forward weights")
  expect(line(/z₁ = 1·1 \+ 0\.4·1 \+ 0 = 1\.400/)).toBeTruthy()
  expect(previousButton().disabled).toBe(true)
  for (const title of ["Activation function", "Loss", "Backward", "Update"]) {
    fireEvent.click(nextButton())
    expect(heading()).toContain(title)
    if (title === "Activation function") {
      expect(screen.getByRole("region", { name: "Math" })).toBeTruthy()
      expect(line(/2\. Activation function — Sigmoid/)).toBeTruthy()
      expect(line(/^a₁ = σ\(1\.400\) = 0\.802$/)).toBeTruthy()
    }
  }
  // Cumulative: the first step's math is still on screen at the last step.
  expect(line(/z₁ = 1·1 \+ 0\.4·1 \+ 0 = 1\.400/)).toBeTruthy()
  expect(line(/new loss: 0\.087 \(was 0\.716\)/)).toBeTruthy()
  expect(screen.getByRole("button", { current: "step" }).textContent).toBe("5")
  fireEvent.click(screen.getByRole("button", { name: /1\. Forward weights/ }))
  expect(heading()).toContain("Forward weights")
  expect(screen.queryByText(/new loss/)).toBeNull()
})

test("the data box starts on AND, with the dataset in a combo box above the table", async () => {
  await renderStepByStep()
  expect(datasetSelect().value).toBe("and")
  expect([...datasetSelect().options].map((o) => o.textContent)).toEqual(["AND", "OR", "XOR"])
  expect(screen.getAllByRole("row")).toHaveLength(5)
  expect(
    datasetSelect().compareDocumentPosition(screen.getAllByRole("row")[0]) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy()
  expect(
    screen.getByRole("img", {
      name: /x₁ against x₂, with the model.s predicted decision boundary/,
    }),
  ).toBeTruthy()
  const color = screen.getByLabelText("Color for Class 1") as HTMLInputElement
  fireEvent.change(color, { target: { value: "#ff0000" } })
  expect(color.value).toBe("#ff0000")
  fireEvent.click(screen.getByRole("button", { name: /Reset colors/ }))
  expect(color.value).toBe("#34d399")
})

test("the untrained network already has a decision boundary line to draw", async () => {
  await renderStepByStep()
  const chart = screen.getByRole("img", { name: /predicted decision boundary/ })
  const lines = [...chart.querySelectorAll("path")].filter((p) =>
    p.getAttribute("class")?.includes("stroke-fg"),
  )
  expect(lines.length).toBeGreaterThan(0)
  expect(lines[0].getAttribute("d")?.length).toBeGreaterThan(10)
})

test("finishing a row updates the network and moves the cursor to the next row", async () => {
  await renderStepByStep()
  expect(activeRow()).toContain("▶111")
  for (let i = 0; i < 4; i++) fireEvent.click(nextButton())
  expect(nextButton().textContent).toContain("Next row")
  fireEvent.click(nextButton())
  expect(activeRow()).toContain("010")
  expect(heading()).toContain("Forward weights")
  expect(screen.getByText("Network updated by row 1")).toBeTruthy()
  // Row 2 starts from row 1's updated parameters, not the initial ones.
  expect(line(/z₁ = 0\.886·0 \+ 0\.286·1 \+ -0\.114 = /)).toBeTruthy()
  // Previous crosses back over the row boundary, to the last step of row 1.
  fireEvent.click(previousButton())
  expect(heading()).toContain("Update")
  expect(activeRow()).toContain("▶111")
})

test("the loss and accuracy readouts follow completed rows", async () => {
  await renderStepByStep()
  const loss = () => screen.getByText(/^Loss: /).textContent
  expect(screen.getByText(/^Accuracy: /).textContent).toBe("Accuracy: 25%")
  expect(loss()).toBe("Loss: 0.746")
  for (let i = 0; i < 4 * 5; i++) fireEvent.click(nextButton())
  expect(loss()).not.toBe("Loss: 0.746")
  expect(screen.getAllByRole("img", { name: /over Updates/ })).toHaveLength(2)
})

test("switching the dataset restarts training on its four corners", async () => {
  await renderStepByStep()
  for (let i = 0; i < 7; i++) fireEvent.click(nextButton())
  fireEvent.change(datasetSelect(), { target: { value: "xor" } })
  expect(heading()).toContain("Forward weights")
  expect(activeRow()).toContain("▶110")
  expect(screen.getAllByRole("row")).toHaveLength(5)
  expect(screen.getByText(/^Loss: /).textContent).toBe("Loss: 0.701")
  fireEvent.change(datasetSelect(), { target: { value: "and" } })
  expect(activeRow()).toContain("▶111")
})

test("Next epoch jumps to the first row of the next epoch, with every row trained", async () => {
  await renderStepByStep()
  fireEvent.click(nextButton())
  fireEvent.click(screen.getByRole("button", { name: /Next epoch/ }))
  expect(screen.getByText(/Epoch 2/)).toBeTruthy()
  expect(activeRow()).toContain("▶111")
  expect(heading()).toContain("Forward weights")
  expect(screen.getByText("Network updated by row 4")).toBeTruthy()
  // Loss reflects the four updates of epoch 1, not the untrained network.
  expect(screen.getByText(/^Loss: /).textContent).not.toBe("Loss: 0.746")
  fireEvent.click(screen.getByRole("button", { name: /Next epoch/ }))
  expect(screen.getByText(/Epoch 3/)).toBeTruthy()
})

test("the decision boundary keeps one faded line per finished epoch", async () => {
  await renderStepByStep()
  const epochLines = () =>
    screen
      .getByRole("img", { name: /predicted decision boundary/ })
      .querySelectorAll('path[stroke^="#"]')
  expect(epochLines()).toHaveLength(1)
  // The bold line for the network now is drawn on top whenever it crosses the square.
  expect(
    screen
      .getByRole("img", { name: /predicted decision boundary/ })
      .querySelector("path.stroke-fg"),
  ).toBeTruthy()
  fireEvent.click(screen.getByRole("button", { name: /Next epoch/ }))
  expect(epochLines()).toHaveLength(2)
  fireEvent.click(screen.getByRole("button", { name: /Next epoch/ }))
  expect(epochLines()).toHaveLength(3)
  // Orange (not the white of the bold line), newer epochs more opaque.
  const alphas = [...epochLines()].map((p) => {
    const stroke = p.getAttribute("stroke") ?? ""
    expect(stroke).toMatch(/^#d9742e[0-9a-f]{2}$/i)
    return Number.parseInt(stroke.slice(7), 16)
  })
  expect(alphas).toEqual([...alphas].sort((a, b) => a - b))
})

test("each math box has an info button that opens what its variables mean", async () => {
  await renderStepByStep()
  fireEvent.click(nextButton())
  const buttons = () => screen.getAllByRole("button", { name: "What the variables mean" })
  expect(buttons()).toHaveLength(2)
  expect(screen.queryByText("where:")).toBeNull()
  fireEvent.click(buttons()[0])
  expect(buttons()[0].getAttribute("aria-expanded")).toBe("true")
  expect(screen.getByText("where:")).toBeTruthy()
  expect(screen.getByText(/The weight from input k to hidden neuron j/)).toBeTruthy()
  // Boxes open independently.
  expect(screen.queryByText(/The sigmoid activation/)).toBeNull()
  fireEvent.click(buttons()[1])
  expect(screen.getByText(/The sigmoid activation/)).toBeTruthy()
  expect(screen.getAllByText("where:")).toHaveLength(2)
  fireEvent.click(buttons()[0])
  expect(screen.queryByText(/The weight from input k to hidden neuron j/)).toBeNull()
})

test("the Math zoom opens a dialog with the same math in bigger type, and closes", async () => {
  await renderStepByStep()
  fireEvent.click(nextButton())
  expect(screen.queryByRole("dialog")).toBeNull()
  fireEvent.click(screen.getByRole("button", { name: "Zoom math" }))
  const dialog = screen.getByRole("dialog", { name: "Math" })
  const inDialog = within(dialog)
  expect(inDialog.getAllByRole("region")).toHaveLength(2)
  expect(dialog.textContent).toContain("a₁ = σ(1.400) = 0.802")
  const big = dialog.querySelector("p.text-fg-muted")
  expect(big?.parentElement?.className).toContain("text-xl")
  // The inline copy stays small.
  const inline = screen.getAllByRole("region", { name: "Math" })[0]
  expect(inline.querySelector("p.text-fg-muted")?.parentElement?.className).toContain("text-xs")
  fireEvent.keyDown(window, { key: "Escape" })
  expect(screen.queryByRole("dialog")).toBeNull()
  fireEvent.click(screen.getByRole("button", { name: "Zoom math" }))
  // The backdrop and the title-bar button both close it.
  fireEvent.click(
    within(screen.getByRole("dialog")).getAllByRole("button", { name: "Back to original size" })[1],
  )
  expect(screen.queryByRole("dialog")).toBeNull()
})

describe("Train and Reset", () => {
  afterEach(() => vi.useRealTimers())

  test("Train completes a row per tick, Pause stops it, Reset starts over", async () => {
    await renderStepByStep()
    vi.useFakeTimers()
    const train = () => screen.getByRole("button", { name: /^(Train|Pause)$/ })
    const reset = () => screen.getByRole("button", { name: /Reset$/ }) as HTMLButtonElement
    fireEvent.click(train())
    expect(train().textContent).toBe("Pause")
    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(heading()).toContain("Update")
    expect(activeRow()).toContain("▶111")
    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(activeRow()).toContain("010")
    fireEvent.click(train())
    expect(train().textContent).toBe("Train")
    const pausedAt = activeRow()
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(activeRow()).toBe(pausedAt)
    fireEvent.click(reset())
    expect(heading()).toContain("Forward weights")
    expect(activeRow()).toContain("▶111")
    expect(reset().disabled).toBe(true)
  })

  test("Train runs to the last epoch and stops by itself", async () => {
    await renderStepByStep()
    vi.useFakeTimers()
    fireEvent.click(screen.getByRole("button", { name: /^Train$/ }))
    // One act per tick: each tick's state update re-arms the next timeout.
    for (let i = 0; i < 4 * 40 + 2; i++) {
      act(() => {
        vi.advanceTimersByTime(150)
      })
    }
    expect(screen.getByRole("button", { name: /^Train$/ })).toBeTruthy()
    expect(nextButton().disabled).toBe(true)
    expect(screen.getByText(/^Accuracy: /).textContent).toBe("Accuracy: 100%")
  }, 30_000)
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

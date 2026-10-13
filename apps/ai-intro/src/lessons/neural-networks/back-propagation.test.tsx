import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router"
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { LanguageProvider } from "@/i18n/language"
import { BackPropagationLabLesson } from "./back-propagation"

async function renderLesson() {
  const rootRoute = createRootRoute({
    component: () => (
      <LanguageProvider>
        <BackPropagationLabLesson />
      </LanguageProvider>
    ),
  })
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  })
  await router.load()
  const view = render(<RouterProvider router={router} />)
  await screen.findByRole("button", { name: "Step" })
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
  return view
}

const stat = (label: string) =>
  within(screen.getByLabelText("Run metrics"))
    .queryByText(label, { selector: "dt" })
    ?.parentElement?.querySelector("dd")?.textContent
const button = (name: string | RegExp) => screen.getByRole("button", { name })
const datasetSelect = () => screen.getByRole("combobox", { name: "Dataset" }) as HTMLSelectElement
const chooseDataset = (value: string) => fireEvent.change(datasetSelect(), { target: { value } })
const toggle = (name: string) => screen.getByRole("switch", { name })
/** One act per tick: React schedules the next tick only after committing the previous one. */
const playTicks = (count: number) => {
  for (let i = 0; i < count; i++) act(() => vi.advanceTimersByTime(40))
}

beforeEach(() => localStorage.clear())
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

test("opens on XOR with the default architecture and an evaluated epoch-0 baseline", async () => {
  await renderLesson()
  expect(datasetSelect().value).toBe("xor")
  expect(button("tanh").getAttribute("aria-pressed")).toBe("true")
  expect(stat("Epoch")).toBe("0")
  expect(screen.getByText("2 → 4 → 4 → 1")).toBeTruthy()
  expect(screen.getByText(/Press Train\. Each small square is what one neuron/)).toBeTruthy()
})

test("Step advances exactly one epoch", async () => {
  await renderLesson()
  fireEvent.click(button("Step"))
  expect(stat("Epoch")).toBe("1")
})

test("zero hidden layers on XOR never solves within a short run and names the Perceptron", async () => {
  await renderLesson()
  const removeLayerButton = () => button("Remove a hidden layer")
  fireEvent.click(removeLayerButton())
  fireEvent.click(removeLayerButton())
  expect(screen.getByText("2 → 1")).toBeTruthy()
  fireEvent.click(button("Train"))
  playTicks(60)
  expect(
    screen.getByText(/No hidden layer = a single neuron — the same Perceptron you just saw\./),
  ).toBeTruthy()
})

test("the default architecture solves XOR with backpropagation", async () => {
  await renderLesson()
  fireEvent.click(button("Train"))
  playTicks(150)
  expect(
    screen.getByText(/✓ Solved — \d hidden layer\(s\) and backpropagation found a boundary/),
  ).toBeTruthy()
  expect(button("Train").hasAttribute("disabled")).toBe(true)
})

test("toggling Train/Pause quickly keeps a single training loop", async () => {
  await renderLesson()
  fireEvent.click(button("Train"))
  fireEvent.click(button("Pause"))
  fireEvent.click(button("Train"))
  expect(vi.getTimerCount()).toBe(1)
})

test("reset restarts training and keeps the configuration", async () => {
  await renderLesson()
  chooseDataset("moons")
  fireEvent.click(toggle("Show weights"))
  fireEvent.click(button("Step"))
  fireEvent.click(button("Reset"))
  expect(datasetSelect().value).toBe("moons")
  expect(toggle("Show weights").getAttribute("aria-checked")).toBe("true")
  expect(stat("Epoch")).toBe("0")
})

test("unmounting during playback leaves no scheduled tick", async () => {
  const view = await renderLesson()
  fireEvent.click(button("Train"))
  expect(vi.getTimerCount()).toBe(1)
  view.unmount()
  expect(vi.getTimerCount()).toBe(0)
})

test("links forward to the forward and backward lesson", async () => {
  await renderLesson()
  const link = screen.getByRole("link", { name: /Next: step by step/ })
  expect(link.getAttribute("href")).toBe("/learn/neural-networks/forward-and-backward")
})

test("the math panel opens behind Show math", async () => {
  await renderLesson()
  fireEvent.click(toggle("Show math"))
  expect(screen.getByText("Weights & math")).toBeTruthy()
})

test("the machines dataset plots raw readings and shows its description", async () => {
  await renderLesson()
  chooseDataset("machines")
  expect(screen.getByText(/The 30 machine readings from Programming vs ML/)).toBeTruthy()
  expect(screen.getByLabelText("Temperature (°C)")).toBeTruthy()
  expect(stat("Epoch")).toBe("0")
})

test("the gradient descent history records every epoch, not one per tick", async () => {
  await renderLesson()
  fireEvent.click(button("Train"))
  playTicks(5)
  const epochs = Number(stat("Epoch"))
  expect(epochs).toBe(10)
  expect(screen.getByText(`${epochs} epochs recorded`)).toBeTruthy()
  const history = screen.getByRole("img", { name: /Loss at every recorded epoch/ })
  expect(history.querySelectorAll("circle")).toHaveLength(epochs + 1)
})

test("the Rings dataset is available and the learning-rate box spans 0.001 to 30", async () => {
  await renderLesson()
  chooseDataset("rings")
  expect(screen.getByText(/A core of 12 points inside a ring of 12/)).toBeTruthy()
  const rates = within(screen.getByRole("combobox", { name: "Learning rate" }))
    .getAllByRole("option")
    .map((o) => o.textContent)
  expect(rates[0]).toBe("0.001")
  expect(rates[rates.length - 1]).toBe("30")
})

test("every chart on the page can be expanded and returned to its original size", async () => {
  await renderLesson()
  const buttons = screen.getAllByRole("button", { name: "Expand chart" })
  // Network, decision boundary, performance, gradient descent + history.
  expect(buttons.length).toBeGreaterThanOrEqual(5)
  fireEvent.click(buttons[1])
  expect(screen.getByRole("dialog", { name: "Decision boundary" })).toBeTruthy()
  const back = screen.getAllByRole("button", { name: "Back to original size" })
  fireEvent.click(back[back.length - 1])
  expect(screen.queryByRole("dialog")).toBeNull()
})

test("the class colors recolor the decision plot legend and reset to the theme", async () => {
  await renderLesson()
  const picker = screen.getByLabelText("Color for class 0") as HTMLInputElement
  fireEvent.change(picker, { target: { value: "#ff0000" } })
  expect(document.querySelector('[style*="rgb(255, 0, 0)"]')).toBeTruthy()
  fireEvent.click(button("Reset colors"))
  expect(document.querySelector('[style*="rgb(255, 0, 0)"]')).toBeNull()
})

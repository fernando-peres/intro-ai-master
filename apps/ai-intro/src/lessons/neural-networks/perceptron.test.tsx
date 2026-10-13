import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router"
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { LanguageProvider } from "@/i18n/language"
import { PerceptronLesson } from "./perceptron"

async function renderLesson() {
  const rootRoute = createRootRoute({
    component: () => (
      <LanguageProvider>
        <PerceptronLesson />
      </LanguageProvider>
    ),
  })
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  })
  await router.load()
  const view = render(<RouterProvider router={router} />)
  await screen.findByRole("button", { name: "Step 1 epoch" })
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
  for (let i = 0; i < count; i++) act(() => vi.advanceTimersByTime(140))
}

beforeEach(() => localStorage.clear())
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

test("opens on OR with the step perceptron and an evaluated epoch-0 baseline", async () => {
  await renderLesson()
  expect(datasetSelect().value).toBe("or")
  expect(button("Step — perceptron").getAttribute("aria-pressed")).toBe("true")
  expect(stat("Epoch")).toBe("0")
  expect(stat("Misclassified")).toBe("2 / 4")
  expect(stat("Training accuracy")).toBe("50%")
  expect(stat("Binary cross-entropy")).toBeUndefined()
  expect(screen.getByText("Press Play or Step 1 epoch to watch the line move.")).toBeTruthy()
})

test("selectors live in the configuration rail and playback in the network toolbar", async () => {
  await renderLesson()
  const config = screen.getByRole("region", { name: "Configuration" })
  expect(within(config).getByRole("combobox", { name: "Dataset" })).toBeTruthy()
  expect(within(config).getByRole("button", { name: "Step — perceptron" })).toBeTruthy()
  const network = screen.getByRole("region", { name: "Network" })
  for (const name of ["Play", "Step 1 epoch", "Reset"]) {
    expect(within(network).getByRole("button", { name })).toBeTruthy()
  }
})

test("the workbench shows Network, Decision plot and Performance panels with run metrics in the toolbar", async () => {
  await renderLesson()
  for (const name of ["Network", "Decision plot", "Performance"]) {
    expect(screen.getByRole("region", { name })).toBeTruthy()
  }
  const network = screen.getByRole("region", { name: "Network" })
  expect(within(network).getByLabelText("Run metrics")).toBeTruthy()
  expect(screen.getByRole("img", { name: /Misclassified over Epoch/ })).toBeTruthy()
})

test("Step 1 epoch advances exactly one epoch", async () => {
  await renderLesson()
  fireEvent.click(button("Step 1 epoch"))
  expect(stat("Epoch")).toBe("1")
})

test("playback solves OR, then disables Play and Step", async () => {
  await renderLesson()
  fireEvent.click(button("Play"))
  playTicks(10)
  expect(stat("Epoch")).toBe("6")
  expect(stat("Misclassified")).toBe("0 / 4")
  expect(
    screen.getByText(
      "All training points are correctly classified. This line separates this dataset.",
    ),
  ).toBeTruthy()
  expect(button("Play").hasAttribute("disabled")).toBe(true)
  expect(button("Step 1 epoch").hasAttribute("disabled")).toBe(true)
})

test("toggling Play/Pause quickly keeps a single training loop", async () => {
  await renderLesson()
  fireEvent.click(button("Play"))
  fireEvent.click(button("Pause"))
  fireEvent.click(button("Play"))
  expect(vi.getTimerCount()).toBe(1)
  playTicks(2)
  expect(stat("Epoch")).toBe("2")
})

test("XOR explains its structural limitation before any training", async () => {
  await renderLesson()
  chooseDataset("xor")
  expect(screen.getAllByText("Not linearly separable").length).toBeGreaterThan(0)
  expect(
    screen.getByText(
      "Opposite corners have the same label. Every straight boundary leaves at least one mistake.",
    ),
  ).toBeTruthy()
})

test("sigmoid shows cross-entropy and keeps training after 100% accuracy", async () => {
  await renderLesson()
  fireEvent.click(button("Sigmoid — logistic regression"))
  expect(stat("Binary cross-entropy")).toMatch(/^\d+\.\d{3}$/)
  for (let i = 0; i < 12; i++) fireEvent.click(button("Step 1 epoch"))
  expect(stat("Misclassified")).toBe("0 / 4")
  expect(button("Step 1 epoch").hasAttribute("disabled")).toBe(false)
  expect(
    screen.getByText(
      "All training points are correctly classified. Probabilities and loss can still change.",
    ),
  ).toBeTruthy()
})

test("reset restarts training and keeps the configuration", async () => {
  await renderLesson()
  chooseDataset("xor")
  fireEvent.click(toggle("Show weights"))
  fireEvent.click(button("Step 1 epoch"))
  fireEvent.click(button("Reset"))
  expect(datasetSelect().value).toBe("xor")
  expect(toggle("Show weights").getAttribute("aria-checked")).toBe("true")
  expect(stat("Epoch")).toBe("0")
})

test("the math panel shows the last real update separately from the selected point", async () => {
  await renderLesson()
  fireEvent.click(toggle("Show math"))
  expect(screen.getByText("No training update yet.")).toBeTruthy()
  fireEvent.click(button("Step 1 epoch"))
  expect(screen.getByText("Last training update")).toBeTruthy()
  expect(screen.getByText("Selected point with current weights")).toBeTruthy()
})

test("unmounting during playback leaves no scheduled tick", async () => {
  const view = await renderLesson()
  fireEvent.click(button("Play"))
  expect(vi.getTimerCount()).toBe(1)
  view.unmount()
  expect(vi.getTimerCount()).toBe(0)
})

test("links to the existing back-propagation lesson", async () => {
  await renderLesson()
  const link = screen.getByRole("link", { name: /Next: hidden layers and back-propagation/ })
  expect(link.getAttribute("href")).toBe("/learn/neural-networks/back-propagation")
})

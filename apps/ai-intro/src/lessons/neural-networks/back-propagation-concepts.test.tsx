import { render, screen, within } from "@testing-library/react"
import { BackPropagationConcepts } from "./back-propagation-concepts"
import { LEARNING_RATE_PRESETS } from "./back-propagation-training"

const risingHistory = Array.from({ length: 20 }, (_, i) => ({ epoch: i, loss: 1 - i * 0.04 }))
const flatHistory = Array.from({ length: 20 }, (_, i) => ({
  epoch: i,
  loss: Math.LN2 + (i % 2 === 0 ? 0.0001 : -0.0001),
}))

test("renders one labelled live graphic per key concept", () => {
  render(
    <BackPropagationConcepts
      hiddenLayers={[4, 4]}
      activation="tanh"
      learningRate={0.3}
      learningRatePresets={LEARNING_RATE_PRESETS}
      epoch={10}
      pointCount={4}
      history={risingHistory}
    />,
  )
  const titles = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)
  expect(titles).toEqual([
    "Hidden layers",
    "Nonlinear activation",
    "Backpropagation",
    "Learning rate",
    "Epoch",
    "Vanishing gradients",
  ])
  for (const card of screen.getAllByRole("article")) {
    const graphic = within(card).getByRole("img")
    expect(graphic.getAttribute("aria-label")).toBeTruthy()
    expect(within(card).getByText("What", { selector: "dt" })).toBeTruthy()
    expect(within(card).getByText("Why", { selector: "dt" })).toBeTruthy()
  }
})

test("the epoch graphic reports progress toward the limit", () => {
  render(
    <BackPropagationConcepts
      hiddenLayers={[4, 4]}
      activation="tanh"
      learningRate={0.3}
      learningRatePresets={LEARNING_RATE_PRESETS}
      epoch={15}
      pointCount={4}
      history={risingHistory}
    />,
  )
  expect(screen.getByRole("img", { name: /Epoch 15 of/ })).toBeTruthy()
})

test("the vanishing-gradients graphic reports a stall once loss has flattened", () => {
  render(
    <BackPropagationConcepts
      hiddenLayers={[4, 4, 4, 4, 4, 4, 4, 4]}
      activation="sigmoid"
      learningRate={0.3}
      learningRatePresets={LEARNING_RATE_PRESETS}
      epoch={19}
      pointCount={4}
      history={flatHistory}
    />,
  )
  expect(screen.getByRole("img", { name: /loss history is flat/ })).toBeTruthy()
})

test("the vanishing-gradients graphic reports movement while loss is still falling", () => {
  render(
    <BackPropagationConcepts
      hiddenLayers={[4, 4]}
      activation="tanh"
      learningRate={0.3}
      learningRatePresets={LEARNING_RATE_PRESETS}
      epoch={19}
      pointCount={4}
      history={risingHistory}
    />,
  )
  expect(screen.getByRole("img", { name: /loss history is still moving/ })).toBeTruthy()
})

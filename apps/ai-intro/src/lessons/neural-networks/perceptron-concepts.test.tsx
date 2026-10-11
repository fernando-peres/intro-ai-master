import { render, screen, within } from "@testing-library/react"
import { INITIAL_PARAMS, score } from "@/lib/perceptron"
import { contributions, PerceptronConcepts } from "./perceptron-concepts"
import { DATASETS } from "./perceptron-data"

const point = { id: "p", x1: 0.6, x2: -0.4, y: 1 as const }

test("weighted-sum contributions add up to the score", () => {
  const params = { w1: 1.5, w2: -0.75, b: 0.2 }
  const parts = contributions(params, point)
  expect(parts.map((p) => p.key)).toEqual(["w1x1", "w2x2", "b"])
  expect(parts.reduce((sum, p) => sum + p.value, 0)).toBeCloseTo(score(params, point), 12)
})

test("renders one labelled live graphic per key concept", () => {
  render(
    <PerceptronConcepts
      params={INITIAL_PARAMS}
      activation="sigmoid"
      selected={DATASETS.or.points[0]}
      pointCount={4}
      epoch={3}
      separable
    />,
  )
  const titles = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)
  expect(titles).toEqual([
    "Inputs",
    "Weights",
    "Bias",
    "Weighted sum",
    "Activation",
    "Learning rate",
    "Epoch",
    "Linear separability",
  ])
  for (const card of screen.getAllByRole("article")) {
    const graphic = within(card).getByRole("img")
    expect(graphic.getAttribute("aria-label")).toBeTruthy()
  }
})

test("the epoch graphic reports progress toward the limit", () => {
  render(
    <PerceptronConcepts
      params={INITIAL_PARAMS}
      activation="step"
      selected={DATASETS.xor.points[0]}
      pointCount={4}
      epoch={15}
      separable={false}
    />,
  )
  expect(screen.getByRole("img", { name: /Epoch 15 of 60/ })).toBeTruthy()
  expect(screen.getByRole("img", { name: /not linearly separable/i })).toBeTruthy()
})

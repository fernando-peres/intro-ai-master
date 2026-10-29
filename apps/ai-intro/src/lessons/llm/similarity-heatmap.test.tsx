import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { SimilarityHeatmap } from "./similarity-heatmap"

afterEach(cleanup)

const labels = ["a", "b", "c"]
const matrix = [
  [1, 0.5, -0.25],
  [0.5, 1, 0.1],
  [-0.25, 0.1, 1],
]
const base = {
  labels,
  matrix,
  selected: null,
  onSelect: () => {},
  ariaLabel: "Sentence similarity",
}
const cells = () => screen.getAllByTestId("similarity-cell")

test("draws n × n cells carrying their value, with row and column labels", () => {
  render(<SimilarityHeatmap {...base} />)
  expect(cells()).toHaveLength(9)
  expect(cells()[1].getAttribute("data-value")).toBe("0.5")
  expect(cells()[2].getAttribute("data-value")).toBe("-0.25")
  expect(screen.getAllByText("a")).toHaveLength(2)
  expect(screen.getByRole("img", { name: "Sentence similarity" })).toBeTruthy()
})

test("positive values use the warm color, negatives the amber one, opacity is |value|", () => {
  render(<SimilarityHeatmap {...base} />)
  expect(cells()[1].getAttribute("fill")).toBe("var(--color-chart-warm)")
  expect(cells()[1].getAttribute("fill-opacity")).toBe("0.5")
  expect(cells()[2].getAttribute("fill")).toBe("var(--color-chart-amber)")
  expect(cells()[2].getAttribute("fill-opacity")).toBe("0.25")
})

test("clicking or pressing Enter on a cell reports its row and column", () => {
  const onSelect = vi.fn()
  render(<SimilarityHeatmap {...base} onSelect={onSelect} />)
  fireEvent.click(cells()[5])
  fireEvent.keyDown(cells()[3], { key: "Enter" })
  expect(onSelect.mock.calls).toEqual([
    [1, 2],
    [1, 0],
  ])
})

test("marks the selected cell as pressed and formats values with the given formatter", () => {
  render(<SimilarityHeatmap {...base} selected={[0, 1]} format={(v) => `${v * 100}%`} />)
  expect(cells()[1].getAttribute("aria-pressed")).toBe("true")
  expect(cells()[0].getAttribute("aria-pressed")).toBe("false")
  expect(screen.getAllByText("50%").length).toBeGreaterThan(0)
})

test("scales values above 1 (dot product, distances) so the opacity stays within range", () => {
  render(
    <SimilarityHeatmap
      {...base}
      matrix={[
        [0, 4],
        [4, 0],
      ]}
      labels={["a", "b"]}
    />,
  )
  expect(cells()[1].getAttribute("fill-opacity")).toBe("1")
  expect(Number(cells()[0].getAttribute("fill-opacity"))).toBeLessThanOrEqual(1)
})

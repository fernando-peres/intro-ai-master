import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { EmbeddingScatter } from "./embedding-scatter"

afterEach(cleanup)

const series = [
  { key: "words", label: "words", color: "var(--color-chart-warm)" },
  { key: "target", label: "analogy target", color: "var(--color-chart-amber)" },
]
const points = [
  { id: "king", label: "king", x: 1, y: 2, series: "words" },
  { id: "queen", label: "queen", x: 3, y: 4, series: "words" },
  { id: "answer", label: "queen*", x: 2, y: 1, series: "target" },
]
const base = { points, series, caption: "2 of 300 dimensions", ariaLabel: "Word map" }

const dots = () => screen.getAllByTestId("embedding-point")

test("draws one focusable button per point with a tooltip title and the caption", () => {
  render(<EmbeddingScatter {...base} />)
  expect(dots()).toHaveLength(3)
  expect(dots()[0].getAttribute("role")).toBe("button")
  expect(dots()[0].getAttribute("tabindex")).toBe("0")
  expect(dots()[0].getAttribute("data-label")).toBe("king")
  expect(within(dots()[0]).getByText(/^king \(1\.00, 2\.00\)$/)).toBeTruthy()
  expect(screen.getByRole("img", { name: "Word map" })).toBeTruthy()
  expect(screen.getByText("2 of 300 dimensions")).toBeTruthy()
})

test("colors points by series and fills the selected ones in the brand colour", () => {
  render(<EmbeddingScatter {...base} selected={["queen"]} />)
  const [king, queen, answer] = dots()
  expect(king.getAttribute("fill")).toBe("var(--color-chart-warm)")
  expect(answer.getAttribute("fill")).toBe("var(--color-chart-amber)")
  expect(queen.getAttribute("fill")).toBe("var(--color-brand)")
  expect(queen.getAttribute("aria-pressed")).toBe("true")
  expect(king.getAttribute("aria-pressed")).toBe("false")
})

test("click and the Enter key both select a point by id", () => {
  const onSelect = vi.fn()
  render(<EmbeddingScatter {...base} onSelect={onSelect} />)
  fireEvent.click(dots()[1])
  fireEvent.keyDown(dots()[2], { key: "Enter" })
  expect(onSelect.mock.calls).toEqual([["queen"], ["answer"]])
})

test("labels points that share rounded coordinates once", () => {
  const stacked = [
    { id: "a", label: "doctor", x: 1.001, y: 2, series: "words" },
    { id: "b", label: "nurse", x: 1.002, y: 2, series: "words" },
  ]
  const { container } = render(<EmbeddingScatter {...base} points={stacked} />)
  expect(dots()).toHaveLength(2)
  const labels = [...container.querySelectorAll("text[data-point-label]")]
  expect(labels.map((l) => l.textContent)).toEqual(["doctor / nurse"])
})

test("hides labels when showLabels is off", () => {
  const { container } = render(<EmbeddingScatter {...base} showLabels={false} />)
  expect(container.querySelectorAll("text[data-point-label]")).toHaveLength(0)
})

test("draws a labelled arrow for each pair of coordinates, dashed on request", () => {
  const arrows = [
    { from: { x: 1, y: 2 }, to: { x: 3, y: 4 }, label: "A → B" },
    { from: { x: 2, y: 1 }, to: { x: 3, y: 4 }, label: "C → target", dashed: true },
  ]
  render(<EmbeddingScatter {...base} arrows={arrows} />)
  const drawn = screen.getAllByTestId("embedding-arrow")
  expect(drawn).toHaveLength(2)
  expect(drawn[0].getAttribute("stroke-dasharray")).toBeNull()
  expect(drawn[1].getAttribute("stroke-dasharray")).toBeTruthy()
  expect(screen.getByText("C → target")).toBeTruthy()
})

test("lists every series in the legend", () => {
  render(<EmbeddingScatter {...base} />)
  expect(screen.getByText("analogy target")).toBeTruthy()
})

test("shows a short message instead of a plot when there are no points", () => {
  render(<EmbeddingScatter {...base} points={[]} />)
  expect(screen.queryByRole("img")).toBeNull()
  expect(screen.getByText("No points to draw yet.")).toBeTruthy()
})

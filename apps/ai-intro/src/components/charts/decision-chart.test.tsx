import { fireEvent, render, screen } from "@testing-library/react"

import { DecisionChart } from "./decision-chart"

const points = [
  { x: 45, y: 2, series: "a" },
  { x: 50, y: 7, series: "b" },
]
const series = [
  { key: "a", label: "A — Normal", color: "blue" },
  { key: "b", label: "B — At Risk", color: "orange" },
]

test("renders the point circles, a 40x24 background grid, and the legend", () => {
  const { container } = render(
    <DecisionChart
      points={points}
      series={series}
      xLabel="Temperature"
      yLabel="Vibration"
      valueAt={(x) => (x > 47 ? 0.9 : 0.1)}
    />,
  )

  expect(container.querySelectorAll("circle")).toHaveLength(points.length)
  expect(container.querySelectorAll("g[clip-path] > rect")).toHaveLength(40 * 24)
  expect(screen.getByText("A — Normal")).toBeTruthy()
})

test("draws a boundary path only when showBoundaryLine is set", () => {
  const valueAt = (x: number) => (x > 47 ? 0.9 : 0.1)

  const without = render(
    <DecisionChart
      points={points}
      series={series}
      xLabel="Temperature"
      yLabel="Vibration"
      valueAt={valueAt}
    />,
  )
  expect(without.container.querySelector("path")).toBeNull()

  const { container } = render(
    <DecisionChart
      points={points}
      series={series}
      xLabel="Temperature"
      yLabel="Vibration"
      valueAt={valueAt}
      showBoundaryLine
    />,
  )
  const path = container.querySelector("path")
  expect(path).not.toBeNull()
  expect(path?.getAttribute("d")).toMatch(/^M.*L/)
})

test("rings flagged points", () => {
  const { container } = render(
    <DecisionChart
      points={points}
      series={series}
      xLabel="Temperature"
      yLabel="Vibration"
      valueAt={() => 0.9}
      flaggedKeys={new Set(["45-2-a"])}
    />,
  )
  expect(container.querySelectorAll("circle")).toHaveLength(points.length + 1)
})

test("draws one extra contour per entry in boundaries, in its own color", () => {
  const { container } = render(
    <DecisionChart
      points={points}
      series={series}
      xLabel="Temperature"
      yLabel="Vibration"
      valueAt={() => 0.2}
      boundaries={[
        { key: "run-1", valueAt: (x) => (x > 46 ? 0.9 : 0.1), color: "red" },
        { key: "truth", valueAt: (x) => (x > 48 ? 0.9 : 0.1), color: "gray", dashed: true },
      ]}
    />,
  )
  const paths = [...container.querySelectorAll("g[clip-path] > path")]
  expect(paths.map((p) => p.getAttribute("stroke"))).toEqual(["red", "gray"])
  expect(paths[1].getAttribute("stroke-dasharray")).toBe("6 5")
})

test("reports the data-space position of clicks inside the plot only", () => {
  const onPlotClick = vi.fn()
  const { container } = render(
    <DecisionChart
      points={points}
      series={series}
      xLabel="Temperature"
      yLabel="Vibration"
      valueAt={() => 0.5}
      onPlotClick={onPlotClick}
    />,
  )
  const svg = container.querySelector("svg") as SVGSVGElement
  // Unscaled viewBox: svg units equal CSS pixels.
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 760, height: 420 }) as DOMRect

  fireEvent.click(svg, { clientX: 5, clientY: 5 })
  expect(onPlotClick).not.toHaveBeenCalled()

  fireEvent.click(svg, { clientX: 48, clientY: 20 })
  expect(onPlotClick).toHaveBeenLastCalledWith({ x: 45, y: 8 })
})

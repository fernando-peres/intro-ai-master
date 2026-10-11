import { render, screen } from "@testing-library/react"

import { ScatterChart } from "./scatter-chart"

const points = [
  { x: 45, y: 2, series: "a" },
  { x: 55, y: 3, series: "a" },
  { x: 50, y: 7, series: "b" },
]
const series = [
  { key: "a", label: "A — Normal", color: "blue" },
  { key: "b", label: "B — At Risk", color: "orange" },
]

test("renders one circle per point and a legend entry per series", () => {
  const { container } = render(
    <ScatterChart points={points} series={series} xLabel="Temperature" yLabel="Vibration" />,
  )

  expect(container.querySelectorAll("circle")).toHaveLength(points.length)
  expect(screen.getByText("A — Normal")).toBeTruthy()
  expect(screen.getByText("B — At Risk")).toBeTruthy()
})

test("renders a labeled × mark for each extra marker", () => {
  render(
    <ScatterChart
      points={points}
      series={series}
      xLabel="Temperature"
      yLabel="Vibration"
      markers={[{ x: 50, y: 4, label: "centroid 1" }]}
    />,
  )

  expect(screen.getByText("centroid 1")).toBeTruthy()
})

test("draws a labeled line through the given points", () => {
  render(
    <ScatterChart
      points={points}
      series={series}
      xLabel="Temperature"
      yLabel="Vibration"
      lines={[
        {
          points: [
            { x: 45, y: 2 },
            { x: 55, y: 7 },
          ],
          label: "ŷ = 0.5x − 20.5",
        },
      ]}
    />,
  )

  expect(screen.getByText("ŷ = 0.5x − 20.5")).toBeTruthy()
})

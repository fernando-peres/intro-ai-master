import { render, screen } from "@testing-library/react"

import { LineChart } from "./line-chart"

const series = [
  {
    key: "train",
    label: "train",
    color: "blue",
    points: [
      { x: 0, y: 1 },
      { x: 1, y: 0.6 },
      { x: 2, y: 0.3 },
    ],
  },
  {
    key: "test",
    label: "test",
    color: "orange",
    points: [
      { x: 0, y: 1.1 },
      { x: 1, y: 0.7 },
      { x: 2, y: 0.5 },
    ],
  },
]

test("renders one path per series and a legend entry per series", () => {
  const { container } = render(<LineChart series={series} xLabel="Epoch" yLabel="Loss" />)

  expect(container.querySelectorAll("path")).toHaveLength(2)
  expect(screen.getByText("train")).toBeTruthy()
  expect(screen.getByText("test")).toBeTruthy()
})

test("renders nothing when every series is empty", () => {
  const { container } = render(
    <LineChart
      series={[
        { key: "train", label: "train", color: "blue", points: [] },
        { key: "test", label: "test", color: "orange", points: [] },
      ]}
      xLabel="Epoch"
      yLabel="Loss"
    />,
  )
  expect(container.querySelector("svg")).toBeNull()
})

test("a dashed series renders with a dash pattern", () => {
  const { container } = render(
    <LineChart series={[{ ...series[0], dashed: true }, series[1]]} xLabel="Epoch" yLabel="Loss" />,
  )
  const [dashed, solid] = container.querySelectorAll("path")
  expect(dashed.getAttribute("stroke-dasharray")).toBe("6 5")
  expect(solid.getAttribute("stroke-dasharray")).toBeNull()
})

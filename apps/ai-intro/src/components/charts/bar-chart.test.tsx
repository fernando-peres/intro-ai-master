import { render, screen } from "@testing-library/react"

import { BarChart } from "./bar-chart"

test("draws one bar per category and series, with labels and legend", () => {
  const { container } = render(
    <BarChart
      categories={["A", "B", "C"]}
      series={[
        { key: "x", label: "Group X", color: "blue", values: [1, 2, 3] },
        { key: "y", label: "Group Y", color: "red", values: [-1, 0.5, 2] },
      ]}
      yLabel="Rate"
      showValues
    />,
  )
  expect(container.querySelectorAll("rect")).toHaveLength(6)
  for (const text of ["A", "B", "C", "Group X", "Group Y", "-1.00"]) {
    expect(screen.getByText(text)).toBeTruthy()
  }
})

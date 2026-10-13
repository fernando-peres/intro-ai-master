import { render, screen } from "@testing-library/react"

import { DonutChart } from "./donut-chart"

test("draws one slice per segment, with legend shares and an optional center label", () => {
  const { container } = render(
    <DonutChart
      segments={[
        { key: "legit", label: "Legitimate", value: 980, color: "purple" },
        { key: "fraud", label: "Fraud", value: 20, color: "green" },
      ]}
      centerLabel="1000"
    />,
  )
  expect(container.querySelectorAll("path")).toHaveLength(2)
  const legend = container.querySelector("figcaption")
  expect(legend?.textContent).toContain("Legitimate")
  expect(legend?.textContent).toContain("98%")
  expect(legend?.textContent).toContain("Fraud")
  expect(legend?.textContent).toContain("2%")
  expect(screen.getByText("1000")).toBeTruthy()
})

test("draws a full ring when one segment holds the whole total", () => {
  const { container } = render(
    <DonutChart segments={[{ key: "all", label: "All", value: 10, color: "blue" }]} />,
  )
  expect(container.querySelectorAll("path")).toHaveLength(1)
  expect(container.querySelector("figcaption")?.textContent).toContain("100%")
})

import { render, screen } from "@testing-library/react"

import { StatStrip } from "./stat-strip"

test("renders each label with its value", () => {
  render(
    <StatStrip
      label="Performance"
      stats={[
        { label: "Epoch", value: "3" },
        { label: "Loss", value: "0.5" },
      ]}
    />,
  )
  expect(screen.getByText("Epoch")).toBeTruthy()
  expect(screen.getByText("0.5")).toBeTruthy()
})

import { fireEvent, render, screen } from "@testing-library/react"

import { SideConfig } from "./side-config"

test("collapse button hides the configuration but keeps the content", () => {
  render(
    <SideConfig title="Configuration" config={<p>controls</p>}>
      <p>diagram</p>
    </SideConfig>,
  )
  expect(screen.getByText("controls")).toBeTruthy()
  fireEvent.click(screen.getByRole("button", { name: "Hide configuration" }))
  expect(screen.queryByText("controls")).toBeNull()
  expect(screen.getByText("diagram")).toBeTruthy()
  expect(
    screen.getByRole("button", { name: "Show configuration" }).getAttribute("aria-expanded"),
  ).toBe("false")
})

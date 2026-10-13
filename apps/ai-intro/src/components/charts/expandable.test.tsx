import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, expect, test } from "vitest"
import { LanguageProvider } from "@/i18n/language"
import { Expandable } from "./expandable"

afterEach(cleanup)

const renderChart = () =>
  render(
    <LanguageProvider>
      <Expandable title="My chart">
        <svg role="img" aria-label="plot" />
      </Expandable>
    </LanguageProvider>,
  )

test("shows the chart once, with an expand button and no dialog", () => {
  renderChart()
  expect(screen.getAllByRole("img", { name: "plot" })).toHaveLength(1)
  expect(screen.getByRole("button", { name: "Expand chart" })).toBeTruthy()
  expect(screen.queryByRole("dialog")).toBeNull()
})

test("expanding opens a titled dialog with a second copy of the chart", () => {
  renderChart()
  fireEvent.click(screen.getByRole("button", { name: "Expand chart" }))
  expect(screen.getByRole("dialog", { name: "My chart" })).toBeTruthy()
  expect(screen.getAllByRole("img", { name: "plot" })).toHaveLength(2)
})

test("the original-size button, Escape and the backdrop all close it", () => {
  renderChart()
  const open = () => fireEvent.click(screen.getByRole("button", { name: "Expand chart" }))

  open()
  const back = () => screen.getAllByRole("button", { name: "Back to original size" })
  fireEvent.click(back()[back().length - 1])
  expect(screen.queryByRole("dialog")).toBeNull()

  open()
  fireEvent.keyDown(window, { key: "Escape" })
  expect(screen.queryByRole("dialog")).toBeNull()

  open()
  fireEvent.click(back()[0])
  expect(screen.queryByRole("dialog")).toBeNull()
})

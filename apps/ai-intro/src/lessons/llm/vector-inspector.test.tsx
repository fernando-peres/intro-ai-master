import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, expect, test } from "vitest"
import { VectorInspector } from "./vector-inspector"

afterEach(cleanup)

const vector = Array.from({ length: 30 }, (_, i) => i / 10 - 1)

test("shows the first 12 dimensions with index and value, plus norm and size", () => {
  render(<VectorInspector vector={vector} label="king" normalized={false} />)
  expect(screen.getAllByTestId("vector-dim")).toHaveLength(12)
  expect(screen.getByText("king")).toBeTruthy()
  expect(screen.getByText("30")).toBeTruthy()
  expect(screen.getByText("no")).toBeTruthy()
  expect(screen.getByText("5.34")).toBeTruthy()
})

test("the toggle expands to every dimension and collapses again", () => {
  render(<VectorInspector vector={vector} label="king" normalized />)
  const toggle = screen.getByRole("button", { name: "Show all 30" })
  expect(toggle.getAttribute("aria-expanded")).toBe("false")
  fireEvent.click(toggle)
  expect(screen.getAllByTestId("vector-dim")).toHaveLength(30)
  expect(screen.getByRole("button", { name: "Show fewer" }).getAttribute("aria-expanded")).toBe(
    "true",
  )
  fireEvent.click(screen.getByRole("button", { name: "Show fewer" }))
  expect(screen.getAllByTestId("vector-dim")).toHaveLength(12)
  expect(screen.getByText("yes")).toBeTruthy()
})

test("a vector no longer than the preview has no toggle", () => {
  render(<VectorInspector vector={[1, 2, 3]} label="x" normalized={false} />)
  expect(screen.queryByRole("button")).toBeNull()
})

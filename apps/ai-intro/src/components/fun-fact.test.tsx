import { fireEvent, render, screen } from "@testing-library/react"

import { FunFact } from "./fun-fact"

test("opens a note on click and closes on Escape", () => {
  render(<FunFact>37 parameters</FunFact>)
  expect(screen.queryByRole("note")).toBeNull()
  fireEvent.click(screen.getByRole("button", { name: "Fun fact" }))
  expect(screen.getByRole("note").textContent).toContain("37 parameters")
  fireEvent.keyDown(document, { key: "Escape" })
  expect(screen.queryByRole("note")).toBeNull()
})

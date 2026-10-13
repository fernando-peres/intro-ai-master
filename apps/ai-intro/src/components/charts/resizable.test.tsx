import { fireEvent, render, screen } from "@testing-library/react"

import { Resizable } from "./resizable"

test("slider changes the max width of the wrapped chart", () => {
  render(
    <Resizable>
      <svg />
    </Resizable>,
  )
  const body = screen.getByTestId("resizable-body")
  expect(body.style.maxWidth).toBe("100%")
  fireEvent.change(screen.getByRole("slider"), { target: { value: "60" } })
  expect(body.style.maxWidth).toBe("60%")
})

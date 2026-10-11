import { fireEvent, render, screen } from "@testing-library/react"

import { Chat } from "./chat"

test("sends a message and shows the reply", async () => {
  render(<Chat />)

  fireEvent.change(screen.getByLabelText("Message"), { target: { value: "hi" } })
  fireEvent.click(screen.getByRole("button", { name: "Send" }))

  expect(await screen.findByText("hi")).toBeTruthy()
  expect(await screen.findByText("Echo: hi")).toBeTruthy()
})

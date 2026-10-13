import { fireEvent, render, screen } from "@testing-library/react"
import { vi } from "vitest"

import { FloatingPanel } from "./floating-panel"

test("shows content and closes from the button and Escape", () => {
  const onClose = vi.fn()
  render(
    <FloatingPanel title="Math" onClose={onClose}>
      body
    </FloatingPanel>,
  )
  expect(screen.getByRole("dialog", { name: "Math" })).toBeTruthy()
  fireEvent.click(screen.getByRole("button", { name: "Close" }))
  fireEvent.keyDown(window, { key: "Escape" })
  expect(onClose).toHaveBeenCalledTimes(2)
})

test("dragging the header moves the panel", () => {
  render(
    <FloatingPanel title="Math" onClose={() => {}}>
      body
    </FloatingPanel>,
  )
  const handle = screen.getByTestId("floating-panel-handle")
  fireEvent.pointerDown(handle, { clientX: 10, clientY: 10, pointerId: 1 })
  fireEvent.pointerMove(handle, { clientX: 60, clientY: 80, pointerId: 1 })
  expect(screen.getByRole("dialog").style.top).toBe("70px")
})

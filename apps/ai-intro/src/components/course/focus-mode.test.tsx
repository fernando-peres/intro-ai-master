import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, expect, test } from "vitest"

import { LanguageProvider } from "@/i18n/language"

import { FocusModeProvider, FocusToggle, useFocusMode } from "./focus-mode"

function Probe() {
  const { focused } = useFocusMode()
  return <p>{focused ? "focused" : "standard"}</p>
}

function renderToggle() {
  render(
    <LanguageProvider>
      <FocusModeProvider>
        <FocusToggle />
        <Probe />
      </FocusModeProvider>
    </LanguageProvider>,
  )
}

beforeEach(() => localStorage.clear())
afterEach(cleanup)

test("enters and leaves focus mode from the toggle", () => {
  renderToggle()
  expect(screen.getByText("standard")).toBeTruthy()
  fireEvent.click(screen.getByRole("button", { name: "Focus mode" }))
  expect(screen.getByText("focused")).toBeTruthy()
  const exit = screen.getByRole("button", { name: "Exit focus mode" })
  expect(exit.getAttribute("aria-pressed")).toBe("true")
  fireEvent.click(exit)
  expect(screen.getByText("standard")).toBeTruthy()
})

test("Escape leaves focus mode", () => {
  renderToggle()
  fireEvent.click(screen.getByRole("button", { name: "Focus mode" }))
  fireEvent.keyDown(window, { key: "Escape" })
  expect(screen.getByText("standard")).toBeTruthy()
})

test("labels the toggle in Portuguese", () => {
  localStorage.setItem("ai-intro-language", "pt-BR")
  renderToggle()
  fireEvent.click(screen.getByRole("button", { name: "Modo foco" }))
  expect(screen.getByRole("button", { name: "Sair do modo foco" })).toBeTruthy()
})

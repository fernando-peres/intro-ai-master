import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, expect, test } from "vitest"

import { LanguageProvider, useLanguage } from "./language"

function Probe() {
  const { language, setLanguage } = useLanguage()
  return (
    <button type="button" onClick={() => setLanguage("pt-BR")}>
      {language}
    </button>
  )
}

beforeEach(() => localStorage.clear())
afterEach(cleanup)

test("defaults to English and persists a language change", () => {
  render(
    <LanguageProvider>
      <Probe />
    </LanguageProvider>,
  )
  fireEvent.click(screen.getByRole("button", { name: "en-US" }))
  expect(screen.getByRole("button").textContent).toBe("pt-BR")
  expect(localStorage.getItem("ai-intro-language")).toBe("pt-BR")
})

test("restores Portuguese on a new visit", () => {
  localStorage.setItem("ai-intro-language", "pt-BR")
  render(
    <LanguageProvider>
      <Probe />
    </LanguageProvider>,
  )
  expect(screen.getByRole("button").textContent).toBe("pt-BR")
})

test("ignores unsupported saved languages", () => {
  localStorage.setItem("ai-intro-language", "fr-FR")
  render(
    <LanguageProvider>
      <Probe />
    </LanguageProvider>,
  )
  expect(screen.getByRole("button").textContent).toBe("en-US")
})

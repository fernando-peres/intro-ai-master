import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { SummaryEditor } from "./editor"
import { storageKey } from "./draft"

beforeEach(() => { localStorage.clear() })
afterEach(() => { cleanup(); vi.restoreAllMocks() })

// The real editor must load persisted blocks, rather than silently replacing them with seeds.
test("loads the saved language copy and offers an editable document", async () => {
  localStorage.setItem(storageKey("en-US"), JSON.stringify({ version: 1, blocks: [{ type: "paragraph", content: "My own summary" }] }))
  const { container } = render(<SummaryEditor language="en-US" />)
  expect(await screen.findByText("My own summary")).toBeTruthy()
  expect(container.querySelector('[contenteditable="true"]')).toBeTruthy()
  expect(await screen.findByText("Saved in this browser")).toBeTruthy()
})

test("unreadable storage stays intact when restore is cancelled", async () => {
  localStorage.setItem(storageKey("pt-BR"), "broken")
  render(<SummaryEditor language="pt-BR" />)
  expect(await screen.findByText(/Não foi possível abrir/)).toBeTruthy()
  vi.spyOn(window, "confirm").mockReturnValue(false)
  fireEvent.click(screen.getByRole("button", { name: "Restaurar original" }))
  expect(localStorage.getItem(storageKey("pt-BR"))).toBe("broken")
})

test("confirmed restore replaces only the active language", async () => {
  localStorage.setItem(storageKey("en-US"), "broken")
  localStorage.setItem(storageKey("pt-BR"), "leave untouched")
  render(<SummaryEditor language="en-US" />)
  vi.spyOn(window, "confirm").mockReturnValue(true)
  fireEvent.click(screen.getByRole("button", { name: "Restore original" }))
  await waitFor(() => expect(localStorage.getItem(storageKey("en-US"))).toContain("Statistical bias"))
  expect(localStorage.getItem(storageKey("pt-BR"))).toBe("leave untouched")
})

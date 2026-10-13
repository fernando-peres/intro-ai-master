import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { StrictMode } from "react"
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { storageKey } from "./draft"
import { SummaryEditor } from "./editor"

beforeEach(() => {
  localStorage.clear()
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

// The real editor must load persisted blocks, rather than silently replacing them with seeds.
test("loads the saved language copy and offers an editable document", async () => {
  localStorage.setItem(
    storageKey("en-US"),
    JSON.stringify({ version: 1, blocks: [{ type: "paragraph", content: "My own summary" }] }),
  )
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
  await waitFor(() =>
    expect(localStorage.getItem(storageKey("en-US"))).toContain("Statistical bias"),
  )
  expect(localStorage.getItem(storageKey("pt-BR"))).toBe("leave untouched")
})

test("flushes actual editor changes on language switch and keeps both copies", async () => {
  localStorage.setItem(
    storageKey("en-US"),
    JSON.stringify({ version: 1, blocks: [{ type: "paragraph", content: "Original English" }] }),
  )
  localStorage.setItem(
    storageKey("pt-BR"),
    JSON.stringify({ version: 1, blocks: [{ type: "paragraph", content: "Português separado" }] }),
  )
  const view = render(<SummaryEditor language="en-US" />)
  const paragraph = await screen.findByText("Original English")
  paragraph.textContent = "Edited explanation"
  fireEvent.input(paragraph)
  await screen.findByText("Saving…")
  view.rerender(<SummaryEditor language="pt-BR" />)
  expect(await screen.findByText("Português separado")).toBeTruthy()
  expect(localStorage.getItem(storageKey("en-US"))).toContain("Edited explanation")
  view.rerender(<SummaryEditor language="en-US" />)
  expect(await screen.findByText("Edited explanation")).toBeTruthy()
  expect(screen.queryByText("Português separado")).toBeNull()
})

test("page exit and unmount flush pending changes from the real editor", async () => {
  localStorage.setItem(
    storageKey("en-US"),
    JSON.stringify({ version: 1, blocks: [{ type: "paragraph", content: "Before exit" }] }),
  )
  const view = render(<SummaryEditor language="en-US" />)
  const paragraph = await screen.findByText("Before exit")
  paragraph.textContent = "Saved on exit"
  fireEvent.input(paragraph)
  await screen.findByText("Saving…")
  fireEvent(window, new Event("pagehide"))
  expect(localStorage.getItem(storageKey("en-US"))).toContain("Saved on exit")
  paragraph.textContent = "Saved on unmount"
  fireEvent.input(paragraph)
  await screen.findByText("Saving…")
  view.unmount()
  expect(localStorage.getItem(storageKey("en-US"))).toContain("Saved on unmount")
})

test("both authored documents round-trip through the editor including tables and lesson links", async () => {
  for (const language of ["en-US", "pt-BR"] as const) {
    const view = render(<SummaryEditor language={language} />)
    expect(await screen.findByRole("table")).toBeTruthy()
    const links = screen.getAllByRole("link")
    expect(links.length).toBeGreaterThan(30)
    expect(new Set(links.map((link) => link.getAttribute("href")))).toEqual(
      new Set([
        "/learn/machine-learning/bias-and-variance",
        "/learn/machine-learning/fairness",
        "/learn/machine-learning/data-splits",
        "/learn/machine-learning/generalization",
      ]),
    )
    view.unmount()
    const reloaded = render(<SummaryEditor language={language} />)
    expect(await screen.findByRole("table")).toBeTruthy()
    expect(screen.queryByRole("alert")).toBeNull()
    reloaded.unmount()
  }
})

test("failed writes preserve the live draft across StrictMode remounts", async () => {
  localStorage.setItem(
    storageKey("en-US"),
    JSON.stringify({ version: 1, blocks: [{ type: "paragraph", content: "Previously saved" }] }),
  )
  const view = render(
    <StrictMode>
      <SummaryEditor language="en-US" />
    </StrictMode>,
  )
  const paragraph = await screen.findByText("Previously saved")
  const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Quota")
  })
  paragraph.textContent = "Keep these unsaved edits"
  fireEvent.input(paragraph)
  await screen.findByText("Couldn’t save")
  view.unmount()
  const remounted = render(
    <StrictMode>
      <SummaryEditor language="en-US" />
    </StrictMode>,
  )
  expect(await screen.findByText("Keep these unsaved edits")).toBeTruthy()
  write.mockRestore()
  fireEvent.click(screen.getByRole("button", { name: "Retry save" }))
  expect(localStorage.getItem(storageKey("en-US"))).toContain("Keep these unsaved edits")
  remounted.unmount()
})

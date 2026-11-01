import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { SaveIndicator } from "@/components/shell/save-indicator"
import type { Autosave, SaveStatus } from "@/hooks/use-autosave"

const autosave = (status: SaveStatus, flush = vi.fn(async () => true)): Autosave => ({
  status,
  savedAt: null,
  error: null,
  flush,
  currentEtag: () => undefined,
})
const props = { editable: true, updatedAt: "not-a-stamp", onReload: vi.fn() }

afterEach(cleanup)

describe("SaveIndicator", () => {
  it.each([
    ["dirty", "Unsaved"],
    ["saving", "Saving…"],
    ["error", "Save failed"],
    ["conflict", "Changed elsewhere"],
    ["idle", "Saved not-a-stamp"],
  ] as const)("%s reads %s", (status, text) => {
    render(<SaveIndicator autosave={autosave(status)} {...props} />)
    expect(screen.getByRole("status").textContent).toBe(text)
  })

  it("offers a retry after a failed save", () => {
    const flush = vi.fn(async () => true)
    render(<SaveIndicator autosave={autosave("error", flush)} {...props} />)
    fireEvent.click(screen.getByRole("button", { name: "Retry" }))
    expect(flush).toHaveBeenCalledOnce()
  })

  it("offers a reload after a conflict", () => {
    const onReload = vi.fn()
    render(<SaveIndicator autosave={autosave("conflict")} {...props} onReload={onReload} />)
    fireEvent.click(screen.getByRole("button", { name: "Reload" }))
    expect(onReload).toHaveBeenCalledOnce()
  })

  it("shows the read-only label instead of a save state", () => {
    render(<SaveIndicator autosave={autosave("error")} {...props} editable={false} />)
    expect(screen.getByRole("status").textContent).toBe("Read only")
    expect(screen.queryByRole("button")).toBeNull()
  })
})

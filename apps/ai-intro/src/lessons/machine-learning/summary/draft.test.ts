import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { SummaryDraft, storageKey } from "./draft"

const seed = [{ type: "paragraph" as const, content: "Original" }]
const edited = [{ type: "paragraph" as const, content: "My explanation" }]
beforeEach(() => { localStorage.clear(); vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

test("seeds a missing document, debounces edits, and reloads the saved copy", () => {
  const draft = new SummaryDraft("en-US", seed)
  draft.flush()
  draft.change(edited)
  expect(draft.getSnapshot().status).toBe("saving")
  vi.advanceTimersByTime(499)
  expect(localStorage.getItem(storageKey("en-US"))).toContain("Original")
  vi.advanceTimersByTime(1)
  expect(draft.getSnapshot().status).toBe("saved")
  expect(new SummaryDraft("en-US", seed).getSnapshot().blocks).toEqual(edited)
})

test("flush preserves the latest edit before navigation and keeps languages separate", () => {
  const en = new SummaryDraft("en-US", seed)
  en.change(edited)
  en.flush()
  const pt = new SummaryDraft("pt-BR", [{ type: "paragraph", content: "Original em português" }])
  pt.flush()
  expect(new SummaryDraft("en-US", seed).getSnapshot().blocks).toEqual(edited)
  expect(new SummaryDraft("pt-BR", seed).getSnapshot().blocks[0].content).toBe("Original em português")
})

test.each(["{broken", JSON.stringify({ version: 2, blocks: seed }), JSON.stringify({ version: 1, blocks: [{ type: "video" }] }), JSON.stringify({ version: 1, blocks: [{ type: "table", content: "bad" }] })])("preserves unreadable saved content until explicit restore: %s", (raw) => {
  localStorage.setItem(storageKey("en-US"), raw)
  const draft = new SummaryDraft("en-US", seed)
  expect(draft.getSnapshot().status).toBe("blocked")
  draft.change(edited)
  draft.flush()
  expect(localStorage.getItem(storageKey("en-US"))).toBe(raw)
  draft.restore()
  expect(draft.getSnapshot().status).toBe("saved")
  expect(new SummaryDraft("en-US", seed).getSnapshot().blocks).toEqual(seed)
})

test("failed writes keep the newest document in memory without reporting saved", () => {
  const draft = new SummaryDraft("en-US", seed)
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Quota") })
  draft.change(edited)
  draft.flush()
  expect(draft.getSnapshot()).toMatchObject({ status: "error", blocks: edited })
  vi.restoreAllMocks()
  draft.flush()
  expect(draft.getSnapshot().status).toBe("saved")
})

test("unavailable storage still allows in-memory editing", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Blocked") })
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Blocked") })
  const draft = new SummaryDraft("en-US", seed)
  draft.change(edited)
  draft.flush()
  expect(draft.getSnapshot()).toMatchObject({ status: "error", blocks: edited })
})

test("restoring cancels pending saves and affects only the active language", () => {
  const en = new SummaryDraft("en-US", seed)
  const pt = new SummaryDraft("pt-BR", seed)
  pt.change(edited); pt.flush()
  en.change(edited); en.restore()
  vi.runAllTimers()
  expect(new SummaryDraft("en-US", seed).getSnapshot().blocks).toEqual(seed)
  expect(new SummaryDraft("pt-BR", seed).getSnapshot().blocks).toEqual(edited)
})

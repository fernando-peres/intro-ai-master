import type { Language } from "@/i18n/language"
import type { SummaryBlock } from "./schema"

type Status = "saving" | "saved" | "error" | "blocked"
type Snapshot = { blocks: SummaryBlock[]; status: Status }
export const storageKey = (language: Language) => `ai-intro-generalization-summary:${language}`
const blockTypes = new Set([
  "paragraph",
  "heading",
  "bulletListItem",
  "numberedListItem",
  "checkListItem",
  "table",
  "quote",
])
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

function inline(value: unknown): boolean {
  return (
    typeof value === "string" ||
    (Array.isArray(value) &&
      value.every(
        (item) =>
          record(item) &&
          ((item.type === "text" && typeof item.text === "string" && record(item.styles)) ||
            (item.type === "link" && typeof item.href === "string" && inline(item.content))),
      ))
  )
}

function validBlocks(value: unknown): value is SummaryBlock[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((block) => {
      if (!record(block) || !blockTypes.has(String(block.type))) return false
      if (block.props !== undefined && !record(block.props)) return false
      if (
        block.children !== undefined &&
        (!Array.isArray(block.children) ||
          (block.children.length > 0 && !validBlocks(block.children)))
      )
        return false
      if (block.type !== "table") return block.content === undefined || inline(block.content)
      const content = block.content
      return (
        record(content) &&
        content.type === "tableContent" &&
        Array.isArray(content.rows) &&
        content.rows.length > 0 &&
        content.rows.every(
          (row) =>
            record(row) &&
            Array.isArray(row.cells) &&
            row.cells.length > 0 &&
            row.cells.every(
              (cell) =>
                inline(cell) || (record(cell) && cell.type === "tableCell" && inline(cell.content)),
            ),
        )
      )
    })
  )
}

/** Owns one language's in-memory document and pending browser-storage write. */
export class SummaryDraft {
  private snapshot: Snapshot
  private dirty = false
  private timer: ReturnType<typeof setTimeout> | undefined
  private listeners = new Set<() => void>()

  constructor(
    private language: Language,
    private seed: SummaryBlock[],
  ) {
    this.snapshot = { blocks: structuredClone(seed), status: "saving" }
    this.dirty = true
    try {
      const raw = localStorage.getItem(storageKey(language))
      if (raw === null) return
      const saved: unknown = JSON.parse(raw)
      if (!record(saved) || saved.version !== 1 || !validBlocks(saved.blocks)) {
        this.block()
        return
      }
      this.snapshot = { blocks: saved.blocks, status: "saved" }
      this.dirty = false
    } catch {
      // Read errors allow editing; malformed JSON must remain untouched.
      try {
        if (localStorage.getItem(storageKey(language)) !== null) {
          this.block()
          return
        }
      } catch {
        /* Browser storage may be disabled. */
      }
      this.snapshot = { ...this.snapshot, status: "error" }
    }
  }

  getSnapshot = () => this.snapshot
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private publish(snapshot: Snapshot) {
    this.snapshot = snapshot
    for (const listener of this.listeners) listener()
  }

  block = () => {
    clearTimeout(this.timer)
    this.dirty = false
    this.publish({ ...this.snapshot, status: "blocked" })
  }

  change = (blocks: SummaryBlock[]) => {
    if (this.snapshot.status === "blocked") return
    this.dirty = true
    this.publish({ blocks, status: "saving" })
    clearTimeout(this.timer)
    this.timer = setTimeout(this.flush, 500)
  }

  flush = () => {
    clearTimeout(this.timer)
    if (!this.dirty || this.snapshot.status === "blocked") return
    try {
      localStorage.setItem(
        storageKey(this.language),
        JSON.stringify({ version: 1, blocks: this.snapshot.blocks }),
      )
      this.dirty = false
      this.publish({ ...this.snapshot, status: "saved" })
    } catch {
      this.publish({ ...this.snapshot, status: "error" })
    }
  }

  restore = () => {
    clearTimeout(this.timer)
    this.dirty = true
    this.publish({ blocks: structuredClone(this.seed), status: "saving" })
    this.flush()
  }
}

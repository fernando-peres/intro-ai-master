import { describe, expect, it } from "vitest"
import {
  fileProblem,
  filterResources,
  formatBytes,
  isEditable,
  resourceKind,
  typeChip,
  uniqueName,
} from "@/lib/resources"

const asset = (name: string, mimeType: string) =>
  ({ name, mimeType }) as Parameters<typeof filterResources>[0][number]

describe("resources", () => {
  it("classify by mime type and label by extension", () => {
    expect(resourceKind({ mimeType: "text/markdown" })).toBe("note")
    expect(resourceKind({ mimeType: "image/png" })).toBe("image")
    expect(typeChip({ name: "Rubric.PDF" })).toBe("PDF")
    expect(isEditable({ mimeType: "text/csv" })).toBe(true)
    expect(isEditable({ mimeType: "application/pdf" })).toBe(false)
  })

  it("reject unsupported or oversized files before uploading", () => {
    expect(fileProblem({ name: "notes.md", size: 10 })).toBeNull()
    expect(fileProblem({ name: "page.html", size: 10 })).toMatch(/unsupported type/)
    expect(fileProblem({ name: "talk.png", size: 21 * 1024 * 1024 })).toMatch(/20 MB/)
  })

  it("format sizes and pick free names", () => {
    expect([formatBytes(800), formatBytes(2150), formatBytes(3 * 1024 * 1024)]).toEqual([
      "800 B",
      "2.1 KB",
      "3.0 MB",
    ])
    expect(uniqueName("untitled-note.md", [])).toBe("untitled-note.md")
    expect(uniqueName("untitled-note.md", ["untitled-note.md", "untitled-note-2.md"])).toBe(
      "untitled-note-3.md",
    )
  })

  it("search by name, ignoring case", () => {
    const list = [asset("evaluation-notes.md", "text/markdown"), asset("Rubric.pdf", "x")]
    expect(filterResources(list, " rubric ").map((a) => a.name)).toEqual(["Rubric.pdf"])
    expect(filterResources(list, "")).toBe(list)
  })
})

import { describe, expect, it } from "vitest"
import { ApiError } from "@/api/client"
import { issuesOf, readImport } from "@/lib/import"

describe("readImport", () => {
  it("accepts bare content and the version envelope", () => {
    expect(readImport('{"schemaVersion":1,"type":"slide"}')).toMatchObject({
      ok: true,
      type: "slide",
    })
    expect(
      readImport('{"title":"Rubric","content":{"schemaVersion":1,"type":"doc","blocks":[]}}'),
    ).toMatchObject({ ok: true, type: "doc", title: "Rubric" })
  })

  it("explains syntax and type problems", () => {
    const syntax = readImport("{nope")
    expect(syntax.ok).toBe(false)
    expect(readImport('{"schemaVersion":1,"type":"video"}')).toEqual({
      ok: false,
      issues: [{ path: "type", message: 'Expected one of slide, doc, animation, got "video"' }],
    })
    expect(readImport("[1]")).toMatchObject({ ok: false })
  })

  it("surfaces the API's issue list", () => {
    const issues = [{ path: "elements.0", message: "Unknown component 'slide.video'" }]
    const error = new ApiError(422, "unknown_component", "x", { issues })
    expect(issuesOf(error)).toEqual(issues)
    expect(issuesOf(new Error("offline"))).toEqual([{ path: "", message: "offline" }])
  })
})

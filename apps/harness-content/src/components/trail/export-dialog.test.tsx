// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ExportDialog } from "@/components/trail/export-dialog"
import { newStep, type TrailStep } from "@/lib/trail"

const step = (title: string, version: string | null): TrailStep =>
  newStep({
    artifactId: title,
    artifactTitle: title,
    artifactType: "slide",
    locale: "en",
    artifactVersionId: version,
    versionNumber: 1,
    versionState: "published",
    durationSeconds: null,
    label: null,
  })

describe("export dialog", () => {
  afterEach(cleanup)
  const steps = [step("One", "v1"), step("Two", "v2"), step("Three", null), step("Four", "v4")]

  it("exports every pinned step by default, in order", () => {
    const onExport = vi.fn()
    render(<ExportDialog steps={steps} onExport={onExport} onClose={() => {}} />)
    fireEvent.click(screen.getByRole("button", { name: "Export" }))
    expect(onExport).toHaveBeenCalledWith([1, 2, 4])
  })

  it("leaves out an unticked step", () => {
    const onExport = vi.fn()
    render(<ExportDialog steps={steps} onExport={onExport} onClose={() => {}} />)
    fireEvent.click(screen.getByLabelText(/2\. Two/))
    fireEvent.click(screen.getByRole("button", { name: "Export" }))
    expect(onExport).toHaveBeenCalledWith([1, 4])
  })

  it("disables a step with no pinned version", () => {
    render(<ExportDialog steps={steps} onExport={() => {}} onClose={() => {}} />)
    expect((screen.getByLabelText(/3\. Three/) as HTMLInputElement).disabled).toBe(true)
  })
})

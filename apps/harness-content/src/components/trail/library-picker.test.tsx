// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { LibraryPicker } from "@/components/trail/library-picker"

const item = {
  id: "art1",
  type: "slide",
  title: "Harness intro",
  tags: ["harness", "intro"],
  description: "What a harness is",
  status: "published",
  metadata: { audience: "executives" },
  instructionalDesign: {},
  defaults: { en: "v2" },
}
const versions = [
  { id: "v1", state: "published", locale: "en", versionNumber: 1, isDefault: false },
  { id: "v2", state: "published", locale: "en", versionNumber: 2, isDefault: true },
]

const draft = { ...item, id: "art2", title: "Cover 1", status: "draft", defaults: {} }
const searched = vi.fn()

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="/x">{children}</a>,
}))
vi.mock("@/api/queries", () => ({
  useTags: () => ({ data: [{ tag: "harness", count: 1 }] }),
  useArtifactSearch: (params: unknown) => {
    searched(params)
    return { data: { items: [item, draft], total: 80 } }
  },
  useArtifactVersions: () => ({ data: versions }),
  useArtifact: () => ({ data: item }),
  useVersion: (id: string) => ({ data: id ? { version: { id, content: { pinned: id } } } : null }),
}))
vi.mock("@/components/trail/themed-content", () => ({
  StepRenderer: ({ content }: { content: { pinned: string } }) => <p>rendered {content.pinned}</p>,
}))

describe("library picker preview", () => {
  afterEach(cleanup)

  it("previews the pinned version and shows tags and metadata", () => {
    render(<LibraryPicker locale="en" onAdd={() => {}} onClose={() => {}} />)
    fireEvent.click(screen.getByRole("button", { name: /Harness intro/ }))
    const preview = screen.getByTestId("step-preview")
    expect(preview.textContent).toContain("rendered v2")
    expect(screen.getByRole("list", { name: "Tags" }).textContent).toContain("harness")
    expect(preview.textContent).toContain("executives")

    fireEvent.change(screen.getByLabelText("Pinned version"), { target: { value: "v1" } })
    expect(preview.textContent).toContain("rendered v1")
  })

  it("lists an unpublished artifact but does not let it be picked", () => {
    render(<LibraryPicker locale="en" onAdd={() => {}} onClose={() => {}} />)
    expect(screen.getByText("Cover 1")).toBeTruthy()
    expect(screen.queryByRole("button", { name: /Cover 1/ })).toBeNull()
    expect(screen.getByText("Showing 2 of 80")).toBeTruthy()
  })

  it("searches by the chosen type and tags", () => {
    render(<LibraryPicker locale="en" onAdd={() => {}} onClose={() => {}} />)
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "slide" } })
    fireEvent.click(screen.getByRole("button", { name: "harness" }))
    expect(searched).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: "slide", tag: ["harness"] }),
    )
  })
})

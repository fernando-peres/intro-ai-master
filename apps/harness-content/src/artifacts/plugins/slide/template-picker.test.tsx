// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { useState } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { SlideEditorProvider, useSlideActions } from "@/artifacts/plugins/slide/editor-context"
import { createEmptySlide, type SlideContent } from "@/artifacts/plugins/slide/model"
import { SlideInsertPanel } from "@/artifacts/plugins/slide/panels"

vi.mock("@/api/queries", () => ({
  useArtifactSearch: () => ({ data: { items: [] } }),
  useTemplates: () => ({ data: [] }),
}))
vi.mock("@/artifacts/plugins/slide/scene", () => ({ SlideScene: () => null }))
vi.mock("@/artifacts/plugins/slide/editor", () => ({ INSERT_MIME: "x" }))
vi.stubGlobal(
  "IntersectionObserver",
  class {
    observe() {}
    disconnect() {}
  },
)

function Harness({ theme, readOnly = false }: { theme: string; readOnly?: boolean }) {
  const [content, setContent] = useState<SlideContent>({ ...createEmptySlide(), theme })
  return (
    <SlideEditorProvider>
      <SlideInsertPanel
        artifactId="art"
        locale="en"
        content={content}
        onChange={setContent}
        readOnly={readOnly}
      />
      <Undo content={content} onChange={setContent} />
      <output>{content.elements.map((el) => el.id).join(",")}</output>
    </SlideEditorProvider>
  )
}

function Undo(props: { content: SlideContent; onChange: (next: SlideContent) => void }) {
  const actions = useSlideActions(props.content, props.onChange)
  return (
    <button type="button" onClick={actions.undo}>
      Undo
    </button>
  )
}

const show = (theme: string, readOnly = false) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <Harness theme={theme} readOnly={readOnly} />
    </QueryClientProvider>,
  )

describe("template picker", () => {
  afterEach(cleanup)

  it("lists the layouts of the slide's theme", () => {
    show("nova-ims-green")
    expect(screen.getByLabelText("Apply template Nova lesson")).toBeTruthy()
    cleanup()
    show("dark")
    expect(screen.queryByLabelText("Apply template Nova lesson")).toBeNull()
    expect(screen.getByLabelText("Apply template Cover")).toBeTruthy()
  })

  it("replaces the slide, and undo restores it", () => {
    show("nova-ims-green")
    const before = screen.getByRole("status").textContent
    fireEvent.click(screen.getByLabelText("Apply template Nova lesson"))
    expect(screen.getByRole("status").textContent).toContain("objective")
    fireEvent.click(screen.getByText("Undo"))
    expect(screen.getByRole("status").textContent).toBe(before)
  })

  it("is hidden on read-only slides", () => {
    show("nova-ims-green", true)
    expect(screen.queryByText("Template slides")).toBeNull()
  })
})

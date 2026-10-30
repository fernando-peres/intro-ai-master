import { render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"
import { docPlugin } from "@/artifacts/plugins/doc"
import { DocRenderer } from "@/artifacts/plugins/doc/editor"
import { SlideRenderer } from "@/artifacts/plugins/slide/editor"
import { createEmptySlide } from "@/artifacts/plugins/slide/model"
import { StudioThemeProvider } from "@/lib/studio-theme"

vi.mock("@/artifacts/plugins/slide/scene", () => ({
  SlideScene: ({ bare }: { bare?: boolean }) => <span>{bare ? "bare" : "with background"}</span>,
}))

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  )
})

describe("SlideRenderer", () => {
  const slide = { ...createEmptySlide(), background: { kind: "flat", color: "#112233" } as const }

  it("paints the background itself when presenting", () => {
    render(<SlideRenderer content={slide} presenting />)
    expect(screen.getByText("bare")).toBeTruthy()
    expect(screen.getByTestId("slide-renderer").style.background).toBe("rgb(17, 34, 51)")
  })

  it("leaves the background to the scene otherwise", () => {
    render(<SlideRenderer content={slide} />)
    expect(screen.getByText("with background")).toBeTruthy()
    expect(screen.getByTestId("slide-renderer").style.background).toBe("")
  })
})

describe("DocRenderer", () => {
  const doc = docPlugin.createEmpty()

  it("offers zoom only while presenting with controls", () => {
    const { rerender } = render(<DocRenderer content={doc} presenting showControls />, {
      wrapper: StudioThemeProvider,
    })
    expect(screen.getByTestId("doc-presenting")).toBeTruthy()
    expect(screen.getByLabelText("Zoom in")).toBeTruthy()

    rerender(<DocRenderer content={doc} presenting showControls={false} />)
    expect(screen.getByTestId("doc-presenting")).toBeTruthy()
    expect(screen.queryByLabelText("Zoom in")).toBeNull()
  })

  it("keeps the page card outside presentation", () => {
    render(<DocRenderer content={doc} />, { wrapper: StudioThemeProvider })
    expect(screen.queryByTestId("doc-presenting")).toBeNull()
    expect(screen.queryByLabelText("Zoom in")).toBeNull()
  })
})

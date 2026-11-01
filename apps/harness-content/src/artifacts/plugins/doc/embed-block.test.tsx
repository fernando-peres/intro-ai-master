import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  clampWidth,
  DocEmbed,
  DocEmbedPlayback,
  type DocEmbedProps,
  widthFromDrag,
} from "@/artifacts/plugins/doc/embed-block"
import { EmbeddedArtifact } from "@/components/embed/embedded-artifact"

vi.mock("@/components/embed/embedded-artifact", () => ({
  isLiveEmbed: (embed: DocEmbedProps) => embed.artifactType !== "slide",
  EmbedChip: () => <div>chip</div>,
  EmbedRepin: () => null,
  EmbeddedArtifact: vi.fn(() => <div />),
}))

const embed: DocEmbedProps = {
  artifactId: "ra",
  versionId: "v",
  locale: "en",
  title: "Pipeline",
  artifactType: "diagram",
  versionNumber: 3,
  width: 60,
  aspect: "4:3",
  align: "left",
}
const show = (props: Partial<DocEmbedProps> = {}, editable = true, onChange = vi.fn()) => {
  render(
    <DocEmbed
      embed={{ ...embed, ...props }}
      editable={editable}
      onChange={onChange}
      onSelect={() => {}}
    />,
  )
  return onChange
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("sizing", () => {
  it("clamps to 20–100", () => {
    expect([clampWidth(5), clampWidth(55.4), clampWidth(140)]).toEqual([20, 55, 100])
  })

  it("converts drag distance, doubled when centred", () => {
    expect(widthFromDrag(50, 100, 1000, "left")).toBe(60)
    expect(widthFromDrag(50, 100, 1000, "center")).toBe(70)
    expect(widthFromDrag(50, -900, 1000, "left")).toBe(20)
  })
})

describe("DocEmbed", () => {
  it("applies width and aspect, with the caption", () => {
    show()
    expect(screen.getByRole("figure").style.width).toBe("60%")
    expect(screen.getByTestId("embed-box").style.aspectRatio).toBe("4 / 3")
    expect(screen.getByText("Pipeline")).toBeTruthy()
    expect(screen.getByText(/diagram · en v3/)).toBeTruthy()
  })

  it("gives auto a fixed height", () => {
    show({ aspect: "auto" })
    expect(screen.getByTestId("embed-box").style.height).toBe("320px")
  })

  it("resizes by keyboard within the limits", () => {
    const onChange = show({ width: 98 })
    const handle = screen.getByRole("button", { name: /Resize embed, 98%/ })
    fireEvent.keyDown(handle, { key: "ArrowRight" })
    expect(onChange).toHaveBeenCalledWith({ width: 100 })
  })

  it("resizes by dragging and saves only on release", () => {
    const onChange = show()
    const handle = screen.getByRole("button", { name: /Resize embed/ })
    Object.defineProperty(screen.getByRole("figure").parentElement, "clientWidth", { value: 1000 })
    fireEvent.pointerDown(handle, { clientX: 500 })
    fireEvent.pointerMove(window, { clientX: 600 })
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.pointerUp(window, { clientX: 600 })
    expect(onChange).toHaveBeenCalledWith({ width: 70 })
  })

  it("plays nothing while editing and follows the reader's playback otherwise", () => {
    show()
    expect(vi.mocked(EmbeddedArtifact).mock.lastCall?.[0].playback).toBe("static")
    cleanup()
    show({}, false)
    expect(vi.mocked(EmbeddedArtifact).mock.lastCall?.[0].playback).toBe("auto")
    expect(screen.queryByRole("button")).toBeNull()
    cleanup()
    render(
      <DocEmbedPlayback value="static">
        <DocEmbed embed={embed} editable={false} onChange={() => {}} onSelect={() => {}} />
      </DocEmbedPlayback>,
    )
    expect(vi.mocked(EmbeddedArtifact).mock.lastCall?.[0].playback).toBe("static")
  })

  it("keeps the chip for types that don't render live", () => {
    show({ artifactType: "slide" })
    expect(screen.getByText("chip")).toBeTruthy()
  })
})

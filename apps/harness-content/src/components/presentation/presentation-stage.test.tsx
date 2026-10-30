import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  PresentationBadge,
  PresentationStage,
  PresentationZoom,
  usePresentation,
} from "@/components/presentation/presentation-stage"

function Harness({ onExit }: { onExit: () => void }) {
  const { stageRef, controls } = usePresentation(onExit)
  return (
    <PresentationStage stageRef={stageRef} isDoc={false}>
      <input aria-label="field" />
      {controls && <span>controls</span>}
    </PresentationStage>
  )
}

afterEach(() => {
  vi.restoreAllMocks()
  Reflect.deleteProperty(HTMLElement.prototype, "requestFullscreen")
  Reflect.deleteProperty(document, "fullscreenElement")
})

describe("usePresentation", () => {
  it("starts without controls and toggles them with i", () => {
    render(<Harness onExit={() => {}} />)
    expect(screen.queryByText("controls")).toBeNull()
    fireEvent.keyDown(window, { key: "i" })
    expect(screen.getByText("controls")).toBeTruthy()
    fireEvent.keyDown(window, { key: "I" })
    expect(screen.queryByText("controls")).toBeNull()
  })

  it("ignores i while typing or with a modifier", () => {
    render(<Harness onExit={() => {}} />)
    fireEvent.keyDown(screen.getByLabelText("field"), { key: "i" })
    fireEvent.keyDown(window, { key: "i", metaKey: true })
    fireEvent.keyDown(window, { key: "i", ctrlKey: true })
    expect(screen.queryByText("controls")).toBeNull()
  })

  it("exits on Esc", () => {
    const onExit = vi.fn()
    render(<Harness onExit={onExit} />)
    fireEvent.keyDown(window, { key: "Escape" })
    expect(onExit).toHaveBeenCalledOnce()
  })

  it("exits when the browser leaves fullscreen, but not before entering it", () => {
    const onExit = vi.fn()
    render(<Harness onExit={onExit} />)
    fireEvent(document, new Event("fullscreenchange"))
    expect(onExit).not.toHaveBeenCalled()

    const stage = screen.getByTestId("presentation-stage")
    Object.defineProperty(document, "fullscreenElement", { configurable: true, value: stage })
    fireEvent(document, new Event("fullscreenchange"))
    Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null })
    fireEvent(document, new Event("fullscreenchange"))
    expect(onExit).toHaveBeenCalledOnce()
  })

  it("survives a refused fullscreen request", async () => {
    const request = vi.fn().mockRejectedValue(new TypeError("Permissions check failed"))
    Object.defineProperty(HTMLElement.prototype, "requestFullscreen", {
      configurable: true,
      value: request,
    })
    render(<Harness onExit={() => {}} />)
    await act(async () => {})
    expect(request).toHaveBeenCalledOnce()
    expect(screen.getByTestId("presentation-stage")).toBeTruthy()
  })
})

describe("PresentationZoom", () => {
  it("steps within its limits and resets", () => {
    const onZoom = vi.fn()
    const { rerender } = render(<PresentationZoom zoom={1} onZoom={onZoom} />)
    expect(screen.getByText("100%")).toBeTruthy()
    expect((screen.getByLabelText("Reset zoom") as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByLabelText("Zoom in"))
    expect(onZoom).toHaveBeenLastCalledWith(1.25)
    fireEvent.click(screen.getByLabelText("Zoom out"))
    expect(onZoom).toHaveBeenLastCalledWith(0.75)

    rerender(<PresentationZoom zoom={0.5} onZoom={onZoom} />)
    expect((screen.getByLabelText("Zoom out") as HTMLButtonElement).disabled).toBe(true)
    rerender(<PresentationZoom zoom={3} onZoom={onZoom} />)
    expect((screen.getByLabelText("Zoom in") as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByLabelText("Reset zoom"))
    expect(onZoom).toHaveBeenLastCalledWith(1)
  })
})

describe("PresentationBadge", () => {
  it("shows the step and percent of a trail", () => {
    render(<PresentationBadge name="Onboarding" progress={{ step: 3, total: 12 }} />)
    expect(screen.getByText("STEP 3 / 12")).toBeTruthy()
    expect(screen.getByText("25%")).toBeTruthy()
  })

  it("shows only the name of a lone artifact", () => {
    const { container } = render(<PresentationBadge name="Intro" />)
    expect(container.textContent).toBe("Intro")
  })
})

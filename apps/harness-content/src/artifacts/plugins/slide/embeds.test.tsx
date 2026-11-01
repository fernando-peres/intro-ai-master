import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createEmptyDiagram, type FlowDiagram, flowAspect } from "@/artifacts/plugins/diagram/model"
import { EmbedOverlay } from "@/artifacts/plugins/slide/embed-overlay"
import {
  createEmbed,
  fitEmbedToAspect,
  slideSchema,
  slideSearchText,
} from "@/artifacts/plugins/slide/model"
import { embedAspect } from "@/components/embed/embed-aspect"
import { EmbeddedArtifact } from "@/components/embed/embedded-artifact"
import type { EmbedRef } from "@/lib/embeds"
import { embedsOf } from "@/lib/embeds"

vi.mock("@/components/embed/embedded-artifact", () => ({ EmbeddedArtifact: vi.fn(() => <i />) }))

const ref: EmbedRef = {
  artifactId: "ra",
  versionId: "v",
  locale: "en",
  title: "Pipeline",
  artifactType: "diagram",
  versionNumber: 2,
}
const slide = (element: unknown) => ({ schemaVersion: 1, type: "slide", elements: [element] })

afterEach(cleanup)

describe("slide.embed", () => {
  it("round-trips and is found by embedsOf and search", () => {
    const element = createEmbed(ref)
    const parsed = slideSchema.parse(JSON.parse(JSON.stringify(slide(element))))
    expect(parsed.elements[0]).toEqual(element)
    expect(embedsOf(parsed)).toEqual([{ path: "elements.0", ref }])
    expect(slideSearchText(parsed)).toContain("Pipeline")
  })

  it("defaults to locked aspect and static playback, centred on the canvas", () => {
    const element = createEmbed(ref)
    expect(element).toMatchObject({ lockAspect: true, playback: "static", x: 480, y: 270 })
  })

  it("rejects the removed diagram element", () => {
    const old = { id: "d", type: "diagram", x: 0, y: 0, width: 9, height: 9, labels: [] }
    expect(slideSchema.safeParse(slide(old)).success).toBe(false)
  })

  it("fits the height to the content's aspect", () => {
    expect(fitEmbedToAspect(createEmbed(ref), 2)).toMatchObject({ width: 960, height: 480 })
  })
})

describe("EmbedOverlay", () => {
  const element = { ...createEmbed(ref), playback: "auto" as const }
  const box = { x: 100, y: 200, width: 400, height: 300, rotation: 30 }
  const show = (still: boolean) =>
    render(<EmbedOverlay element={element} box={box} scale={0.5} hostTheme="mint" still={still} />)

  it("sits at the scaled box, rotated around its origin, and lets clicks through", () => {
    show(false)
    const { style, className } = screen.getByTestId("embed-overlay")
    expect([style.left, style.top, style.width, style.height]).toEqual([
      "50px",
      "100px",
      "200px",
      "150px",
    ])
    expect(style.transform).toBe("rotate(30deg)")
    expect(style.transformOrigin).toBe("top left")
    expect(className).toContain("pointer-events-none")
  })

  it("applies the host theme; a still view overrides playback", () => {
    show(false)
    expect(vi.mocked(EmbeddedArtifact).mock.lastCall?.[0]).toMatchObject({
      hostTheme: "mint",
      playback: "auto",
    })
    cleanup()
    show(true)
    expect(vi.mocked(EmbeddedArtifact).mock.lastCall?.[0].playback).toBe("static")
  })
})

describe("content aspect", () => {
  it("measures a flow diagram's nodes", async () => {
    const flow = createEmptyDiagram("flow") as FlowDiagram
    expect(flowAspect(flow)).toBeGreaterThan(4)
    expect(await embedAspect("diagram", flow)).toBe(flowAspect(flow))
    expect(flowAspect({ ...flow, nodes: [] })).toBeNull()
  })

  it("treats animations as 16:9", async () => {
    expect(await embedAspect("animation", {})).toBeCloseTo(16 / 9)
  })
})

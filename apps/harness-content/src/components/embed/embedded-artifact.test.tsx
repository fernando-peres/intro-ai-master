import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useArtifactVersions, useVersion } from "@/api/queries"
import { createEmptyDiagram } from "@/artifacts/plugins/diagram/model"
import { EmbeddedArtifact, EmbedRepin } from "@/components/embed/embedded-artifact"
import { StepRenderer } from "@/components/trail/themed-content"
import { type EmbedRef, embedsOf, repinned } from "@/lib/embeds"

vi.mock("@/api/queries", () => ({ useVersion: vi.fn(), useArtifactVersions: vi.fn() }))
vi.mock("@/api/client", () => ({
  api: { GET: async () => ({ data: [{ flowId: "f1" }] }) },
}))
vi.mock("@/components/trail/themed-content", () => ({
  StepRenderer: vi.fn(() => <div data-testid="stage" />),
}))

const embed: EmbedRef = {
  artifactId: "ra1",
  versionId: "v1",
  locale: "en",
  title: "Pipeline",
  artifactType: "diagram",
  versionNumber: 1,
}
const version = (useVersion as unknown as ReturnType<typeof vi.fn>).mockName("useVersion")
const loaded = (content: unknown, artifactId = "ra1") =>
  version.mockReturnValue({
    isPending: false,
    data: { version: { artifactId, content } },
  })

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("EmbeddedArtifact", () => {
  it("shows a loading state", () => {
    version.mockReturnValue({ isPending: true })
    render(<EmbeddedArtifact embed={embed} />)
    expect(screen.getByRole("status").getAttribute("aria-label")).toBe("Loading Pipeline")
  })

  it("says when the pinned version is missing", () => {
    version.mockReturnValue({ isPending: false, isError: true })
    render(<EmbeddedArtifact embed={embed} />)
    expect(screen.getByRole("alert").textContent).toContain("no longer available")
  })

  it("treats another artifact's version as missing", () => {
    loaded(createEmptyDiagram(), "ra2")
    render(<EmbeddedArtifact embed={embed} />)
    expect(screen.getByRole("alert").textContent).toContain("no longer available")
  })

  it("says when the stored content is invalid", () => {
    loaded({ schemaVersion: 1, type: "diagram", engine: "plantuml" })
    render(<EmbeddedArtifact embed={embed} />)
    expect(screen.getByRole("alert").textContent).toContain("not valid")
  })

  it.each([
    ["static", true],
    ["auto", false],
  ] as const)("renders with the host theme and %s playback", (playback, still) => {
    const content = createEmptyDiagram()
    loaded(content)
    render(<EmbeddedArtifact embed={embed} hostTheme="mint" playback={playback} />)
    expect(screen.getByTestId("stage")).toBeTruthy()
    expect(vi.mocked(StepRenderer).mock.calls[0][0]).toMatchObject({
      type: "diagram",
      content,
      trailTheme: "mint",
      still,
      showControls: false,
    })
  })

  it("keeps the chip for types that don't render live", () => {
    render(<EmbeddedArtifact embed={{ ...embed, artifactType: "slide" }} />)
    expect(screen.getByText("Pipeline")).toBeTruthy()
    expect(useVersion).not.toHaveBeenCalled()
  })
})

describe("re-pinning", () => {
  const rows = [
    { id: "v1", locale: "en", isDefault: false, versionNumber: 1 },
    { id: "v2", locale: "en", isDefault: true, versionNumber: 2 },
    { id: "v9", locale: "pt-BR", isDefault: true, versionNumber: 9 },
  ]

  it("moves to the default in the same locale", () => {
    expect(repinned(embed, rows)).toEqual({ ...embed, versionId: "v2", versionNumber: 2 })
  })

  it("does nothing when current or when the locale has no default", () => {
    expect(repinned({ ...embed, versionId: "v2" }, rows)).toBeNull()
    expect(repinned({ ...embed, locale: "fr" }, rows)).toBeNull()
  })

  it("offers the update and reports the new pin", () => {
    vi.mocked(useArtifactVersions).mockReturnValue({ data: rows } as never)
    const onRepin = vi.fn()
    render(<EmbedRepin embed={embed} onRepin={onRepin} />)
    fireEvent.click(screen.getByRole("button", { name: /Update to v2/ }))
    expect(onRepin).toHaveBeenCalledWith({ ...embed, versionId: "v2", versionNumber: 2 })
  })

  it("stays hidden when already current", () => {
    vi.mocked(useArtifactVersions).mockReturnValue({ data: rows } as never)
    render(<EmbedRepin embed={{ ...embed, versionId: "v2" }} onRepin={() => {}} />)
    expect(screen.queryByRole("button")).toBeNull()
  })
})

describe("embedsOf", () => {
  it("finds nested doc embeds and slide embeds with their paths", () => {
    const doc = {
      blocks: [
        { type: "paragraph" },
        { type: "toggleListItem", children: [{ type: "raEmbed", props: embed }] },
      ],
    }
    expect(embedsOf(doc)).toEqual([{ path: "blocks.1.children.0", ref: embed }])
    const slide = { elements: [{ type: "rect" }, { type: "embed", ref: embed }] }
    expect(embedsOf(slide)).toEqual([{ path: "elements.1", ref: embed }])
    expect(embedsOf({ engine: "flow" })).toEqual([])
  })
})

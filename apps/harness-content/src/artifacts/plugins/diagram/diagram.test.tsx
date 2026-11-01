import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { DiagramEditorProvider } from "@/artifacts/plugins/diagram/editor-context"
import {
  createEmptyDiagram,
  type DiagramContent,
  diagramSchema,
  diagramSearchText,
  type FlowDiagram,
  type MermaidDiagram,
  removeNodes,
  switchEngine,
} from "@/artifacts/plugins/diagram/model"
import { addNode } from "@/artifacts/plugins/diagram/panels"
import {
  DiagramEditorView,
  DiagramRenderer,
  toFlowEdges,
  toFlowNodes,
} from "@/artifacts/plugins/diagram/view"
import { SLIDE_THEMES } from "@/artifacts/plugins/slide/model"

const mermaid = vi.hoisted(() => ({
  initialize: vi.fn(),
  parse: vi.fn(async (_source: string) => true),
  render: vi.fn(async (_id: string, source: string) => ({ svg: `<svg>${source}</svg>` })),
}))
vi.mock("mermaid", () => ({ default: mermaid }))

const flow = () => createEmptyDiagram("flow") as FlowDiagram
const chart = (source: string) => ({ ...createEmptyDiagram("mermaid"), source }) as MermaidDiagram

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
  globalThis.DOMMatrixReadOnly ??= class {
    m22 = 1
  } as unknown as typeof DOMMatrixReadOnly
})
afterEach(cleanup)

describe("schema", () => {
  it.each(["flow", "mermaid"] as const)("round-trips a %s diagram", (engine) => {
    const content = createEmptyDiagram(engine)
    expect(diagramSchema.parse(JSON.parse(JSON.stringify(content)))).toEqual(content)
  })

  it("rejects an unknown engine", () => {
    const bad = { schemaVersion: 1, type: "diagram", engine: "plantuml" }
    expect(diagramSchema.safeParse(bad).success).toBe(false)
  })

  it("search text holds labels or source", () => {
    const content = flow()
    content.edges[0].label = "on failure"
    expect(diagramSearchText(content)).toContain("Record trace")
    expect(diagramSearchText(content)).toContain("on failure")
    expect(diagramSearchText(chart("flowchart LR\n a --> b"))).toContain("a --> b")
  })
})

describe("graph edits", () => {
  it("removing a node removes its edges", () => {
    const next = removeNodes(flow(), ["n2"])
    expect(next.nodes.map((n) => n.id)).toEqual(["n1", "n3", "n4"])
    expect(next.edges.map((e) => e.id)).toEqual(["e3"])
  })

  it("added nodes get a free id and stay valid", () => {
    const next = addNode(removeNodes(flow(), ["n1"]), "diamond")
    expect(new Set(next.nodes.map((n) => n.id)).size).toBe(next.nodes.length)
    expect(diagramSchema.safeParse(next).success).toBe(true)
  })

  it("switching engine keeps only the theme", () => {
    const next = switchEngine({ ...flow(), theme: "mint" }, "mermaid")
    expect(next).toMatchObject({ engine: "mermaid", theme: "mint" })
  })
})

describe("renderers", () => {
  it("maps tones to theme colours and edges to their endpoints", () => {
    const content = flow()
    const nodes = toFlowNodes(content, SLIDE_THEMES.mint, false)
    expect(nodes[0].data.stroke).toBe(SLIDE_THEMES.mint.accent)
    expect(nodes[1].data.stroke).toBe(SLIDE_THEMES.mint.line)
    expect(toFlowEdges(content, SLIDE_THEMES.mint)[0]).toMatchObject({
      source: "n1",
      target: "n2",
    })
  })

  it("draws flow node labels", async () => {
    render(<DiagramRenderer content={flow()} presenting />)
    expect(await screen.findByText("Record trace")).toBeTruthy()
  })

  it("renders Mermaid in strict mode", async () => {
    render(<DiagramRenderer content={chart("flowchart LR\n a --> b")} />)
    await waitFor(() => expect(screen.getByTestId("mermaid-svg").innerHTML).toContain("<svg"))
    expect(mermaid.initialize).toHaveBeenCalledWith(
      expect.objectContaining({ securityLevel: "strict" }),
    )
  })

  it("shows a parse error inline and keeps the last drawing", async () => {
    const props = { onChange: () => {}, readOnly: false, artifactId: "a", locale: "en" }
    const view = (content: DiagramContent) => (
      <DiagramEditorProvider>
        <DiagramEditorView content={content} {...props} />
      </DiagramEditorProvider>
    )
    const { rerender } = render(view(chart("flowchart LR\n a --> b")))
    await waitFor(() => expect(screen.getByTestId("mermaid-svg").textContent).toContain("a --> b"))

    mermaid.parse.mockRejectedValueOnce(new Error("Parse error on line 2"))
    rerender(view(chart("flowchart LR\n a -->")))
    expect((await screen.findByRole("alert")).textContent).toContain("Parse error on line 2")
    expect(screen.getByTestId("mermaid-svg").textContent).toContain("a --> b")
  })

  it("edits Mermaid source through the textarea", () => {
    const onChange = vi.fn()
    render(
      <DiagramEditorProvider>
        <DiagramEditorView
          content={chart("flowchart LR")}
          onChange={onChange}
          readOnly={false}
          artifactId="a"
          locale="en"
        />
      </DiagramEditorProvider>,
    )
    fireEvent.change(screen.getByLabelText("Mermaid source"), { target: { value: "graph TD" } })
    expect(onChange.mock.calls[0][0]).toMatchObject({ source: "graph TD" })
  })
})

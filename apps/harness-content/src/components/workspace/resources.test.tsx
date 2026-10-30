import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { MarkdownPreview, ResourcesInspector } from "@/components/workspace/resources"
import type { Asset } from "@/lib/resources"

const asset = (id: string, name: string, mimeType: string): Asset => ({
  id,
  artifactId: "ra_1",
  name,
  mimeType,
  sizeBytes: 2150,
  checksum: "x",
  revision: 1,
  createdBy: "usr_author",
  updatedBy: "usr_author",
  createdAt: "2026-10-30-11-58-00",
  updatedAt: "2026-10-30-11-58-00",
})

const ASSETS = [
  asset("ast_1", "untitled-note.md", "text/markdown"),
  asset("ast_2", "rubric.pdf", "application/pdf"),
]

type SentRequest = Request & { sentBody?: BodyInit | null }

// openapi-fetch captures `fetch` when the client module loads, so delegate before imports run.
// Node's Request needs absolute URLs and cannot read jsdom's FormData, so keep the raw body.
const fetchMock = vi.hoisted(() => {
  const mock = vi.fn<(request: SentRequest) => Promise<Response>>()
  const Base = globalThis.Request
  globalThis.Request = class extends Base {
    sentBody?: BodyInit | null
    constructor(input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === "string" ? new URL(input, "http://localhost") : input
      super(url, init && { ...init, body: null })
      this.sentBody = init?.body
    }
  }
  globalThis.fetch = ((request: SentRequest) => mock(request)) as typeof fetch
  return mock
})

afterEach(() => fetchMock.mockReset())

function renderInspector(readOnly = false) {
  const onSelect = vi.fn()
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ResourcesInspector
        artifactId="ra_1"
        assets={ASSETS}
        selectedId="ast_1"
        onSelect={onSelect}
        readOnly={readOnly}
        collapsed={false}
        onCollapse={() => {}}
      />
    </QueryClientProvider>,
  )
  return onSelect
}

describe("resources inspector", () => {
  it("groups notes and files and filters them by name", () => {
    renderInspector()
    const notes = screen.getByRole("region", { name: "Notes" })
    expect(within(notes).getByRole("button", { name: /untitled-note\.md/ })).toHaveProperty(
      "ariaCurrent",
      "true",
    )
    const files = screen.getByRole("region", { name: "Files" })
    expect(within(files).getByText(/PDF · 2\.1 KB/)).toBeTruthy()

    fireEvent.change(screen.getByRole("searchbox", { name: "Search notes and files" }), {
      target: { value: "rubric" },
    })
    expect(within(notes).getByText("No matching notes")).toBeTruthy()
  })

  it("creates a note under a free name and opens it", async () => {
    const sent: { url: string; artifactId: unknown; name: unknown }[] = []
    fetchMock.mockImplementation(async (request) => {
      const form = request.sentBody as FormData
      const file = form.get("file") as File
      sent.push({ url: request.url, artifactId: form.get("artifactId"), name: file.name })
      return Response.json(asset("ast_3", file.name, "text/markdown"), { status: 201 })
    })
    const onSelect = renderInspector()
    fireEvent.click(screen.getByRole("button", { name: "New note" }))
    await waitFor(() => expect(sent).toHaveLength(1))
    expect(sent[0]).toEqual({
      url: "http://localhost/api/v1/assets",
      artifactId: "ra_1",
      name: "untitled-note-2.md",
    })
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith("ast_3"))
  })

  it("hides authoring controls from viewers", () => {
    renderInspector(true)
    expect(screen.queryByRole("button", { name: "New note" })).toBeNull()
    expect(screen.queryByLabelText("Attach files")).toBeNull()
  })
})

describe("markdown preview", () => {
  it("renders headings, lists, code and quotes, but never raw HTML", () => {
    const text = [
      "## Evaluation notes",
      "- Trace replay is deterministic",
      "```\nverdict = reconcile()\n```",
      "> If the harness cannot explain the verdict, it does not ship.",
      '<img src=x onerror="alert(1)"><script>alert(1)</script>',
      "[bad](javascript:alert(1))",
    ].join("\n\n")
    const { container } = render(<MarkdownPreview text={text} />)
    expect(screen.getByRole("heading", { level: 2, name: "Evaluation notes" })).toBeTruthy()
    expect(screen.getByRole("listitem").textContent).toBe("Trace replay is deterministic")
    expect(container.querySelector("pre")?.textContent).toContain("verdict = reconcile()")
    expect(container.querySelector("blockquote")).toBeTruthy()
    expect(container.querySelector("img, script")).toBeNull()
    expect(screen.getByText("bad").getAttribute("href")).not.toMatch(/javascript/)
  })
})

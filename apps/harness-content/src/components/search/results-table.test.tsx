import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router"
import { render, screen, within } from "@testing-library/react"
import type { ReactNode } from "react"
import { describe, expect, it } from "vitest"
import { ResultsTable } from "@/components/search/results-table"
import { artifact } from "@/test/fixtures"

function renderWithRouter(ui: ReactNode) {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => ui }),
    history: createMemoryHistory(),
  })
  return render(<RouterProvider router={router} />)
}

const ITEMS = [
  artifact({
    id: "ra_1",
    title: "Harness scoring",
    tags: ["eval", "scoring"],
    status: "has-published",
    reuseCount: 3,
    locationPath: [
      { id: "box", kind: "box", title: "Intro to AI" },
      { id: "unit", kind: "unit", title: "Foundations" },
    ],
    localeVersions: [
      { locale: "en", latestNumber: 2, defaultNumber: 2, hasDraft: false },
      { locale: "pt-PT", latestNumber: null, defaultNumber: null, hasDraft: true },
    ],
  }),
  artifact({ id: "ra_2", title: "Welcome tour", type: "doc" }),
]

describe("ResultsTable", () => {
  it("renders the design's columns for each artifact", async () => {
    renderWithRouter(<ResultsTable items={ITEMS} now={new Date(Date.UTC(2026, 9, 29, 14, 0, 0))} />)
    const row = (await screen.findByText("Harness scoring")).closest("tr") as HTMLElement
    const cells = within(row)
    expect(cells.getByText("eval")).toBeTruthy()
    expect(cells.getByText("Intro to AI")).toBeTruthy()
    expect(cells.getByText("Foundations")).toBeTruthy()
    expect(cells.getByText("v2")).toBeTruthy()
    expect(cells.getByText("draft")).toBeTruthy()
    expect(cells.getByText("published")).toBeTruthy()
    expect(cells.getByText("×3")).toBeTruthy()
    expect(cells.getByText("2h ago")).toBeTruthy()
    const link = cells.getByRole("link")
    expect(link.getAttribute("href")).toBe("/artifacts/ra_1")

    const other = screen.getByText("Welcome tour").closest("tr") as HTMLElement
    expect(within(other).queryByText("Box level")).toBeNull()
  })

  it("exposes real table semantics", async () => {
    renderWithRouter(<ResultsTable items={ITEMS} />)
    await screen.findByText("Harness scoring")
    expect(screen.getAllByRole("columnheader").map((th) => th.textContent)).toEqual([
      "Name",
      "Tags",
      "Location",
      "Versions",
      "Status",
      "Reuse",
      "Updated",
    ])
    expect(screen.getAllByRole("row")).toHaveLength(3)
  })

  it("drops the tags column when nothing is tagged", async () => {
    renderWithRouter(<ResultsTable items={[ITEMS[1]]} />)
    await screen.findByText("Welcome tour")
    expect(screen.queryByRole("columnheader", { name: "Tags" })).toBeNull()
  })
})

import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router"
import { render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ArtifactListItem } from "@/api/client"
import { LocationContent } from "@/components/library/location-view"
import { artifact, location } from "@/test/fixtures"

const LOCATIONS = [
  location({ id: "box", title: "Intro" }),
  location({ id: "unit", kind: "unit", parentId: "box", title: "Foundations" }),
  location({ id: "sec", kind: "section", parentId: "unit", title: "Models" }),
]

let items: ArtifactListItem[] = []
let total = 0

vi.mock("@/api/queries", () => ({
  useLocations: () => ({ data: LOCATIONS }),
  useLocationCounts: () => ({ data: { sec: total } }),
  useArtifactSearch: () => ({ data: { items, total }, isPending: false, isError: false }),
  useCreateLocation: () => ({ mutateAsync: vi.fn() }),
  useUpdateLocation: () => ({ mutateAsync: vi.fn() }),
}))
vi.mock("@/components/shell/studio-dialogs", () => ({
  useStudioDialogs: () => ({ newArtifact: vi.fn(), setRenamingId: vi.fn() }),
}))
vi.mock("@/components/library/artifact-thumbnail", () => ({
  ArtifactThumbnail: () => <span>thumbnail</span>,
}))

function renderWithRouter(ui: ReactNode) {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => ui }),
    history: createMemoryHistory(),
  })
  return render(<RouterProvider router={router} />)
}

describe("LocationContent", () => {
  beforeEach(() => {
    items = [artifact({ id: "a", title: "Neuron", locationId: "sec" })]
    total = 1
  })

  it("shows a box's whole hierarchy with totals and previews", async () => {
    renderWithRouter(<LocationContent location={LOCATIONS[0]} />)
    expect(await screen.findByRole("link", { name: "Foundations" })).toBeTruthy()
    expect(screen.getByRole("link", { name: "Models" })).toBeTruthy()
    expect(screen.getByText("Neuron")).toBeTruthy()
    expect(screen.getByText("thumbnail")).toBeTruthy()
    expect(screen.getAllByText("1 artifact")).toHaveLength(2)
  })

  it("shows only a unit's direct content", async () => {
    renderWithRouter(<LocationContent location={LOCATIONS[1]} />)
    expect(await screen.findByRole("link", { name: "Models" })).toBeTruthy()
    expect(screen.queryByText("Neuron")).toBeNull()
  })

  it("offers the add actions in an empty location", async () => {
    items = []
    total = 0
    renderWithRouter(<LocationContent location={LOCATIONS[2]} />)
    expect(await screen.findByText("Models is empty")).toBeTruthy()
    expect(screen.getByRole("button", { name: "New artifact" })).toBeTruthy()
    expect(screen.queryByRole("button", { name: /New section/ })).toBeNull()
  })

  it("says so when a location holds more than one page", async () => {
    total = 250
    renderWithRouter(<LocationContent location={LOCATIONS[2]} />)
    expect(await screen.findByText(/first 200 of 250/)).toBeTruthy()
  })
})

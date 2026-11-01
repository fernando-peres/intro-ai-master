import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  LocationAddButton,
  LocationNameInput,
  useAddLocation,
} from "@/components/library/location-controls"
import { location } from "@/test/fixtures"

const create = vi.fn()
const update = vi.fn()
const newArtifact = vi.fn()
const setRenamingId = vi.fn()

vi.mock("@/api/queries", () => ({
  useCreateLocation: () => ({ mutateAsync: create }),
  useUpdateLocation: () => ({ mutateAsync: update }),
}))
vi.mock("@/components/shell/studio-dialogs", () => ({
  useStudioDialogs: () => ({ newArtifact, setRenamingId }),
}))

function renderWithRouter(ui: ReactNode) {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => ui }),
    history: createMemoryHistory(),
  })
  return render(<RouterProvider router={router} />)
}

function AddBox() {
  const add = useAddLocation()
  return (
    <button type="button" onClick={() => add("box")}>
      Add box
    </button>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  create.mockResolvedValue({ id: "new" })
  update.mockResolvedValue({})
})

describe("LocationAddButton", () => {
  it("goes straight to the artifact dialog from a section", async () => {
    renderWithRouter(
      <LocationAddButton location={location({ id: "sec", kind: "section", title: "Models" })} />,
    )
    fireEvent.click(await screen.findByRole("button", { name: "New artifact in Models" }))
    expect(newArtifact).toHaveBeenCalledWith("sec")
  })

  it.each([
    ["box", "Unit", "unit", "Untitled unit"],
    ["unit", "Section", "section", "Untitled section"],
  ] as const)(
    "offers a %s the right child, created immediately",
    async (kind, item, child, title) => {
      renderWithRouter(
        <LocationAddButton location={location({ id: "here", kind, title: "Here" })} />,
      )
      fireEvent.click(await screen.findByRole("button", { name: "Add to Here" }))
      expect(await screen.findByRole("menuitem", { name: "Artifact" })).toBeTruthy()
      fireEvent.click(screen.getByRole("menuitem", { name: item }))
      await waitFor(() => expect(setRenamingId).toHaveBeenCalledWith("new"))
      expect(create).toHaveBeenCalledWith({ kind: child, title, parentId: "here" })
    },
  )
})

describe("useAddLocation", () => {
  it("creates an untitled box and opens it for naming", async () => {
    renderWithRouter(<AddBox />)
    fireEvent.click(await screen.findByRole("button", { name: "Add box" }))
    await waitFor(() => expect(setRenamingId).toHaveBeenCalledWith("new"))
    expect(create).toHaveBeenCalledWith({ kind: "box", title: "Untitled box", parentId: null })
  })
})

describe("LocationNameInput", () => {
  const place = location({ id: "unit", kind: "unit", title: "Old" })

  function setup() {
    const onDone = vi.fn()
    render(<LocationNameInput location={place} onDone={onDone} />)
    return { onDone, input: screen.getByRole("textbox", { name: "Name of Old" }) }
  }

  it("saves a trimmed name once on Enter, even if blur follows", async () => {
    const { input, onDone } = setup()
    fireEvent.change(input, { target: { value: "  New  " } })
    fireEvent.keyDown(input, { key: "Enter" })
    fireEvent.blur(input)
    await waitFor(() => expect(onDone).toHaveBeenCalledOnce())
    expect(update).toHaveBeenCalledOnce()
    expect(update).toHaveBeenCalledWith({ id: "unit", title: "New" })
  })

  it("saves on blur", async () => {
    const { input, onDone } = setup()
    fireEvent.change(input, { target: { value: "New" } })
    fireEvent.blur(input)
    await waitFor(() => expect(onDone).toHaveBeenCalledOnce())
    expect(update).toHaveBeenCalledWith({ id: "unit", title: "New" })
  })

  it("discards on Escape", async () => {
    const { input, onDone } = setup()
    fireEvent.change(input, { target: { value: "New" } })
    fireEvent.keyDown(input, { key: "Escape" })
    await waitFor(() => expect(onDone).toHaveBeenCalledOnce())
    expect(update).not.toHaveBeenCalled()
  })

  it.each(["   ", "Old"])("saves nothing for %j", async (value) => {
    const { input, onDone } = setup()
    fireEvent.change(input, { target: { value } })
    fireEvent.keyDown(input, { key: "Enter" })
    await waitFor(() => expect(onDone).toHaveBeenCalledOnce())
    expect(update).not.toHaveBeenCalled()
  })
})

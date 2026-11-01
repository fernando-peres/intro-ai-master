import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { RouteError } from "@/components/shell/route-error"

afterEach(cleanup)

describe("RouteError", () => {
  it("keeps the surrounding chrome when a page throws while rendering", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    const root = createRootRoute({
      component: () => (
        <>
          <nav>Studio navigation</nav>
          <Outlet />
        </>
      ),
    })
    const broken = createRoute({
      getParentRoute: () => root,
      path: "/",
      component: () => {
        throw new Error("x is not a function")
      },
    })
    const router = createRouter({
      routeTree: root.addChildren([broken]),
      history: createMemoryHistory(),
      defaultErrorComponent: RouteError,
    })
    render(<RouterProvider router={router} />)

    expect(await screen.findByRole("alert")).toBeTruthy()
    expect(screen.getByText("This page could not be shown")).toBeTruthy()
    expect(screen.queryByText(/x is not a function/)).toBeNull()
    expect(screen.getByText("Studio navigation")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy()
    expect(screen.getByRole("link", { name: "Go to artifact search" })).toBeTruthy()
  })
})

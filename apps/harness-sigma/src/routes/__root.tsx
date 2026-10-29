import { createRootRoute, Link, Outlet } from "@tanstack/react-router"

export const Route = createRootRoute({ component: RootLayout, notFoundComponent: NotFound })

function RootLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <Outlet />
    </div>
  )
}

function NotFound() {
  return (
    <div className="flex flex-col gap-4 p-14">
      <h1 className="text-2xl font-medium">Page not found</h1>
      <Link to="/" className="text-sm text-primary underline-offset-4 hover:underline">
        Back home
      </Link>
    </div>
  )
}

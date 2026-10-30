import { createRootRoute, Link, Outlet } from "@tanstack/react-router"
import { Sidebar } from "@/components/shell/sidebar"
import { StudioDialogsProvider } from "@/components/shell/studio-dialogs"
import { TopBar } from "@/components/shell/top-bar"
import { TopBarSlotsProvider } from "@/components/shell/top-bar-slots"

export const Route = createRootRoute({ component: RootLayout, notFoundComponent: NotFound })

function RootLayout() {
  return (
    <TopBarSlotsProvider>
      <StudioDialogsProvider>
        <div className="flex h-svh flex-col bg-gc-page text-gc-text">
          <TopBar />
          <div className="flex min-h-0 flex-1">
            <Sidebar />
            <main className="flex min-w-0 flex-1 flex-col">
              <Outlet />
            </main>
          </div>
        </div>
      </StudioDialogsProvider>
    </TopBarSlotsProvider>
  )
}

function NotFound() {
  return (
    <div className="flex flex-col gap-4 p-14">
      <h1 className="text-2xl font-medium">Page not found</h1>
      <Link to="/" className="text-sm text-gc-primary underline-offset-4 hover:underline">
        Back to artifact search
      </Link>
    </div>
  )
}

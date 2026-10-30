import { createRootRoute, Link, Outlet, useRouterState } from "@tanstack/react-router"
import { useEffect } from "react"
import { useArtifactThemes } from "@/api/queries"
import { registerThemes } from "@/artifacts/plugins/slide/themes"
import { Sidebar } from "@/components/shell/sidebar"
import { StudioDialogsProvider } from "@/components/shell/studio-dialogs"
import { TopBar } from "@/components/shell/top-bar"
import { TopBarSlotsProvider } from "@/components/shell/top-bar-slots"

export const Route = createRootRoute({ component: RootLayout, notFoundComponent: NotFound })

/** Keeps the renderers' synchronous theme lookup in step with the saved themes. */
function useThemeRegistry() {
  const themes = useArtifactThemes().data
  useEffect(() => {
    if (themes) registerThemes(themes)
  }, [themes])
}

function RootLayout() {
  useThemeRegistry()
  // The trail player is full screen, without the studio chrome; providers stay mounted so a
  // page that is still unmounting can use them.
  const bare = useRouterState({ select: (state) => state.location.pathname.startsWith("/play/") })
  return (
    <TopBarSlotsProvider>
      <StudioDialogsProvider>
        {bare ? (
          <Outlet />
        ) : (
          <div className="flex h-svh flex-col bg-gc-page text-gc-text">
            <TopBar />
            <div className="flex min-h-0 flex-1">
              <Sidebar />
              <main className="flex min-w-0 flex-1 flex-col">
                <Outlet />
              </main>
            </div>
          </div>
        )}
      </StudioDialogsProvider>
    </TopBarSlotsProvider>
  )
}

function NotFound() {
  return (
    <div className="flex flex-col gap-4 p-14">
      <h1 className="text-2xl font-medium">Page not found</h1>
      <Link to="/" className="text-sm text-gc-primary-ink underline-offset-4 hover:underline">
        Back to artifact search
      </Link>
    </div>
  )
}

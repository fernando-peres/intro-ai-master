import { createRootRoute, Link, Outlet, useRouterState } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { useArtifactThemes } from "@/api/queries"
import { registerThemes } from "@/artifacts/plugins/slide/themes"
import { Sidebar } from "@/components/shell/sidebar"
import { StudioDialogsProvider } from "@/components/shell/studio-dialogs"
import { TopBar } from "@/components/shell/top-bar"
import { TopBarSlotsProvider } from "@/components/shell/top-bar-slots"
import { COMPACT, useMediaQuery } from "@/hooks/use-media-query"

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
  // The trail player and print page are full screen, without the studio chrome; providers stay mounted so a
  // page that is still unmounting can use them.
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const bare = pathname.startsWith("/play/") || pathname.startsWith("/print/")
  const compact = useMediaQuery(COMPACT)
  const [drawer, setDrawer] = useState(false)
  // biome-ignore lint/correctness/useExhaustiveDependencies: navigating closes the drawer
  useEffect(() => setDrawer(false), [pathname])
  useEffect(() => {
    if (!drawer) return
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setDrawer(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [drawer])
  return (
    <TopBarSlotsProvider>
      <StudioDialogsProvider>
        {bare ? (
          <Outlet />
        ) : (
          <div className="flex h-svh flex-col bg-gc-page text-gc-text">
            <TopBar onMenu={compact ? () => setDrawer(true) : undefined} />
            <div className="flex min-h-0 flex-1">
              {!compact && <Sidebar />}
              {compact && drawer && (
                <>
                  <button
                    type="button"
                    aria-label="Close navigation"
                    onClick={() => setDrawer(false)}
                    className="fixed inset-0 z-40 bg-black/50"
                  />
                  <Sidebar className="fixed inset-y-0 left-0 z-50 shadow-xl" />
                </>
              )}
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

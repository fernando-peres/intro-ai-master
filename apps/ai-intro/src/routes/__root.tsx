import { createRootRoute, Link, Outlet } from "@tanstack/react-router"

import { FocusModeProvider, useFocusMode } from "@/components/course/focus-mode"
import { Sidebar } from "@/components/course/sidebar"
import { TopBar } from "@/components/course/top-bar"
import { LanguageProvider } from "@/i18n/language"

export const Route = createRootRoute({ component: RootLayout, notFoundComponent: NotFound })

function RootLayout() {
  return (
    <LanguageProvider>
      <FocusModeProvider>
        <Shell />
      </FocusModeProvider>
    </LanguageProvider>
  )
}

/** Header and sidebar are hidden in place, so the outlet never remounts when focus mode toggles. */
function Shell() {
  const { focused } = useFocusMode()
  return (
    <div className="flex h-svh flex-col bg-canvas text-fg">
      {!focused && <TopBar />}
      <div className="flex min-h-0 flex-1">
        {!focused && <Sidebar />}
        <main className="flex min-w-0 flex-1 flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="flex flex-col gap-4 px-14 py-11">
      <p className="label-ui text-fg-muted">404</p>
      <h1 className="font-display text-5xl text-fg">Lesson not found</h1>
      <Link to="/" className="label-ui text-brand">
        Back to the course →
      </Link>
    </div>
  )
}

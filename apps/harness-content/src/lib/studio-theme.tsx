import { createContext, type ReactNode, useCallback, useContext, useState } from "react"

export const STUDIO_THEMES = ["graphite-dark", "graphite-light"] as const
export type StudioTheme = (typeof STUDIO_THEMES)[number]

/** Must match the inline script in index.html, which applies it before first paint. */
const STORAGE_KEY = "harness.studioTheme"

function readTheme(): StudioTheme {
  const applied = document.documentElement.dataset.theme
  return STUDIO_THEMES.find((theme) => theme === applied) ?? "graphite-dark"
}

type Value = { theme: StudioTheme; setTheme: (theme: StudioTheme) => void }
const Context = createContext<Value | null>(null)

/** Studio chrome theme as `data-theme` on <html>, remembered per browser. */
export function StudioThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setState] = useState(readTheme)
  const setTheme = useCallback((next: StudioTheme) => {
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage blocked: the choice lasts until reload.
    }
    setState(next)
  }, [])
  return <Context value={{ theme, setTheme }}>{children}</Context>
}

export function useStudioTheme(): Value {
  const value = useContext(Context)
  if (!value) throw new Error("useStudioTheme needs <StudioThemeProvider>")
  return value
}

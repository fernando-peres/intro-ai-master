import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

export const DARK_STUDIO_THEMES = [
  "graphite-dark",
  "graphite-violet",
  "graphite-mint",
  "graphite-cobalt",
  "graphite-ivory",
] as const
export const STUDIO_THEMES = ["graphite-light", ...DARK_STUDIO_THEMES] as const
export type DarkStudioTheme = (typeof DARK_STUDIO_THEMES)[number]
export type StudioTheme = (typeof STUDIO_THEMES)[number]
export type StudioMode = "system" | "light" | "dark"

/** Both keys and this logic must match the inline script in index.html (runs before first paint). */
const THEME_KEY = "harness.studioTheme"
const MODE_KEY = "harness.studioMode"
const LIGHT_QUERY = "(prefers-color-scheme: light)"

export function resolveStudioTheme(
  mode: StudioMode,
  dark: DarkStudioTheme,
  systemLight: boolean,
): StudioTheme {
  return mode === "light" || (mode === "system" && systemLight) ? "graphite-light" : dark
}

function stored(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function store(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage blocked: the choice lasts until reload.
  }
}

/** Reads stored choices; a lone legacy `graphite-light` in the theme key means light mode. */
export function readPreferences(theme: string | null, mode: string | null) {
  return {
    dark: DARK_STUDIO_THEMES.find((option) => option === theme) ?? "graphite-dark",
    mode: (mode === "system" || mode === "light" || mode === "dark"
      ? mode
      : theme === "graphite-light"
        ? "light"
        : "dark") as StudioMode,
  }
}

function systemIsLight(): boolean {
  return window.matchMedia?.(LIGHT_QUERY).matches ?? false
}

type Value = {
  theme: StudioTheme
  mode: StudioMode
  setMode: (mode: StudioMode) => void
  /** Picks a theme card: also moves the mode to the side that shows it. */
  pickTheme: (theme: StudioTheme) => void
}
const Context = createContext<Value | null>(null)

/** Studio chrome theme as `data-theme` on <html>, remembered per browser. */
export function StudioThemeProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState(() => readPreferences(stored(THEME_KEY), stored(MODE_KEY)))
  const [systemLight, setSystemLight] = useState(systemIsLight)
  const theme = resolveStudioTheme(prefs.mode, prefs.dark, systemLight)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const query = window.matchMedia?.(LIGHT_QUERY)
    if (!query) return
    const onChange = (event: MediaQueryListEvent) => setSystemLight(event.matches)
    query.addEventListener("change", onChange)
    return () => query.removeEventListener("change", onChange)
  }, [])

  const setMode = useCallback((mode: StudioMode) => {
    store(MODE_KEY, mode)
    setPrefs((current) => ({ ...current, mode }))
  }, [])

  const pickTheme = useCallback(
    (next: StudioTheme) => {
      if (next === "graphite-light") return setMode("light")
      store(THEME_KEY, next)
      store(MODE_KEY, "dark")
      setPrefs({ dark: next, mode: "dark" })
    },
    [setMode],
  )

  const value = useMemo(
    () => ({ theme, mode: prefs.mode, setMode, pickTheme }),
    [theme, prefs.mode, setMode, pickTheme],
  )
  return <Context value={value}>{children}</Context>
}

export function useStudioTheme(): Value {
  const value = useContext(Context)
  if (!value) throw new Error("useStudioTheme needs <StudioThemeProvider>")
  return value
}

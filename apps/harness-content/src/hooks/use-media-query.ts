import { useEffect, useState } from "react"

/** Below this the sidebar is a drawer and the inspector starts collapsed. */
export const COMPACT = "(max-width: 1279px)"
/** Below this, authoring screens ask for a larger window. */
export const TOO_NARROW_TO_EDIT = "(max-width: 1023px)"

export const matchesMedia = (query: string) => window.matchMedia?.(query).matches ?? false

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => matchesMedia(query))
  useEffect(() => {
    const list = window.matchMedia?.(query)
    if (!list) return
    const onChange = () => setMatches(list.matches)
    onChange()
    list.addEventListener("change", onChange)
    return () => list.removeEventListener("change", onChange)
  }, [query])
  return matches
}

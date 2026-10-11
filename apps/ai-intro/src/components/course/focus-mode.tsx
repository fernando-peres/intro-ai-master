import { Maximize2Icon, Minimize2Icon } from "lucide-react"
import { createContext, type ReactNode, useContext, useEffect, useState } from "react"

import { useLanguage } from "@/i18n/language"

const FocusModeContext = createContext<{
  focused: boolean
  setFocused: (focused: boolean) => void
}>({ focused: false, setFocused: () => {} })

/** Not persisted: every visit starts in the standard layout. Escape exits focus mode. */
export function FocusModeProvider({ children }: { children: ReactNode }) {
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    if (!focused) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFocused(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [focused])
  return (
    <FocusModeContext.Provider value={{ focused, setFocused }}>
      {children}
    </FocusModeContext.Provider>
  )
}

export function useFocusMode() {
  return useContext(FocusModeContext)
}

/** Square icon chip shared by the lesson header's focus toggle and pager. */
export const iconChip =
  "flex cursor-pointer items-center justify-center rounded-sm border border-line p-1.5 text-fg-secondary transition-colors hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"

export function FocusToggle() {
  const { focused, setFocused } = useFocusMode()
  const { language } = useLanguage()
  const label = focused
    ? language === "pt-BR"
      ? "Sair do modo foco"
      : "Exit focus mode"
    : language === "pt-BR"
      ? "Modo foco"
      : "Focus mode"
  const Icon = focused ? Minimize2Icon : Maximize2Icon

  return (
    <button
      type="button"
      onClick={() => setFocused(!focused)}
      aria-pressed={focused}
      aria-label={label}
      title={label}
      className={iconChip}
    >
      <Icon className="size-3.5" aria-hidden />
    </button>
  )
}

import { SunMoonIcon } from "lucide-react"
import { useTheme } from "next-themes"

export const THEMES = ["dark", "light", "violet", "mint", "cobalt"] as const
type Theme = (typeof THEMES)[number]

const isTheme = (value: string | undefined): value is Theme => THEMES.includes(value as Theme)

/** Cycles through the design's five themes. */
export function ThemeChip() {
  const { theme, setTheme } = useTheme()
  const current: Theme = isTheme(theme) ? theme : "dark"
  const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length]

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Theme: ${current}. Switch to ${next}`}
      className="label-ui flex cursor-pointer items-center gap-[7px] rounded-[2px] border border-line px-3 py-1.5 text-fg-secondary transition-colors hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
    >
      <SunMoonIcon className="size-3" aria-hidden />
      {current}
    </button>
  )
}

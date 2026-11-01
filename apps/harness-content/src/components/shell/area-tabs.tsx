import type { KeyboardEvent } from "react"
import { cn } from "@/lib/utils"

type Tab<T extends string> = { id: T; label: string; badge?: number }
type Props<T extends string> = {
  label: string
  tabs: Tab<T>[]
  value: T
  onChange: (id: T) => void
  /** Keeps ids unique when two tab sets share a screen: `<prefix>-tab-<id>`. */
  prefix?: string
  variant?: "underline" | "pill"
}

/** The ids that tie a tab to its panel. */
export const tabIds = (id: string, prefix?: string) => ({
  tab: prefix ? `${prefix}-tab-${id}` : `tab-${id}`,
  panel: prefix ? `${prefix}-area-${id}` : `area-${id}`,
})

/**
 * WAI-ARIA tabs: arrow keys move between tabs, only the selected tab is in the tab order.
 * Each tab is `tab-<id>` and controls a panel the caller renders as `area-<id>` (see `tabIds`).
 */
export function AreaTabs<T extends string>({
  label,
  tabs,
  value,
  onChange,
  prefix,
  variant = "underline",
}: Props<T>) {
  const move = (event: KeyboardEvent, index: number) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = tabs[(index + step + tabs.length) % tabs.length]
    onChange(next.id)
    document.getElementById(tabIds(next.id, prefix).tab)?.focus()
  }
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn("flex h-full items-center", variant === "pill" ? "gap-[3px]" : "gap-1")}
    >
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          id={tabIds(tab.id, prefix).tab}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          aria-controls={tabIds(tab.id, prefix).panel}
          tabIndex={value === tab.id ? 0 : -1}
          onClick={() => onChange(tab.id)}
          onKeyDown={(event) => move(event, index)}
          className={cn(
            "flex items-center gap-1.5 text-ui",
            variant === "pill"
              ? [
                  "h-7 rounded-[5px] px-1.5",
                  value === tab.id
                    ? "bg-gc-row-bg font-semibold text-gc-nav-ink"
                    : "text-gc-ink3 hover:text-gc-ink2",
                ]
              : [
                  "h-full border-b-2 px-3",
                  value === tab.id
                    ? "border-gc-primary font-semibold text-gc-text"
                    : "border-transparent text-gc-ink3 hover:text-gc-ink2",
                ],
          )}
        >
          {tab.label}
          {tab.badge !== undefined && (
            <span className="rounded-[3px] bg-gc-sunken px-[5px] font-mono text-label text-gc-ink2">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

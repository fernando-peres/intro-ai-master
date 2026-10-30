import type { KeyboardEvent } from "react"
import { cn } from "@/lib/utils"

type Tab<T extends string> = { id: T; label: string; badge?: number }
type Props<T extends string> = {
  label: string
  tabs: Tab<T>[]
  value: T
  onChange: (id: T) => void
}

/**
 * WAI-ARIA tabs: arrow keys move between tabs, only the selected tab is in the tab order.
 * Each tab is `tab-<id>` and controls a panel the caller renders as `area-<id>`.
 */
export function AreaTabs<T extends string>({ label, tabs, value, onChange }: Props<T>) {
  const move = (event: KeyboardEvent, index: number) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = tabs[(index + step + tabs.length) % tabs.length]
    onChange(next.id)
    document.getElementById(`tab-${next.id}`)?.focus()
  }
  return (
    <div role="tablist" aria-label={label} className="flex h-full items-center gap-1">
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          id={`tab-${tab.id}`}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          aria-controls={`area-${tab.id}`}
          tabIndex={value === tab.id ? 0 : -1}
          onClick={() => onChange(tab.id)}
          onKeyDown={(event) => move(event, index)}
          className={cn(
            "flex h-full items-center gap-1.5 border-b-2 px-3 text-xs",
            value === tab.id
              ? "border-gc-primary font-semibold text-gc-text"
              : "border-transparent text-gc-ink3 hover:text-gc-ink2",
          )}
        >
          {tab.label}
          {tab.badge !== undefined && (
            <span className="rounded-[3px] bg-gc-sunken px-[5px] font-mono text-[8.5px] text-gc-ink2">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

import { ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type Option = { value: string; label: string }

type Props = {
  label: string
  value: string | undefined
  options: Option[]
  onChange: (value: string | undefined) => void
}

/** "Type: Any" style filter: a native select laid over the pill, highlighted when set. */
export function FilterPill({ label, value, options, onChange }: Props) {
  const current = options.find((option) => option.value === value)
  const active = current !== undefined
  return (
    <span
      className={cn(
        "relative inline-flex h-[30px] shrink-0 items-center gap-1.5 rounded-md border border-gc-border px-2.5 text-ui",
        active ? "bg-gc-nav-bg font-semibold text-gc-nav-ink" : "bg-gc-sunken text-gc-ink2",
      )}
    >
      {label}: {current?.label ?? "Any"}
      <ChevronDownIcon
        aria-hidden
        className={cn("size-[11px]", active ? "text-gc-nav-ink" : "text-gc-ink3")}
      />
      <select
        aria-label={label}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || undefined)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        <option value="">Any</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </span>
  )
}

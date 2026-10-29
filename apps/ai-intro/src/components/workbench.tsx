import { MinusIcon, PlusIcon, SlidersHorizontalIcon } from "lucide-react"
import { type ReactNode, useId, useState } from "react"
import { useTranslation } from "@/i18n/use-translation"
import { cn } from "@/lib/utils"

/** Simulation workbench: a configuration rail beside a column of panels (stacked on mobile). */
export function Workbench({ rail, children }: { rail: ReactNode; children: ReactNode }) {
  return (
    <div className="grid items-start gap-5 md:grid-cols-[auto_minmax(0,1fr)]">
      {rail}
      <div className="flex min-w-0 flex-col gap-5">{children}</div>
    </div>
  )
}

/** The collapsible left rail: titled head, configuration sections, then a tip pinned below. */
export function ConfigRail({
  title,
  tip,
  children,
}: {
  title: string
  tip?: ReactNode
  children: ReactNode
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(true)
  return (
    <section
      aria-label={title}
      className={cn(
        "flex flex-col rounded-[3px] border border-divider bg-surface md:sticky md:top-4",
        open && "md:w-[248px]",
      )}
    >
      <div className="flex items-center justify-between gap-2.5 border-b border-divider px-3.5 py-[11px]">
        <h2 className={cn("label-ui text-fg-secondary", !open && "md:sr-only")}>{title}</h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? t("Hide configuration") : t("Show configuration")}
          className="text-fg-muted transition-colors hover:text-brand"
        >
          <SlidersHorizontalIcon className="size-3" aria-hidden />
        </button>
      </div>
      {open && (
        <div className="flex flex-col gap-[17px] p-3.5">
          {children}
          {tip && (
            <div className="mt-2 flex flex-col gap-1.5 border-t border-divider pt-3">
              <span className="label-ui text-brand">{t("Tip")}</span>
              <p className="font-display text-sm leading-snug text-fg-muted">{tip}</p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export function RailSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="label-ui text-fg-muted">{label}</span>
      {children}
    </div>
  )
}

export function railButtonClass(active = false) {
  return cn(
    "label-ui flex items-center justify-center gap-1.5 rounded-[2px] border px-2 py-[7px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-50",
    active ? "border-brand bg-elevated text-brand" : "border-line text-fg-muted hover:text-fg",
  )
}

/** A full-width row: label on the left, − value + on the right. */
export function Stepper({
  label,
  value,
  onDecrement,
  onIncrement,
  decrementLabel,
  incrementLabel,
}: {
  label: string
  value: number
  onDecrement: () => void
  onIncrement: () => void
  decrementLabel: string
  incrementLabel: string
}) {
  return (
    <div className="flex items-center justify-between rounded-[2px] border border-line px-2.5 py-1.5">
      <span className="label-ui text-fg-secondary">{label}</span>
      <div className="flex items-center gap-3">
        <button type="button" onClick={onDecrement} aria-label={decrementLabel}>
          <MinusIcon className="size-3 text-fg-muted hover:text-brand" aria-hidden />
        </button>
        <span className="w-4 text-center font-display text-[17px] leading-none text-brand">
          {value}
        </span>
        <button type="button" onClick={onIncrement} aria-label={incrementLabel}>
          <PlusIcon className="size-3 text-fg-muted hover:text-brand" aria-hidden />
        </button>
      </div>
    </div>
  )
}

export type Option<T extends string> = { value: T; label: string; badge?: ReactNode }

/** Mutually exclusive toggle buttons laid out in `columns` equal columns. */
export function OptionGrid<T extends string>({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  columns?: 1 | 2
}) {
  return (
    <div className={cn("grid gap-2", columns === 2 ? "grid-cols-2" : "grid-cols-1")}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(railButtonClass(value === option.value), columns === 1 && "justify-start")}
        >
          {option.label}
          {option.badge}
        </button>
      ))}
    </div>
  )
}

export type SelectOption<T extends string> = {
  value: T
  label: string
  description?: string
  badge?: ReactNode
}

/** A native combo box; the selected option's description and badge show beneath it. */
export function SelectField<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: SelectOption<T>[]
  value: T
  onChange: (value: T) => void
}) {
  const id = useId()
  const selected = options.find((option) => option.value === value)
  return (
    <div className="flex flex-col gap-2">
      <select
        aria-label={label}
        aria-describedby={selected?.description ? id : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="rounded-[2px] border border-line bg-surface px-2.5 py-1.5 font-display text-[17px] text-fg"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {(selected?.description || selected?.badge) && (
        <div className="flex flex-col items-start gap-1.5">
          {selected.badge}
          {selected.description && (
            <p id={id} className="text-xs text-fg-muted">
              {selected.description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function Switch({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between py-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <span className={cn("label-ui", checked ? "text-fg-secondary" : "text-fg-muted")}>
        {label}
      </span>
      <span
        aria-hidden
        className={cn(
          "flex h-3.5 w-[26px] items-center rounded-full border p-0.5 transition-colors",
          checked ? "justify-end border-brand bg-brand" : "justify-start border-line",
        )}
      >
        <span className={cn("size-2.5 rounded-full", checked ? "bg-canvas" : "bg-fg-muted")} />
      </span>
    </button>
  )
}

/** A surface card with a header row (title left, caption or legend right) and optional footer. */
export function Panel({
  title,
  aside,
  footer,
  children,
  className,
}: {
  title: string
  aside?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      aria-label={title}
      className={cn(
        "flex min-w-0 flex-col rounded-[3px] border border-divider bg-surface",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-divider px-4 py-[11px]">
        <h2 className="label-ui text-fg-secondary">{title}</h2>
        {aside && <div className="label-ui text-fg-muted">{aside}</div>}
      </div>
      <div className="flex flex-1 flex-col gap-3 px-4 pt-3.5 pb-4">{children}</div>
      {footer}
    </section>
  )
}

export function toolbarButtonClass(primary = false) {
  return cn(
    "label-ui flex items-center gap-[7px] rounded-[2px] border px-3.5 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-50",
    primary
      ? "border-brand bg-brand text-canvas hover:bg-brand-soft"
      : "border-line text-fg-secondary hover:text-fg",
  )
}

export type Metric = { label: string; value: string; highlight?: boolean }

/** Footer of the network panel: run controls and architecture left, live metrics right. */
export function RunToolbar({
  controls,
  architecture,
  metrics,
  metricsLabel,
}: {
  controls: ReactNode
  architecture: ReactNode
  metrics: Metric[]
  metricsLabel: string
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-7 gap-y-3 border-t border-divider px-4 py-2 md:px-7">
      <div className="flex flex-wrap items-center gap-2">
        {controls}
        <span aria-hidden className="mx-1 h-5 w-px bg-divider" />
        <span className="font-ui text-[10px] tracking-[0.18em] text-fg-secondary">
          {architecture}
        </span>
      </div>
      <dl aria-label={metricsLabel} className="flex items-center divide-x divide-divider">
        {metrics.map((m) => (
          <div key={m.label} className="flex flex-col gap-[3px] px-[18px] last:pr-0">
            <dt className="label-ui text-fg-muted">{m.label}</dt>
            <dd
              className={cn(
                "font-display text-[17px] leading-none",
                m.highlight ? "text-brand" : "text-fg",
              )}
            >
              {m.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export type CompareRow = {
  label: string
  count: string
  percent: number
  /** Replaces the `percent%` text when the figure is not a percentage; the bar still uses `percent`. */
  value?: string
  tone: "brand" | "muted"
}

/** Horizontal percentage bars, e.g. the network's accuracy against the hand-written rules. */
export function CompareBars({ rows }: { rows: CompareRow[] }) {
  return (
    <div className="flex flex-col gap-3.5">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col gap-[7px]">
          <div className="flex items-end justify-between gap-3">
            <span
              className={cn(
                "label-ui",
                row.tone === "brand" ? "text-fg-secondary" : "text-fg-muted",
              )}
            >
              {row.label}
            </span>
            <span className="flex items-baseline gap-3">
              <span className="font-ui text-[8.5px] tracking-[0.16em] text-fg-muted">
                {row.count}
              </span>
              <span
                className={cn(
                  "font-display text-[22px] leading-none",
                  row.tone === "brand" ? "text-brand" : "text-fg-secondary",
                )}
              >
                {row.value ?? `${row.percent}%`}
              </span>
            </span>
          </div>
          <div aria-hidden className="h-1.5 rounded-[3px] bg-elevated">
            <div
              className={cn(
                "h-full rounded-[3px] transition-[width]",
                row.tone === "brand" ? "bg-brand" : "bg-fg-muted/50",
              )}
              style={{ width: `${row.percent}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Closing note of a panel, separated by a hairline. */
export function PanelNote({ children }: { children: ReactNode }) {
  return (
    <div
      aria-live="polite"
      className="mt-auto flex flex-col gap-1.5 border-t border-divider pt-3 font-display text-[13.5px] leading-[1.45] text-fg-muted"
    >
      {children}
    </div>
  )
}

export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-[5px]">
      <span aria-hidden className="size-[7px] rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

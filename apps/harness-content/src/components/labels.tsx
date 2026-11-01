import { XIcon } from "lucide-react"
import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

export type StatusKind = "draft" | "review" | "published" | "archived"

const STATUS_STYLES: Record<StatusKind, { box: string; dot: string; ink: string }> = {
  draft: { box: "bg-gc-warn-tint", dot: "bg-gc-warn-base", ink: "text-gc-warn-ink" },
  review: { box: "bg-gc-risk-tint", dot: "bg-gc-risk-base", ink: "text-gc-risk-ink" },
  published: { box: "bg-gc-pass-tint", dot: "bg-gc-pass-base", ink: "text-gc-pass-ink" },
  archived: { box: "border border-gc-border bg-gc-sunken", dot: "bg-gc-ink3", ink: "text-gc-ink2" },
}

/** The API's derived artifact status, as a label kind. */
export function artifactStatusKind(status: string): StatusKind {
  if (status === "has-published") return "published"
  if (status === "archived-only") return "archived"
  return "draft"
}

type StatusLabelProps = {
  kind: StatusKind
  className?: string
  /** In long lists published is the default: only the exceptions get a chip. */
  quietPublished?: boolean
}

export function StatusLabel({ kind, className, quietPublished }: StatusLabelProps) {
  const style = STATUS_STYLES[kind]
  const quiet = quietPublished && kind === "published"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[5px] rounded-[3px] px-[7px] align-middle py-[3px] font-mono text-label tracking-[0.6px] uppercase",
        quiet ? "px-0 text-gc-ink3" : [style.box, style.ink],
        className,
      )}
    >
      <span aria-hidden className={cn("size-[5px] rounded-full", style.dot)} />
      {kind}
    </span>
  )
}

type LocaleLabelProps = {
  locale: string
  /** Published version number; omitted for the plain form used in filters. */
  version?: number | null
  /** Whether the shown version is published (green dot) or still a draft (amber dot). */
  published?: boolean
}

export function LocaleLabel({ locale, version, published }: LocaleLabelProps) {
  const plain = version === undefined
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-gc-border bg-gc-sunken px-[7px] py-[3px] font-mono">
      <span className="text-label font-bold text-gc-text uppercase">{locale}</span>
      {!plain && (
        <>
          <span className="text-label text-gc-ink3">{version ? `v${version}` : "draft"}</span>
          <span
            role="img"
            aria-label={published ? "published" : "draft"}
            className={cn(
              "size-[5px] rounded-full",
              published ? "bg-gc-pass-base" : "bg-gc-warn-base",
            )}
          />
        </>
      )}
    </span>
  )
}

export function TagChip({ children }: { children: string }) {
  return (
    <span className="rounded-[3px] border border-gc-border bg-gc-sunken px-1.5 py-0.5 font-mono text-label text-gc-ink2">
      {children}
    </span>
  )
}

type FilterTagProps = ComponentProps<"button"> & { label: string; selected: boolean }

/** A pill in the "TAGS · ANY OF" row; selected pills show a remove icon. */
export function FilterTag({ label, selected, className, ...props }: FilterTagProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex h-[22px] items-center gap-[5px] rounded-full px-[9px] font-mono text-label",
        selected
          ? "bg-gc-nav-bg text-gc-nav-ink"
          : "border border-gc-border bg-gc-sunken text-gc-ink2 hover:text-gc-text",
        className,
      )}
      {...props}
    >
      {label}
      {selected && <XIcon aria-hidden className="size-[9px]" />}
    </button>
  )
}

/** Small uppercase mono caption used for section and column headings. */
export function Caption({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn("font-mono text-label tracking-[0.5px] text-gc-ink3 uppercase", className)}
      {...props}
    />
  )
}

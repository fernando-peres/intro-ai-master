import type { ComponentProps, ReactNode } from "react"
import { cn } from "@/lib/utils"

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is passed in as children
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[9px] tracking-[1px] text-gc-ink3 uppercase">{label}</span>
      {children}
    </label>
  )
}

const control =
  "h-[30px] rounded-md border border-gc-border bg-gc-sunken px-2.5 text-[11.5px] text-gc-text outline-none focus-visible:border-gc-primary"

export function TextInput({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, "placeholder:text-gc-ink3", className)} {...props} />
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(control, className)} {...props} />
}

type ActionProps = ComponentProps<"button"> & { variant?: "primary" | "quiet" }

/** The 28px header/footer buttons: primary (solid) or quiet (sunken). */
export function ActionButton({ variant = "quiet", className, ...props }: ActionProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-md px-[11px] text-[11px] disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-[11px]",
        variant === "primary"
          ? "bg-gc-primary font-semibold text-gc-on-solid hover:brightness-110"
          : "border border-gc-border bg-gc-sunken text-gc-ink2 hover:text-gc-text",
        className,
      )}
      {...props}
    />
  )
}

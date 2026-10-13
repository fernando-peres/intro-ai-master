import { Maximize2Icon, Minimize2Icon } from "lucide-react"
import { type ReactNode, useEffect, useRef, useState } from "react"
import { useTranslation } from "@/i18n/use-translation"
import { cn } from "@/lib/utils"

/**
 * Wraps a chart with an expand button. Expanded, the same chart is drawn large in an overlay
 * (like `FloatingPanel`, rendered in place) until the user minimizes it, presses Escape or
 * clicks outside it. `className` styles the inline wrapper, e.g. `flex flex-1 flex-col`.
 */
export function Expandable({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const close = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    close.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <div className={cn("relative", className)}>
      {children}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("Expand chart")}
        title={t("Expand chart")}
        className="absolute top-0.5 right-0.5 rounded-[2px] border border-line bg-surface/80 p-1 text-fg-muted opacity-60 transition-opacity hover:text-brand hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-brand"
      >
        <Maximize2Icon className="size-3.5" aria-hidden />
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <button
            type="button"
            tabIndex={-1}
            aria-label={t("Back to original size")}
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-canvas/90 backdrop-blur-sm"
          />
          <div className="relative flex max-h-full w-full max-w-6xl flex-col rounded-[3px] border border-line bg-surface shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-divider px-4 py-2.5">
              <h2 className="label-ui text-fg-secondary">{title}</h2>
              <button
                ref={close}
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("Back to original size")}
                title={t("Back to original size")}
                className="flex items-center gap-1.5 rounded-[2px] border border-line px-2.5 py-1 label-ui text-fg-secondary hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
              >
                <Minimize2Icon className="size-3.5" aria-hidden />
                {t("Original size")}
              </button>
            </div>
            <div className="flex flex-col overflow-auto p-5">{children}</div>
          </div>
        </div>
      )}
    </div>
  )
}

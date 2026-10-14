import { Minimize2Icon } from "lucide-react"
import { type ReactNode, useEffect, useRef } from "react"
import { useTranslation } from "@/i18n/use-translation"

/** A full-screen overlay with a title bar; closes on Escape, the backdrop or its button. */
export function ZoomDialog({
  title,
  onClose,
  closeLabel,
  children,
}: {
  title: string
  onClose: () => void
  /** Replaces the default "Original size" button text. */
  closeLabel?: string
  children: ReactNode
}) {
  const { t } = useTranslation()
  const close = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    close.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
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
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-canvas/90 backdrop-blur-sm"
      />
      <div className="relative flex max-h-full w-full max-w-4xl flex-col rounded-[3px] border border-line bg-surface shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-divider px-4 py-2.5">
          <h2 className="label-ui text-fg-secondary">{title}</h2>
          <button
            ref={close}
            type="button"
            onClick={onClose}
            aria-label={t("Back to original size")}
            title={t("Back to original size")}
            className="label-ui flex items-center gap-1.5 rounded-[2px] border border-line px-2.5 py-1 text-fg-secondary hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
          >
            <Minimize2Icon className="size-3.5" aria-hidden />
            {closeLabel ?? t("Original size")}
          </button>
        </div>
        <div className="flex flex-col overflow-auto p-6">{children}</div>
      </div>
    </div>
  )
}

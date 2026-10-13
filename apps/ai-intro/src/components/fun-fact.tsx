import { Lightbulb } from "lucide-react"
import { type ReactNode, useEffect, useId, useRef, useState } from "react"

import { useTranslation } from "@/i18n/use-translation"
import { cn } from "@/lib/utils"

/** A small lightbulb button that opens a post-it with a contextual fun fact; place it above a component. */
export function FunFact({ children, className }: { children: ReactNode; className?: string }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const noteId = useId()

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={root} className={cn("relative inline-block", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? noteId : undefined}
        aria-label={t("Fun fact")}
        title={t("Fun fact")}
        onClick={() => setOpen((o) => !o)}
        className="flex size-6 items-center justify-center rounded-full border border-line bg-elevated text-chart-amber transition-colors hover:border-chart-amber focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <Lightbulb className="size-3.5" aria-hidden />
      </button>
      {open && (
        <div
          id={noteId}
          role="note"
          className="absolute top-full left-0 z-20 mt-2 w-80 -rotate-1 rounded-[2px] bg-[#fdba74] p-5 font-sans text-xl leading-snug font-medium text-[#431407] shadow-lg"
        >
          <span className="label-ui mb-1 block text-[#9a3412]">{t("Fun fact")}</span>
          {children}
        </div>
      )}
    </div>
  )
}

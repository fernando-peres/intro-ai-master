import { GripHorizontalIcon, XIcon } from "lucide-react"
import { type PointerEvent, type ReactNode, useEffect, useRef, useState } from "react"
import { useTranslation } from "@/i18n/use-translation"

type Position = { x: number; y: number }

/** Non-modal panel the reader can drag by its header; closes on ✕ or Escape. */
export function FloatingPanel({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const { t } = useTranslation()
  const panel = useRef<HTMLDivElement>(null)
  const grab = useRef<Position | null>(null)
  const [position, setPosition] = useState<Position | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const startDrag = (e: PointerEvent<HTMLDivElement>) => {
    const rect = panel.current?.getBoundingClientRect()
    if (!rect) return
    grab.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const drag = (e: PointerEvent<HTMLDivElement>) => {
    const offset = grab.current
    const rect = panel.current?.getBoundingClientRect()
    if (!offset || !rect) return
    setPosition({
      x: Math.min(Math.max(0, e.clientX - offset.x), window.innerWidth - rect.width),
      y: Math.min(Math.max(0, e.clientY - offset.y), window.innerHeight - 48),
    })
  }
  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    grab.current = null
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  }

  return (
    <div
      ref={panel}
      role="dialog"
      aria-label={title}
      style={position ? { left: position.x, top: position.y } : undefined}
      className={`fixed z-40 flex max-h-[70vh] w-[min(34rem,calc(100vw-2rem))] flex-col rounded-[3px] border border-line bg-surface shadow-xl ${
        position ? "" : "right-4 bottom-4"
      }`}
    >
      <div
        data-testid="floating-panel-handle"
        onPointerDown={startDrag}
        onPointerMove={drag}
        onPointerUp={endDrag}
        className="flex cursor-grab touch-none items-center gap-2 border-b border-divider px-3 py-2 active:cursor-grabbing"
      >
        <GripHorizontalIcon className="size-4 text-fg-muted" aria-hidden />
        <h2 className="label-ui flex-1 text-fg-muted">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={t("Close")}
          className="text-fg-muted hover:text-brand"
        >
          <XIcon className="size-4" aria-hidden />
        </button>
      </div>
      <div className="overflow-auto p-3">{children}</div>
    </div>
  )
}

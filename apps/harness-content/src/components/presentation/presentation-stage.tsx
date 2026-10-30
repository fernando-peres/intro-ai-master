import { MinusIcon, PlusIcon, RouteIcon, ScanIcon } from "lucide-react"
import { type ReactNode, type RefObject, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

/**
 * Full-screen behavior shared by the trail player and artifact preview: controls start hidden and
 * `i` toggles them. Browsers swallow Esc in fullscreen, so leaving fullscreen also calls `onExit`.
 */
export function usePresentation(onExit: () => void) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [controls, setControls] = useState(false)
  const exit = useRef(onExit)
  exit.current = onExit

  useEffect(() => {
    const stage = stageRef.current
    // The button that opened the stage keeps focus otherwise, and Space would click it again.
    stage?.focus()
    let entered = false
    const onChange = () => {
      if (document.fullscreenElement === stage) entered = true
      else if (entered) exit.current()
    }
    document.addEventListener("fullscreenchange", onChange)
    // Refused without a recent user gesture (a deep link): the stage still fills the viewport.
    stage?.requestFullscreen?.()?.catch(() => {})
    return () => {
      document.removeEventListener("fullscreenchange", onChange)
      if (document.fullscreenElement === stage) document.exitFullscreen?.()?.catch(() => {})
    }
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea")) return
      if (event.key === "Escape") exit.current()
      else if (
        event.key.toLowerCase() === "i" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        setControls((shown) => !shown)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return { stageRef, controls, setControls }
}

/** Covers the viewport; the document type keeps the studio's page colors. */
export function PresentationStage({
  stageRef,
  isDoc,
  children,
}: {
  stageRef: RefObject<HTMLDivElement | null>
  isDoc: boolean
  children: ReactNode
}) {
  return (
    <div
      ref={stageRef}
      tabIndex={-1}
      data-testid="presentation-stage"
      data-theme={isDoc ? undefined : "graphite-dark"}
      className={cn(
        "fixed inset-0 z-50 flex overflow-hidden outline-none",
        isDoc ? "bg-gc-page" : "bg-[#07070A]",
      )}
    >
      {children}
    </div>
  )
}

export function OverlayButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-[30px] items-center justify-center rounded-lg border border-[#FFFFFF24] bg-[#15141Ddd] text-[#D8D4EA] backdrop-blur-lg disabled:opacity-40 [&_svg]:size-[13px]"
    >
      {children}
    </button>
  )
}

/** The top-right button group of the visible controls. */
export function PresentationActions({ children }: { children: ReactNode }) {
  return <div className="absolute top-5 right-[19px] z-30 flex items-center gap-2">{children}</div>
}

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3]

/** The top-left zoom group of a document on stage. */
export function PresentationZoom({
  zoom,
  onZoom,
}: {
  zoom: number
  onZoom: (next: number) => void
}) {
  const index = ZOOM_STEPS.indexOf(zoom)
  return (
    <div className="absolute top-5 left-[19px] z-30 flex items-center gap-2">
      <OverlayButton
        label="Zoom out"
        disabled={index === 0}
        onClick={() => onZoom(ZOOM_STEPS[index - 1])}
      >
        <MinusIcon />
      </OverlayButton>
      <span
        aria-live="polite"
        className="flex h-[30px] w-12 items-center justify-center rounded-lg border border-[#FFFFFF24] bg-[#15141Ddd] font-mono text-[9.5px] text-[#D8D4EA] backdrop-blur-lg"
      >
        {Math.round(zoom * 100)}%
      </span>
      <OverlayButton
        label="Zoom in"
        disabled={index === ZOOM_STEPS.length - 1}
        onClick={() => onZoom(ZOOM_STEPS[index + 1])}
      >
        <PlusIcon />
      </OverlayButton>
      <OverlayButton label="Reset zoom" disabled={zoom === 1} onClick={() => onZoom(1)}>
        <ScanIcon />
      </OverlayButton>
    </div>
  )
}

/** Names what is on stage; `progress` is omitted for a lone artifact, which has no steps. */
export function PresentationBadge({
  name,
  progress,
}: {
  name: string
  progress?: { step: number; total: number }
}) {
  const percent = progress && Math.round((progress.step / progress.total) * 100)
  return (
    <div
      className={cn(
        "absolute right-[19px] bottom-2 z-30 flex h-[30px] max-w-[calc(100%-2rem)] items-center gap-[9px] rounded-lg border border-[#FFFFFF24] bg-[#15141Ddd] px-3 backdrop-blur-lg",
        progress && "w-[349px]",
      )}
    >
      <RouteIcon className="size-3 shrink-0 text-[#B9B1DC]" />
      <span className="truncate text-[11.5px] font-semibold text-[#F0EEF8]">{name}</span>
      {progress && (
        <>
          <span className="h-3 w-px shrink-0 bg-[#FFFFFF2E]" />
          <span className="shrink-0 font-mono text-[9px] tracking-[0.6px] text-[#9D93C9]">
            STEP {progress.step} / {progress.total}
          </span>
          <span className="h-[3px] min-w-4 flex-1 overflow-hidden rounded-sm bg-[#FFFFFF33]">
            <span className="block h-full bg-[#FFFFFFC4]" style={{ width: `${percent}%` }} />
          </span>
          <span className="shrink-0 font-mono text-[8.5px] tracking-[1px] text-[#FFFFFFA6]">
            {percent}%
          </span>
        </>
      )}
    </div>
  )
}

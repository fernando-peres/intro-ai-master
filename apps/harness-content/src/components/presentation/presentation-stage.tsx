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
  const [help, setHelp] = useState(false)
  const exit = useRef(onExit)
  exit.current = onExit
  const helpRef = useRef(help)
  helpRef.current = help

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
      if (event.key === "?") setHelp((shown) => !shown)
      else if (event.key === "Escape") {
        // Closing the list must not also leave the presentation.
        if (helpRef.current) setHelp(false)
        else exit.current()
      } else if (
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

  return { stageRef, controls, setControls, help, setHelp }
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
        isDoc ? "bg-gc-page" : "bg-ov-stage",
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
      className="flex size-[30px] items-center justify-center rounded-lg border border-ov-line bg-ov-surface text-ov-ink backdrop-blur-lg disabled:opacity-40 [&_svg]:size-[13px]"
    >
      {children}
    </button>
  )
}

/** The top-right button group of the visible controls. */
export function PresentationActions({ children }: { children: ReactNode }) {
  return <div className="absolute top-5 right-[19px] z-30 flex items-center gap-2">{children}</div>
}

type Shortcut = { keys: string; action: string }

export const STAGE_SHORTCUTS: Shortcut[] = [
  { keys: "I", action: "Show or hide the controls" },
  { keys: "?", action: "Show or hide this list" },
  { keys: "Esc", action: "Exit" },
]

/** The keyboard list, reachable with `?` even while the controls are hidden. */
export function ShortcutsHelp({
  shortcuts,
  onClose,
}: {
  shortcuts: Shortcut[]
  onClose: () => void
}) {
  return (
    <div
      role="dialog"
      aria-label="Keyboard shortcuts"
      className="absolute top-1/2 left-1/2 z-40 w-[320px] max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-ov-line bg-ov-panel p-4"
    >
      <div className="flex items-center justify-between pb-3">
        <h2 className="text-body font-semibold text-ov-text">Keyboard shortcuts</h2>
        <button type="button" onClick={onClose} className="text-ui text-ov-muted underline">
          Close
        </button>
      </div>
      <dl className="flex flex-col gap-2">
        {shortcuts.map((entry) => (
          <div key={entry.keys} className="flex items-center justify-between gap-4">
            <dt className="text-ui text-ov-ink">{entry.action}</dt>
            <dd className="shrink-0 font-mono text-label text-ov-soft">{entry.keys}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
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
        className="flex h-[30px] w-12 items-center justify-center rounded-lg border border-ov-line bg-ov-surface font-mono text-label text-ov-ink backdrop-blur-lg"
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
        "absolute right-[19px] bottom-2 z-30 flex h-[30px] max-w-[calc(100%-2rem)] items-center gap-[9px] rounded-lg border border-ov-line bg-ov-surface px-3 backdrop-blur-lg",
        progress && "w-[349px]",
      )}
    >
      <RouteIcon className="size-3 shrink-0 text-ov-soft" />
      <span className="truncate text-ui font-semibold text-ov-text">{name}</span>
      {progress && (
        <>
          <span className="h-3 w-px shrink-0 bg-ov-line" />
          <span className="shrink-0 font-mono text-label tracking-[0.6px] text-ov-muted">
            STEP {progress.step} / {progress.total}
          </span>
          <span className="h-[3px] min-w-4 flex-1 overflow-hidden rounded-sm bg-ov-track">
            <span className="block h-full bg-ov-bar" style={{ width: `${percent}%` }} />
          </span>
          <span className="shrink-0 font-mono text-label tracking-[0.5px] text-ov-dim">
            {percent}%
          </span>
        </>
      )}
    </div>
  )
}

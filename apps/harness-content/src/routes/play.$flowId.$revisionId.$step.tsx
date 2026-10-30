import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Minimize2Icon,
  PanelRightIcon,
  PauseIcon,
  PlayIcon,
  RouteIcon,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import type { Schemas } from "@/api/client"
import { usePlayback } from "@/api/flows"
import { typeInfo } from "@/components/artifact-types"
import { StepRenderer } from "@/components/trail/themed-content"
import { formatClock } from "@/lib/trail"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/play/$flowId/$revisionId/$step")({ component: TrailPlayer })

type Playback = Schemas["Playback"]
const TICK_MS = 100

function TrailPlayer() {
  const { flowId, revisionId, step } = Route.useParams()
  const playback = usePlayback(flowId, revisionId)
  if (playback.error) {
    return <PlayerMessage flowId={flowId}>{playback.error.message}</PlayerMessage>
  }
  if (!playback.data) return <PlayerMessage flowId={flowId}>Loading trail…</PlayerMessage>
  const total = playback.data.steps.length
  const index = Math.min(Math.max(Number.parseInt(step, 10) || 1, 1), total) - 1
  return <Presentation key={index} playback={playback.data} index={index} />
}

function PlayerMessage({ flowId, children }: { flowId: string; children: string }) {
  return (
    <div className="flex h-svh flex-col items-center justify-center gap-3 bg-[#08080B] text-[12px] text-[#D8D4EA]">
      <p>{children}</p>
      <Link to="/trails/$flowId" params={{ flowId }} className="text-[#9D93C9] underline">
        Back to the trail
      </Link>
    </div>
  )
}

/**
 * One step of a published revision, full screen. The URL is the deep link: each step change
 * navigates, so the browser's back button walks the trail too.
 */
function Presentation({ playback, index }: { playback: Playback; index: number }) {
  const navigate = useNavigate()
  const { flow, revision, steps } = playback
  const current = steps[index]
  const total = steps.length
  const [outline, setOutline] = useState(false)
  const advance = current.advanceSeconds ?? null
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(advance !== null)

  const go = useCallback(
    (target: number) => {
      if (target < 0 || target >= total) return
      navigate({
        to: "/play/$flowId/$revisionId/$step",
        params: { flowId: flow.id, revisionId: revision.id, step: String(target + 1) },
      })
    },
    [navigate, flow.id, revision.id, total],
  )
  const exit = useCallback(
    () => navigate({ to: "/trails/$flowId", params: { flowId: flow.id } }),
    [navigate, flow.id],
  )

  useEffect(() => {
    if (advance === null || !running) return
    const timer = setInterval(() => setElapsed((value) => value + TICK_MS / 1000), TICK_MS)
    return () => clearInterval(timer)
  }, [advance, running])
  useEffect(() => {
    if (advance === null || elapsed < advance) return
    if (index < total - 1) go(index + 1)
    else setRunning(false)
  }, [advance, elapsed, index, total, go])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea")) return
      if (event.key === "ArrowRight" || event.key === "PageDown") go(index + 1)
      else if (event.key === "ArrowLeft" || event.key === "PageUp") go(index - 1)
      else if (event.key === "Escape") exit()
      else if (event.key === "o") setOutline((open) => !open)
      else if (event.key === " " && advance !== null) {
        event.preventDefault()
        setRunning((value) => !value)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [go, exit, index, advance])

  const info = typeInfo(current.artifact.type)
  const isDoc = current.artifact.type === "doc"
  const title = current.label || current.artifact.title
  const progress = ((index + 1) / total) * 100

  return (
    <div
      data-theme={isDoc ? undefined : "graphite-dark"}
      className={cn(
        "relative flex h-svh flex-col overflow-hidden",
        isDoc ? "bg-gc-page" : "bg-[#08080B]",
      )}
    >
      {isDoc ? (
        <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-gc-border bg-gc-raised/90 px-[22px]">
          <span className="flex min-w-0 items-center gap-2.5">
            <span
              className={cn(
                "rounded px-[7px] py-[3px] font-mono text-[8.5px] tracking-[0.6px] uppercase",
                info.chip,
              )}
            >
              {info.label}
            </span>
            <span className="truncate text-[12.5px] font-semibold text-gc-text">{title}</span>
            <span className="h-[13px] w-px bg-gc-border" />
            <span className="font-mono text-[9px] tracking-[0.6px] text-gc-ink3 uppercase">
              {flow.title} · Step {index + 1} of {total}
            </span>
          </span>
          <ChromeButtons
            onPrev={() => go(index - 1)}
            onNext={() => go(index + 1)}
            onOutline={() => setOutline(!outline)}
            onExit={exit}
            canPrev={index > 0}
            canNext={index < total - 1}
          />
        </header>
      ) : (
        <div className="pointer-events-none absolute inset-x-4 top-4 z-20 flex items-center justify-between">
          <span className="pointer-events-auto flex h-[30px] items-center gap-[9px] rounded-lg border border-[#FFFFFF24] bg-[#15141Ddd] px-3">
            <RouteIcon className="size-3 text-[#B9B1DC]" />
            <span className="text-[11.5px] font-semibold text-[#F0EEF8]">{flow.title}</span>
            <span className="h-3 w-px bg-[#FFFFFF2E]" />
            <span className="font-mono text-[9px] tracking-[0.6px] text-[#9D93C9]">
              STEP {index + 1} / {total}
            </span>
          </span>
          <span className="pointer-events-auto flex gap-2">
            <OverlayButton label="Outline (O)" onClick={() => setOutline(!outline)}>
              <PanelRightIcon />
            </OverlayButton>
            <OverlayButton label="Exit (Esc)" onClick={exit}>
              <Minimize2Icon />
            </OverlayButton>
          </span>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <main
          aria-label={`Step ${index + 1}: ${title}`}
          className={cn(
            "flex min-w-0 flex-1 items-center justify-center",
            isDoc ? "overflow-y-auto" : "px-6 pt-16 pb-24",
          )}
        >
          <StepRenderer
            type={current.artifact.type}
            content={current.version.content}
            override={current.themeOverride}
            trailTheme={flow.theme}
          />
        </main>
        {outline && (
          <aside
            aria-label="Trail outline"
            className="z-20 flex w-[280px] shrink-0 flex-col gap-1 overflow-y-auto border-l border-[#FFFFFF1F] bg-[#15141Df2] p-3"
          >
            <span className="px-1 pb-1 font-mono text-[9px] tracking-[1px] text-[#9D93C9]">
              OUTLINE · REV {revision.revision}
            </span>
            {steps.map((entry, i) => (
              <button
                key={entry.id}
                type="button"
                aria-current={i === index ? "step" : undefined}
                onClick={() => go(i)}
                className={cn(
                  "flex flex-col gap-0.5 rounded-md px-2 py-1.5 text-left",
                  i === index ? "bg-[#6D5BD033]" : "hover:bg-[#FFFFFF0F]",
                )}
              >
                <span className="flex items-center gap-2 text-[11px] text-[#F0EEF8]">
                  <span className="font-mono text-[9px] text-[#9D93C9]">{i + 1}</span>
                  {entry.label || entry.artifact.title}
                </span>
                {i === index && entry.presenterNote && (
                  <span className="pl-4 text-[10px] text-[#B9B1DC]">{entry.presenterNote}</span>
                )}
              </button>
            ))}
          </aside>
        )}
      </div>

      {!isDoc && (
        <div className="absolute bottom-5 left-1/2 z-20 flex h-[46px] w-[400px] max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-[11px] rounded-xl border border-[#FFFFFF24] bg-[#15141Ddd] px-3">
          <button
            type="button"
            aria-label="Previous step"
            disabled={index === 0}
            onClick={() => go(index - 1)}
            className="text-[#D8D4EA] disabled:opacity-30"
          >
            <ChevronLeftIcon className="size-4" />
          </button>
          {advance !== null ? (
            <>
              <button
                type="button"
                aria-label={running ? "Pause auto-advance" : "Resume auto-advance"}
                onClick={() => setRunning(!running)}
                className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-gc-primary text-white"
              >
                {running ? (
                  <PauseIcon className="size-[13px]" />
                ) : (
                  <PlayIcon className="size-[13px]" />
                )}
              </button>
              <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-sm bg-[#FFFFFF24]">
                <div
                  className="h-full rounded-sm bg-[#D8D4EA]"
                  style={{ width: `${Math.min(elapsed / advance, 1) * 100}%` }}
                />
              </div>
              <span role="timer" className="font-mono text-[9.5px] text-[#9D93C9]">
                {formatClock(elapsed)} / {formatClock(advance)}
              </span>
            </>
          ) : (
            <span className="min-w-0 flex-1 text-center font-mono text-[9px] tracking-[0.6px] text-[#9D93C9]">
              {index < total - 1 ? "MANUAL · → FOR NEXT" : "END OF TRAIL"}
            </span>
          )}
          <button
            type="button"
            aria-label="Next step"
            disabled={index === total - 1}
            onClick={() => go(index + 1)}
            className="text-[#D8D4EA] disabled:opacity-30"
          >
            <ChevronRightIcon className="size-4" />
          </button>
        </div>
      )}

      <div
        role="progressbar"
        aria-label="Trail progress"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={index + 1}
        className="h-[3px] shrink-0 bg-[#FFFFFF1A]"
      >
        <div className="h-full bg-gc-primary" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

function OverlayButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex size-[30px] items-center justify-center rounded-lg border border-[#FFFFFF24] bg-[#15141Ddd] text-[#D8D4EA] [&_svg]:size-[13px]"
    >
      {children}
    </button>
  )
}

function ChromeButtons({
  onPrev,
  onNext,
  onOutline,
  onExit,
  canPrev,
  canNext,
}: {
  onPrev: () => void
  onNext: () => void
  onOutline: () => void
  onExit: () => void
  canPrev: boolean
  canNext: boolean
}) {
  const button =
    "flex size-7 items-center justify-center rounded-[7px] border border-gc-border bg-gc-sunken text-gc-ink2 hover:text-gc-text disabled:opacity-35 [&_svg]:size-[13px]"
  return (
    <span className="flex gap-2">
      <button type="button" aria-label="Outline (O)" onClick={onOutline} className={button}>
        <PanelRightIcon />
      </button>
      <button
        type="button"
        aria-label="Previous step"
        disabled={!canPrev}
        onClick={onPrev}
        className={button}
      >
        <ChevronLeftIcon />
      </button>
      <button
        type="button"
        aria-label="Next step"
        disabled={!canNext}
        onClick={onNext}
        className={button}
      >
        <ChevronRightIcon />
      </button>
      <button type="button" aria-label="Exit (Esc)" onClick={onExit} className={button}>
        <Minimize2Icon />
      </button>
    </span>
  )
}

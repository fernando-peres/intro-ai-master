import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Minimize2Icon, PanelRightIcon } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import type { Schemas } from "@/api/client"
import { usePlayback } from "@/api/flows"
import {
  OverlayButton,
  PresentationActions,
  PresentationBadge,
  PresentationStage,
  usePresentation,
} from "@/components/presentation/presentation-stage"
import { StepRenderer } from "@/components/trail/themed-content"
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
  return <Presentation playback={playback.data} index={index} />
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
  const [timedIndex, setTimedIndex] = useState(index)
  if (timedIndex !== index) {
    setTimedIndex(index)
    setElapsed(0)
    setRunning(advance !== null)
  }

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
  const { stageRef, controls, setControls } = usePresentation(exit)

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
      else if (event.key === "o") {
        setControls(true)
        setOutline((open) => !controls || !open)
      } else if (event.key === " " && advance !== null) {
        event.preventDefault()
        setRunning((value) => !value)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [go, setControls, controls, index, advance])

  const isDoc = current.artifact.type === "doc"
  const title = current.label || current.artifact.title
  const progress = ((index + 1) / total) * 100

  return (
    <PresentationStage stageRef={stageRef} isDoc={isDoc}>
      <div
        role="progressbar"
        aria-label="Trail progress"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={index + 1}
        className="absolute inset-x-0 top-0 z-20 h-[3px] bg-[#FFFFFF1A]"
      >
        <div className="h-full bg-gc-primary" style={{ width: `${progress}%` }} />
      </div>

      <main
        aria-label={`Step ${index + 1}: ${title}`}
        className="flex min-w-0 flex-1 items-center justify-center"
      >
        <h1 className="sr-only">
          {flow.title}, step {index + 1} of {total}: {title}
        </h1>
        <StepRenderer
          key={current.id}
          type={current.artifact.type}
          content={current.version.content}
          override={current.themeOverride}
          trailTheme={flow.theme}
          showControls={controls}
          presenting
        />
      </main>

      {controls && (
        <>
          <PresentationActions>
            <OverlayButton label="Outline (O)" onClick={() => setOutline(!outline)}>
              <PanelRightIcon />
            </OverlayButton>
            <OverlayButton label="Exit (Esc)" onClick={exit}>
              <Minimize2Icon />
            </OverlayButton>
          </PresentationActions>
          <PresentationBadge name={flow.title} progress={{ step: index + 1, total }} />
          {outline && (
            <aside
              aria-label="Trail outline"
              className="absolute inset-y-0 right-0 z-20 flex w-[280px] flex-col gap-1 overflow-y-auto border-l border-[#FFFFFF1F] bg-[#15141Df2] px-3 pt-14 pb-12"
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
        </>
      )}
    </PresentationStage>
  )
}

import { PauseIcon, PlayIcon, RotateCcwIcon } from "lucide-react"
import type { AnimationPlaybackControls, AnimationSequence } from "motion/react"
import { useAnimate, useReducedMotion } from "motion/react"
import { useEffect, useRef, useState } from "react"
import type { EditorProps, RendererProps } from "@/artifacts/plugin"
import { type AnimationContent, getTemplate } from "@/artifacts/plugins/animation/model"
import {
  backgroundCss,
  type CommonProps,
  schemeOf,
} from "@/artifacts/plugins/animation/templates/shared"
import { type Segment, sequenceDuration } from "@/artifacts/plugins/animation/templates/types"
import { cn } from "@/lib/utils"

const FRAME = { width: 1920, height: 1080 }
const LOOP_GAP_MS = 900

type Status = "playing" | "paused" | "ended"

export function toMotionSequence(segments: Segment[]): AnimationSequence {
  return segments.map((s) => [
    `[data-anim="${s.target}"]`,
    s.keyframes,
    { at: s.at, duration: s.duration, ease: s.ease },
  ]) as unknown as AnimationSequence
}

function useFitScale() {
  const box = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(0.4)
  useEffect(() => {
    const node = box.current
    if (!node) return
    const measure = (width: number, height: number) => {
      const next = Math.min(width / FRAME.width, height / FRAME.height)
      if (next > 0) setFit(next)
    }
    // Measured now as well: a page that is not rendering frames may never call the observer.
    measure(node.clientWidth, node.clientHeight)
    const observer = new ResizeObserver(([entry]) =>
      measure(entry.contentRect.width, entry.contentRect.height),
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return { box, fit }
}

/**
 * Plays the content's template. Any change to `content` remounts the scene and restarts from
 * the first frame, so playback never continues from a state built with older props. With
 * reduced motion it shows the final frame and plays only when asked.
 */
export function AnimationPlayer({
  content,
  showControls = true,
  presenting = false,
  still = false,
}: {
  content: AnimationContent
  showControls?: boolean
  presenting?: boolean
  still?: boolean
}) {
  const template = getTemplate(content.template)
  const reduced = (useReducedMotion() ?? false) || still
  const key = JSON.stringify(content)
  const [run, setRun] = useState({ key, id: 0, play: !reduced })
  if (run.key !== key) setRun({ key, id: run.id + 1, play: !reduced })
  const [status, setStatus] = useState<Status>("ended")
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const controls = useRef<AnimationPlaybackControls | null>(null)
  const bar = useRef<HTMLDivElement>(null)
  const clock = useRef<HTMLSpanElement>(null)
  const { box, fit } = useFitScale()

  const segments = template.sequence(content.props)
  const total = sequenceDuration(segments)
  const loop = Boolean((content.props as { loop?: boolean }).loop)

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new run id is the only restart signal
  useEffect(() => {
    if (!run.play) {
      setStatus("ended")
      return
    }
    const playback = animate(toMotionSequence(segments))
    controls.current = playback
    setStatus("playing")
    let live = true
    let timer: ReturnType<typeof setTimeout> | undefined
    playback.then(() => {
      if (!live) return
      if (loop)
        timer = setTimeout(() => setRun((r) => ({ ...r, id: r.id + 1, play: true })), LOOP_GAP_MS)
      else setStatus("ended")
    })
    return () => {
      live = false
      clearTimeout(timer)
      playback.stop()
      controls.current = null
    }
  }, [run.id])

  useEffect(() => {
    let frame = 0
    const tick = () => {
      const time = controls.current ? Math.min(controls.current.time, total) : run.play ? 0 : total
      const done = status === "ended" ? total : time
      if (bar.current) bar.current.style.transform = `scaleX(${total ? done / total : 1})`
      if (clock.current) clock.current.textContent = `${done.toFixed(1)} / ${total.toFixed(1)}s`
      frame = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(frame)
  }, [status, total, run.play])

  const restart = () => setRun((r) => ({ ...r, id: r.id + 1, play: true }))
  const toggle = () => {
    if (status === "playing") {
      controls.current?.pause()
      setStatus("paused")
    } else if (status === "paused" && controls.current) {
      controls.current.play()
      setStatus("playing")
    } else restart()
  }

  return (
    <div
      className="flex size-full min-h-0 flex-col items-center gap-3"
      style={
        presenting
          ? { background: backgroundCss(schemeOf(content.props as CommonProps)) }
          : undefined
      }
    >
      <div ref={box} className="flex min-h-0 w-full flex-1 items-center justify-center">
        <div
          className={cn("overflow-hidden", !presenting && "rounded-md shadow-lg")}
          style={{ width: FRAME.width * fit, height: FRAME.height * fit }}
        >
          <div
            ref={scope}
            data-testid="animation-frame"
            // The wrapper paints the background when presenting; a second one would show a seam.
            className={cn(presenting && "[&>*]:bg-none! [&>*]:bg-transparent!")}
            style={{ ...FRAME, transform: `scale(${fit})`, transformOrigin: "top left" }}
          >
            <template.Scene key={run.id} props={content.props} hidden={run.play} />
          </div>
        </div>
      </div>
      {showControls && (
        <div
          className={
            presenting
              ? "absolute bottom-2 left-[19px] z-30 flex w-[max(240px,min(560px,calc(100%-400px)))] flex-col gap-1"
              : "contents"
          }
        >
          <div className="flex w-full max-w-[560px] shrink-0 items-center gap-2.5 rounded-md border border-gc-border bg-gc-raised px-2.5 py-1.5">
            <PlayerButton label={status === "playing" ? "Pause" : "Play"} onClick={toggle}>
              {status === "playing" ? <PauseIcon /> : <PlayIcon />}
            </PlayerButton>
            <PlayerButton label="Restart" onClick={restart}>
              <RotateCcwIcon />
            </PlayerButton>
            <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-gc-sunken">
              <div ref={bar} className="h-full origin-left bg-gc-primary" />
            </div>
            <span ref={clock} className="w-[76px] text-right font-mono text-label text-gc-ink2" />
            <span className="font-mono text-label tracking-[0.5px] text-gc-ink3 uppercase">
              {status}
              {loop ? " · loop" : ""}
            </span>
          </div>
          {reduced && (
            <p className="text-label text-gc-ink3">
              Reduced motion is on: showing the final frame. Press play to preview the motion.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function PlayerButton({
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
      className="flex size-6 shrink-0 items-center justify-center rounded-[5px] border border-gc-border bg-gc-sunken text-gc-ink2 hover:text-gc-text [&_svg]:size-3"
    >
      {children}
    </button>
  )
}

export function AnimationEditorView({ content }: EditorProps<AnimationContent>) {
  return <AnimationPlayer content={content} />
}

export function AnimationRenderer({
  content,
  showControls,
  presenting,
  still,
}: RendererProps<AnimationContent>) {
  return (
    <AnimationPlayer
      content={content}
      showControls={showControls}
      presenting={presenting}
      still={still}
    />
  )
}

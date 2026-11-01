import { createContext, type KeyboardEvent, type PointerEvent, useContext, useState } from "react"
import {
  EmbedChip,
  EmbeddedArtifact,
  EmbedRepin,
  isLiveEmbed,
  type Playback,
} from "@/components/embed/embedded-artifact"
import type { EmbedRef } from "@/lib/embeds"
import { cn } from "@/lib/utils"

export const EMBED_ASPECTS = ["16:9", "4:3", "1:1", "3:4", "auto"] as const
export const EMBED_ALIGNS = ["left", "center", "right"] as const
export const EMBED_MIN_WIDTH = 20
export const EMBED_MAX_WIDTH = 100
const KEY_STEP = 5
/** `auto` has no ratio to keep: the renderers fill their box, so the height is fixed instead. */
const AUTO_HEIGHT = 320

export type EmbedAspect = (typeof EMBED_ASPECTS)[number]
export type EmbedAlign = (typeof EMBED_ALIGNS)[number]
export type EmbedLayout = { width: number; aspect: EmbedAspect; align: EmbedAlign }
export type DocEmbedProps = EmbedRef & EmbedLayout

/** Print and other still views override the reader's autoplay. */
export const DocEmbedPlayback = createContext<Playback>("auto")

export function clampWidth(width: number): number {
  return Math.round(Math.min(EMBED_MAX_WIDTH, Math.max(EMBED_MIN_WIDTH, width)))
}

/** A centred block grows on both sides, so the edge moves half as far as its width changes. */
export function widthFromDrag(start: number, dx: number, parent: number, align: EmbedAlign) {
  return clampWidth(start + (dx / parent) * 100 * (align === "center" ? 2 : 1))
}

const ALIGN_MARGIN: Record<EmbedAlign, string> = {
  left: "mr-auto",
  center: "mx-auto",
  right: "ml-auto",
}

type Props = {
  embed: DocEmbedProps
  editable: boolean
  onChange: (patch: Partial<DocEmbedProps>) => void
  onSelect: () => void
}

export function DocEmbed({ embed, editable, onChange, onSelect }: Props) {
  const playback = useContext(DocEmbedPlayback)
  // Follows the pointer while dragging; only the release is saved.
  const [dragWidth, setDragWidth] = useState<number | null>(null)
  if (!isLiveEmbed(embed)) {
    return <EmbedChip embed={embed} onRepin={editable ? onChange : undefined} />
  }
  const width = dragWidth ?? embed.width

  const startDrag = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const handle = event.currentTarget
    const parent = handle.closest("figure")?.parentElement?.clientWidth ?? 1
    const startX = event.clientX
    const at = (x: number) => widthFromDrag(embed.width, x - startX, parent, embed.align)
    const move = (next: globalThis.PointerEvent) => setDragWidth(at(next.clientX))
    const up = (next: globalThis.PointerEvent) => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      setDragWidth(null)
      onChange({ width: at(next.clientX) })
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }

  const onHandleKey = (event: KeyboardEvent) => {
    const step = { ArrowLeft: -KEY_STEP, ArrowRight: KEY_STEP }[event.key]
    if (!step) return
    event.preventDefault()
    event.stopPropagation()
    onChange({ width: clampWidth(embed.width + step) })
  }

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: the editor selects blocks by keyboard itself
    <figure
      contentEditable={false}
      onClick={onSelect}
      className={cn(
        "relative my-1 overflow-hidden rounded-[7px] border border-gc-border bg-gc-sunken",
        ALIGN_MARGIN[embed.align],
      )}
      style={{ width: `${width}%` }}
    >
      <div
        data-testid="embed-box"
        style={
          embed.aspect === "auto"
            ? { height: AUTO_HEIGHT }
            : { aspectRatio: embed.aspect.replace(":", " / ") }
        }
      >
        <EmbeddedArtifact embed={embed} playback={editable ? "static" : playback} />
      </div>
      <figcaption className="flex min-h-8 items-center gap-2 border-t border-gc-border px-2.5 py-1">
        <span className="min-w-0 flex-1 truncate text-label text-gc-ink2">{embed.title}</span>
        <span className="shrink-0 font-mono text-label tracking-[0.5px] text-gc-ink3 uppercase">
          {embed.artifactType} · {embed.locale} v{embed.versionNumber}
        </span>
        {editable && <EmbedRepin embed={embed} onRepin={onChange} />}
      </figcaption>
      {editable && (
        <button
          type="button"
          aria-label={`Resize embed, ${width}% wide`}
          title="Drag or use the arrow keys to resize"
          onPointerDown={startDrag}
          onKeyDown={onHandleKey}
          className="absolute inset-y-0 right-0 w-2.5 cursor-ew-resize bg-transparent hover:bg-gc-primary/40 focus-visible:bg-gc-primary/60 focus-visible:outline-none"
        />
      )}
    </figure>
  )
}

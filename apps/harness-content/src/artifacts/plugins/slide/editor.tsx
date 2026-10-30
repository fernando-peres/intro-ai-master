import type Konva from "konva"
import { MinusIcon, PlusIcon, Redo2Icon, ScanIcon, Undo2Icon } from "lucide-react"
import { type KeyboardEvent, useEffect, useRef, useState } from "react"
import type { EditorProps, RendererProps } from "@/artifacts/plugin"
import { useSlideActions, useSlideEditor } from "@/artifacts/plugins/slide/editor-context"
import {
  CANVAS,
  createElement,
  type InsertKind,
  resolveText,
  SLIDE_THEMES,
  type SlideContent,
  type TextElement,
} from "@/artifacts/plugins/slide/model"
import {
  addElement,
  applyTransforms,
  duplicateElements,
  moveBy,
  removeElements,
  updateElement,
} from "@/artifacts/plugins/slide/ops"
import { SlideScene } from "@/artifacts/plugins/slide/scene"
import { cn } from "@/lib/utils"

/** MIME type for dragging palette entries onto the canvas. */
export const INSERT_MIME = "application/x-harness-slide-element"
const ZOOM_STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2]
const NUDGE = 2
/** Single-key inserts shown in the Insert palette. */
const INSERT_KEYS: Record<string, InsertKind> = {
  t: "title",
  b: "body",
  l: "bullets",
  d: "diagram",
  i: "image",
}
const NUDGE_LARGE = 20

/** Largest scale at which the 16:9 canvas fits `box` with `margin` px around it. */
function useFitScale(margin: number) {
  const box = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(0.4)
  useEffect(() => {
    const node = box.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const next = Math.min((width - margin) / CANVAS.width, (height - margin) / CANVAS.height)
      if (next > 0) setFit(next)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [margin])
  return { box, fit }
}

export function SlideEditorView({ content, onChange, readOnly }: EditorProps<SlideContent>) {
  const { selected, setSelected } = useSlideEditor()
  const actions = useSlideActions(content, onChange)
  const { box, fit } = useFitScale(56)
  const [zoom, setZoom] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const stage = useRef<Konva.Stage>(null)
  const scale = zoom ?? fit
  const live = content.elements.map((el) => el.id)
  const selection = selected.filter((id) => live.includes(id))

  const zoomBy = (direction: 1 | -1) => {
    const steps = direction > 0 ? ZOOM_STEPS : [...ZOOM_STEPS].reverse()
    setZoom(
      steps.find((step) => (direction > 0 ? step > scale + 0.001 : step < scale - 0.001)) ?? scale,
    )
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (editingId) return
    const mod = event.metaKey || event.ctrlKey
    if (mod && event.key.toLowerCase() === "z") {
      event.preventDefault()
      if (event.shiftKey) actions.redo()
      else actions.undo()
      return
    }
    if (readOnly) return
    if (mod && event.key.toLowerCase() === "d" && selection.length) {
      event.preventDefault()
      const [next, ids] = duplicateElements(content, selection)
      actions.apply(next)
      setSelected(ids)
      return
    }
    if ((event.key === "Delete" || event.key === "Backspace") && selection.length) {
      event.preventDefault()
      actions.apply(removeElements(content, selection))
      setSelected([])
      return
    }
    if (event.key === "Escape") {
      setSelected([])
      return
    }
    const insertKind = !mod && !event.altKey ? INSERT_KEYS[event.key.toLowerCase()] : undefined
    if (insertKind) {
      event.preventDefault()
      const element = createElement(insertKind)
      actions.apply(addElement(content, element))
      setSelected([element.id])
      return
    }
    const arrows: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }
    const arrow = arrows[event.key]
    if (arrow && selection.length) {
      event.preventDefault()
      const step = event.shiftKey ? NUDGE_LARGE : NUDGE
      actions.apply(moveBy(content, selection, arrow[0] * step, arrow[1] * step), "nudge")
    }
  }

  const onDrop = (event: React.DragEvent) => {
    const kind = event.dataTransfer.getData(INSERT_MIME) as InsertKind
    const container = stage.current?.container()
    if (!kind || !container || readOnly) return
    event.preventDefault()
    const rect = container.getBoundingClientRect()
    const element = createElement(
      kind,
      (event.clientX - rect.left) / scale,
      (event.clientY - rect.top) / scale,
    )
    actions.apply(addElement(content, element))
    setSelected([element.id])
  }

  const editing = content.elements.find(
    (el): el is TextElement => el.id === editingId && el.type === "text",
  )

  return (
    <div className="relative flex h-full w-full min-w-0 flex-col">
      <div className="absolute top-0 right-0 z-10 flex items-center gap-1.5">
        <ToolButton label="Undo" onClick={actions.undo} disabled={!actions.canUndo}>
          <Undo2Icon />
        </ToolButton>
        <ToolButton label="Redo" onClick={actions.redo} disabled={!actions.canRedo}>
          <Redo2Icon />
        </ToolButton>
        <span className="w-10 text-right font-mono text-[9.5px] text-gc-ink3" aria-live="polite">
          {Math.round(scale * 100)}%
        </span>
        <ToolButton label="Zoom out" onClick={() => zoomBy(-1)}>
          <MinusIcon />
        </ToolButton>
        <ToolButton label="Zoom in" onClick={() => zoomBy(1)}>
          <PlusIcon />
        </ToolButton>
        <ToolButton label="Fit to screen" onClick={() => setZoom(null)} disabled={zoom === null}>
          <ScanIcon />
        </ToolButton>
      </div>
      <div
        ref={box}
        role="application"
        aria-label="Slide canvas. Arrow keys move the selection, Delete removes it."
        // biome-ignore lint/a11y/noNoninteractiveTabindex: the canvas takes focus for its keyboard shortcuts
        tabIndex={0}
        onKeyDown={onKeyDown}
        onDragOver={(event) => {
          if (event.dataTransfer.types.includes(INSERT_MIME)) event.preventDefault()
        }}
        onDrop={onDrop}
        className="flex min-h-0 flex-1 items-center justify-center overflow-auto pt-8 outline-none"
      >
        <div className="relative shrink-0 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
          <SlideScene
            content={content}
            scale={scale}
            stageRef={stage}
            handlers={{
              selected: selection,
              editingId,
              onSelect: (id, additive) => {
                box.current?.focus()
                if (!id) setSelected([])
                else if (additive) {
                  setSelected(
                    selection.includes(id) ? selection.filter((s) => s !== id) : [...selection, id],
                  )
                } else setSelected([id])
              },
              onTransform: (transforms) =>
                !readOnly && actions.apply(applyTransforms(content, transforms)),
              onEditText: (id) => !readOnly && setEditingId(id),
            }}
          />
          {editing && (
            <TextOverlay
              element={editing}
              content={content}
              scale={scale}
              onCommit={(text) => {
                if (text !== editing.text)
                  actions.apply(updateElement(content, editing.id, { text }))
                setEditingId(null)
                box.current?.focus()
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/** In-place text editing: a textarea laid exactly over the element, in canvas units × scale. */
function TextOverlay({
  element,
  content,
  scale,
  onCommit,
}: {
  element: TextElement
  content: SlideContent
  scale: number
  onCommit: (text: string) => void
}) {
  const [text, setText] = useState(element.text)
  const style = resolveText(element, SLIDE_THEMES[content.theme])
  return (
    <textarea
      aria-label="Edit text"
      // biome-ignore lint/a11y/noAutofocus: opened by a deliberate double-click
      autoFocus
      value={text}
      onChange={(event) => setText(event.target.value)}
      onBlur={() => onCommit(text)}
      onKeyDown={(event) => {
        if (event.key === "Escape" || ((event.metaKey || event.ctrlKey) && event.key === "Enter")) {
          event.preventDefault()
          onCommit(text)
        }
      }}
      className="absolute resize-none overflow-hidden border-0 bg-transparent p-0 outline outline-2 outline-gc-primary"
      style={{
        left: element.x * scale,
        top: element.y * scale,
        width: element.width * scale,
        height: element.height * scale,
        transform: `rotate(${element.rotation}deg)`,
        transformOrigin: "top left",
        fontFamily: style.fontFamily,
        fontSize: style.fontSize * scale,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        letterSpacing: style.letterSpacing * scale,
        textTransform: style.uppercase ? "uppercase" : undefined,
        textAlign: style.align,
        color: style.color,
      }}
    />
  )
}

function ToolButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex size-[22px] items-center justify-center rounded-md border border-gc-border bg-gc-sunken text-gc-ink2 hover:text-gc-text disabled:opacity-40 [&_svg]:size-3",
      )}
    >
      {children}
    </button>
  )
}

/** Read-only slide scaled to its container's width (preview, flow player). */
export function SlideRenderer({ content }: RendererProps<SlideContent>) {
  const { box, fit } = useFitScale(0)
  return (
    <div ref={box} className="flex h-full w-full items-center justify-center">
      <SlideScene content={content} scale={fit} />
    </div>
  )
}

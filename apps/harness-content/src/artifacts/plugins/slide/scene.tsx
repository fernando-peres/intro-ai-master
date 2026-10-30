import type Konva from "konva"
import { useEffect, useRef, useState } from "react"
import {
  Arc,
  Arrow,
  Circle,
  Ellipse,
  Group,
  Image as KonvaImage,
  Layer,
  Line,
  Rect,
  Stage,
  Text,
  Transformer,
} from "react-konva"
import { layoutChart } from "@/artifacts/plugins/slide/chart-layout"
import {
  CANVAS,
  FONTS,
  resolveBackground,
  resolveShape,
  resolveText,
  SLIDE_THEMES,
  type SlideContent,
  type SlideElement,
  type SlideTheme,
} from "@/artifacts/plugins/slide/model"
import type { Transform } from "@/artifacts/plugins/slide/ops"
import { snapBox, visualBounds } from "@/artifacts/plugins/slide/snapping"

/** Snap distance in screen pixels; hold Alt while dragging to place freely. */
const SNAP_PX = 6
const GUIDE = "#F472B6"

export type SceneHandlers = {
  selected: readonly string[]
  /** Hidden while its text is edited in the DOM overlay. */
  editingId: string | null
  onSelect: (id: string | null, additive: boolean) => void
  onTransform: (transforms: Transform[]) => void
  onEditText: (id: string) => void
}

type Props = {
  content: SlideContent
  scale: number
  /** Omitted for read-only rendering (preview, flow player). */
  handlers?: SceneHandlers
  stageRef?: React.RefObject<Konva.Stage | null>
  /** Skips the background; the caller paints it, so a gradient can run past the canvas. */
  bare?: boolean
}

/** Draws a slide at `scale`; editor and renderer share it, so preview matches editing exactly. */
export function SlideScene({ content, scale, handlers, stageRef, bare }: Props) {
  const theme = SLIDE_THEMES[content.theme]
  const fontsReady = useCanvasFonts()
  const ownStage = useRef<Konva.Stage>(null)
  const stage = stageRef ?? ownStage
  const transformer = useRef<Konva.Transformer>(null)
  const selected = handlers?.selected ?? []
  const [guides, setGuides] = useState<{ vertical: number[]; horizontal: number[] }>({
    vertical: [],
    horizontal: [],
  })

  const free = useRef(false)
  /** Konva's drag hook, in absolute (screen) coordinates; snaps the box's edges and centre. */
  const snapDrag = (element: SlideElement) => (pos: Konva.Vector2d) => {
    if (free.current) {
      setGuides({ vertical: [], horizontal: [] })
      return pos
    }
    const targets = [
      { x: 0, y: 0, width: CANVAS.width, height: CANVAS.height },
      ...content.elements
        .filter((el) => el.visible && !selected.includes(el.id) && el.id !== element.id)
        .map(visualBounds),
    ]
    // Snap what the eye sees: rotated elements contribute their rotated bounds.
    const moving = visualBounds({ ...element, x: pos.x / scale, y: pos.y / scale })
    const snap = snapBox(moving, targets, SNAP_PX / scale)
    setGuides({ vertical: snap.vertical, horizontal: snap.horizontal })
    return { x: pos.x + snap.dx * scale, y: pos.y + snap.dy * scale }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: nodes remount when content changes, so re-attach
  useEffect(() => {
    const node = transformer.current
    if (!node || !stage.current) return
    const targets = selected
      .map((id) => findById(stage.current, id))
      .filter((target): target is Konva.Node => Boolean(target?.draggable()))
    node.nodes(targets)
    node.getLayer()?.batchDraw()
  }, [selected, content, stage])

  const collect = (): Transform[] =>
    selected.flatMap((id) => {
      const node = findById(stage.current, id)
      const element = content.elements.find((el) => el.id === id)
      if (!node || !element) return []
      const transform = {
        id,
        x: node.x(),
        y: node.y(),
        width: element.width * node.scaleX(),
        height: element.height * node.scaleY(),
        rotation: node.rotation(),
      }
      node.scale({ x: 1, y: 1 })
      return [transform]
    })

  return (
    <Stage
      ref={stage}
      width={CANVAS.width * scale}
      height={CANVAS.height * scale}
      scaleX={scale}
      scaleY={scale}
      listening={Boolean(handlers)}
      onMouseDown={(event) => {
        if (handlers && event.target === event.target.getStage()) handlers.onSelect(null, false)
      }}
    >
      {!bare && (
        <Layer listening={false}>
          <BackgroundRect content={content} />
        </Layer>
      )}
      <Layer key={fontsReady ? "fonts" : "fallback"}>
        <Rect
          name="backdrop"
          width={CANVAS.width}
          height={CANVAS.height}
          onMouseDown={() => handlers?.onSelect(null, false)}
        />
        {content.elements.map((element) =>
          element.visible ? (
            <Group
              key={element.id}
              id={element.id}
              x={element.x}
              y={element.y}
              rotation={element.rotation}
              draggable={Boolean(handlers) && !element.locked}
              opacity={handlers?.editingId === element.id ? 0 : 1}
              onMouseDown={(event) => {
                event.cancelBubble = true
                const additive = event.evt.shiftKey || event.evt.metaKey || event.evt.ctrlKey
                if (additive || !selected.includes(element.id)) {
                  handlers?.onSelect(element.id, additive)
                }
              }}
              onDblClick={() => element.type === "text" && handlers?.onEditText(element.id)}
              dragBoundFunc={handlers ? snapDrag(element) : undefined}
              onDragStart={(event) => {
                free.current = event.evt.altKey
              }}
              onDragEnd={() => {
                setGuides({ vertical: [], horizontal: [] })
                handlers?.onTransform(collect())
              }}
            >
              <ElementShape element={element} theme={theme} />
            </Group>
          ) : null,
        )}
        {handlers && (
          <Transformer
            ref={transformer}
            rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
            anchorSize={9}
            borderStrokeWidth={1.5}
            anchorStrokeWidth={1.5}
            rotateAnchorOffset={28}
            anchorStroke="#6D5BD0"
            borderStroke="#6D5BD0"
            anchorCornerRadius={2}
            keepRatio={false}
            ignoreStroke
            boundBoxFunc={(previous, next) =>
              Math.abs(next.width) < 8 || Math.abs(next.height) < 8 ? previous : next
            }
            onTransformEnd={() => handlers.onTransform(collect())}
          />
        )}
      </Layer>
      {handlers && (
        <Layer listening={false}>
          {guides.vertical.map((x) => (
            <Line
              key={`v${x}`}
              points={[x, 0, x, CANVAS.height]}
              stroke={GUIDE}
              strokeWidth={1.5 / scale}
            />
          ))}
          {guides.horizontal.map((y) => (
            <Line
              key={`h${y}`}
              points={[0, y, CANVAS.width, y]}
              stroke={GUIDE}
              strokeWidth={1.5 / scale}
            />
          ))}
        </Layer>
      )}
    </Stage>
  )
}

function BackgroundRect({ content }: { content: SlideContent }) {
  const background = resolveBackground(content)
  if (background.kind === "flat") {
    return <Rect width={CANVAS.width} height={CANVAS.height} fill={background.color} />
  }
  const [start, end] = gradientPoints(background.angle)
  return (
    <Rect
      width={CANVAS.width}
      height={CANVAS.height}
      fillLinearGradientStartPoint={start}
      fillLinearGradientEndPoint={end}
      fillLinearGradientColorStops={[0, background.from, 1, background.to]}
    />
  )
}

/** Element ids are UUIDs, which may start with a digit; Konva's `#id` selector cannot express that. */
export function findById(root: Konva.Container | null, id: string): Konva.Node | undefined {
  return root?.findOne((node: Konva.Node) => node.id() === id)
}

/** CSS `linear-gradient(<angle>deg, …)` endpoints on the canvas (0deg points up). */
export function gradientPoints(angle: number) {
  const radians = (angle * Math.PI) / 180
  const dx = Math.sin(radians)
  const dy = -Math.cos(radians)
  const half = (Math.abs(CANVAS.width * dx) + Math.abs(CANVAS.height * dy)) / 2
  const cx = CANVAS.width / 2
  const cy = CANVAS.height / 2
  return [
    { x: cx - dx * half, y: cy - dy * half },
    { x: cx + dx * half, y: cy + dy * half },
  ] as const
}

function ElementShape({ element, theme }: { element: SlideElement; theme: SlideTheme }) {
  const { width, height } = element
  switch (element.type) {
    case "text": {
      const style = resolveText(element, theme)
      const text =
        element.variant === "bullets"
          ? element.text
              .split("\n")
              .map((line) => (line.trim() ? `•   ${line}` : line))
              .join("\n")
          : element.text
      // No fixed height: Konva drops lines that overflow it, so text stays visible past the box.
      return (
        <>
          <Rect width={width} height={height} fill="transparent" />
          <Text
            width={width}
            text={style.uppercase ? text.toUpperCase() : text}
            fontFamily={style.fontFamily}
            fontSize={style.fontSize}
            fontStyle={String(style.fontWeight)}
            fill={style.color}
            align={style.align}
            lineHeight={style.lineHeight}
            letterSpacing={style.letterSpacing}
            wrap="word"
          />
        </>
      )
    }
    case "rect": {
      const style = resolveShape(element, theme)
      return (
        <Rect
          width={width}
          height={height}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          cornerRadius={style.cornerRadius}
        />
      )
    }
    case "ellipse": {
      const style = resolveShape(element, theme)
      return (
        <Ellipse
          x={width / 2}
          y={height / 2}
          radiusX={width / 2}
          radiusY={height / 2}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
        />
      )
    }
    case "line":
    case "arrow": {
      const style = resolveShape(element, theme)
      const points = [0, height / 2, width, height / 2]
      return (
        <>
          <Rect width={width} height={height} fill="transparent" />
          {element.type === "arrow" ? (
            <Arrow
              points={points}
              stroke={style.stroke}
              fill={style.stroke}
              strokeWidth={style.strokeWidth}
              pointerLength={style.strokeWidth * 4}
              pointerWidth={style.strokeWidth * 4}
            />
          ) : (
            <Line points={points} stroke={style.stroke} strokeWidth={style.strokeWidth} />
          )}
        </>
      )
    }
    case "image":
      return <ImageShape element={element} theme={theme} />
    case "diagram":
      return <DiagramShape element={element} theme={theme} />
    case "chart":
      return <ChartShape element={element} theme={theme} />
  }
}

function ImageShape({
  element,
  theme,
}: {
  element: Extract<SlideElement, { type: "image" }>
  theme: SlideTheme
}) {
  const image = useLoadedImage(element.src)
  const { width, height } = element
  if (!image) {
    return (
      <>
        <Rect
          width={width}
          height={height}
          fill={theme.surface}
          stroke={theme.line}
          strokeWidth={3}
          dash={[18, 12]}
          cornerRadius={12}
        />
        <Text
          width={width}
          height={height}
          align="center"
          verticalAlign="middle"
          text={element.src ? "Image could not load" : "Image · set its URL in Format"}
          fontFamily={FONTS.mono}
          fontSize={26}
          fill={theme.muted}
        />
      </>
    )
  }
  const crop = element.fit === "cover" ? coverCrop(image, width, height) : undefined
  const contain = element.fit === "contain" ? containBox(image, width, height) : undefined
  return (
    <KonvaImage
      image={image}
      crop={crop}
      x={contain?.x ?? 0}
      y={contain?.y ?? 0}
      width={contain?.width ?? width}
      height={contain?.height ?? height}
    />
  )
}

function coverCrop(image: HTMLImageElement, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  const cropWidth = width / scale
  const cropHeight = height / scale
  return {
    x: (image.naturalWidth - cropWidth) / 2,
    y: (image.naturalHeight - cropHeight) / 2,
    width: cropWidth,
    height: cropHeight,
  }
}

function containBox(image: HTMLImageElement, width: number, height: number) {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight)
  const w = image.naturalWidth * scale
  const h = image.naturalHeight * scale
  return { x: (width - w) / 2, y: (height - h) / 2, width: w, height: h }
}

function DiagramShape({
  element,
  theme,
}: {
  element: Extract<SlideElement, { type: "diagram" }>
  theme: SlideTheme
}) {
  const style = resolveShape(element, theme)
  const labels = element.labels.length ? element.labels : ["Step"]
  const gap = 90
  const nodeWidth = (element.width - gap * (labels.length - 1)) / labels.length
  const midY = element.height / 2
  return (
    <>
      {labels.map((label, index) => {
        const x = index * (nodeWidth + gap)
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: steps are positional and labels may repeat
          <Group key={index}>
            <Rect
              x={x}
              width={nodeWidth}
              height={element.height}
              fill={style.fill}
              stroke={style.stroke}
              strokeWidth={style.strokeWidth}
              cornerRadius={style.cornerRadius}
            />
            <Text
              x={x}
              width={nodeWidth}
              height={element.height}
              align="center"
              verticalAlign="middle"
              text={label}
              fontFamily={FONTS.ui}
              fontSize={36}
              fill={theme.text}
            />
            {index < labels.length - 1 && (
              <Arrow
                points={[x + nodeWidth + 18, midY, x + nodeWidth + gap - 18, midY]}
                stroke={theme.muted}
                fill={theme.muted}
                strokeWidth={4}
                pointerLength={14}
                pointerWidth={14}
              />
            )}
          </Group>
        )
      })}
    </>
  )
}

/** Draws the chart from its data on every render; see chart-layout.ts. */
function ChartShape({
  element,
  theme,
}: {
  element: Extract<SlideElement, { type: "chart" }>
  theme: SlideTheme
}) {
  return (
    <>
      <Rect width={element.width} height={element.height} fill="transparent" />
      {layoutChart(element, theme).map((prim, index) => {
        // Primitives are positional and rebuilt from the data on every render.
        const key = index
        switch (prim.kind) {
          case "rect":
            return (
              <Rect
                key={key}
                x={prim.x}
                y={prim.y}
                width={prim.width}
                height={prim.height}
                fill={prim.fill}
                cornerRadius={prim.radius}
              />
            )
          case "line":
            return (
              <Line
                key={key}
                points={prim.points}
                stroke={prim.stroke}
                strokeWidth={prim.width}
                dash={prim.dash}
                lineCap="round"
                lineJoin="round"
              />
            )
          case "dot":
            return <Circle key={key} x={prim.x} y={prim.y} radius={prim.radius} fill={prim.fill} />
          case "arc":
            return (
              <Arc
                key={key}
                x={prim.x}
                y={prim.y}
                innerRadius={0}
                outerRadius={prim.radius}
                angle={prim.angle}
                rotation={prim.rotation}
                fill={prim.fill}
              />
            )
          case "text":
            return (
              <Text
                key={key}
                x={prim.x}
                y={prim.y}
                width={prim.width}
                text={prim.text}
                fontSize={prim.size}
                fontFamily={prim.font}
                fill={prim.fill}
                align={prim.align}
                wrap="none"
                ellipsis
              />
            )
          default:
            return null
        }
      })}
    </>
  )
}

function useLoadedImage(src: string): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  useEffect(() => {
    setImage(null)
    if (!src) return
    const next = new window.Image()
    next.crossOrigin = "anonymous"
    next.onload = () => setImage(next)
    next.src = src
    return () => {
      next.onload = null
    }
  }, [src])
  return image
}

/** Canvas text only uses fonts the page has loaded; load ours, then redraw once. */
function useCanvasFonts(): boolean {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let live = true
    Promise.all([
      document.fonts.load(`600 40px "${FONTS.display}"`),
      document.fonts.load(`400 40px "${FONTS.ui}"`),
      document.fonts.load(`600 40px "${FONTS.ui}"`),
      document.fonts.load(`400 40px "${FONTS.mono}"`),
    ])
      .catch(() => undefined)
      .then(() => live && setReady(true))
    return () => {
      live = false
    }
  }, [])
  return ready
}

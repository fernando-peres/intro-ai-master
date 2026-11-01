import {
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  Handle,
  MarkerType,
  type Node,
  type NodeChange,
  type NodeProps,
  Position,
  ReactFlow,
  useReactFlow,
  useStore,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useCallback, useEffect, useMemo, useState } from "react"
import type { EditorProps, RendererProps } from "@/artifacts/plugin"
import { useDiagramEditor } from "@/artifacts/plugins/diagram/editor-context"
import { useMermaid } from "@/artifacts/plugins/diagram/mermaid"
import {
  type DiagramContent,
  type DiagramNode,
  type FlowDiagram,
  type MermaidDiagram,
  removeNodes,
} from "@/artifacts/plugins/diagram/model"
import { type SlideTheme, useSlideTheme } from "@/artifacts/plugins/slide/themes"
import { cn } from "@/lib/utils"

type NodeData = {
  label: string
  shape: DiagramNode["shape"]
  fill: string
  stroke: string
  text: string
  direction: FlowDiagram["direction"]
  handles: boolean
}
type DiagramFlowNode = Node<NodeData, "diagram">

const NODE_TYPES = { diagram: DiagramNodeView }

function backgroundCss(theme: SlideTheme): string {
  const { background } = theme
  return background.kind === "flat"
    ? background.color
    : `linear-gradient(${background.angle}deg, ${background.from}, ${background.to})`
}

function toneColor(theme: SlideTheme, tone: DiagramNode["tone"]): string | null {
  if (tone === "neutral") return null
  if (tone === "accent") return theme.accent
  return theme.series[Number(tone.slice(-1)) - 2] ?? theme.accent
}

export function toFlowNodes(
  content: FlowDiagram,
  theme: SlideTheme,
  handles: boolean,
): DiagramFlowNode[] {
  return content.nodes.map((node) => {
    const tone = toneColor(theme, node.tone)
    return {
      id: node.id,
      type: "diagram",
      position: { x: node.x, y: node.y },
      data: {
        label: node.label,
        shape: node.shape,
        fill: tone ? `color-mix(in srgb, ${tone} 22%, transparent)` : theme.surface,
        stroke: tone ?? theme.line,
        text: theme.text,
        direction: content.direction,
        handles,
      },
    }
  })
}

export function toFlowEdges(content: FlowDiagram, theme: SlideTheme): Edge[] {
  const solid = theme.background.kind === "flat" ? theme.background.color : theme.background.to
  return content.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label || undefined,
    animated: edge.animated,
    type: "smoothstep",
    style: { stroke: theme.muted, strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: theme.muted },
    labelStyle: { fill: theme.body, fontSize: 12 },
    labelBgStyle: { fill: solid },
  }))
}

function DiagramNodeView({ data }: NodeProps<DiagramFlowNode>) {
  const horizontal = data.direction === "LR"
  const handleClass = data.handles ? "" : "opacity-0"
  const diamond = data.shape === "diamond"
  return (
    <div
      className={cn(
        "relative flex w-[180px] items-center justify-center px-3 text-center text-[14px] leading-snug",
        diamond ? "h-24 px-8" : "min-h-14 border-[1.5px] py-2",
        data.shape === "pill" ? "rounded-full" : "rounded-lg",
      )}
      style={
        diamond
          ? { color: data.text }
          : { color: data.text, background: data.fill, borderColor: data.stroke }
      }
    >
      {diamond && (
        <svg
          aria-hidden
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full"
        >
          <polygon
            points="50,1 99,50 50,99 1,50"
            fill={data.fill}
            stroke={data.stroke}
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
      <span className="relative">{data.label}</span>
      <Handle
        type="target"
        position={horizontal ? Position.Left : Position.Top}
        className={handleClass}
      />
      <Handle
        type="source"
        position={horizontal ? Position.Right : Position.Bottom}
        className={handleClass}
      />
    </div>
  )
}

/** `fitView` only runs once; embeds and the slide stage change size after mounting. */
function RefitOnResize() {
  const { fitView } = useReactFlow()
  const width = useStore((state) => state.width)
  const height = useStore((state) => state.height)
  // biome-ignore lint/correctness/useExhaustiveDependencies: the size is what triggers a refit
  useEffect(() => {
    fitView()
  }, [fitView, width, height])
  return null
}

function FlowRenderer({ content }: { content: FlowDiagram }) {
  const theme = useSlideTheme(content.theme)
  return (
    <ReactFlow
      // Remounted on change so `fitView` runs again.
      key={JSON.stringify(content)}
      defaultNodes={toFlowNodes(content, theme, false)}
      defaultEdges={toFlowEdges(content, theme)}
      nodeTypes={NODE_TYPES}
      fitView
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      panOnDrag={false}
      zoomOnScroll={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      preventScrolling={false}
      style={{ background: "transparent" }}
    >
      <RefitOnResize />
    </ReactFlow>
  )
}

function MermaidCanvas({ content }: { content: MermaidDiagram }) {
  const theme = useSlideTheme(content.theme)
  const { svg, error } = useMermaid(content.source, theme)
  return (
    <div className="relative size-full min-h-0 min-w-0">
      <div
        data-testid="mermaid-svg"
        className="size-full p-4 [&_svg]:size-full [&_svg]:max-w-none!"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Mermaid's strict mode sanitizes this SVG
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {error && (
        <p
          role="alert"
          className="absolute inset-x-3 bottom-3 max-h-[40%] overflow-auto rounded-md border border-gc-fail-base/40 bg-gc-fail-tint p-2 font-mono text-label whitespace-pre-wrap text-gc-fail-ink"
        >
          {error}
        </p>
      )}
    </div>
  )
}

export function DiagramRenderer({ content, presenting }: RendererProps<DiagramContent>) {
  const theme = useSlideTheme(content.theme)
  return (
    <div
      className={cn("overflow-hidden", presenting ? "size-full" : "aspect-video w-full")}
      style={{ background: backgroundCss(theme) }}
    >
      {content.engine === "flow" ? (
        <FlowRenderer content={content} />
      ) : (
        <MermaidCanvas content={content} />
      )}
    </div>
  )
}

function FlowEditor({ content, onChange, readOnly }: EditorProps<FlowDiagram>) {
  const theme = useSlideTheme(content.theme)
  const { select } = useDiagramEditor()
  const [nodes, setNodes] = useState<DiagramFlowNode[]>([])
  const [edges, setEdges] = useState<Edge[]>([])

  // Content is the source of truth; selection and measurements belong to the canvas.
  useEffect(() => {
    setNodes((current) => {
      const previous = new Map(current.map((node) => [node.id, node]))
      return toFlowNodes(content, theme, !readOnly).map((node) => {
        const old = previous.get(node.id)
        return old ? { ...old, ...node, selected: old.selected, measured: old.measured } : node
      })
    })
    setEdges((current) => {
      const selected = new Set(current.filter((edge) => edge.selected).map((edge) => edge.id))
      return toFlowEdges(content, theme).map((edge) => ({
        ...edge,
        selected: selected.has(edge.id),
      }))
    })
  }, [content, theme, readOnly])

  // The panels edit by id, so a removed element must not stay selected.
  useEffect(() => () => select({ nodes: [], edges: [] }), [select])

  const onNodesChange = useCallback(
    (changes: NodeChange<DiagramFlowNode>[]) =>
      setNodes((current) => applyNodeChanges(changes, current)),
    [],
  )
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((current) => applyEdgeChanges(changes, current)),
    [],
  )

  // React Flow requires a stable handler here; an inline one loops through the provider's state.
  const onSelectionChange = useCallback(
    ({ nodes: picked, edges: pickedEdges }: { nodes: Node[]; edges: Edge[] }) =>
      select({ nodes: picked.map((node) => node.id), edges: pickedEdges.map((edge) => edge.id) }),
    [select],
  )

  const onConnect = ({ source, target }: Connection) => {
    if (readOnly || source === target) return
    if (content.edges.some((edge) => edge.source === source && edge.target === target)) return
    const used = new Set(content.edges.map((edge) => edge.id))
    let index = content.edges.length + 1
    while (used.has(`e${index}`)) index++
    onChange({
      ...content,
      edges: [...content.edges, { id: `e${index}`, source, target, label: "", animated: false }],
    })
  }

  const onDragStop = (_: unknown, __: unknown, dragged: DiagramFlowNode[]) => {
    const moved = new Map(dragged.map((node) => [node.id, node.position]))
    onChange({
      ...content,
      nodes: content.nodes.map((node) => {
        const position = moved.get(node.id)
        return position ? { ...node, x: position.x, y: position.y } : node
      }),
    })
  }

  const onDelete = ({ nodes: gone, edges: goneEdges }: { nodes: Node[]; edges: Edge[] }) => {
    const edgeIds = new Set(goneEdges.map((edge) => edge.id))
    const next = removeNodes(
      content,
      gone.map((node) => node.id),
    )
    onChange({ ...next, edges: next.edges.filter((edge) => !edgeIds.has(edge.id)) })
  }

  return (
    <ReactFlow
      aria-label="Diagram canvas"
      nodes={nodes}
      edges={edges}
      nodeTypes={NODE_TYPES}
      fitView
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeDragStop={onDragStop}
      onDelete={onDelete}
      onSelectionChange={onSelectionChange}
      nodesDraggable={!readOnly}
      nodesConnectable={!readOnly}
      edgesReconnectable={false}
      deleteKeyCode={readOnly ? null : ["Backspace", "Delete"]}
      style={{ background: "transparent" }}
    />
  )
}

function MermaidEditor({ content, onChange, readOnly }: EditorProps<MermaidDiagram>) {
  const canvas = useMemo(() => <MermaidCanvas content={content} />, [content])
  return (
    <div className="grid size-full grid-cols-[minmax(280px,2fr)_3fr]">
      <textarea
        aria-label="Mermaid source"
        spellCheck={false}
        readOnly={readOnly}
        value={content.source}
        onChange={(event) => onChange({ ...content, source: event.target.value })}
        className="resize-none border-r border-gc-border bg-gc-sunken p-3 font-mono text-ui leading-relaxed text-gc-text outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gc-primary"
      />
      {canvas}
    </div>
  )
}

export function DiagramEditorView(props: EditorProps<DiagramContent>) {
  const { content } = props
  const theme = useSlideTheme(content.theme)
  return (
    <div className="size-full min-h-0" style={{ background: backgroundCss(theme) }}>
      {content.engine === "flow" ? (
        <FlowEditor {...(props as EditorProps<FlowDiagram>)} />
      ) : (
        <MermaidEditor {...(props as EditorProps<MermaidDiagram>)} />
      )}
    </div>
  )
}

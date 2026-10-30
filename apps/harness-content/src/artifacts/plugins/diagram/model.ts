import { z } from "zod"

export const ENGINES = ["flow", "mermaid"] as const
export type Engine = (typeof ENGINES)[number]

export const ENGINE_LABELS: Record<Engine, { label: string; description: string }> = {
  flow: { label: "Node graph", description: "Boxes and arrows you drag and connect." },
  mermaid: { label: "Mermaid", description: "A diagram written as Mermaid text." },
}

export const NODE_SHAPES = ["rect", "pill", "diamond"] as const
/** Theme colours: `neutral` is the theme's surface, the others its four accent slots. */
export const NODE_TONES = ["neutral", "accent", "accent2", "accent3", "accent4"] as const
export const DIRECTIONS = ["LR", "TB"] as const

const node = z.object({
  id: z.string().min(1),
  label: z.string().max(80).default(""),
  x: z.number().default(0),
  y: z.number().default(0),
  shape: z.enum(NODE_SHAPES).default("rect"),
  tone: z.enum(NODE_TONES).default("neutral"),
})

const edge = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  label: z.string().max(60).default(""),
  animated: z.boolean().default(false),
})

export type DiagramNode = z.infer<typeof node>
export type DiagramEdge = z.infer<typeof edge>

const base = {
  schemaVersion: z.literal(1),
  type: z.literal("diagram"),
  theme: z.string().min(1).default("dark"),
}

/** Persisted diagram: a theme id plus either a node graph or Mermaid source, never markup. */
export const diagramSchema = z.discriminatedUnion("engine", [
  z.object({
    ...base,
    engine: z.literal("flow"),
    direction: z.enum(DIRECTIONS).default("LR"),
    nodes: z.array(node).default([]),
    edges: z.array(edge).default([]),
  }),
  z.object({
    ...base,
    engine: z.literal("mermaid"),
    source: z.string().max(20_000).default(""),
  }),
])

export type DiagramContent = z.output<typeof diagramSchema>
export type FlowDiagram = Extract<DiagramContent, { engine: "flow" }>
export type MermaidDiagram = Extract<DiagramContent, { engine: "mermaid" }>

const STARTER_SOURCE = `flowchart LR
  trace[Record trace] --> replay[Replay build]
  replay --> score{Rubric pass?}
  score -- yes --> ship[Ship]
  score -- no --> fix[Fix regression]`

const STARTER_STEPS = ["Record trace", "Replay build", "Score", "Report"]

export function createEmptyDiagram(engine: Engine = "flow"): DiagramContent {
  if (engine === "mermaid") {
    return diagramSchema.parse({
      schemaVersion: 1,
      type: "diagram",
      engine,
      source: STARTER_SOURCE,
    })
  }
  const nodes = STARTER_STEPS.map((label, index) => ({
    id: `n${index + 1}`,
    label,
    x: index * 240,
    y: 0,
    tone: index === 0 ? "accent" : "neutral",
  }))
  const edges = nodes.slice(1).map((target, index) => ({
    id: `e${index + 1}`,
    source: nodes[index].id,
    target: target.id,
  }))
  return diagramSchema.parse({ schemaVersion: 1, type: "diagram", engine, nodes, edges })
}

/** Replaces the content with `engine`'s starter, keeping the theme. */
export function switchEngine(content: DiagramContent, engine: Engine): DiagramContent {
  if (content.engine === engine) return content
  return { ...createEmptyDiagram(engine), theme: content.theme }
}

export function diagramSearchText(content: DiagramContent): string {
  if (content.engine === "mermaid") return content.source
  return [...content.nodes.map((n) => n.label), ...content.edges.map((e) => e.label)]
    .filter(Boolean)
    .join("\n")
}

/** A node id not used in `content`. */
export function nextNodeId(content: FlowDiagram): string {
  const used = new Set(content.nodes.map((n) => n.id))
  let index = content.nodes.length + 1
  while (used.has(`n${index}`)) index++
  return `n${index}`
}

/** Removes nodes and every edge touching them. */
export function removeNodes(content: FlowDiagram, ids: readonly string[]): FlowDiagram {
  const gone = new Set(ids)
  return {
    ...content,
    nodes: content.nodes.filter((n) => !gone.has(n.id)),
    edges: content.edges.filter((e) => !gone.has(e.source) && !gone.has(e.target)),
  }
}

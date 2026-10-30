import type { Schemas } from "@/api/client"
import { fromServer, moveItem, type TrailStep, toStepIn } from "@/lib/trail"

export type ChecklistItem = { label: string; done: boolean }

/** Instructional-design notes for the trail, a unit or a pill. */
export type Rationale = {
  summary: string
  objectives: string[]
  prerequisites: string[]
  assessment: string
  checklist: ChecklistItem[]
}

export type StepNode = { kind: "step"; step: TrailStep }
export type PillNode = {
  kind: "pill"
  key: string
  title: string
  rationale: Rationale
  children: StepNode[]
}
export type UnitNode = {
  kind: "unit"
  key: string
  title: string
  rationale: Rationale
  children: (PillNode | StepNode)[]
}
export type GroupNode = UnitNode | PillNode
export type OutlineNode = GroupNode | StepNode

/** Trail → Unit → Pill; steps sit at any level and play in reading order. */
export type TrailOutline = { rationale: Rationale; nodes: (UnitNode | StepNode)[] }

/** A place steps can live in: a unit or pill key, or `null` for the trail root. */
export type ContainerKey = string | null

export const emptyRationale = (): Rationale => ({
  summary: "",
  objectives: [],
  prerequisites: [],
  assessment: "",
  checklist: [],
})

function readRationale(raw: Schemas["Rationale"] | undefined): Rationale {
  return {
    summary: raw?.summary ?? "",
    objectives: raw?.objectives ?? [],
    prerequisites: raw?.prerequisites ?? [],
    assessment: raw?.assessment ?? "",
    checklist: (raw?.checklist ?? []).map((item) => ({ label: item.label, done: !!item.done })),
  }
}

export const nodeId = (node: OutlineNode) => (node.kind === "step" ? node.step.key : node.key)

export function fromRevision(revision: {
  steps: Schemas["StepOut"][]
  outline: Schemas["Outline"]
}): TrailOutline {
  const steps = fromServer(revision.steps)
  const used = new Set<number>()
  const ref = (position: number): StepNode[] => {
    const step = steps[position - 1]
    if (!step || used.has(position)) return []
    used.add(position)
    return [{ kind: "step", step }]
  }
  const nodes = (revision.outline.nodes ?? []).flatMap((node): (UnitNode | StepNode)[] =>
    node.kind === "unit"
      ? [
          {
            kind: "unit",
            key: node.key,
            title: node.title,
            rationale: readRationale(node.rationale),
            children: (node.children ?? []).flatMap((child): (PillNode | StepNode)[] =>
              child.kind === "pill"
                ? [
                    {
                      kind: "pill",
                      key: child.key,
                      title: child.title,
                      rationale: readRationale(child.rationale),
                      children: (child.children ?? []).flatMap((leaf) => ref(leaf.step)),
                    },
                  ]
                : ref(child.step),
            ),
          },
        ]
      : ref(node.step),
  )
  // A step the outline forgot still belongs to the trail.
  const orphans = steps.flatMap((_, i) => ref(i + 1))
  return { rationale: readRationale(revision.outline.rationale), nodes: [...nodes, ...orphans] }
}

export function flattenSteps(outline: TrailOutline): TrailStep[] {
  const walk = (nodes: OutlineNode[]): TrailStep[] =>
    nodes.flatMap((node) => (node.kind === "step" ? [node.step] : walk(node.children)))
  return walk(outline.nodes)
}

/** The draft body: steps in play order, and the outline pointing at their positions. */
export function toDraftIn(outline: TrailOutline): Schemas["DraftSteps"] {
  let position = 0
  const ref = (): Schemas["StepRef"] => ({ kind: "step", step: ++position })
  return {
    steps: flattenSteps(outline).map(toStepIn),
    outline: {
      rationale: outline.rationale,
      nodes: outline.nodes.map((node) =>
        node.kind === "step"
          ? ref()
          : {
              kind: "unit",
              key: node.key,
              title: node.title,
              rationale: node.rationale,
              children: node.children.map((child) =>
                child.kind === "step"
                  ? ref()
                  : {
                      kind: "pill",
                      key: child.key,
                      title: child.title,
                      rationale: child.rationale,
                      children: child.children.map(ref),
                    },
              ),
            },
      ),
    },
  }
}

export function groups(outline: TrailOutline): GroupNode[] {
  return outline.nodes.flatMap((node) =>
    node.kind === "unit"
      ? [node, ...node.children.filter((child): child is PillNode => child.kind === "pill")]
      : [],
  )
}

export function findGroup(outline: TrailOutline, key: string): GroupNode | undefined {
  return groups(outline).find((group) => group.key === key)
}

export function groupSteps(group: GroupNode): TrailStep[] {
  return group.children.flatMap((child) =>
    child.kind === "step" ? [child.step] : child.children.map((leaf) => leaf.step),
  )
}

/** Rewrites every node bottom-up; returning `null` drops it, an array splices it in place. */
function rewrite(
  outline: TrailOutline,
  fn: (node: OutlineNode) => OutlineNode | OutlineNode[] | null,
): TrailOutline {
  const walk = (nodes: OutlineNode[]): OutlineNode[] =>
    nodes.flatMap((node) => {
      const next = node.kind === "step" ? node : { ...node, children: walk(node.children) }
      return fn(next as OutlineNode) ?? []
    })
  return { ...outline, nodes: walk(outline.nodes) as TrailOutline["nodes"] }
}

function withChildren(
  outline: TrailOutline,
  container: ContainerKey,
  fn: (children: OutlineNode[]) => OutlineNode[],
): TrailOutline {
  if (container === null) {
    return { ...outline, nodes: fn(outline.nodes) as TrailOutline["nodes"] }
  }
  return rewrite(outline, (node) =>
    node.kind !== "step" && node.key === container
      ? ({ ...node, children: fn(node.children) } as GroupNode)
      : node,
  )
}

export function patchStep(
  outline: TrailOutline,
  key: string,
  patch: Partial<TrailStep>,
): TrailOutline {
  return rewrite(outline, (node) =>
    node.kind === "step" && node.step.key === key
      ? { kind: "step", step: { ...node.step, ...patch } }
      : node,
  )
}

export function patchGroup(
  outline: TrailOutline,
  key: string,
  patch: Partial<Pick<GroupNode, "title" | "rationale">>,
): TrailOutline {
  return rewrite(outline, (node) =>
    node.kind !== "step" && node.key === key ? ({ ...node, ...patch } as GroupNode) : node,
  )
}

/** `null` is the trail's own rationale. */
export function patchRationale(
  outline: TrailOutline,
  key: ContainerKey,
  rationale: Rationale,
): TrailOutline {
  return key === null ? { ...outline, rationale } : patchGroup(outline, key, { rationale })
}

function freshKey(outline: TrailOutline, prefix: "u" | "p"): string {
  const taken = new Set(groups(outline).map((group) => group.key))
  let n = 1
  while (taken.has(`${prefix}${n}`)) n++
  return `${prefix}${n}`
}

export function addUnit(outline: TrailOutline, title: string): [TrailOutline, string] {
  const key = freshKey(outline, "u")
  const unit: UnitNode = { kind: "unit", key, title, rationale: emptyRationale(), children: [] }
  return [{ ...outline, nodes: [...outline.nodes, unit] }, key]
}

export function addPill(
  outline: TrailOutline,
  unitKey: string,
  title: string,
): [TrailOutline, string] {
  const key = freshKey(outline, "p")
  const pill: PillNode = { kind: "pill", key, title, rationale: emptyRationale(), children: [] }
  return [withChildren(outline, unitKey, (children) => [...children, pill]), key]
}

export function addStep(
  outline: TrailOutline,
  step: TrailStep,
  container: ContainerKey,
): TrailOutline {
  return withChildren(outline, container, (children) => [...children, { kind: "step", step }])
}

export function removeStep(outline: TrailOutline, key: string): TrailOutline {
  return rewrite(outline, (node) => (node.kind === "step" && node.step.key === key ? null : node))
}

/**
 * Dissolves a unit or pill; its steps take its place. A unit's pills dissolve with it,
 * since pills cannot sit at the root.
 */
export function removeGroup(outline: TrailOutline, key: string): TrailOutline {
  return rewrite(outline, (node) => {
    if (node.kind === "step" || node.key !== key) return node
    return node.kind === "pill"
      ? node.children
      : groupSteps(node).map((step) => ({ kind: "step", step }))
  })
}

/** Reorders `fromId` onto `toId` (node ids) inside one container. */
export function moveWithin(
  outline: TrailOutline,
  container: ContainerKey,
  fromId: string,
  toId: string,
): TrailOutline {
  return withChildren(outline, container, (children) => {
    const ids = children.map(nodeId)
    return moveItem(children, ids.indexOf(fromId), ids.indexOf(toId))
  })
}

export function placementOf(
  outline: TrailOutline,
  stepKey: string,
): { unit?: UnitNode; pill?: PillNode } {
  for (const node of outline.nodes) {
    if (node.kind !== "unit") continue
    for (const child of node.children) {
      if (child.kind === "step" && child.step.key === stepKey) return { unit: node }
      if (child.kind === "pill" && child.children.some((leaf) => leaf.step.key === stepKey)) {
        return { unit: node, pill: child }
      }
    }
  }
  return {}
}

export function containerOf(outline: TrailOutline, stepKey: string): ContainerKey {
  const { unit, pill } = placementOf(outline, stepKey)
  return pill?.key ?? unit?.key ?? null
}

/** Moves a step to the end of another container. */
export function moveStepTo(
  outline: TrailOutline,
  stepKey: string,
  container: ContainerKey,
): TrailOutline {
  const step = flattenSteps(outline).find((entry) => entry.key === stepKey)
  if (!step || containerOf(outline, stepKey) === container) return outline
  return addStep(removeStep(outline, stepKey), step, container)
}

export function containers(outline: TrailOutline): { key: ContainerKey; label: string }[] {
  return [
    { key: null, label: "Trail root" },
    ...outline.nodes.flatMap((node) =>
      node.kind === "unit"
        ? [
            { key: node.key, label: node.title },
            ...node.children.flatMap((child) =>
              child.kind === "pill"
                ? [{ key: child.key, label: `${node.title} › ${child.title}` }]
                : [],
            ),
          ]
        : [],
    ),
  ]
}

/** Step position → "Unit › Pill" (or "Unit") for a server outline; root steps are absent. */
export function placementLabels(outline: Schemas["Outline"]): Map<number, string> {
  const labels = new Map<number, string>()
  for (const node of outline.nodes ?? []) {
    if (node.kind !== "unit") continue
    for (const child of node.children ?? []) {
      if (child.kind === "step") labels.set(child.step, node.title)
      else
        for (const leaf of child.children ?? [])
          labels.set(leaf.step, `${node.title} › ${child.title}`)
    }
  }
  return labels
}

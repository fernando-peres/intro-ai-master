import { useTranslation } from "@/i18n/use-translation"
export type TreeDiagramNode = {
  label: string
  /** Set on leaves: the outcome's color. Internal (question) nodes are drawn neutral. */
  color?: string
  children?: { edge: string; node: TreeDiagramNode }[]
}

const SLOT = 76
const LEVEL = 84
const LEAF_W = 56
const NODE_H = 34
const PAD = 12
const CHAR_W = 9.6

const widthOf = (node: TreeDiagramNode) => Math.max(LEAF_W, node.label.length * CHAR_W + 20)

type Placed = { node: TreeDiagramNode; x: number; y: number; edge?: string; parent?: Placed }

function place(root: TreeDiagramNode): Placed[] {
  const placed: Placed[] = []
  let leafIndex = 0
  const visit = (node: TreeDiagramNode, depth: number, edge?: string): Placed => {
    const self: Placed = { node, x: 0, y: PAD + depth * LEVEL, edge }
    placed.push(self)
    const kids = (node.children ?? []).map((c) => visit(c.node, depth + 1, c.edge))
    for (const k of kids) k.parent = self
    self.x = kids.length
      ? (kids[0].x + kids[kids.length - 1].x) / 2
      : PAD + leafIndex++ * SLOT + LEAF_W / 2
    return self
  }
  visit(root, 0)
  return placed
}

/** A top-down tree: questions at internal nodes, branch values on the edges, outcomes at leaves. */
export function TreeDiagram({ root, ariaLabel }: { root: TreeDiagramNode; ariaLabel: string }) {
  const { t } = useTranslation()
  const translated = (node: TreeDiagramNode): TreeDiagramNode => ({
    ...node,
    label: t(node.label),
    children: node.children?.map((child) => ({
      edge: t(child.edge),
      node: translated(child.node),
    })),
  })
  const placed = place(translated(root))
  const width = Math.max(...placed.map((p) => p.x + widthOf(p.node) / 2)) + PAD
  const height = Math.max(...placed.map((p) => p.y)) + NODE_H + PAD

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label={t(ariaLabel)}
    >
      {placed
        .filter((p) => p.parent)
        .map((p) => {
          const parent = p.parent as Placed
          const midY = parent.y + NODE_H + (p.y - parent.y - NODE_H) / 2
          return (
            <g key={`${parent.node.label}-${p.edge}`}>
              <path
                d={`M${parent.x},${parent.y + NODE_H} V${midY} H${p.x} V${p.y}`}
                fill="none"
                className="stroke-fg-muted"
                strokeWidth={1.5}
              />
              <text
                x={p.x}
                y={(midY + p.y) / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-fg-secondary font-ui text-[14px]"
                stroke="var(--color-surface)"
                strokeWidth={5}
                paintOrder="stroke"
              >
                {t(p.edge ?? "")}
              </text>
            </g>
          )
        })}
      {placed.map((p) => (
        <g key={`${p.parent?.node.label ?? "root"}-${p.edge ?? ""}-${p.node.label}`}>
          <rect
            x={p.x - widthOf(p.node) / 2}
            y={p.y}
            width={widthOf(p.node)}
            height={NODE_H}
            rx={p.node.color ? NODE_H / 2 : 3}
            fill="var(--color-surface)"
            stroke={p.node.color ?? "var(--color-fg-muted)"}
            strokeWidth={p.node.color ? 2 : 1.5}
          />
          <text
            x={p.x}
            y={p.y + NODE_H / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={p.node.color ?? "var(--color-fg)"}
            className="font-ui text-[16px]"
          >
            {t(p.node.label)}
          </text>
        </g>
      ))}
    </svg>
  )
}

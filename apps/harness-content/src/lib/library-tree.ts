import type { ArtifactListItem, Location } from "@/api/client"

export type LibraryNode = {
  location: Location
  depth: number
  children: LibraryNode[]
  artifacts: ArtifactListItem[]
  /** Artifacts in this location and everything beneath it. */
  total: number
}

/** What a location's add action can create beneath it, besides an artifact. */
export const CHILD_KIND: Record<Location["kind"], Location["kind"] | null> = {
  box: "unit",
  unit: "section",
  section: null,
}

export const UNTITLED: Record<Location["kind"], string> = {
  box: "Untitled box",
  unit: "Untitled unit",
  section: "Untitled section",
}

/**
 * Box → Unit → Section tree with each location's artifacts; siblings keep API order.
 * `counts` holds direct artifact counts. Without it, totals only reflect `artifacts`.
 */
export function buildLibraryTree(
  locations: Location[],
  artifacts: ArtifactListItem[],
  counts?: Record<string, number>,
): LibraryNode[] {
  const nodes = new Map<string, LibraryNode>()
  for (const location of locations) {
    nodes.set(location.id, { location, depth: 0, children: [], artifacts: [], total: 0 })
  }
  const roots: LibraryNode[] = []
  for (const node of nodes.values()) {
    const parent = node.location.parentId ? nodes.get(node.location.parentId) : undefined
    if (parent) parent.children.push(node)
    else if (!node.location.parentId) roots.push(node)
  }
  for (const artifact of artifacts) nodes.get(artifact.locationId)?.artifacts.push(artifact)
  const finish = (node: LibraryNode, depth: number): number => {
    node.depth = depth
    const own = counts ? (counts[node.location.id] ?? 0) : node.artifacts.length
    node.total = node.children.reduce((sum, child) => sum + finish(child, depth + 1), own)
    return node.total
  }
  for (const root of roots) finish(root, 0)
  return roots
}

export function findNode(tree: LibraryNode[], locationId: string): LibraryNode | undefined {
  for (const node of tree) {
    if (node.location.id === locationId) return node
    const below = findNode(node.children, locationId)
    if (below) return below
  }
  return undefined
}

/** Ids of the locations above `locationId`, excluding itself. */
export function locationAncestors(locations: Location[], locationId: string): string[] {
  const byId = new Map(locations.map((location) => [location.id, location]))
  const ancestors: string[] = []
  let parentId = byId.get(locationId)?.parentId
  while (parentId) {
    ancestors.unshift(parentId)
    parentId = byId.get(parentId)?.parentId
  }
  return ancestors
}

/** "Intro to AI › Foundations › What is a model" for a location id. */
export function locationTrail(locations: Location[], locationId: string | undefined): string[] {
  const byId = new Map(locations.map((location) => [location.id, location]))
  const trail: string[] = []
  let current = locationId ? byId.get(locationId) : undefined
  while (current) {
    trail.unshift(current.title)
    current = current.parentId ? byId.get(current.parentId) : undefined
  }
  return trail
}

/** Keeps nodes whose title matches, plus the ancestors needed to reach them. */
export function filterTree(tree: LibraryNode[], query: string): LibraryNode[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return tree
  const hit = (title: string) => title.toLowerCase().includes(needle)
  return tree.flatMap((node) => {
    if (hit(node.location.title)) return [node]
    const children = filterTree(node.children, query)
    const artifacts = node.artifacts.filter((artifact) => hit(artifact.title))
    return children.length || artifacts.length ? [{ ...node, children, artifacts }] : []
  })
}

/** Location ids from the root down to the one holding `artifactId`; empty if it is not in the tree. */
export function ancestorsOf(tree: LibraryNode[], artifactId: string): string[] {
  for (const node of tree) {
    if (node.artifacts.some((artifact) => artifact.id === artifactId)) return [node.location.id]
    const below = ancestorsOf(node.children, artifactId)
    if (below.length) return [node.location.id, ...below]
  }
  return []
}

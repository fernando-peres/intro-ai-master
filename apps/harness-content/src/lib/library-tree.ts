import type { ArtifactListItem, Location } from "@/api/client"

export type LibraryNode = {
  location: Location
  depth: number
  children: LibraryNode[]
  artifacts: ArtifactListItem[]
}

/** Box → Unit → Section tree with each location's artifacts; siblings keep API order. */
export function buildLibraryTree(
  locations: Location[],
  artifacts: ArtifactListItem[],
): LibraryNode[] {
  const nodes = new Map<string, LibraryNode>()
  for (const location of locations) {
    nodes.set(location.id, { location, depth: 0, children: [], artifacts: [] })
  }
  const roots: LibraryNode[] = []
  for (const node of nodes.values()) {
    const parent = node.location.parentId ? nodes.get(node.location.parentId) : undefined
    if (parent) parent.children.push(node)
    else if (!node.location.parentId) roots.push(node)
  }
  for (const artifact of artifacts) nodes.get(artifact.locationId)?.artifacts.push(artifact)
  const setDepth = (node: LibraryNode, depth: number) => {
    node.depth = depth
    for (const child of node.children) setDepth(child, depth + 1)
  }
  for (const root of roots) setDepth(root, 0)
  return roots
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

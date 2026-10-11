export type CategoricalRow = Record<string, string>

export type DecisionTree =
  | { kind: "leaf"; label: string; count: number }
  | {
      kind: "split"
      attribute: string
      gain: number
      /** Fallback for an attribute value never seen while training this node. */
      majority: string
      branches: { value: string; child: DecisionTree }[]
    }

function majorityLabel(labels: string[]): string {
  const counts = new Map<string, number>()
  for (const l of labels) counts.set(l, (counts.get(l) ?? 0) + 1)
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0]
}

/** Shannon entropy in bits: H = −Σ pᵢ log₂ pᵢ. */
export function entropy(labels: string[]): number {
  const counts = new Map<string, number>()
  for (const l of labels) counts.set(l, (counts.get(l) ?? 0) + 1)
  return [...counts.values()].reduce((h, c) => {
    const p = c / labels.length
    return h - p * Math.log2(p)
  }, 0)
}

/** Entropy removed by splitting `rows` on `attribute`. */
export function informationGain(rows: CategoricalRow[], attribute: string, target: string): number {
  const values = [...new Set(rows.map((r) => r[attribute]))]
  const remainder = values.reduce((sum, v) => {
    const subset = rows.filter((r) => r[attribute] === v)
    return sum + (subset.length / rows.length) * entropy(subset.map((r) => r[target]))
  }, 0)
  return entropy(rows.map((r) => r[target])) - remainder
}

/** Quinlan's ID3: greedily split on the highest-information-gain attribute until nodes are pure. */
export function id3(rows: CategoricalRow[], attributes: string[], target: string): DecisionTree {
  const labels = rows.map((r) => r[target])
  if (new Set(labels).size === 1 || attributes.length === 0) {
    return { kind: "leaf", label: majorityLabel(labels), count: rows.length }
  }
  const gains = attributes.map((a) => ({ a, gain: informationGain(rows, a, target) }))
  const best = gains.reduce((x, y) => (y.gain > x.gain ? y : x))
  const rest = attributes.filter((a) => a !== best.a)
  const values = [...new Set(rows.map((r) => r[best.a]))]
  return {
    kind: "split",
    attribute: best.a,
    gain: best.gain,
    majority: majorityLabel(labels),
    branches: values.map((value) => ({
      value,
      child: id3(
        rows.filter((r) => r[best.a] === value),
        rest,
        target,
      ),
    })),
  }
}

export function classifyTree(tree: DecisionTree, row: CategoricalRow): string {
  if (tree.kind === "leaf") return tree.label
  const branch = tree.branches.find((b) => b.value === row[tree.attribute])
  return branch ? classifyTree(branch.child, row) : tree.majority
}

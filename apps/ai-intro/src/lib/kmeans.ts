import { mulberry32 } from "./neural-net"

export type KMeansResult = {
  assignments: number[]
  centroids: number[][]
  /** Total squared distance to each point's assigned centroid, after each iteration. */
  inertiaHistory: number[]
}

function squaredDistance(a: number[], b: number[]): number {
  return a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0)
}

function nearestCentroid(point: number[], centroids: number[][]): number {
  let best = 0
  let bestDistance = Number.POSITIVE_INFINITY
  centroids.forEach((centroid, i) => {
    const distance = squaredDistance(point, centroid)
    if (distance < bestDistance) {
      bestDistance = distance
      best = i
    }
  })
  return best
}

/**
 * Lloyd's algorithm: alternates "assign each point to its nearest centroid" and "recompute each
 * centroid as the mean of its assigned points," seeded from `k` distinct random points.
 */
export function kMeans(points: number[][], k: number, seed: number, iterations = 10): KMeansResult {
  const rand = mulberry32(seed)
  const order = points.map((_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  let centroids = order.slice(0, k).map((i) => [...points[i]])
  let assignments = points.map(() => 0)
  const inertiaHistory: number[] = []

  for (let iter = 0; iter < iterations; iter++) {
    assignments = points.map((p) => nearestCentroid(p, centroids))
    inertiaHistory.push(
      points.reduce((sum, p, i) => sum + squaredDistance(p, centroids[assignments[i]]), 0),
    )
    centroids = centroids.map((centroid, ci) => {
      const members = points.filter((_, i) => assignments[i] === ci)
      if (members.length === 0) return centroid
      return centroid.map((_, dim) => members.reduce((s, m) => s + m[dim], 0) / members.length)
    })
  }
  return { assignments, centroids, inertiaHistory }
}

/** Silhouette coefficient per point: (b − a) / max(a, b), with 0 for a point alone in its cluster. */
export function silhouetteSamples(points: number[][], assignments: number[]): number[] {
  const clusters = [...new Set(assignments)]
  return points.map((p, i) => {
    const own = points.filter((_, j) => j !== i && assignments[j] === assignments[i])
    const avgDistanceTo = (members: number[][]) =>
      members.reduce((s, q) => s + Math.sqrt(squaredDistance(p, q)), 0) / members.length

    const a = own.length ? avgDistanceTo(own) : 0
    const b = Math.min(
      ...clusters
        .filter((c) => c !== assignments[i])
        .map((c) => avgDistanceTo(points.filter((_, j) => assignments[j] === c))),
    )
    return own.length ? (b - a) / Math.max(a, b) : 0
  })
}

/** Mean silhouette coefficient (−1..1, higher = better-separated clusters). */
export function silhouetteScore(points: number[][], assignments: number[]): number {
  const scores = silhouetteSamples(points, assignments)
  return scores.reduce((s, v) => s + v, 0) / scores.length
}

/** Davies–Bouldin index (≥ 0, lower = more compact, better-separated clusters). */
export function daviesBouldin(
  points: number[][],
  assignments: number[],
  centroids: number[][],
): number {
  const spread = centroids.map((c, ci) => {
    const members = points.filter((_, i) => assignments[i] === ci)
    return members.length
      ? members.reduce((s, p) => s + Math.sqrt(squaredDistance(p, c)), 0) / members.length
      : 0
  })
  const worst = centroids.map((c, i) =>
    Math.max(
      ...centroids
        .map((d, j) => (i === j ? 0 : (spread[i] + spread[j]) / Math.sqrt(squaredDistance(c, d))))
        .filter(Number.isFinite),
    ),
  )
  return worst.reduce((s, v) => s + v, 0) / centroids.length
}

/** Calinski–Harabasz index: between-cluster over within-cluster dispersion, scaled by degrees of freedom. */
export function calinskiHarabasz(points: number[][], assignments: number[]): number {
  const clusters = [...new Set(assignments)]
  const k = clusters.length
  const n = points.length
  const meanOf = (members: number[][]) =>
    members[0].map((_, d) => members.reduce((s, m) => s + m[d], 0) / members.length)
  const overall = meanOf(points)
  let between = 0
  let within = 0
  for (const c of clusters) {
    const members = points.filter((_, i) => assignments[i] === c)
    const centre = meanOf(members)
    between += members.length * squaredDistance(centre, overall)
    within += members.reduce((s, m) => s + squaredDistance(m, centre), 0)
  }
  return between / (k - 1) / (within / (n - k))
}

/** The pieces of the adjusted Rand index: agreeing pairs, their chance expectation and maximum. */
export function adjustedRandParts(a: (number | string)[], b: (number | string)[]) {
  const pairs = (n: number) => (n * (n - 1)) / 2
  const countBy = (keys: string[]) => {
    const m = new Map<string, number>()
    for (const k of keys) m.set(k, (m.get(k) ?? 0) + 1)
    return [...m.values()]
  }
  const sumPairs = (counts: number[]) => counts.reduce((s, c) => s + pairs(c), 0)
  const index = sumPairs(countBy(a.map((x, i) => `${x}|${b[i]}`)))
  const sumA = sumPairs(countBy(a.map(String)))
  const sumB = sumPairs(countBy(b.map(String)))
  const expected = (sumA * sumB) / pairs(a.length)
  const max = (sumA + sumB) / 2
  return { index, expected, max, ari: max === expected ? 1 : (index - expected) / (max - expected) }
}

/** Agreement between two labelings, corrected for chance: 1 = identical, ~0 = random. */
export function adjustedRandIndex(a: (number | string)[], b: (number | string)[]): number {
  return adjustedRandParts(a, b).ari
}

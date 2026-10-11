import {
  adjustedRandIndex,
  calinskiHarabasz,
  daviesBouldin,
  kMeans,
  silhouetteSamples,
  silhouetteScore,
} from "./kmeans"

const twoBlobs = [
  [0, 0],
  [0.1, 0.1],
  [-0.1, 0],
  [0, -0.1],
  [10, 10],
  [10.1, 10.1],
  [9.9, 10],
  [10, 9.9],
]

test("the same seed reproduces the same assignments", () => {
  const a = kMeans(twoBlobs, 2, 1)
  const b = kMeans(twoBlobs, 2, 1)
  expect(a.assignments).toEqual(b.assignments)
})

test("separates two obvious blobs into two clusters", () => {
  const { assignments } = kMeans(twoBlobs, 2, 1)
  const firstHalf = assignments.slice(0, 4)
  const secondHalf = assignments.slice(4)
  expect(new Set(firstHalf).size).toBe(1)
  expect(new Set(secondHalf).size).toBe(1)
  expect(firstHalf[0]).not.toBe(secondHalf[0])
})

test("inertia never increases from one iteration to the next", () => {
  const { inertiaHistory } = kMeans(twoBlobs, 2, 1, 10)
  for (let i = 1; i < inertiaHistory.length; i++) {
    expect(inertiaHistory[i]).toBeLessThanOrEqual(inertiaHistory[i - 1] + 1e-9)
  }
})

test("silhouette score is high for well-separated clusters", () => {
  const { assignments } = kMeans(twoBlobs, 2, 1)
  expect(silhouetteScore(twoBlobs, assignments)).toBeGreaterThan(0.9)
})

test("Davies–Bouldin is near 0 for tight, far-apart clusters", () => {
  const { assignments, centroids } = kMeans(twoBlobs, 2, 1)
  expect(daviesBouldin(twoBlobs, assignments, centroids)).toBeLessThan(0.05)
})

test("Calinski–Harabasz is large for well-separated clusters", () => {
  const { assignments } = kMeans(twoBlobs, 2, 1)
  expect(calinskiHarabasz(twoBlobs, assignments)).toBeGreaterThan(1000)
})

test("adjusted Rand index is 1 for the same partition under different names", () => {
  expect(adjustedRandIndex([0, 0, 1, 1], ["a", "a", "b", "b"])).toBe(1)
  expect(adjustedRandIndex([0, 0, 1, 1], [0, 1, 0, 1])).toBeLessThan(0)
})

test("silhouette samples average to the silhouette score", () => {
  const { assignments } = kMeans(twoBlobs, 2, 1)
  const samples = silhouetteSamples(twoBlobs, assignments)
  expect(samples).toHaveLength(twoBlobs.length)
  expect(samples.reduce((s, v) => s + v, 0) / samples.length).toBeCloseTo(
    silhouetteScore(twoBlobs, assignments),
  )
})

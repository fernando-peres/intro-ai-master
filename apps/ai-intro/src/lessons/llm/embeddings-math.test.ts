import { expect, test } from "vitest"
import {
  cosine,
  dot,
  euclidean,
  fmt,
  manhattan,
  metrics,
  nearest,
  norm,
  normalize,
  projectIntoBasis,
  similarityMatrix,
} from "./embeddings-math"

test("dot, norm and the distances match hand-computed values", () => {
  expect(dot([1, 2, 3], [4, 5, 6])).toBe(32)
  expect(norm([3, 4])).toBe(5)
  expect(euclidean([0, 0], [3, 4])).toBe(5)
  expect(manhattan([1, 2], [4, 6])).toBe(7)
})

test("cosine of [1,0] and [1,1] is 0.7071; opposite vectors give -1", () => {
  expect(cosine([1, 0], [1, 1])).toBeCloseTo(Math.SQRT1_2, 4)
  expect(cosine([1, 2], [-1, -2])).toBeCloseTo(-1, 10)
  expect(cosine([0, 0], [1, 1])).toBe(0)
})

test("normalize returns a unit vector and leaves the zero vector alone", () => {
  expect(normalize([3, 4])).toEqual([0.6, 0.8])
  expect(normalize([0, 0])).toEqual([0, 0])
})

test("the dot product of normalized vectors equals the cosine", () => {
  const a = [0.3, -1.2, 2.5]
  const b = [1.1, 0.4, -0.7]
  expect(dot(normalize(a), normalize(b))).toBeCloseTo(cosine(a, b), 10)
})

test("metrics returns all five; with normalized the dot product is the cosine", () => {
  const a = [1, 0]
  const b = [1, 1]
  const raw = metrics(a, b, { normalized: false })
  expect(raw.dot).toBe(1)
  expect(raw.cosine).toBeCloseTo(Math.SQRT1_2, 4)
  expect(raw.euclidean).toBe(1)
  expect(raw.manhattan).toBe(1)
  expect(raw.cosine).not.toBe(raw.dot)
  const unit = metrics(a, b, { normalized: true })
  expect(unit.dot).toBeCloseTo(Math.SQRT1_2, 4)
  expect(unit.dot).toBeCloseTo(unit.cosine, 10)
  expect(unit.euclidean).toBeCloseTo(Math.sqrt(2 - 2 * Math.SQRT1_2), 4)
  expect(Object.keys(unit).sort()).toEqual(["cosine", "dot", "euclidean", "manhattan", "norms"])
})

test("similarityMatrix is square and symmetric; distances have a zero diagonal", () => {
  const vectors = [
    [1, 0],
    [0, 1],
    [1, 1],
  ]
  const cos = similarityMatrix(vectors, "cosine")
  expect(cos[0][0]).toBeCloseTo(1, 10)
  expect(cos[0][1]).toBeCloseTo(0, 10)
  expect(cos[0][2]).toBeCloseTo(Math.SQRT1_2, 4)
  expect(cos[2][0]).toBe(cos[0][2])
  expect(similarityMatrix(vectors, "euclidean")[1][1]).toBe(0)
})

test("nearest ranks other items by cosine and skips the query itself", () => {
  const vectors = [
    [1, 0],
    [0.9, 0.1],
    [0, 1],
    [-1, 0],
  ]
  expect(nearest(0, vectors, 2).map((n) => n.index)).toEqual([1, 2])
  expect(nearest(0, vectors, 10)).toHaveLength(3)
})

test("projectIntoBasis centers the vector on the mean before dotting with each component", () => {
  const mean = [1, 1, 1]
  const components = [
    [1, 0, 0],
    [0, 1, 0],
  ]
  expect(projectIntoBasis([3, 4, 9], mean, components)).toEqual([2, 3])
})

test("fmt keeps 2 or 3 decimals and never prints -0", () => {
  expect(fmt(Math.SQRT1_2)).toBe("0.71")
  expect(fmt(Math.SQRT1_2, 3)).toBe("0.707")
  expect(fmt(-0.0001)).toBe("0.00")
  expect(fmt(-0.0001)).not.toContain("-")
  expect(fmt(-1.5)).toBe("-1.50")
})

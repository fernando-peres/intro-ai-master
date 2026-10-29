import { expect, test } from "vitest"
import {
  meanHeads,
  scaledDotProductAttention,
  softmax,
  TOY_DEFAULTS,
  topAttended,
} from "./attention-math"

test("softmax turns scores into a distribution that keeps their order", () => {
  const p = softmax([2, 0, -1])
  expect(p.reduce((a, b) => a + b)).toBeCloseTo(1)
  expect(p[0]).toBeGreaterThan(p[1])
  expect(p[1]).toBeGreaterThan(p[2])
})

test("a two-token example matches the hand computation", () => {
  // Identity projections, d = 2: Q = K = V = X, scores = X·Xᵀ / √2.
  const identity = [
    [1, 0],
    [0, 1],
  ]
  const X = [
    [1, 0],
    [1, 1],
  ]
  const out = scaledDotProductAttention(X, identity, identity, identity, { causal: false })
  expect(out.Q).toEqual(X)
  // Row 0: scores (1, 1) / √2 → equal weights.
  expect(out.scores[0][0]).toBeCloseTo(1 / Math.SQRT2)
  expect(out.scores[0][1]).toBeCloseTo(1 / Math.SQRT2)
  expect(out.weights[0]).toEqual([0.5, 0.5])
  // Row 1: scores (1, 2) / √2 → the second token weighs more.
  const w = softmax([1 / Math.SQRT2, 2 / Math.SQRT2])
  expect(out.weights[1][0]).toBeCloseTo(w[0])
  expect(out.weights[1][1]).toBeCloseTo(w[1])
  // Output of row 0 is the mean of both value vectors.
  expect(out.output[0]).toEqual([1, 0.5])
})

test("the causal mask zeroes future keys and renormalises each row", () => {
  const out = scaledDotProductAttention(
    TOY_DEFAULTS.X,
    TOY_DEFAULTS.Wq,
    TOY_DEFAULTS.Wk,
    TOY_DEFAULTS.Wv,
    { causal: true },
  )
  expect(out.weights[0]).toEqual([1, 0, 0])
  expect(out.weights[1][2]).toBe(0)
  for (const row of out.weights) expect(row.reduce((a, b) => a + b)).toBeCloseTo(1)
})

test("meanHeads averages the same cell across heads", () => {
  const heads = [
    [
      [1, 0],
      [0.2, 0.8],
    ],
    [
      [1, 0],
      [0.6, 0.4],
    ],
  ]
  const mean = meanHeads(heads)
  expect(mean[0]).toEqual([1, 0])
  expect(mean[1][0]).toBeCloseTo(0.4)
  expect(mean[1][1]).toBeCloseTo(0.6)
})

test("topAttended lists the keys of one query row, strongest first", () => {
  const row = [0.1, 0.6, 0.3]
  expect(topAttended(["a", "b", "c"], row, 2)).toEqual([
    { token: "b", weight: 0.6, index: 1 },
    { token: "c", weight: 0.3, index: 2 },
  ])
})

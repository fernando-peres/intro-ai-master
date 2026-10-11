import {
  averagePrecisionAtRanks,
  dcgAtK,
  hitAtK,
  ndcgAtK,
  precisionAtK,
  recallAtK,
  reciprocalRank,
} from "./ranking"

const results = [0, 3, 0, 1, 2]

test("precision, recall and hit rate at k", () => {
  expect(precisionAtK(results, 2)).toBe(0.5)
  expect(recallAtK(results, 2, 4)).toBe(0.25)
  expect(hitAtK(results, 1)).toBe(0)
  expect(hitAtK(results, 2)).toBe(1)
})

test("reciprocal rank and average precision", () => {
  expect(reciprocalRank(results)).toBe(0.5)
  expect(reciprocalRank([0, 0])).toBe(0)
  expect(averagePrecisionAtRanks(results, 3)).toBeCloseTo((1 / 2 + 2 / 4 + 3 / 5) / 3)
})

test("NDCG is 1 for the ideal order and below 1 otherwise", () => {
  expect(dcgAtK([3], 1)).toBe(7)
  expect(ndcgAtK([3, 2, 1, 0, 0], 5, results)).toBeCloseTo(1)
  expect(ndcgAtK(results, 5, results)).toBeLessThan(1)
})

import { randomFolds, stratifiedFolds } from "./splits"

const keys = Array.from({ length: 103 }, (_, i) => (i < 7 ? "rare" : i < 30 ? "mid" : "common"))

test("folds partition every index exactly once", () => {
  for (const folds of [randomFolds(103, 5, 1), stratifiedFolds(keys, 5, 1)]) {
    expect(folds.flat().sort((a, b) => a - b)).toEqual(keys.map((_, i) => i))
  }
})

test("stratified folds keep each key's count within one of its fair share", () => {
  const folds = stratifiedFolds(keys, 5, 3)
  for (const key of ["rare", "mid", "common"]) {
    const total = keys.filter((k) => k === key).length
    for (const fold of folds) {
      const count = fold.filter((i) => keys[i] === key).length
      expect(Math.abs(count - total / 5)).toBeLessThanOrEqual(1)
    }
  }
})

test("the same seed gives the same folds", () => {
  expect(randomFolds(20, 4, 9)).toEqual(randomFolds(20, 4, 9))
})

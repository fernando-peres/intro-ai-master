import {
  accuracyScores,
  makeTrainSet,
  splitTrainSets,
  summarize,
  testSet,
} from "./generalization-data"

test("each split is a different sample with the same settings", () => {
  const splits = splitTrainSets({ size: 50, minorityShare: 0.2, labelNoise: 0 })
  expect(splits).toHaveLength(5)
  expect(splits.every((s) => s.length === 50)).toBe(true)
  expect(splits.every((s) => s.filter((p) => p.group === "B").length === 10)).toBe(true)
  expect(splits[0][0]).not.toEqual(splits[1][0])
})

test("the test set is balanced and clean", () => {
  expect(testSet.filter((p) => p.group === "A")).toHaveLength(200)
  expect(testSet.filter((p) => p.group === "B")).toHaveLength(200)
})

test("a perfect predictor scores 1 everywhere with no gap", () => {
  const train = makeTrainSet({ size: 40, minorityShare: 0.5, labelNoise: 0, seed: 3 })
  const truth = (x: number, y: number) => testSet.find((p) => p.x === x && p.y === y)?.label ?? 0
  const scores = accuracyScores(
    train,
    (x, y) => train.find((p) => p.x === x && p.y === y)?.label ?? truth(x, y),
  )
  expect(scores.train).toBe(1)
  expect(scores.test).toBe(1)
  expect(scores.gap).toBe(0)
})

test("summarize averages runs and measures their spread", () => {
  const run = (test: number) => ({
    train: 1,
    test,
    groupA: test,
    groupB: test - 0.2,
    gap: 1 - test,
    worst: test - 0.2,
  })
  const s = summarize([run(0.8), run(0.6)])
  expect(s.test).toBeCloseTo(0.7)
  expect(s.spread).toBeCloseTo(0.2)
  expect(s.worst).toBeCloseTo(0.5)
})

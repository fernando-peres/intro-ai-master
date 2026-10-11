import {
  boundarySegment,
  evaluate,
  meanBce,
  type Params,
  type PerceptronPoint,
  predictClass,
  score,
  shuffledOrder,
  sigmoid,
  trainEpoch,
  updateSigmoid,
  updateStep,
} from "./perceptron"

const params = (w1: number, w2: number, b: number): Params => ({ w1, w2, b })
const point = (x1: number, x2: number, y: 0 | 1, id = `p-${x1}-${x2}`): PerceptronPoint => ({
  id,
  x1,
  x2,
  y,
})
const expectParams = (actual: Params, expected: Params) => {
  expect(actual.w1).toBeCloseTo(expected.w1, 12)
  expect(actual.w2).toBeCloseTo(expected.w2, 12)
  expect(actual.b).toBeCloseTo(expected.b, 12)
}

test("a score of exactly zero predicts class 1", () => {
  expect(score(params(0, 0, 0), point(1, 1, 0))).toBe(0)
  expect(predictClass(params(0, 0, 0), point(1, 1, 0))).toBe(1)
})

test("a step mistake moves both weights and the bias by η × error × input", () => {
  const { params: next, trace } = updateStep(params(-0.3, 0.2, 0.1), point(1, 1, 0))
  // z = −0.3 + 0.2 + 0.1 = 0 → ŷ = 1, error = −1, η = 0.1.
  expectParams(next, params(-0.4, 0.1, 0))
  expect(trace.prediction).toBe(1)
  expect(trace.error).toBe(-1)
  expect(trace.z).toBeCloseTo(0, 12)
  expectParams(trace.before, params(-0.3, 0.2, 0.1))
  expectParams(trace.after, next)
})

test("a misclassified (0,0) point still updates the bias", () => {
  const { params: next, trace } = updateStep(params(-0.3, 0.2, 0.1), point(0, 0, 0))
  expectParams(next, params(-0.3, 0.2, 0))
  expectParams(trace.delta, params(0, 0, -0.1))
})

test("a correctly classified step point leaves all three parameters unchanged", () => {
  const before = params(-0.3, 0.2, 0.1)
  const { params: next, trace } = updateStep(before, point(0, 1, 1))
  expect(next).toEqual(before)
  expect(trace.error).toBe(0)
})

test("the sigmoid rule follows the BCE gradient even on a correctly classified point", () => {
  const { params: next, trace } = updateSigmoid(params(0, 0, 0), point(1, 1, 1))
  // p = σ(0) = 0.5 → predicted class 1 (correct); error = 1 − 0.5; η = 0.5.
  expect(trace.prediction).toBe(1)
  expect(trace.probability).toBe(0.5)
  expectParams(next, params(0.25, 0.25, 0.25))
})

test("the sigmoid update uses y − p without a p(1−p) factor", () => {
  const before = params(0.4, -0.2, 0.3)
  const p = point(0.5, 1, 0)
  const z = 0.4 * 0.5 - 0.2 + 0.3
  const error = 0 - 1 / (1 + Math.exp(-z))
  const { params: next } = updateSigmoid(before, p)
  expectParams(next, params(0.4 + 0.5 * error * 0.5, -0.2 + 0.5 * error, 0.3 + 0.5 * error))
})

test("extreme logits give valid probabilities and finite loss", () => {
  for (const z of [-1000, -40, 0, 40, 1000]) {
    const probability = sigmoid(z)
    expect(probability).toBeGreaterThanOrEqual(0)
    expect(probability).toBeLessThanOrEqual(1)
  }
  const points = [point(1, 0, 0), point(0, 1, 1)]
  const loss = meanBce(params(1000, -1000, 0), points)
  expect(Number.isFinite(loss)).toBe(true)
  expect(loss).toBeCloseTo(1000, 6)
})

test("BCE matches the textbook formula for moderate logits", () => {
  const points = [point(1, 0, 1), point(0, 1, 0)]
  const model = params(0.7, -0.4, 0.1)
  const naive =
    points
      .map((p) => {
        const prob = 1 / (1 + Math.exp(-(model.w1 * p.x1 + model.w2 * p.x2 + model.b)))
        return -(p.y * Math.log(prob) + (1 - p.y) * Math.log(1 - prob))
      })
      .reduce((a, b) => a + b, 0) / points.length
  expect(meanBce(model, points)).toBeCloseTo(naive, 12)
})

test("the epoch order is a seeded, reproducible permutation", () => {
  const order = shuffledOrder(10, 4)
  expect(order).toEqual(shuffledOrder(10, 4))
  expect([...order].sort((a, b) => a - b)).toEqual([...Array(10).keys()])
  expect(shuffledOrder(10, 5)).not.toEqual(order)
})

test("an epoch visits every point once in the seeded order, updating immediately", () => {
  const points = [point(0, 0, 0), point(0, 1, 1), point(1, 0, 1), point(1, 1, 1)]
  const start = params(-0.3, 0.2, 0.1)
  let expected = start
  let last = null
  for (const index of shuffledOrder(points.length, 2)) {
    const result = updateStep(expected, points[index])
    expected = result.params
    last = result.trace
  }
  const epoch = trainEpoch(start, points, "step", 2)
  expect(epoch.params).toEqual(expected)
  expect(epoch.lastTrace).toEqual(last)
})

test("evaluation recomputes every prediction from one parameter snapshot", () => {
  const points = [
    point(0, 0, 0, "a"),
    point(0, 1, 1, "b"),
    point(1, 0, 1, "c"),
    point(1, 1, 0, "d"),
  ]
  const result = evaluate(params(1, 1, -0.5), points)
  expect(result.misclassifiedIds).toEqual(["d"])
  expect(result.errors).toBe(1)
  expect(result.accuracy).toBe(0.75)
  expect(result.bce).toBeCloseTo(meanBce(params(1, 1, -0.5), points), 12)
})

const unitDomain = { x: [0, 1], y: [0, 1] } as const

test("a vertical boundary is clipped without dividing by zero", () => {
  const segment = boundarySegment(params(1, 0, -0.5), unitDomain)
  expect(segment).not.toBeNull()
  const xs = segment?.map((p) => p.x) ?? []
  const ys = (segment?.map((p) => p.y) ?? []).sort()
  expect(xs).toEqual([0.5, 0.5])
  expect(ys).toEqual([0, 1])
})

test("a diagonal boundary is clipped to the viewport", () => {
  const segment = boundarySegment(params(1, 1, -1), unitDomain)
  const ends = (segment ?? []).map((p) => [p.x, p.y]).sort()
  expect(ends).toEqual([
    [0, 1],
    [1, 0],
  ])
})

test("no line is drawn for a zero weight vector or a boundary outside the viewport", () => {
  expect(boundarySegment(params(0, 0, 0), unitDomain)).toBeNull()
  expect(boundarySegment(params(0, 0, 1), unitDomain)).toBeNull()
  expect(boundarySegment(params(1, 0, -5), unitDomain)).toBeNull()
})

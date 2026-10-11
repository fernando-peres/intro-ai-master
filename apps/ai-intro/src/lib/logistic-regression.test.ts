import { fitLogisticRegression, sigmoid } from "./logistic-regression"

test("learns a rising probability across a noisy threshold", () => {
  const xs = [1, 2, 3, 4, 5, 6, 7, 8]
  const ys = [0, 0, 0, 1, 0, 1, 1, 1]
  const fit = fitLogisticRegression(xs, ys)
  expect(fit.weight).toBeGreaterThan(0)
  expect(sigmoid(fit.weight * 1 + fit.bias)).toBeLessThan(0.2)
  expect(sigmoid(fit.weight * 8 + fit.bias)).toBeGreaterThan(0.8)
})

test("log loss never goes up from one epoch to the next", () => {
  const { lossHistory } = fitLogisticRegression([1, 2, 3, 4], [0, 1, 0, 1], { epochs: 50 })
  for (let i = 1; i < lossHistory.length; i++) {
    expect(lossHistory[i].y).toBeLessThanOrEqual(lossHistory[i - 1].y + 1e-9)
  }
})

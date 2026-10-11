import { fitLinearRegression } from "./linear-regression"

const xs = [1, 2, 3, 4, 5]
const ys = xs.map((x) => 3 * x + 10)

test("gradient descent recovers an exact line", () => {
  const fit = fitLinearRegression(xs, ys, { epochs: 300 })
  expect(fit.slope).toBeCloseTo(3, 3)
  expect(fit.intercept).toBeCloseTo(10, 3)
})

test("the error never goes up from one epoch to the next", () => {
  const { rmseHistory } = fitLinearRegression(xs, [12, 17, 18, 23, 24])
  for (let i = 1; i < rmseHistory.length; i++) {
    expect(rmseHistory[i].y).toBeLessThanOrEqual(rmseHistory[i - 1].y + 1e-9)
  }
})

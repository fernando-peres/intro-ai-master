import { fitPolynomial, meanSquaredError } from "./polynomial"

test("recovers an exact quadratic", () => {
  const xs = [0, 1, 2, 3, 4, 5]
  const ys = xs.map((x) => 2 * x * x - 3 * x + 1)
  const f = fitPolynomial(xs, ys, 2, 0)
  expect(f(10)).toBeCloseTo(171, 6)
  expect(meanSquaredError(f, xs, ys)).toBeCloseTo(0, 10)
})

test("a higher degree never fits its own training points worse", () => {
  const xs = [0, 0.2, 0.4, 0.6, 0.8, 1]
  const ys = [0.1, 0.9, 0.7, -0.4, -0.8, 0.2]
  const errors = [0, 1, 2, 3, 4].map((d) => meanSquaredError(fitPolynomial(xs, ys, d, 0), xs, ys))
  for (let i = 1; i < errors.length; i++)
    expect(errors[i]).toBeLessThanOrEqual(errors[i - 1] + 1e-9)
})

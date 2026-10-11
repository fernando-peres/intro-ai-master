import {
  adjustedR2,
  averagePrecision,
  brierScore,
  calibrationCurve,
  classificationMetrics,
  expectedCalibrationError,
  logLoss,
  precisionRecallCurve,
  regressionMetrics,
  rocAuc,
  rocCurve,
} from "./metrics"

test("classification metrics follow from the confusion matrix", () => {
  const actual = [true, true, true, false, false]
  const scores = [0.9, 0.8, 0.2, 0.7, 0.1]
  const m = classificationMetrics(actual, scores)
  expect([m.tp, m.fn, m.fp, m.tn]).toEqual([2, 1, 1, 1])
  expect(m.accuracy).toBeCloseTo(3 / 5)
  expect(m.precision).toBeCloseTo(2 / 3)
  expect(m.recall).toBeCloseTo(2 / 3)
  expect(m.f1).toBeCloseTo(2 / 3)
})

test("AUC is 1 for a perfect ranking, 0.5 for a constant score", () => {
  expect(rocAuc([true, false, true, false], [0.9, 0.1, 0.8, 0.3])).toBe(1)
  expect(rocAuc([true, false], [0.5, 0.5])).toBe(0.5)
})

test("regression metrics on a known set of errors", () => {
  const m = regressionMetrics([10, 20, 30], [12, 18, 30])
  expect(m.mae).toBeCloseTo(4 / 3)
  expect(m.mse).toBeCloseTo(8 / 3)
  expect(m.rmse).toBeCloseTo(Math.sqrt(8 / 3))
  expect(m.r2).toBeCloseTo(1 - 8 / 200)
  expect(m.mape).toBeCloseTo((0.2 + 0.1 + 0) / 3)
})

test("ROC and precision–recall curves, average precision and log loss", () => {
  const actual = [true, false, true, false]
  const scores = [0.9, 0.8, 0.6, 0.2]
  expect(rocCurve(actual, scores)).toEqual([
    { x: 0, y: 0 },
    { x: 0, y: 0.5 },
    { x: 0.5, y: 0.5 },
    { x: 0.5, y: 1 },
    { x: 1, y: 1 },
  ])
  expect(precisionRecallCurve(actual, scores)[0]).toEqual({ x: 0.5, y: 1 })
  expect(averagePrecision(actual, scores)).toBeCloseTo(0.5 * 1 + 0.5 * (2 / 3))
  expect(logLoss([true], [1])).toBeCloseTo(0)
  expect(logLoss([true], [0.5])).toBeCloseTo(Math.log(2))
})

test("adjusted R² is lower than R² once predictors are counted", () => {
  expect(adjustedR2(0.9, 20, 1)).toBeCloseTo(1 - (0.1 * 19) / 18)
})

test("specificity, balanced accuracy and MCC from the confusion matrix", () => {
  const m = classificationMetrics([true, true, true, false, false], [0.9, 0.8, 0.2, 0.7, 0.1])
  expect(m.specificity).toBeCloseTo(1 / 2)
  expect(m.balancedAccuracy).toBeCloseTo((2 / 3 + 1 / 2) / 2)
  expect(m.mcc).toBeCloseTo((2 * 1 - 1 * 1) / Math.sqrt(3 * 3 * 2 * 2))
})

test("a constant prediction has MCC 0 and balanced accuracy 0.5, whatever its accuracy", () => {
  const actual = Array.from({ length: 100 }, (_, i) => i < 5)
  const m = classificationMetrics(
    actual,
    actual.map(() => 0),
  )
  expect(m.accuracy).toBeCloseTo(0.95)
  expect(m.mcc).toBe(0)
  expect(m.balancedAccuracy).toBeCloseTo(0.5)
})

test("Brier score, calibration curve and ECE", () => {
  expect(brierScore([true, false], [1, 0])).toBe(0)
  expect(brierScore([true], [0.5])).toBeCloseTo(0.25)
  const actual = [true, false, true, false]
  const probs = [0.25, 0.25, 0.75, 0.75]
  expect(calibrationCurve(actual, probs, 2)).toEqual([
    { x: 0.25, y: 0.5, count: 2 },
    { x: 0.75, y: 0.5, count: 2 },
  ])
  expect(expectedCalibrationError(actual, probs, 2)).toBeCloseTo(0.25)
})

import { fitLinearRegression } from "@/lib/linear-regression"
import { fitLogisticRegression, sigmoid } from "@/lib/logistic-regression"
import { examResults, housePrices, irisSample } from "./classic-datasets"

/** Models fitted once on the classic datasets, shared by the gallery and the metric lessons. */
export const areas = housePrices.map((h) => h.area)
export const prices = housePrices.map((h) => h.price)
export const houseFit = fitLinearRegression(areas, prices)
export const priceAt = (area: number) => houseFit.slope * area + houseFit.intercept

export const hours = examResults.map((r) => r.hours)
export const passed = examResults.map((r) => r.passed === 1)
export const examFit = fitLogisticRegression(
  hours,
  examResults.map((r) => r.passed),
  { learningRate: 0.3, epochs: 300 },
)
export const passProbability = (h: number) => sigmoid(examFit.weight * h + examFit.bias)
export const examScores = hours.map(passProbability)

export const irisPoints = irisSample.map((f) => [f.petalLength, f.petalWidth])

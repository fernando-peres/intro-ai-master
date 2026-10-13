import {
  averagePrecision,
  brierScore,
  calibrationCurve,
  classificationMetrics,
  expectedCalibrationError,
  logLoss,
  precisionRecallCurve,
  rocCurve,
} from "@/lib/metrics"

/** Four illustrative score bands; fraud is positive and the decision threshold is 0.5. */
export const scoreBands = [
  { count: 14, fraud: true, score: 0.8 },
  { count: 6, fraud: true, score: 0.2 },
  { count: 940, fraud: false, score: 0.1 },
  { count: 40, fraud: false, score: 0.6 },
]
export const observations = scoreBands.flatMap(({ count, fraud, score }) =>
  Array.from({ length: count }, () => ({ fraud, score })),
)
const actual = observations.map((p) => p.fraud)

function evaluate(scores: number[]) {
  const m = classificationMetrics(actual, scores)
  return {
    ...m,
    precision: m.tp + m.fp ? m.precision : null,
    fpr: m.fp / (m.fp + m.tn),
    f2: (5 * m.tp) / (5 * m.tp + 4 * m.fn + m.fp),
    ap: averagePrecision(actual, scores),
    logLoss: logLoss(actual, scores),
    brier: brierScore(actual, scores),
    ece: expectedCalibrationError(actual, scores),
    roc: rocCurve(actual, scores),
    pr: precisionRecallCurve(actual, scores),
    calibration: calibrationCurve(actual, scores),
  }
}

export const candidate = evaluate(observations.map((p) => p.score))
export const lazy = evaluate(observations.map(() => 0.02))
export type MetricKey =
  | "recall"
  | "specificity"
  | "fpr"
  | "precision"
  | "accuracy"
  | "balancedAccuracy"
  | "f1"
  | "f2"
  | "mcc"
  | "auc"
  | "ap"
  | "logLoss"
  | "brier"
  | "ece"
export const metricRows = (
  [
    "recall",
    "specificity",
    "fpr",
    "precision",
    "accuracy",
    "balancedAccuracy",
    "f1",
    "f2",
    "mcc",
    "auc",
    "ap",
    "logLoss",
    "brier",
    "ece",
  ] as const
).map((key) => ({ key, lazy: lazy[key], candidate: candidate[key] }))

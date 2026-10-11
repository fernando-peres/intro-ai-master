const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length

export type ClassificationMetrics = {
  tp: number
  fp: number
  tn: number
  fn: number
  accuracy: number
  precision: number
  recall: number
  f1: number
  /** True-negative rate: TN / (TN + FP). */
  specificity: number
  /** Mean of recall and specificity, so each class counts equally however rare it is. */
  balancedAccuracy: number
  /** Matthews correlation coefficient, −1..1, using all four confusion-matrix cells. */
  mcc: number
  /** Area under the ROC curve, from `scores`; 0.5 = random ranking, 1 = perfect. */
  auc: number
}

/** Probability that a random positive outscores a random negative (ties count half). */
export function rocAuc(actual: boolean[], scores: number[]): number {
  const pos = scores.filter((_, i) => actual[i])
  const neg = scores.filter((_, i) => !actual[i])
  if (!pos.length || !neg.length) return Number.NaN
  let wins = 0
  for (const p of pos) for (const n of neg) wins += p > n ? 1 : p === n ? 0.5 : 0
  return wins / (pos.length * neg.length)
}

/** Binary metrics for the positive class; a prediction is positive when its score is ≥ `threshold`. */
export function classificationMetrics(
  actual: boolean[],
  scores: number[],
  threshold = 0.5,
): ClassificationMetrics {
  const predicted = scores.map((s) => s >= threshold)
  const count = (a: boolean, p: boolean) =>
    actual.filter((v, i) => v === a && predicted[i] === p).length
  const [tp, fp, tn, fn] = [
    count(true, true),
    count(false, true),
    count(false, false),
    count(true, false),
  ]
  const precision = tp + fp ? tp / (tp + fp) : 0
  const recall = tp + fn ? tp / (tp + fn) : 0
  const specificity = tn + fp ? tn / (tn + fp) : 0
  const mccDenominator = Math.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn))
  return {
    tp,
    fp,
    tn,
    fn,
    accuracy: (tp + tn) / actual.length,
    precision,
    recall,
    f1: precision + recall ? (2 * precision * recall) / (precision + recall) : 0,
    specificity,
    balancedAccuracy: (recall + specificity) / 2,
    mcc: mccDenominator ? (tp * tn - fp * fn) / mccDenominator : 0,
    auc: rocAuc(actual, scores),
  }
}

export type RegressionMetrics = { mae: number; mse: number; rmse: number; r2: number; mape: number }

export function regressionMetrics(actual: number[], predicted: number[]): RegressionMetrics {
  const errors = actual.map((y, i) => predicted[i] - y)
  const mse = mean(errors.map((e) => e * e))
  const ym = mean(actual)
  const total = actual.reduce((s, y) => s + (y - ym) ** 2, 0)
  return {
    mae: mean(errors.map(Math.abs)),
    mse,
    rmse: Math.sqrt(mse),
    r2: 1 - (mse * actual.length) / total,
    mape: mean(errors.map((e, i) => Math.abs(e / actual[i]))),
  }
}

/** Confusion counts at every distinct score cut-off, highest first, from one sort and one sweep. */
function sweep(actual: boolean[], scores: number[]) {
  const order = scores.map((score, i) => ({ score, positive: actual[i] }))
  order.sort((a, b) => b.score - a.score)
  const pos = actual.filter(Boolean).length
  const neg = actual.length - pos
  const points: { tp: number; fp: number; pos: number; neg: number }[] = []
  let tp = 0
  let fp = 0
  order.forEach((item, i) => {
    if (item.positive) tp++
    else fp++
    if (i === order.length - 1 || order[i + 1].score !== item.score)
      points.push({ tp, fp, pos, neg })
  })
  return points
}

/** Every distinct score as a cut-off, highest first: one (FPR, TPR) point each, from (0,0) to (1,1). */
export function rocCurve(actual: boolean[], scores: number[]): { x: number; y: number }[] {
  return [
    { x: 0, y: 0 },
    ...sweep(actual, scores).map((p) => ({ x: p.fp / p.neg, y: p.tp / p.pos })),
  ]
}

/** One (recall, precision) point per distinct score cut-off, highest first. */
export function precisionRecallCurve(
  actual: boolean[],
  scores: number[],
): { x: number; y: number }[] {
  return sweep(actual, scores).map((p) => ({ x: p.tp / p.pos, y: p.tp / (p.tp + p.fp) }))
}

/** Area under the step-wise precision–recall curve: Σ (Rₙ − Rₙ₋₁)·Pₙ. */
export function averagePrecision(actual: boolean[], scores: number[]): number {
  let previousRecall = 0
  return precisionRecallCurve(actual, scores).reduce((sum, p) => {
    const area = (p.x - previousRecall) * p.y
    previousRecall = p.x
    return sum + area
  }, 0)
}

/** Mean binary cross-entropy of probabilities against 0/1 truth, clipped away from log(0). */
export function logLoss(actual: boolean[], probabilities: number[]): number {
  const eps = 1e-12
  return -mean(
    actual.map((y, i) => {
      const p = Math.min(1 - eps, Math.max(eps, probabilities[i]))
      return y ? Math.log(p) : Math.log(1 - p)
    }),
  )
}

/** R² penalized for the number of predictors `p`, so extra features must earn their keep. */
export function adjustedR2(r2: number, n: number, p: number): number {
  return 1 - ((1 - r2) * (n - 1)) / (n - p - 1)
}

/** Mean squared difference between predicted probability and the 0/1 outcome (0 = perfect). */
export function brierScore(actual: boolean[], probabilities: number[]): number {
  return mean(probabilities.map((p, i) => (p - (actual[i] ? 1 : 0)) ** 2))
}

/**
 * Groups predictions into `bins` equal-width probability bins; each non-empty bin reports its mean
 * predicted probability (x), observed positive rate (y) and size.
 */
export function calibrationCurve(
  actual: boolean[],
  probabilities: number[],
  bins = 10,
): { x: number; y: number; count: number }[] {
  return Array.from({ length: bins }, (_, b) => {
    const members = probabilities
      .map((p, i) => ({ p, y: actual[i] }))
      .filter(({ p }) => Math.min(bins - 1, Math.floor(p * bins)) === b)
    return members.length
      ? {
          x: mean(members.map((m) => m.p)),
          y: members.filter((m) => m.y).length / members.length,
          count: members.length,
        }
      : undefined
  }).filter((point): point is { x: number; y: number; count: number } => point !== undefined)
}

/** Expected calibration error: the size-weighted mean gap between confidence and outcome rate. */
export function expectedCalibrationError(
  actual: boolean[],
  probabilities: number[],
  bins = 10,
): number {
  return calibrationCurve(actual, probabilities, bins).reduce(
    (sum, b) => sum + (b.count / actual.length) * Math.abs(b.x - b.y),
    0,
  )
}

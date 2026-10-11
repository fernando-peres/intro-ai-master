export type LogisticFit = {
  weight: number
  bias: number
  /** Mean log loss (binary cross-entropy) after each epoch. */
  lossHistory: { x: number; y: number }[]
}

const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length

export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z))

export function logLoss(actual: number[], probabilities: number[]): number {
  const eps = 1e-12
  return -mean(
    actual.map((y, i) => {
      const p = Math.min(1 - eps, Math.max(eps, probabilities[i]))
      return y * Math.log(p) + (1 - y) * Math.log(1 - p)
    }),
  )
}

/**
 * Fits p = σ(weight·x + bias) to 0/1 labels by full-batch gradient descent on log loss. Runs on
 * standardized x so one learning rate works for any units; results are in the original units.
 */
export function fitLogisticRegression(
  xs: number[],
  ys: number[],
  { learningRate = 1, epochs = 400 } = {},
): LogisticFit {
  const xm = mean(xs)
  const xsd = Math.sqrt(mean(xs.map((x) => (x - xm) ** 2))) || 1
  const zx = xs.map((x) => (x - xm) / xsd)
  let a = 0
  let c = 0
  const lossHistory: LogisticFit["lossHistory"] = []
  for (let epoch = 1; epoch <= epochs; epoch++) {
    const errors = zx.map((x, i) => sigmoid(a * x + c) - ys[i])
    a -= learningRate * mean(errors.map((e, i) => e * zx[i]))
    c -= learningRate * mean(errors)
    lossHistory.push({
      x: epoch,
      y: logLoss(
        ys,
        zx.map((x) => sigmoid(a * x + c)),
      ),
    })
  }
  return { weight: a / xsd, bias: c - (a * xm) / xsd, lossHistory }
}

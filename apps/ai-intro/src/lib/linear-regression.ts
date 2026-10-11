export type LinearFit = {
  slope: number
  intercept: number
  /** Root-mean-squared error, in the original y units, after each epoch. */
  rmseHistory: { x: number; y: number }[]
}

const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length
const std = (v: number[]) => Math.sqrt(mean(v.map((x) => (x - mean(v)) ** 2))) || 1

function rmse(xs: number[], ys: number[], slope: number, intercept: number): number {
  return Math.sqrt(mean(xs.map((x, i) => (slope * x + intercept - ys[i]) ** 2)))
}

/**
 * Fits ŷ = slope·x + intercept by full-batch gradient descent on mean squared error. Runs on
 * standardized x and y so one learning rate works for any units; results are in the original units.
 */
export function fitLinearRegression(
  xs: number[],
  ys: number[],
  { learningRate = 0.1, epochs = 60 } = {},
): LinearFit {
  const [xm, xsd, ym, ysd] = [mean(xs), std(xs), mean(ys), std(ys)]
  const zx = xs.map((x) => (x - xm) / xsd)
  const zy = ys.map((y) => (y - ym) / ysd)
  let a = 0
  let c = 0
  const toOriginal = () => {
    const slope = (a * ysd) / xsd
    return { slope, intercept: ym + c * ysd - slope * xm }
  }
  const rmseHistory: LinearFit["rmseHistory"] = []
  for (let epoch = 1; epoch <= epochs; epoch++) {
    const errors = zx.map((x, i) => a * x + c - zy[i])
    a -= learningRate * 2 * mean(errors.map((e, i) => e * zx[i]))
    c -= learningRate * 2 * mean(errors)
    const { slope, intercept } = toOriginal()
    rmseHistory.push({ x: epoch, y: rmse(xs, ys, slope, intercept) })
  }
  return { ...toOriginal(), rmseHistory }
}

import { gaussian, mulberry32 } from "@/lib/neural-net"
import { fitPolynomial, meanSquaredError } from "@/lib/polynomial"

/** The hidden truth every sample is drawn from, plus Gaussian noise of this standard deviation. */
export const truth = (x: number) => Math.sin(2 * Math.PI * x)
export const NOISE = 0.25
export const TRAIN_SIZE = 10
export const DEGREES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
const LAMBDA = 1e-9

/** `n` points: evenly spaced over [0, 1] for training sets, uniformly random when `random`. */
export function sample(n: number, seed: number, random = false) {
  const rand = mulberry32(seed)
  const xs = random
    ? Array.from({ length: n }, () => rand()).sort((a, b) => a - b)
    : Array.from({ length: n }, (_, i) => i / (n - 1))
  return { xs, ys: xs.map((x) => truth(x) + NOISE * gaussian(rand)) }
}

export const train = sample(TRAIN_SIZE, 11)
export const test = sample(200, 99, true)
export const fitDegree = (degree: number, data = train) =>
  fitPolynomial(data.xs, data.ys, degree, LAMBDA)
export const grid = Array.from({ length: 101 }, (_, i) => i / 100)

/** Training and test error for every degree, all fitted on the same 15 points. */
export const errorByDegree = DEGREES.map((d) => {
  const f = fitDegree(d)
  return {
    degree: d,
    train: meanSquaredError(f, train.xs, train.ys),
    test: meanSquaredError(f, test.xs, test.ys),
  }
})

/** Bias² and variance per degree, estimated by refitting on many fresh training sets. */
export const decomposition = DEGREES.map((d) => {
  const fits = Array.from({ length: 200 }, (_, s) => fitDegree(d, sample(TRAIN_SIZE, 1000 + s)))
  let bias2 = 0
  let variance = 0
  for (const x of grid) {
    const preds = fits.map((f) => f(x))
    const avg = preds.reduce((s, p) => s + p, 0) / preds.length
    bias2 += (avg - truth(x)) ** 2
    variance += preds.reduce((s, p) => s + (p - avg) ** 2, 0) / preds.length
  }
  return { degree: d, bias2: bias2 / grid.length, variance: variance / grid.length }
})

/** k-fold cross-validation error per degree, using only the 15 training points. */
export function crossValidation(folds: number) {
  return DEGREES.map((d) => {
    let total = 0
    for (let k = 0; k < folds; k++) {
      const held = (_: number, i: number) => i % folds === k
      const kept = (_: number, i: number) => i % folds !== k
      const f = fitPolynomial(train.xs.filter(kept), train.ys.filter(kept), d, LAMBDA)
      total += meanSquaredError(f, train.xs.filter(held), train.ys.filter(held))
    }
    return { degree: d, cv: total / folds }
  })
}

/** Training and test error as the training set grows, for one fixed degree. */
export function learningCurve(degree: number, sizes: number[]) {
  return sizes.map((n) => {
    const data = sample(n, 500 + n)
    const f = fitDegree(degree, data)
    return {
      n,
      train: meanSquaredError(f, data.xs, data.ys),
      test: meanSquaredError(f, test.xs, test.ys),
    }
  })
}

/** Display range for fitted curves; wild high-degree fits are clipped so the panels stay readable. */
const CLIP = 2

/**
 * The same model fitted on `splits` independent training samples of `n` points each (evenly
 * spaced x unless `randomX`), plus the bias² and variance measured across those fits.
 */
export function splitFits(degree: number, n: number, seed: number, randomX: boolean, splits = 5) {
  const samples = Array.from({ length: splits }, (_, s) => sample(n, seed + s, randomX))
  const fits = samples.map((data) => fitDegree(degree, data))
  let bias2 = 0
  let variance = 0
  for (const x of grid) {
    const preds = fits.map((f) => f(x))
    const avg = preds.reduce((s, p) => s + p, 0) / preds.length
    bias2 += (avg - truth(x)) ** 2
    variance += preds.reduce((s, p) => s + (p - avg) ** 2, 0) / preds.length
  }
  return {
    /** One per split: its clipped curve, and its error on its own training points vs. the test set. */
    runs: fits.map((f, i) => ({
      curve: grid.map((x) => ({ x, y: Math.max(-CLIP, Math.min(CLIP, f(x))) })),
      train: meanSquaredError(f, samples[i].xs, samples[i].ys),
      test: meanSquaredError(f, test.xs, test.ys),
    })),
    bias2: bias2 / grid.length,
    variance: variance / grid.length,
  }
}

/**
 * One neuron with two inputs and a bias, trained point by point with 0/1 labels. Step mode uses
 * the mistake-driven perceptron rule; sigmoid mode uses SGD on binary cross-entropy. Both predict
 * class 1 when z ≥ 0, so both have the same straight boundary w₁x₁ + w₂x₂ + b = 0.
 */
import { mulberry32 } from "./neural-net"

export type Params = { w1: number; w2: number; b: number }
export type PerceptronPoint = { id: string; x1: number; x2: number; y: 0 | 1 }
export type PerceptronActivation = "step" | "sigmoid"
export type Domain = {
  readonly x: readonly [number, number]
  readonly y: readonly [number, number]
}

/** One processed point: everything is computed from `before`, then applied to give `after`. */
export type UpdateTrace = {
  pointId: string
  target: 0 | 1
  before: Params
  z: number
  prediction: 0 | 1
  /** Sigmoid mode only. */
  probability?: number
  error: number
  delta: Params
  after: Params
}

export const LEARNING_RATE: Record<PerceptronActivation, number> = { step: 0.1, sigmoid: 0.5 }
export const MAX_EPOCHS = 60
export const INITIAL_PARAMS: Params = { w1: -0.3, w2: 0.2, b: 0.1 }

export const score = ({ w1, w2, b }: Params, p: Pick<PerceptronPoint, "x1" | "x2">) =>
  w1 * p.x1 + w2 * p.x2 + b

export const classOf = (z: number): 0 | 1 => (z >= 0 ? 1 : 0)

export const predictClass = (params: Params, p: Pick<PerceptronPoint, "x1" | "x2">) =>
  classOf(score(params, p))

/** Never evaluates exp of a large positive number. */
export function sigmoid(z: number): number {
  if (z >= 0) return 1 / (1 + Math.exp(-z))
  const e = Math.exp(z)
  return e / (1 + e)
}

/** −y·log σ(z) − (1−y)·log(1−σ(z)), computed from the logit so it stays finite. */
export const bceFromLogit = (z: number, y: 0 | 1) =>
  Math.max(z, 0) - y * z + Math.log1p(Math.exp(-Math.abs(z)))

export function meanBce(params: Params, points: PerceptronPoint[]): number {
  return points.reduce((sum, p) => sum + bceFromLogit(score(params, p), p.y), 0) / points.length
}

function applyUpdate(
  before: Params,
  point: PerceptronPoint,
  error: number,
  rate: number,
  extra: Pick<UpdateTrace, "z" | "prediction" | "probability">,
): { params: Params; trace: UpdateTrace } {
  const delta = { w1: rate * error * point.x1, w2: rate * error * point.x2, b: rate * error }
  const after =
    error === 0
      ? before
      : { w1: before.w1 + delta.w1, w2: before.w2 + delta.w2, b: before.b + delta.b }
  return {
    params: after,
    trace: { pointId: point.id, target: point.y, before, error, delta, after, ...extra },
  }
}

export function updateStep(before: Params, point: PerceptronPoint) {
  const z = score(before, point)
  const prediction = classOf(z)
  return applyUpdate(before, point, point.y - prediction, LEARNING_RATE.step, { z, prediction })
}

export function updateSigmoid(before: Params, point: PerceptronPoint) {
  const z = score(before, point)
  const probability = sigmoid(z)
  return applyUpdate(before, point, point.y - probability, LEARNING_RATE.sigmoid, {
    z,
    prediction: classOf(z),
    probability,
  })
}

/** Fisher–Yates order of `0…count−1`, seeded by the number of completed epochs. */
export function shuffledOrder(count: number, completedEpochs: number): number[] {
  const rand = mulberry32(completedEpochs + 3)
  const order = [...Array(count).keys()]
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

export function trainEpoch(
  start: Params,
  points: PerceptronPoint[],
  activation: PerceptronActivation,
  completedEpochs: number,
): { params: Params; lastTrace: UpdateTrace | null } {
  const update = activation === "step" ? updateStep : updateSigmoid
  let params = start
  let lastTrace: UpdateTrace | null = null
  for (const index of shuffledOrder(points.length, completedEpochs)) {
    const result = update(params, points[index])
    params = result.params
    lastTrace = result.trace
  }
  return { params, lastTrace }
}

export type Evaluation = {
  misclassifiedIds: string[]
  errors: number
  /** Fraction correct, 0..1. */
  accuracy: number
  bce: number
}

export function evaluate(params: Params, points: PerceptronPoint[]): Evaluation {
  const misclassifiedIds = points.filter((p) => predictClass(params, p) !== p.y).map((p) => p.id)
  return {
    misclassifiedIds,
    errors: misclassifiedIds.length,
    accuracy: (points.length - misclassifiedIds.length) / points.length,
    bce: meanBce(params, points),
  }
}

type XY = { x: number; y: number }

/** The boundary clipped to `domain`, or null for a zero weight vector or a line outside it. */
export function boundarySegment({ w1, w2, b }: Params, domain: Domain): [XY, XY] | null {
  if (w1 === 0 && w2 === 0) return null
  const [x0, x1] = domain.x
  const [y0, y1] = domain.y
  const hits: XY[] = []
  const add = (raw: XY) => {
    const p = { x: raw.x + 0, y: raw.y + 0 } // drop −0 so endpoints compare cleanly
    const inside = p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1
    if (inside && !hits.some((h) => Math.abs(h.x - p.x) < 1e-12 && Math.abs(h.y - p.y) < 1e-12)) {
      hits.push(p)
    }
  }
  if (w2 !== 0) for (const x of [x0, x1]) add({ x, y: -(w1 * x + b) / w2 })
  if (w1 !== 0) for (const y of [y0, y1]) add({ x: -(w2 * y + b) / w1, y })
  return hits.length >= 2 ? [hits[0], hits[1]] : null
}

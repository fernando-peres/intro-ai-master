import { sigmoid } from "./back-propagation-theory-math"

type Params = {
  x?: number[]
  y?: number
  /** `w[j][k]`: weight from input k to hidden neuron j. */
  w?: number[][]
  /** `v[j]`: weight from hidden neuron j to the output. */
  v?: number[]
  /** Hidden-neuron biases and the output bias. */
  b1?: number[]
  b2?: number
  learningRate?: number
}

/**
 * Untrained 2 → 4 → 1 network. The mixed signs put the decision boundary inside the unit square
 * from the start, and AND, OR and XOR all train to 100% within the default run from here.
 */
export const INITIAL = {
  w: [
    [1, 0.4],
    [-0.3, -0.3],
    [-1, 1],
    [-0.6, 0.2],
  ],
  v: [-0.7, 0.1, 0.8, 0.2],
  b1: [0, 0, 0, 0],
  b2: 0,
}
export const HIDDEN = INITIAL.v.length
export const LEARNING_RATE = 2

/** One forward + backward + update pass on a 2 → hidden → 1 sigmoid network with cross-entropy loss. */
export function stepByStep({
  x = [1, 1],
  y = 1,
  w = INITIAL.w,
  v = INITIAL.v,
  b1 = INITIAL.b1,
  b2 = INITIAL.b2,
  learningRate = LEARNING_RATE,
}: Params = {}) {
  const dot = (a: number[], b: number[]) => a.reduce((s, c, i) => s + c * b[i], 0)
  // Clamped so a saturated sigmoid (ŷ = 0 or 1 in floating point) gives a large loss, not Infinity.
  const cost = (p: number) => {
    const q = Math.min(Math.max(p, 1e-12), 1 - 1e-12)
    return -(y * Math.log(q) + (1 - y) * Math.log(1 - q))
  }
  const run = (ww: number[][], vv: number[], bb1: number[], bb2: number) => {
    const z1 = ww.map((row, j) => dot(row, x) + bb1[j])
    const a1 = z1.map(sigmoid)
    const z2 = dot(vv, a1) + bb2
    return { z1, a1, z2, yHat: sigmoid(z2) }
  }

  const f = run(w, v, b1, b2)
  // Sigmoid + cross-entropy: the output delta collapses to ŷ − y.
  const delta2 = f.yHat - y
  const gradV = f.a1.map((a) => delta2 * a)
  const delta1 = f.a1.map((a, j) => delta2 * v[j] * a * (1 - a))
  const gradW = delta1.map((d) => x.map((xk) => d * xk))
  // A bias is a weight on a constant input of 1, so its gradient is its neuron's delta.
  const gradB1 = delta1
  const gradB2 = delta2
  const newW = w.map((row, j) => row.map((c, k) => c - learningRate * gradW[j][k]))
  const newV = v.map((c, j) => c - learningRate * gradV[j])
  const newB1 = b1.map((c, j) => c - learningRate * gradB1[j])
  const newB2 = b2 - learningRate * gradB2

  return {
    x,
    y,
    w,
    v,
    b1,
    b2,
    learningRate,
    ...f,
    loss: cost(f.yHat),
    delta2,
    gradV,
    delta1,
    gradW,
    gradB1,
    gradB2,
    newW,
    newV,
    newB1,
    newB2,
    newLoss: cost(run(newW, newV, newB1, newB2).yHat),
  }
}

/** Enough epochs for the slowest dataset to be learned: AND at about epoch 20, XOR at about 24. */
export const EPOCHS = 40

export type Row = { x: number[]; y: number }

/** The four corners of the unit square, starting at (1, 1) so row 1 has both inputs active. */
const corners = (label: (a: number, b: number) => number): Row[] =>
  [
    [1, 1],
    [0, 1],
    [1, 0],
    [0, 0],
  ].map(([a, b]) => ({ x: [a, b], y: label(a, b) }))

export const DATASET_IDS = ["and", "or", "xor"] as const
export type DatasetId = (typeof DATASET_IDS)[number]
export const DATASETS: Record<DatasetId, Row[]> = {
  and: corners((a, b) => a & b),
  or: corners((a, b) => a | b),
  xor: corners((a, b) => a ^ b),
}

type Weights = Pick<NonNullable<Parameters<typeof stepByStep>[0]>, "w" | "v" | "b1" | "b2">

/** Mean cross-entropy and accuracy (ŷ ≥ 0.5 vs. y) of the whole dataset under one set of weights. */
function evaluate(weights: Weights, rows: Row[]) {
  const runs = rows.map((d) => stepByStep({ ...d, ...weights }))
  return {
    loss: runs.reduce((s, r) => s + r.loss, 0) / runs.length,
    accuracy: runs.filter((r, i) => (r.yHat >= 0.5 ? 1 : 0) === rows[i].y).length / runs.length,
  }
}

/**
 * Online SGD over `rows`, cycling for `epochs`: each round updates the network on one row, and the
 * next round starts from those weights. `initial` is the untrained network's metrics.
 */
export function trainRounds(epochs = EPOCHS, rows: Row[] = DATASETS.and) {
  const initial = evaluate({}, rows)
  const rounds: {
    epoch: number
    row: number
    pass: ReturnType<typeof stepByStep>
    after: { loss: number; accuracy: number }
  }[] = []
  let weights: Weights = {}
  for (let r = 0; r < epochs * rows.length; r++) {
    const row = r % rows.length
    const pass = stepByStep({ ...rows[row], ...weights })
    weights = { w: pass.newW, v: pass.newV, b1: pass.newB1, b2: pass.newB2 }
    rounds.push({
      epoch: Math.floor(r / rows.length) + 1,
      row,
      pass,
      after: evaluate(weights, rows),
    })
  }
  return { rounds, initial }
}

const SUBSCRIPTS = "₀₁₂₃₄₅₆₇₈₉"
/** `sub(12)` → "₁₂". */
export const sub = (n: number) => [...String(n)].map((d) => SUBSCRIPTS[Number(d)]).join("")

/** One trainable parameter, named as on the page: `w₁₂` is h₁ ← x₂, `v₂` is ŷ ← a₂, `b₁` is h₁'s bias. */
export const WEIGHT_REFS = [
  ...INITIAL.w.flatMap((row, j) =>
    row.map((_, k) => ({ id: `w${j}${k}`, label: `w${sub(j + 1)}${sub(k + 1)}`, kind: "w", j, k })),
  ),
  ...INITIAL.v.map((_, k) => ({ id: `v${k}`, label: `v${sub(k + 1)}`, kind: "v", j: 0, k })),
  ...INITIAL.b1.map((_, j) => ({ id: `b${j}`, label: `b${sub(j + 1)}`, kind: "b1", j, k: 0 })),
  { id: "bo", label: "b_out", kind: "b2", j: 0, k: 0 },
] as const satisfies readonly { id: string; label: string; kind: string; j: number; k: number }[]
export type WeightRef = (typeof WEIGHT_REFS)[number]

type Pass = ReturnType<typeof stepByStep>

/** Current value and loss gradient of one parameter in a pass. */
export function weightOf(pass: Pass, ref: WeightRef) {
  switch (ref.kind) {
    case "w":
      return { value: pass.w[ref.j][ref.k], grad: pass.gradW[ref.j][ref.k] }
    case "v":
      return { value: pass.v[ref.k], grad: pass.gradV[ref.k] }
    case "b1":
      return { value: pass.b1[ref.j], grad: pass.gradB1[ref.j] }
    default:
      return { value: pass.b2, grad: pass.gradB2 }
  }
}

/** This pass's row loss when only `ref` is moved to `value`: a 1D slice through parameter space. */
export function lossAt(pass: Pass, ref: WeightRef, value: number) {
  const w = pass.w.map((row) => [...row])
  const v = [...pass.v]
  const b1 = [...pass.b1]
  let b2 = pass.b2
  if (ref.kind === "w") w[ref.j][ref.k] = value
  else if (ref.kind === "v") v[ref.k] = value
  else if (ref.kind === "b1") b1[ref.j] = value
  else b2 = value
  return stepByStep({ x: pass.x, y: pass.y, w, v, b1, b2 }).loss
}

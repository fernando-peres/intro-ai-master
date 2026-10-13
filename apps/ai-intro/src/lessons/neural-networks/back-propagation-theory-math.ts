/** Pure numbers behind the Back-propagation lesson's theory section; charts and prose both read these. */

export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z))

/** One forward + backward + update pass on a 1 → 1 → 1 sigmoid network with cross-entropy loss. */
export function backpropExample({
  x = 1,
  y = 1,
  w1 = 0.5,
  w2 = 0.8,
  learningRate = 0.5,
}: {
  x?: number
  y?: number
  w1?: number
  w2?: number
  learningRate?: number
} = {}) {
  const loss = (a: number, b: number) => {
    const yHat = sigmoid(b * sigmoid(a * x))
    return -(y * Math.log(yHat) + (1 - y) * Math.log(1 - yHat))
  }
  const z1 = w1 * x
  const a1 = sigmoid(z1)
  const z2 = w2 * a1
  const yHat = sigmoid(z2)
  // Sigmoid + cross-entropy: the output delta collapses to ŷ − y.
  const delta2 = yHat - y
  const gradW2 = delta2 * a1
  const delta1 = delta2 * w2 * a1 * (1 - a1)
  const gradW1 = delta1 * x
  const newW1 = w1 - learningRate * gradW1
  const newW2 = w2 - learningRate * gradW2
  return {
    x,
    y,
    w1,
    w2,
    learningRate,
    z1,
    a1,
    z2,
    yHat,
    loss: loss(w1, w2),
    delta2,
    gradW2,
    delta1,
    gradW1,
    newW1,
    newW2,
    newLoss: loss(newW1, newW2),
  }
}

/** Loss for one example as a function of the predicted probability ŷ, for each true label. */
export function crossEntropyCurve(label: 0 | 1, steps = 60) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const yHat = 0.01 + (i / steps) * 0.98
    return { x: yHat, y: label === 1 ? -Math.log(yHat) : -Math.log(1 - yHat) }
  })
}

/** The cost J(w) = w² and its gradient 2w — the simplest bowl, so the update is exact: w ← (1 − 2η)w. */
export const bowl = (w: number) => w * w

/** Gradient descent on `bowl`: `steps + 1` positions starting at `start`. */
export function descentPath(start: number, learningRate: number, steps: number) {
  const path = [start]
  for (let i = 0; i < steps; i++) {
    const w = path[i]
    path.push(w - learningRate * 2 * w)
  }
  return path
}

/**
 * The size of the gradient at each layer, counted back from the output, when every layer
 * multiplies it by `factor`: factor^k. A factor under 1 vanishes, over 1 explodes.
 */
export function gradientFlow(factor: number, layers: number) {
  return Array.from({ length: layers + 1 }, (_, k) => factor ** k)
}

export type OptimizerName = "sgd" | "momentum" | "adam"
export const OPTIMIZERS: OptimizerName[] = ["sgd", "momentum", "adam"]
type Vec = [number, number]

/** A narrow valley: gentle along x, steep along y — where plain gradient descent zig-zags. */
export const valley = ([x, y]: Vec) => 0.5 * (x * x + 20 * y * y)
const valleyGrad = ([x, y]: Vec): Vec => [x, 20 * y]

const SETTINGS: Record<OptimizerName, { learningRate: number }> = {
  sgd: { learningRate: 0.09 },
  momentum: { learningRate: 0.02 },
  adam: { learningRate: 0.35 },
}
export const OPTIMIZER_SETTINGS = SETTINGS
const BETA = 0.9
const BETA2 = 0.999
const EPSILON = 1e-8

/** `steps + 1` positions of one optimizer descending `valley` from `start`. */
export function optimizerPath(name: OptimizerName, start: Vec, steps: number): Vec[] {
  const { learningRate } = SETTINGS[name]
  const path: Vec[] = [start]
  let p: Vec = start
  let m: Vec = [0, 0]
  let v: Vec = [0, 0]
  for (let t = 1; t <= steps; t++) {
    const g = valleyGrad(p)
    if (name === "sgd") {
      p = [p[0] - learningRate * g[0], p[1] - learningRate * g[1]]
    } else if (name === "momentum") {
      m = [BETA * m[0] + g[0], BETA * m[1] + g[1]]
      p = [p[0] - learningRate * m[0], p[1] - learningRate * m[1]]
    } else {
      m = [BETA * m[0] + (1 - BETA) * g[0], BETA * m[1] + (1 - BETA) * g[1]]
      v = [BETA2 * v[0] + (1 - BETA2) * g[0] ** 2, BETA2 * v[1] + (1 - BETA2) * g[1] ** 2]
      const step = (i: 0 | 1) =>
        (learningRate * (m[i] / (1 - BETA ** t))) / (Math.sqrt(v[i] / (1 - BETA2 ** t)) + EPSILON)
      p = [p[0] - step(0), p[1] - step(1)]
    }
    path.push(p)
  }
  return path
}

export function softmax(logits: number[]) {
  const max = Math.max(...logits)
  const exps = logits.map((l) => Math.exp(l - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum)
}

/** Leaky ReLU's slope for z < 0. Libraries default to 0.01; 0.1 keeps the leak visible on a plot. */
export const LEAKY_ALPHA = 0.1
const GELU_C = Math.sqrt(2 / Math.PI)
const GELU_K = 0.044715

/** GELU via the tanh approximation used by GPT-2 and BERT. */
function gelu(z: number) {
  return 0.5 * z * (1 + Math.tanh(GELU_C * (z + GELU_K * z ** 3)))
}

function geluSlope(z: number) {
  const t = Math.tanh(GELU_C * (z + GELU_K * z ** 3))
  return 0.5 * (1 + t) + 0.5 * z * (1 - t * t) * GELU_C * (1 + 3 * GELU_K * z * z)
}

export const ACTIVATION_FUNCTIONS = {
  sigmoid: { f: sigmoid, slope: (z: number) => sigmoid(z) * (1 - sigmoid(z)) },
  tanh: { f: Math.tanh, slope: (z: number) => 1 - Math.tanh(z) ** 2 },
  relu: { f: (z: number) => Math.max(0, z), slope: (z: number) => (z > 0 ? 1 : 0) },
  leakyRelu: {
    f: (z: number) => (z > 0 ? z : LEAKY_ALPHA * z),
    slope: (z: number) => (z > 0 ? 1 : LEAKY_ALPHA),
  },
  gelu: { f: gelu, slope: geluSlope },
  silu: {
    f: (z: number) => z * sigmoid(z),
    slope: (z: number) => sigmoid(z) * (1 + z * (1 - sigmoid(z))),
  },
  linear: { f: (z: number) => z, slope: () => 1 },
} as const

export type ActivationKey = keyof typeof ACTIVATION_FUNCTIONS

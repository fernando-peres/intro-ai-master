/** A small feedforward network trained by backpropagation (mini-batch SGD, cross-entropy). */
export type ActivationName = "tanh" | "relu" | "sigmoid" | "linear"
export type Network = {
  layerSizes: number[]
  weights: number[][][]
  biases: number[][]
  /** Used by every layer except the output layer, which is always sigmoid (0..1 probability). */
  hiddenActivation: ActivationName
}
export type Example = { input: number[]; target: number[] }

/** Deterministic PRNG so a seed reproduces the same network (or dataset) for a whole class. */
export function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Activation = { fn: (z: number) => number; derivativeFromOutput: (output: number) => number }

const activations: Record<ActivationName, Activation> = {
  sigmoid: {
    fn: (z) => 1 / (1 + Math.exp(-z)),
    derivativeFromOutput: (o) => o * (1 - o),
  },
  tanh: {
    fn: Math.tanh,
    derivativeFromOutput: (o) => 1 - o * o,
  },
  relu: {
    fn: (z) => Math.max(0, z),
    derivativeFromOutput: (o) => (o > 0 ? 1 : 0),
  },
  linear: {
    fn: (z) => z,
    derivativeFromOutput: () => 1,
  },
}

/** Standard normal draw (Box–Muller) from a seeded uniform source. */
export function gaussian(rand: () => number): number {
  const u1 = Math.max(rand(), 1e-12)
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * rand())
}

/** He init for relu (it needs the extra variance), `sqrt(1.2/fanIn)` otherwise. */
function initScale(fanIn: number, hiddenActivation: ActivationName) {
  return hiddenActivation === "relu" ? Math.sqrt(2 / fanIn) : Math.sqrt(1.2 / fanIn)
}

export function createNetwork(
  layerSizes: number[],
  seed: number,
  hiddenActivation: ActivationName = "sigmoid",
): Network {
  const rand = mulberry32(seed)
  const weights: number[][][] = []
  const biases: number[][] = []
  for (let l = 1; l < layerSizes.length; l++) {
    const fanIn = layerSizes[l - 1]
    const scale = initScale(fanIn, hiddenActivation)
    const layerWeights: number[][] = []
    for (let n = 0; n < layerSizes[l]; n++) {
      layerWeights.push(Array.from({ length: fanIn }, () => gaussian(rand) * scale))
    }
    weights.push(layerWeights)
    biases.push(Array.from({ length: layerSizes[l] }, () => 0))
  }
  return { layerSizes, weights, biases, hiddenActivation }
}

/**
 * Activations of every layer, input layer included — activations[0] is the raw input,
 * activations[i] the output of weight-layer i-1. Exposed so a diagram can read every neuron's
 * value from a single forward pass.
 */
export function forward(net: Network, input: number[]): number[][] {
  const hidden = activations[net.hiddenActivation]
  const output = activations.sigmoid
  const result: number[][] = [input]
  for (let l = 0; l < net.weights.length; l++) {
    const prev = result[l]
    const { fn } = l === net.weights.length - 1 ? output : hidden
    result.push(
      net.weights[l].map((neuronWeights, n) =>
        fn(neuronWeights.reduce((sum, w, i) => sum + w * prev[i], net.biases[l][n])),
      ),
    )
  }
  return result
}

export function predict(net: Network, input: number[]): number[] {
  const result = forward(net, input)
  return result[result.length - 1]
}

function exampleCrossEntropy(output: number[], target: number[]) {
  const total = output.reduce((sum, o, i) => {
    const p = Math.min(Math.max(o, 1e-9), 1 - 1e-9)
    return sum - (target[i] * Math.log(p) + (1 - target[i]) * Math.log(1 - p))
  }, 0)
  return total / output.length
}

/** Mean binary cross-entropy — the loss `trainEpoch` minimizes. */
export function crossEntropy(net: Network, examples: Example[]): number {
  if (examples.length === 0) return 0
  const total = examples.reduce(
    (sum, { input, target }) => sum + exampleCrossEntropy(predict(net, input), target),
    0,
  )
  return total / examples.length
}

/** One gradient step on `batch`; with sigmoid + cross-entropy the output delta is `ŷ − y`. */
function trainBatch(net: Network, batch: Example[], learningRate: number): number {
  const hiddenDerivative = activations[net.hiddenActivation].derivativeFromOutput
  const weightGrad = net.weights.map((layer) => layer.map((w) => w.map(() => 0)))
  const biasGrad = net.biases.map((layer) => layer.map(() => 0))
  let totalLoss = 0

  for (const { input, target } of batch) {
    const layerActivations = forward(net, input)
    const output = layerActivations[layerActivations.length - 1]
    let delta = output.map((o, i) => o - target[i])
    totalLoss += exampleCrossEntropy(output, target)

    for (let l = net.weights.length - 1; l >= 0; l--) {
      const prevActivation = layerActivations[l]
      net.weights[l].forEach((neuronWeights, n) => {
        neuronWeights.forEach((_, i) => {
          weightGrad[l][n][i] += delta[n] * prevActivation[i]
        })
        biasGrad[l][n] += delta[n]
      })
      if (l > 0) {
        delta = net.weights[l][0].map((_, i) => {
          const sum = net.weights[l].reduce(
            (acc, neuronWeights, n) => acc + neuronWeights[i] * delta[n],
            0,
          )
          return sum * hiddenDerivative(prevActivation[i])
        })
      }
    }
  }

  const step = learningRate / (batch.length || 1)
  net.weights.forEach((layer, l) => {
    layer.forEach((neuronWeights, n) => {
      neuronWeights.forEach((w, i) => {
        neuronWeights[i] = w - step * weightGrad[l][n][i]
      })
    })
  })
  net.biases.forEach((layer, l) => {
    layer.forEach((b, n) => {
      layer[n] = b - step * biasGrad[l][n]
    })
  })
  return totalLoss
}

/**
 * One epoch of mini-batch gradient descent over `examples`; returns the mean cross-entropy
 * seen during the epoch. `rand` shuffles the order first — omit it for a fixed order (and
 * `batchSize: Infinity` for a single full-batch step).
 */
export function trainEpoch(
  net: Network,
  examples: Example[],
  learningRate: number,
  { batchSize = 10, rand }: { batchSize?: number; rand?: () => number } = {},
): number {
  const order = [...examples]
  if (rand) {
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[order[i], order[j]] = [order[j], order[i]]
    }
  }
  let totalLoss = 0
  for (let i = 0; i < order.length; i += batchSize) {
    totalLoss += trainBatch(net, order.slice(i, i + batchSize), learningRate)
  }
  return totalLoss / (order.length || 1)
}

/** Deep clone — used to snapshot a network for React state so re-renders are triggered. */
export function cloneNetwork(net: Network): Network {
  return {
    layerSizes: net.layerSizes,
    weights: net.weights.map((layer) => layer.map((w) => [...w])),
    biases: net.biases.map((layer) => [...layer]),
    hiddenActivation: net.hiddenActivation,
  }
}

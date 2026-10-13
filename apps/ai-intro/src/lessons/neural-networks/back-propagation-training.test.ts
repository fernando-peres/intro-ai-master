import { createNetwork, crossEntropy, mulberry32, predict, trainEpoch } from "@/lib/neural-net"
import {
  BACKPROP_DATASETS,
  DEFAULT_ACTIVATION,
  DEFAULT_HIDDEN_LAYERS,
  DEFAULT_LEARNING_RATE,
  isPlateaued,
  MAX_EPOCHS,
  PLATEAU_EPSILON,
  PLATEAU_WINDOW,
  SEED,
  TARGET_LOSS,
  toExamples,
} from "./back-propagation-training"
import { DATASETS } from "./perceptron-data"

const MAX_EPOCHS_FOR_PLATEAU_CHECK = 300

describe("toExamples", () => {
  test("maps each dataset point to an (input, target) pair in the same order", () => {
    const examples = toExamples("xor")
    expect(examples).toHaveLength(DATASETS.xor.points.length)
    examples.forEach((example, i) => {
      const point = DATASETS.xor.points[i]
      expect(example.input).toEqual([point.x1, point.x2])
      expect(example.target).toEqual([point.y])
    })
  })
})

describe("isPlateaued", () => {
  test("is false while history is shorter than the window", () => {
    const history = Array.from({ length: 5 }, (_, i) => ({ epoch: i, loss: 0.69 }))
    expect(isPlateaued(history, 15, PLATEAU_EPSILON)).toBe(false)
  })

  test("is false when loss is still decreasing across the window", () => {
    const history = Array.from({ length: 20 }, (_, i) => ({ epoch: i, loss: 1 - i * 0.05 }))
    expect(isPlateaued(history, 15, PLATEAU_EPSILON)).toBe(false)
  })

  test("is true when loss has barely moved across the window", () => {
    const history = Array.from({ length: 20 }, (_, i) => ({
      epoch: i,
      loss: Math.LN2 + (i % 2 === 0 ? 0.0001 : -0.0001),
    }))
    expect(isPlateaued(history, 15, PLATEAU_EPSILON)).toBe(true)
  })
})

/** Trains for `epochs`, returning the loss history — mirrors the component's own training loop. */
function trainRun(layerSizes: number[], activation: typeof DEFAULT_ACTIVATION, epochs: number) {
  const net = createNetwork(layerSizes, SEED, activation)
  const rand = mulberry32(SEED + 100)
  const examples = toExamples("xor")
  const history: { epoch: number; loss: number }[] = [
    { epoch: 0, loss: crossEntropy(net, examples) },
  ]
  for (let epoch = 1; epoch <= epochs; epoch++) {
    trainEpoch(net, examples, DEFAULT_LEARNING_RATE, { rand })
    history.push({ epoch, loss: crossEntropy(net, examples) })
  }
  return history
}

describe("training the real engine on XOR (empirical oracles from the spec)", () => {
  test("zero hidden layers never solves XOR within the epoch cap", () => {
    const history = trainRun([2, 1], DEFAULT_ACTIVATION, MAX_EPOCHS)
    expect(history[history.length - 1].loss).toBeGreaterThan(0.3)
  })

  test("the default architecture (tanh, [4,4]) solves XOR within a small epoch budget", () => {
    const history = trainRun([2, ...DEFAULT_HIDDEN_LAYERS, 1], DEFAULT_ACTIVATION, 300)
    expect(history[history.length - 1].loss).toBeLessThan(0.1)
  })

  test("eight sigmoid hidden layers plateau near ln(2) within a bounded epoch window", () => {
    const history = trainRun([2, ...Array(8).fill(4), 1], "sigmoid", MAX_EPOCHS_FOR_PLATEAU_CHECK)
    const final = history[history.length - 1].loss
    expect(final).toBeGreaterThan(Math.log(2) - 0.05)
    expect(final).toBeLessThan(Math.log(2) + 0.05)
    expect(isPlateaued(history, PLATEAU_WINDOW, PLATEAU_EPSILON)).toBe(true)
  })
})

describe("Rings", () => {
  const solves = (learningRate: number) => {
    const examples = toExamples("rings")
    const net = createNetwork([2, ...DEFAULT_HIDDEN_LAYERS, 1], SEED, DEFAULT_ACTIVATION)
    const rand = mulberry32(SEED + 100)
    for (let epoch = 0; epoch < MAX_EPOCHS; epoch++) {
      trainEpoch(net, examples, learningRate, { rand })
      const correct = examples.every(
        (ex) => (predict(net, ex.input)[0] >= 0.5 ? 1 : 0) === ex.target[0],
      )
      if (correct && crossEntropy(net, examples) < TARGET_LOSS) return true
    }
    return false
  }

  test("has 24 labelled points", () => {
    expect(BACKPROP_DATASETS.rings.points).toHaveLength(24)
  })

  test("converges at a moderate learning rate but not at a very large one", () => {
    expect(solves(0.3)).toBe(true)
    expect(solves(30)).toBe(false)
  })
})

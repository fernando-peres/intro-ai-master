import {
  type ActivationName,
  cloneNetwork,
  createNetwork,
  crossEntropy,
  forward,
  mulberry32,
  predict,
  trainEpoch,
} from "./neural-net"

test("the same seed reproduces the same initial weights", () => {
  const a = createNetwork([2, 3, 1], 42)
  const b = createNetwork([2, 3, 1], 42)
  expect(a.weights).toEqual(b.weights)
  expect(a.biases).toEqual(b.biases)
})

test("different seeds diverge", () => {
  const a = createNetwork([2, 3, 1], 1)
  const b = createNetwork([2, 3, 1], 2)
  expect(a.weights).not.toEqual(b.weights)
})

test("training on a linearly separable toy set reduces the loss", () => {
  const net = createNetwork([2, 3, 1], 7)
  const examples = [
    { input: [0, 0], target: [0] },
    { input: [0, 1], target: [0] },
    { input: [1, 0], target: [1] },
    { input: [1, 1], target: [1] },
  ]

  const firstLoss = trainEpoch(net, examples, 1)
  let lastLoss = firstLoss
  for (let i = 0; i < 300; i++) lastLoss = trainEpoch(net, examples, 1)

  expect(lastLoss).toBeLessThan(firstLoss)
  expect(predict(net, [1, 1])[0]).toBeGreaterThan(predict(net, [0, 0])[0])
})

test("the output layer is always a 0..1 probability, whatever the hidden activation is", () => {
  const names: ActivationName[] = ["tanh", "relu", "sigmoid", "linear"]
  for (const hiddenActivation of names) {
    const net = createNetwork([2, 3, 1], 3, hiddenActivation)
    const output = predict(net, [0.4, 0.9])[0]
    expect(output).toBeGreaterThan(0)
    expect(output).toBeLessThan(1)
  }
})

test("each hidden activation keeps its own output range", () => {
  const input = [0.6, -0.3, 0.9]
  const inRange = (values: number[], check: (v: number) => boolean) => values.every(check)

  const tanhHidden = forward(createNetwork([3, 5, 1], 1, "tanh"), input)[1]
  expect(inRange(tanhHidden, (v) => v > -1 && v < 1)).toBe(true)

  const reluHidden = forward(createNetwork([3, 5, 1], 1, "relu"), input)[1]
  expect(inRange(reluHidden, (v) => v >= 0)).toBe(true)

  const sigmoidHidden = forward(createNetwork([3, 5, 1], 1, "sigmoid"), input)[1]
  expect(inRange(sigmoidHidden, (v) => v > 0 && v < 1)).toBe(true)
})

test("backprop gradient matches a finite-difference estimate, for every activation", () => {
  const examples = [
    { input: [0.2, 0.8], target: [1] },
    { input: [0.9, 0.1], target: [0] },
    { input: [0.5, 0.5], target: [1] },
  ]
  const names: ActivationName[] = ["tanh", "relu", "sigmoid", "linear"]
  const epsilon = 1e-4

  for (const hiddenActivation of names) {
    const net = createNetwork([2, 4, 1], 11, hiddenActivation)
    const probe = { l: 0, n: 0, i: 0 }

    const lossAt = (delta: number) => {
      const probeNet = cloneNetwork(net)
      probeNet.weights[probe.l][probe.n][probe.i] += delta
      return crossEntropy(probeNet, examples)
    }
    const numericGradient = (lossAt(epsilon) - lossAt(-epsilon)) / (2 * epsilon)

    const trainingNet = cloneNetwork(net)
    const before = trainingNet.weights[probe.l][probe.n][probe.i]
    trainEpoch(trainingNet, examples, 1, { batchSize: Number.POSITIVE_INFINITY })
    const analyticGradient = before - trainingNet.weights[probe.l][probe.n][probe.i]

    expect(analyticGradient).toBeCloseTo(numericGradient, 2)
  }
})

const xor = [
  { input: [-1, -1], target: [0] },
  { input: [-1, 1], target: [1] },
  { input: [1, -1], target: [1] },
  { input: [1, 1], target: [0] },
]
const xorAccuracy = (net: ReturnType<typeof createNetwork>) =>
  xor.filter((ex) => (predict(net, ex.input)[0] >= 0.5 ? 1 : 0) === ex.target[0]).length

test("a hidden layer + backprop solves XOR", () => {
  const net = createNetwork([2, 4, 1], 1, "tanh")
  const rand = mulberry32(2)
  for (let i = 0; i < 2000; i++) trainEpoch(net, xor, 0.5, { rand })
  expect(xorAccuracy(net)).toBe(4)
})

test("without a hidden layer, XOR can't be separated", () => {
  const net = createNetwork([2, 1], 1, "tanh")
  const rand = mulberry32(2)
  for (let i = 0; i < 2000; i++) trainEpoch(net, xor, 0.5, { rand })
  expect(xorAccuracy(net)).toBeLessThan(4)
})

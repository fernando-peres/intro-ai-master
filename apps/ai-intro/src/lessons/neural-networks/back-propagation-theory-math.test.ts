import {
  ACTIVATION_FUNCTIONS,
  backpropExample,
  descentPath,
  gradientFlow,
  OPTIMIZERS,
  optimizerPath,
  softmax,
  valley,
} from "./back-propagation-theory-math"

test("the worked example's gradients match a numerical derivative and the update lowers the loss", () => {
  const e = backpropExample()
  const loss = (w1: number, w2: number) => backpropExample({ w1, w2 }).loss
  const h = 1e-6
  expect(e.gradW1).toBeCloseTo((loss(e.w1 + h, e.w2) - loss(e.w1 - h, e.w2)) / (2 * h), 6)
  expect(e.gradW2).toBeCloseTo((loss(e.w1, e.w2 + h) - loss(e.w1, e.w2 - h)) / (2 * h), 6)
  expect(e.newLoss).toBeLessThan(e.loss)
})

test("gradient descent on the bowl converges for a small rate, oscillates at 1 and diverges above it", () => {
  expect(Math.abs(descentPath(4, 0.1, 30)[30])).toBeLessThan(0.01)
  expect(descentPath(4, 1, 5).map(Math.abs)).toEqual([4, 4, 4, 4, 4, 4])
  expect(Math.abs(descentPath(4, 1.1, 10)[10])).toBeGreaterThan(4)
})

test("the gradient shrinks or grows geometrically with depth", () => {
  expect(gradientFlow(0.25, 3)).toEqual([1, 0.25, 0.0625, 0.015625])
  expect(gradientFlow(2, 3)).toEqual([1, 2, 4, 8])
})

test("every optimizer descends the valley, and SGD zig-zags across it more than Adam", () => {
  const flips = (name: (typeof OPTIMIZERS)[number]) => {
    const ys = optimizerPath(name, [-4, 1.5], 30).map(([, y]) => y)
    return ys.slice(1).filter((y, i) => y * ys[i] < 0).length
  }
  for (const name of OPTIMIZERS) {
    expect(valley(optimizerPath(name, [-4, 1.5], 30)[30])).toBeLessThan(valley([-4, 1.5]) / 10)
  }
  expect(flips("sgd")).toBeGreaterThan(flips("adam"))
})

test("softmax sums to one and keeps the order of the logits", () => {
  const p = softmax([2, 1, 0.1])
  expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1)
  expect(p[0]).toBeGreaterThan(p[1])
})

test("leaky ReLU, GELU and SiLU match known values and their slopes match a numerical derivative", () => {
  const { leakyRelu, gelu, silu } = ACTIVATION_FUNCTIONS
  expect(leakyRelu.f(-2)).toBeCloseTo(-0.2)
  expect(leakyRelu.f(3)).toBe(3)
  expect(gelu.f(0)).toBe(0)
  expect(gelu.f(1)).toBeCloseTo(0.8412, 4)
  expect(silu.f(1)).toBeCloseTo(0.7311, 4)
  const h = 1e-6
  for (const fn of [gelu, silu]) {
    for (const z of [-2, -0.5, 0.7, 3]) {
      expect(fn.slope(z)).toBeCloseTo((fn.f(z + h) - fn.f(z - h)) / (2 * h), 6)
    }
  }
})

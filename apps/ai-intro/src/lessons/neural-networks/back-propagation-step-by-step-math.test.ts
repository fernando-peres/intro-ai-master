import {
  DATASETS,
  EPOCHS,
  lossAt,
  stepByStep,
  trainRounds,
  WEIGHT_REFS,
  weightOf,
} from "./back-propagation-step-by-step-math"

const close = (a: number, b: number, digits = 3) => expect(a).toBeCloseTo(b, digits)

test("forward pass of the 2 → 4 → 1 network", () => {
  const s = stepByStep()
  expect(s.a1).toHaveLength(4)
  close(s.z1[0], 1.4)
  close(s.z1[1], -0.6)
  close(s.z1[2], 0)
  close(s.z1[3], -0.4)
  close(s.a1[0], 0.802)
  close(s.z2, -0.046)
  close(s.yHat, 0.489)
  close(s.loss, 0.716)
})

test("the biases enter z", () => {
  const s = stepByStep({ b1: [0.1, -0.2, 0, 0.5], b2: 0.3 })
  close(s.z1[0], 1.5)
  close(s.z1[1], -0.8)
  close(s.z2, s.v.reduce((sum, c, j) => sum + c * s.a1[j], 0) + 0.3)
})

test("backward pass uses ŷ − y at the output and the chain rule below it", () => {
  const s = stepByStep()
  close(s.delta2, s.yHat - 1)
  close(s.gradV[0], s.delta2 * s.a1[0])
  close(s.delta1[0], s.delta2 * s.v[0] * s.a1[0] * (1 - s.a1[0]))
  close(s.gradW[3][1], s.delta1[3] * s.x[1])
  close(s.gradB1[1], s.delta1[1])
  close(s.gradB2, s.delta2)
})

test("every analytic gradient matches a finite-difference estimate", () => {
  const s = stepByStep({ x: [1, 0.5], b1: [0.1, -0.1, 0.2, 0], b2: 0.2 })
  const h = 1e-6
  for (const ref of WEIGHT_REFS) {
    const { value, grad } = weightOf(s, ref)
    close(lossAt(s, ref, value), s.loss, 10)
    close((lossAt(s, ref, value + h) - s.loss) / h, grad, 4)
  }
})

test("one update lowers the loss", () => {
  const s = stepByStep()
  expect(s.newLoss).toBeLessThan(s.loss)
  close(s.newV[0], s.v[0] - s.learningRate * s.gradV[0])
  close(s.newB2, s.b2 - s.learningRate * s.gradB2)
})

describe("trainRounds", () => {
  const { rounds, initial } = trainRounds(3)

  test("each round starts from the previous round's updated parameters", () => {
    expect(rounds[1].pass.w).toEqual(rounds[0].pass.newW)
    expect(rounds[1].pass.v).toEqual(rounds[0].pass.newV)
    expect(rounds[1].pass.b1).toEqual(rounds[0].pass.newB1)
    expect(rounds[1].pass.b2).toBe(rounds[0].pass.newB2)
  })

  test("rows and epochs wrap after the last row", () => {
    expect(rounds).toHaveLength(3 * 4)
    expect(rounds[3]).toMatchObject({ row: 3, epoch: 1 })
    expect(rounds[4]).toMatchObject({ row: 0, epoch: 2 })
  })

  test("metrics evaluate the whole dataset with the updated parameters", () => {
    const last = rounds[rounds.length - 1]
    const rows = DATASETS.and
    const hits = rows.filter((d) => {
      const yHat = stepByStep({
        ...d,
        w: last.pass.newW,
        v: last.pass.newV,
        b1: last.pass.newB1,
        b2: last.pass.newB2,
      }).yHat
      return (yHat >= 0.5 ? 1 : 0) === d.y
    }).length
    close(last.after.accuracy, hits / rows.length)
  })

  test("training lowers the mean loss", () => {
    expect(rounds[rounds.length - 1].after.loss).toBeLessThan(initial.loss)
  })
})

test("AND, OR and XOR are all fully learned within the default run", () => {
  const done = (id: keyof typeof DATASETS) =>
    trainRounds(EPOCHS, DATASETS[id]).rounds.at(-1)?.after.accuracy
  expect(done("and")).toBe(1)
  expect(done("or")).toBe(1)
  expect(done("xor")).toBe(1)
})

test("the logic datasets are the four corners, starting at (1, 1)", () => {
  expect(DATASETS.and.map((r) => r.y)).toEqual([1, 0, 0, 0])
  expect(DATASETS.or.map((r) => r.y)).toEqual([1, 1, 1, 0])
  expect(DATASETS.xor.map((r) => r.y)).toEqual([0, 1, 1, 0])
  expect(trainRounds(1, DATASETS.or).rounds[0].pass.x).toEqual([1, 1])
})

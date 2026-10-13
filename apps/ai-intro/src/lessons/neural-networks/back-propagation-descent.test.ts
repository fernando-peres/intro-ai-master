import { createNetwork, crossEntropy, trainEpoch } from "@/lib/neural-net"
import { countRises, trackedWeight, weightSlice } from "./back-propagation-descent"
import { toExamples } from "./back-propagation-training"

const examples = toExamples("xor")
const net = createNetwork([2, 4, 1], 7, "tanh")

test("the curve passes through the current loss at the current weight", () => {
  const s = weightSlice(net, examples, 0.3)
  expect(s.w).toBe(trackedWeight(net))
  expect(s.loss).toBeCloseTo(crossEntropy(net, examples))
})

test("the step lands where a real full-batch training step moves the weight", () => {
  const s = weightSlice(net, examples, 0.3)
  const trained = structuredClone(net)
  trainEpoch(trained, examples, 0.3, { batchSize: Infinity })
  expect(s.nextW).toBeCloseTo(trackedWeight(trained))
})

test("the loss is U-shaped in the tracked weight: the lowest point is inside the range", () => {
  const s = weightSlice(net, examples, 0.3)
  const ends = [s.curve[0].y, s.curve[s.curve.length - 1].y]
  expect(Math.min(...ends)).toBeGreaterThan(s.lowest.loss)
})

test("countRises counts epochs where the loss went up", () => {
  expect(countRises([{ loss: 0.7 }, { loss: 0.6 }, { loss: 0.65 }, { loss: 0.5 }])).toBe(1)
})

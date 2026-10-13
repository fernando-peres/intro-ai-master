import {
  cloneNetwork,
  crossEntropy,
  type Example,
  type Network,
  trainEpoch,
} from "@/lib/neural-net"

export const WEIGHT_MIN = -6
export const WEIGHT_MAX = 6
const CURVE_POINTS = 60

/** One recorded epoch: the loss and the tracked weight after it. */
export type DescentRecord = { epoch: number; loss: number; w: number }

/** The output neuron's first weight — with the others held fixed, the loss is U-shaped in it. */
export function trackedWeight(net: Network) {
  return net.weights[net.weights.length - 1][0][0]
}

export function descentRecord(net: Network, examples: Example[], epoch: number): DescentRecord {
  return { epoch, loss: crossEntropy(net, examples), w: trackedWeight(net) }
}

/**
 * The loss as a function of the tracked weight alone, plus the gradient step from the current
 * weight. The step is the full-batch one (w − η·∂L/∂w); the playground's own epoch takes several
 * mini-batch steps of the same kind.
 */
export function weightSlice(net: Network, examples: Example[], learningRate: number) {
  const last = net.weights.length - 1
  const lossAt = (w: number) => {
    const probe = cloneNetwork(net)
    probe.weights[last][0][0] = w
    return crossEntropy(probe, examples)
  }
  const curve = Array.from({ length: CURVE_POINTS + 1 }, (_, i) => {
    const w = WEIGHT_MIN + (i / CURVE_POINTS) * (WEIGHT_MAX - WEIGHT_MIN)
    return { x: w, y: lossAt(w) }
  })
  const lowest = curve.reduce((a, b) => (b.y < a.y ? b : a))

  // A full-batch step of size 1 moves each weight by exactly its gradient.
  const w = trackedWeight(net)
  const unit = cloneNetwork(net)
  trainEpoch(unit, examples, 1, { batchSize: Number.POSITIVE_INFINITY })
  const gradient = w - trackedWeight(unit)
  const nextW = w - learningRate * gradient
  return {
    curve,
    w,
    loss: lossAt(w),
    gradient,
    nextW,
    nextLoss: lossAt(nextW),
    lowest: { w: lowest.x, loss: lowest.y },
  }
}

/** Epochs where the loss went up from the previous one — overshoots. */
export function countRises(history: { loss: number }[]) {
  return history.filter((h, i) => i > 0 && h.loss > history[i - 1].loss).length
}

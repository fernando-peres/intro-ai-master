import {
  type ActivationName,
  createNetwork,
  crossEntropy,
  type Example,
  mulberry32,
  type Network,
  trainEpoch,
} from "@/lib/neural-net"
import { type MachineReading, machineReadings } from "./dataset"

/** Config defaults for the Machine Learning page's playground. */
export const SEED = 7
export const DEFAULT_HIDDEN_LAYERS = [4, 2]
export const DEFAULT_ACTIVATION: ActivationName = "tanh"
export const LEARNING_RATE_PRESETS = [0.01, 0.03, 0.1, 0.3, 1, 3] as const
export const DEFAULT_LEARNING_RATE = 0.3
export const MAX_EPOCHS = 1000
export const EPOCHS_PER_TICK = 2
export const TARGET_LOSS = 0.05

export const MIN_LAYERS = 0
export const MAX_LAYERS = 4
export const MIN_NEURONS_PER_LAYER = 1
export const MAX_NEURONS_PER_LAYER = 8

export const TEMP_DOMAIN: [number, number] = [40, 105]
export const VIB_DOMAIN: [number, number] = [0, 9]

/** Centers and scales the raw readings to roughly −1..1 — the network trains on this. */
export function toInput({
  temperature,
  vibration,
}: Pick<MachineReading, "temperature" | "vibration">) {
  return [(temperature - 72.5) / 22.5, (vibration - 4.5) / 3]
}

/** The shared dataset as (input, target) pairs, ready for `trainEpoch`/`predict`. */
export const examples: Example[] = machineReadings.map((reading) => ({
  input: toInput(reading),
  target: [reading.label === "at-risk" ? 1 : 0],
}))

/** Trains a fresh network for `epochs` epochs, sampling the loss every `checkpointEvery`. */
export function trainWithLossHistory(
  layerSizes: number[],
  activation: ActivationName,
  epochs: number,
  checkpointEvery: number,
): { net: Network; history: { x: number; y: number }[] } {
  const net = createNetwork(layerSizes, SEED, activation)
  const rand = mulberry32(SEED + 100)
  const history = [{ x: 0, y: crossEntropy(net, examples) }]
  for (let epoch = 1; epoch <= epochs; epoch++) {
    trainEpoch(net, examples, DEFAULT_LEARNING_RATE, { rand })
    if (epoch % checkpointEvery === 0) history.push({ x: epoch, y: crossEntropy(net, examples) })
  }
  return { net, history }
}

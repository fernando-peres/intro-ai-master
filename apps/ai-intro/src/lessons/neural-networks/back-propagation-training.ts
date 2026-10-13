import { classMeta, machineReadings } from "@/lessons/programming-vs-ml/dataset"
import {
  TEMP_DOMAIN,
  toInput as toMachineInput,
  VIB_DOMAIN,
} from "@/lessons/programming-vs-ml/ml-training"
import { type ActivationName, type Example, mulberry32 } from "@/lib/neural-net"
import {
  DATASET_IDS,
  DATASET_TEXT,
  DATASETS,
  type Dataset,
  type DatasetId,
} from "./perceptron-data"

/** Config defaults for the Back-propagation page's playground. */
export const SEED = 7
export const DEFAULT_HIDDEN_LAYERS = [4, 4]
export const DEFAULT_ACTIVATION: ActivationName = "tanh"
/** Spans six orders of magnitude on purpose: the Rings dataset only misbehaves at the large end. */
export const LEARNING_RATE_PRESETS = [
  0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1, 3, 5, 7, 8, 9, 10, 30,
] as const
export const DEFAULT_LEARNING_RATE = 0.3
export const MAX_EPOCHS = 1000
export const EPOCHS_PER_TICK = 2
export const TARGET_LOSS = 0.05

export const MIN_LAYERS = 0
/** Raised from the Machine Learning lesson's 4, so depth can be pushed far enough to stall training. */
export const MAX_LAYERS = 8
export const MIN_NEURONS_PER_LAYER = 1
export const MAX_NEURONS_PER_LAYER = 8

/** A saturating activation is only worth flagging as "stuck" once it's had a real chance to train. */
export const MIN_EPOCHS_BEFORE_PLATEAU_CHECK = 40
/** Hidden-layer count from which a saturating activation reliably stalls (see spec's empirical sweep). */
export const PLATEAU_MIN_LAYERS = 6
/** How many trailing history entries to inspect for a stalled loss. */
export const PLATEAU_WINDOW = 15
/** Max loss swing across that window to call it "stalled." */
export const PLATEAU_EPSILON = 0.01

export const BACKPROP_DATASET_IDS = [...DATASET_IDS, "machines", "rings"] as const
export type BackPropDatasetId = (typeof BACKPROP_DATASET_IDS)[number]

/** Labels are untranslated English keys. Points stay in plot units; `toInput` maps them for the network. */
export type BackPropDataset = Dataset & {
  label: string
  description: string
  axes: [string, string]
  classes: [string, string]
  toInput: (x1: number, x2: number) => number[]
  /** Starting values for "Classify a new example". */
  sample: [number, number]
}

const round2 = (v: number) => Math.round(v * 100) / 100

/**
 * 24 points: a core (radius 0.8–2.4) inside a ring (radius 2.6–3.4), so the gap is thin and the
 * boundary must be a tight circle. With the default network it solves at η 0.3–1, bounces at 3
 * and diverges from 10 up.
 */
function rings(): BackPropDataset["points"] {
  const rand = mulberry32(5)
  const group = (y: 0 | 1, scale: number, near: number, spread: number) =>
    Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * 2 * Math.PI + rand() * 0.3
      const radius = (near + rand() * spread) * scale
      return {
        id: `rings-${y}-${i}`,
        x1: round2(radius * Math.cos(angle)),
        x2: round2(radius * Math.sin(angle)),
        y,
      }
    })
  return [...group(1, 2, 0.4, 0.8), ...group(0, 1, 2.6, 0.8)]
}

const machines: BackPropDataset = {
  label: "Machines",
  description:
    "The 30 machine readings from Programming vs ML: temperature and vibration, normal or at risk. Separating them needs a curve.",
  points: machineReadings.map((r, i) => ({
    id: `machines-${i}`,
    x1: r.temperature,
    x2: r.vibration,
    y: r.label === "at-risk" ? 1 : 0,
  })),
  separable: false,
  domain: { x: TEMP_DOMAIN, y: VIB_DOMAIN },
  axes: ["Temperature (°C)", "Vibration (mm/s)"],
  classes: [classMeta.normal.name, classMeta["at-risk"].name],
  toInput: (temperature, vibration) => toMachineInput({ temperature, vibration }),
  sample: [72, 5],
}

const ringsDataset: BackPropDataset = {
  label: "Rings",
  description:
    "A core of 12 points inside a ring of 12, with only a thin gap between. Needs a tight circle, and it is touchy: a big learning rate bounces instead of settling.",
  points: rings(),
  separable: false,
  domain: { x: [-4, 4], y: [-4, 4] },
  axes: ["x₁", "x₂"],
  classes: ["class 0", "class 1"],
  toInput: (x1, x2) => [x1, x2],
  sample: [0, 0],
}

export const BACKPROP_DATASETS: Record<BackPropDatasetId, BackPropDataset> = {
  ...(Object.fromEntries(
    DATASET_IDS.map((id) => [
      id,
      {
        ...DATASETS[id],
        ...DATASET_TEXT[id],
        axes: ["x₁", "x₂"],
        classes: ["class 0", "class 1"],
        toInput: (x1: number, x2: number) => [x1, x2],
        sample: [0.5, 0.5],
      },
    ]),
  ) as Record<DatasetId, BackPropDataset>),
  machines,
  rings: ringsDataset,
}

/** The dataset's points as (input, target) pairs, ready for `trainEpoch`/`predict`. */
export function toExamples(dataset: BackPropDatasetId): Example[] {
  const { points, toInput } = BACKPROP_DATASETS[dataset]
  return points.map((p) => ({ input: toInput(p.x1, p.x2), target: [p.y] }))
}

/**
 * True when loss has not moved by more than `epsilon` across the last `window` history entries —
 * the signal behind the vanishing-gradient status message. Pure function over already-tracked
 * history; no new instrumentation on the training engine.
 */
export function isPlateaued(
  history: { epoch: number; loss: number }[],
  window: number,
  epsilon: number,
): boolean {
  if (history.length < window + 1) return false
  const recent = history.slice(-(window + 1)).map((h) => h.loss)
  return Math.max(...recent) - Math.min(...recent) < epsilon
}

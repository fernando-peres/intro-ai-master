import { mulberry32 } from "@/lib/neural-net"
import type { Domain, PerceptronPoint } from "@/lib/perceptron"

/** Fixed fixtures for the Perceptron lesson. Point order and ids are stable across runs. */
export const DATASET_IDS = ["or", "and", "clusters", "xor", "moons"] as const
export type DatasetId = (typeof DATASET_IDS)[number]

export type Dataset = {
  points: PerceptronPoint[]
  /** Geometric fact about the fixture, verified in tests — never inferred from training. */
  separable: boolean
  /** Fixed, padded plot domain so axes never move during training. */
  domain: Domain
}

const BOOLEAN_INPUTS = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
] as const
const UNIT_DOMAIN: Domain = { x: [-0.25, 1.25], y: [-0.25, 1.25] }

function truthTable(id: string, targets: [0 | 1, 0 | 1, 0 | 1, 0 | 1]): PerceptronPoint[] {
  return BOOLEAN_INPUTS.map(([x1, x2], i) => ({ id: `${id}-${i}`, x1, x2, y: targets[i] }))
}

function clusters(): PerceptronPoint[] {
  const rand = mulberry32(7)
  const offset = () => (rand() * 2 - 1) * 0.15
  return Array.from({ length: 40 }, (_, i) => {
    const y = (i % 2) as 0 | 1
    const [cx, cy] = y === 1 ? [0.95, 0.9] : [0.15, 0.2]
    return { id: `clusters-${i}`, x1: cx + offset(), x2: cy + offset(), y }
  })
}

function moons(): PerceptronPoint[] {
  const ts = Array.from({ length: 30 }, (_, i) => (i * Math.PI) / 29)
  return [
    ...ts.map((t, i) => ({ id: `moons-${i}`, x1: Math.cos(t), x2: Math.sin(t), y: 0 as const })),
    ...ts.map((t, i) => ({
      id: `moons-${30 + i}`,
      x1: 1 - Math.cos(t),
      x2: 0.5 - Math.sin(t),
      y: 1 as const,
    })),
  ]
}

/** Untranslated English keys; callers pass them through `t`. */
export const DATASET_TEXT: Record<DatasetId, { label: string; description: string }> = {
  or: {
    label: "OR",
    description: "Four points: class 1 when either input is 1. One straight line separates them.",
  },
  and: {
    label: "AND",
    description:
      "Four points: class 1 only when both inputs are 1. One straight line separates them.",
  },
  clusters: {
    label: "2 clusters",
    description: "40 points in two well-separated groups. Any reasonable line works.",
  },
  xor: {
    label: "XOR",
    description:
      "Four points: class 1 when exactly one input is 1. No straight line separates them.",
  },
  moons: {
    label: "Moons",
    description: "Two interlocking half-circles of 30 points each. Separating them needs a curve.",
  },
}

export const DATASETS: Record<DatasetId, Dataset> = {
  or: { points: truthTable("or", [0, 1, 1, 1]), separable: true, domain: UNIT_DOMAIN },
  and: { points: truthTable("and", [0, 0, 0, 1]), separable: true, domain: UNIT_DOMAIN },
  clusters: { points: clusters(), separable: true, domain: UNIT_DOMAIN },
  xor: { points: truthTable("xor", [0, 1, 1, 0]), separable: false, domain: UNIT_DOMAIN },
  moons: { points: moons(), separable: false, domain: { x: [-1.25, 2.25], y: [-0.75, 1.25] } },
}

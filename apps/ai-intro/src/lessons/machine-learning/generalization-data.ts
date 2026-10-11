import { classificationMetrics } from "@/lib/metrics"
import { mulberry32 } from "@/lib/neural-net"

/** Group A (majority) lives at x < SPLIT; group B (minority) at x ≥ SPLIT, with the rule flipped. */
export const SPLIT = 0.65
export type GroupPoint = { x: number; y: number; label: 0 | 1; group: "A" | "B" }

const boundary = (x: number) => 0.5 + 0.2 * Math.sin((2 * Math.PI * x) / SPLIT)
/** The true rule: above the wave in group A, below the midline in group B. */
export const trueLabel = (x: number, y: number): 0 | 1 =>
  x < SPLIT ? (y > boundary(x) ? 1 : 0) : y < 0.5 ? 1 : 0

function point(group: "A" | "B", rand: () => number): GroupPoint {
  const x = group === "A" ? rand() * SPLIT : SPLIT + rand() * (1 - SPLIT)
  const y = rand()
  return { x, y, group, label: trueLabel(x, y) }
}

export type TrainSettings = {
  size: number
  minorityShare: number
  labelNoise: number
  seed: number
}

/**
 * A training sample: `minorityShare` of it from group B, and `labelNoise` of the labels replaced by
 * coin flips — so 40% noise leaves about 20% of labels actually wrong.
 */
export function makeTrainSet({
  size,
  minorityShare,
  labelNoise,
  seed,
}: TrainSettings): GroupPoint[] {
  const rand = mulberry32(seed)
  const minority = Math.round(size * minorityShare)
  return Array.from({ length: size }, (_, i) => {
    const p = point(i < minority ? "B" : "A", rand)
    return rand() < labelNoise ? { ...p, label: rand() < 0.5 ? 0 : 1 } : p
  })
}

/** Fixed, clean, balanced: 200 per group, so each group's accuracy is always measurable. */
export const testSet: GroupPoint[] = (() => {
  const rand = mulberry32(4242)
  return [
    ...Array.from({ length: 200 }, () => point("A", rand)),
    ...Array.from({ length: 200 }, () => point("B", rand)),
  ]
})()

/** How many independent training samples ("splits") each scenario is trained on. */
export const SPLITS = 5

/** One training sample per split: same settings, different seed, so only the luck of the draw differs. */
export function splitTrainSets(
  settings: Omit<TrainSettings, "seed">,
  baseSeed = 11,
): GroupPoint[][] {
  return Array.from({ length: SPLITS }, (_, run) =>
    makeTrainSet({ ...settings, seed: baseSeed + run }),
  )
}

export type Scores = {
  train: number
  test: number
  groupA: number
  groupB: number
  /** Train minus test for accuracy; test minus train for errors — positive means "worse on new data". */
  gap: number
  worst: number
}

/** Summarizes accuracy-style scores (higher is better) from a predictor's 0/1 calls. */
export function accuracyScores(
  train: GroupPoint[],
  predict: (x: number, y: number) => 0 | 1,
): Scores {
  const acc = (points: GroupPoint[]) =>
    points.filter((p) => predict(p.x, p.y) === p.label).length / Math.max(points.length, 1)
  const trainAcc = acc(train)
  const test = acc(testSet)
  const groupA = acc(testSet.filter((p) => p.group === "A"))
  const groupB = acc(testSet.filter((p) => p.group === "B"))
  return {
    train: trainAcc,
    test,
    groupA,
    groupB,
    gap: trainAcc - test,
    worst: Math.min(groupA, groupB),
  }
}

/**
 * Averages per-run scores into one summary. `worst` is the worse of the two group means, and
 * `spread` is how far apart the runs' test scores land: the variance signal.
 */
export function summarize(runs: Scores[]): Scores & { spread: number } {
  const mean = (pick: (s: Scores) => number) =>
    runs.reduce((sum, r) => sum + pick(r), 0) / runs.length
  const tests = runs.map((r) => r.test)
  const groupA = mean((r) => r.groupA)
  const groupB = mean((r) => r.groupB)
  return {
    train: mean((r) => r.train),
    test: mean((r) => r.test),
    groupA,
    groupB,
    gap: mean((r) => r.gap),
    worst: Math.min(groupA, groupB),
    spread: Math.max(...tests) - Math.min(...tests),
  }
}

export type Verdict = "underfit" | "good" | "memorize" | "imbalanced"

/**
 * Reads accuracy-style scores into one of the four situations the playground can force.
 * "Imbalanced" means one group generalizes (near its training score) while the other fails;
 * memorizing instead makes every group worse than training.
 */
export function accuracyVerdict(s: Scores): Verdict {
  const better = Math.max(s.groupA, s.groupB)
  if (s.train < 0.85) return "underfit"
  if (better - s.worst > 0.25 && s.train - better < 0.05) return "imbalanced"
  if (s.gap > 0.15) return "memorize"
  return "good"
}

export type GroupReport = {
  accuracy: number
  /** True-positive rate: class-1 points the model labels 1. */
  tpr: number
  /** False-positive rate: class-0 points the model labels 1. */
  fpr: number
  /** Of the points labelled 1, the share that really are class 1. */
  precision: number
  /** Share of the group the model labels 1, whatever their true class. */
  selectionRate: number
}

/** Per-group classification measures on the fixed test set, as in Bias & Fairness. */
export function groupReport(
  predict: (x: number, y: number) => 0 | 1,
): Record<"A" | "B", GroupReport> {
  const report = (group: "A" | "B"): GroupReport => {
    const pts = testSet.filter((p) => p.group === group)
    const m = classificationMetrics(
      pts.map((p) => p.label === 1),
      pts.map((p) => predict(p.x, p.y)),
    )
    return {
      accuracy: m.accuracy,
      tpr: m.recall,
      fpr: m.fp + m.tn ? m.fp / (m.fp + m.tn) : 0,
      precision: m.precision,
      selectionRate: (m.tp + m.fp) / pts.length,
    }
  }
  return { A: report("A"), B: report("B") }
}

/** The Bias & Fairness criteria as gaps between the groups (0 = equal), plus the four-fifths ratio. */
export function fairnessGaps(r: Record<"A" | "B", GroupReport>) {
  const gap = (pick: (g: GroupReport) => number) => Math.abs(pick(r.A) - pick(r.B))
  const rates = [r.A.selectionRate, r.B.selectionRate]
  return {
    demographicParity: gap((g) => g.selectionRate),
    disparateImpact: Math.max(...rates) ? Math.min(...rates) / Math.max(...rates) : 1,
    equalOpportunity: gap((g) => g.tpr),
    equalizedOdds: Math.max(
      gap((g) => g.tpr),
      gap((g) => g.fpr),
    ),
    predictiveParity: gap((g) => g.precision),
    worstGroup: Math.min(r.A.accuracy, r.B.accuracy),
  }
}

/** Averages each measure of several runs' group reports. */
export function meanGroupReport(reports: Record<"A" | "B", GroupReport>[]) {
  const avg = (group: "A" | "B"): GroupReport => {
    const mean = (pick: (g: GroupReport) => number) =>
      reports.reduce((sum, r) => sum + pick(r[group]), 0) / reports.length
    return {
      accuracy: mean((g) => g.accuracy),
      tpr: mean((g) => g.tpr),
      fpr: mean((g) => g.fpr),
      precision: mean((g) => g.precision),
      selectionRate: mean((g) => g.selectionRate),
    }
  }
  return { A: avg("A"), B: avg("B") }
}

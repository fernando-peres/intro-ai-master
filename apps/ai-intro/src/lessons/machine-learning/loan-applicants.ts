import { classificationMetrics } from "@/lib/metrics"
import { gaussian, mulberry32 } from "@/lib/neural-net"

/**
 * Synthetic, illustrative loan applicants: two groups with different repayment base rates, and
 * a credit score that under-rates group B's repayers (e.g. thinner credit histories).
 */
export type Applicant = { group: "A" | "B"; repaid: boolean; score: number }

const GROUP_SIZE = 150
const groups = [
  { group: "A" as const, baseRate: 0.65, repaidMean: 0.66, defaultMean: 0.4, spread: 0.14 },
  { group: "B" as const, baseRate: 0.45, repaidMean: 0.57, defaultMean: 0.4, spread: 0.16 },
]

export const applicants: Applicant[] = groups.flatMap((g, gi) => {
  const rand = mulberry32(300 + gi)
  const repaidCount = Math.round(GROUP_SIZE * g.baseRate)
  return Array.from({ length: GROUP_SIZE }, (_, i) => {
    const repaid = i < repaidCount
    const mean = repaid ? g.repaidMean : g.defaultMean
    const score = Math.min(0.99, Math.max(0.01, mean + g.spread * gaussian(rand)))
    return { group: g.group, repaid, score }
  })
})

export const GROUPS = ["A", "B"] as const

export function groupMetrics(group: "A" | "B", threshold: number) {
  const members = applicants.filter((a) => a.group === group)
  const m = classificationMetrics(
    members.map((a) => a.repaid),
    members.map((a) => a.score),
    threshold,
  )
  return {
    ...m,
    baseRate: members.filter((a) => a.repaid).length / members.length,
    selectionRate: (m.tp + m.fp) / members.length,
    tpr: m.recall,
    fpr: m.fp + m.tn ? m.fp / (m.fp + m.tn) : 0,
  }
}

/** Score histogram for one group's repayers or defaulters, as counts per 0.1-wide bin. */
export function scoreHistogram(group: "A" | "B", repaid: boolean) {
  const scores = applicants.filter((a) => a.group === group && a.repaid === repaid)
  return Array.from({ length: 10 }, (_, b) => ({
    x: b / 10 + 0.05,
    y: scores.filter((a) => Math.min(9, Math.floor(a.score * 10)) === b).length,
  }))
}

/** Four illustrative credit scores: how well each separates repayers, and whether it under-rates B. */
export const modelVariants = [
  {
    key: "fair-accurate",
    label: "Accurate and fair",
    repaid: [0.72, 0.72],
    default: 0.3,
    spread: 0.1,
  },
  {
    key: "unfair-accurate",
    label: "Accurate but unfair",
    repaid: [0.72, 0.5],
    default: 0.3,
    spread: 0.1,
  },
  {
    key: "fair-inaccurate",
    label: "Fair but inaccurate",
    repaid: [0.55, 0.55],
    default: 0.45,
    spread: 0.2,
  },
  {
    key: "unfair-inaccurate",
    label: "Inaccurate and unfair",
    repaid: [0.58, 0.4],
    default: 0.45,
    spread: 0.2,
  },
] as const

const SPLIT_GROUP_SIZE = 100

/**
 * Scores each variant on `splits` fresh test samples (approval threshold 0.5): overall accuracy
 * and the gap between the groups' true-positive rates.
 */
export function splitScores(variant: (typeof modelVariants)[number], splits = 5) {
  return Array.from({ length: splits }, (_, s) => {
    const sampleOf = (gi: number) => {
      const rand = mulberry32(900 + s * 10 + gi)
      const repaidCount = Math.round(SPLIT_GROUP_SIZE * groups[gi].baseRate)
      return Array.from({ length: SPLIT_GROUP_SIZE }, (_, i) => {
        const repaid = i < repaidCount
        const mean = repaid ? variant.repaid[gi] : variant.default
        return { repaid, score: mean + variant.spread * gaussian(rand) }
      })
    }
    const [a, b] = [sampleOf(0), sampleOf(1)]
    const metricsOf = (rows: { repaid: boolean; score: number }[]) =>
      classificationMetrics(
        rows.map((r) => r.repaid),
        rows.map((r) => r.score),
      )
    const [ma, mb, all] = [metricsOf(a), metricsOf(b), metricsOf([...a, ...b])]
    return { accuracy: all.accuracy, tprGap: Math.abs(ma.recall - mb.recall) }
  })
}

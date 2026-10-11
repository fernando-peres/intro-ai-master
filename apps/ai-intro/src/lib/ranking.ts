/** `relevance` lists each result's graded relevance (0 = irrelevant) in ranked order. */
export type RankedResults = number[]

const isRelevant = (grade: number) => grade > 0

export function precisionAtK(relevance: RankedResults, k: number): number {
  return relevance.slice(0, k).filter(isRelevant).length / k
}

/** `totalRelevant` counts every relevant item for the query, including ones never retrieved. */
export function recallAtK(relevance: RankedResults, k: number, totalRelevant: number): number {
  return relevance.slice(0, k).filter(isRelevant).length / totalRelevant
}

export function hitAtK(relevance: RankedResults, k: number): number {
  return relevance.slice(0, k).some(isRelevant) ? 1 : 0
}

/** 1 / rank of the first relevant result, or 0 if none was retrieved. */
export function reciprocalRank(relevance: RankedResults): number {
  const i = relevance.findIndex(isRelevant)
  return i < 0 ? 0 : 1 / (i + 1)
}

/** Mean of precision@i over every rank i holding a relevant result, divided by all relevant items. */
export function averagePrecisionAtRanks(relevance: RankedResults, totalRelevant: number): number {
  let hits = 0
  let sum = 0
  relevance.forEach((grade, i) => {
    if (isRelevant(grade)) {
      hits++
      sum += hits / (i + 1)
    }
  })
  return totalRelevant ? sum / totalRelevant : 0
}

/** Discounted cumulative gain with exponential gain: Σ (2^rel − 1) / log₂(i + 1). */
export function dcgAtK(relevance: RankedResults, k: number): number {
  return relevance.slice(0, k).reduce((s, rel, i) => s + (2 ** rel - 1) / Math.log2(i + 2), 0)
}

/** DCG divided by the best possible DCG for the same set of grades (`allGrades`, any order). */
export function ndcgAtK(relevance: RankedResults, k: number, allGrades: number[]): number {
  const ideal = dcgAtK(
    [...allGrades].sort((a, b) => b - a),
    k,
  )
  return ideal ? dcgAtK(relevance, k) / ideal : 0
}

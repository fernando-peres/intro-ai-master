/**
 * Illustrative search results: for each query, the relevance (0–3) of the top 10 results from two
 * rankers, and `allGrades` — the grades of every relevant document, retrieved or not.
 */
export const queries = [
  {
    query: "laptop for students",
    allGrades: [3, 3, 2, 1, 1],
    keyword: [1, 0, 3, 0, 0, 2, 0, 1, 0, 0],
    learned: [3, 2, 0, 3, 1, 0, 0, 0, 1, 0],
  },
  {
    query: "cheap flights to lisbon",
    allGrades: [3, 2, 2, 1],
    keyword: [0, 0, 2, 0, 3, 0, 1, 0, 0, 0],
    learned: [2, 3, 0, 0, 1, 0, 2, 0, 0, 0],
  },
  {
    query: "how to fix a flat tyre",
    allGrades: [3, 2, 1],
    keyword: [3, 0, 0, 1, 0, 0, 0, 2, 0, 0],
    learned: [0, 3, 2, 0, 0, 1, 0, 0, 0, 0],
  },
  {
    query: "python sort dictionary",
    allGrades: [3, 3, 2, 1],
    keyword: [0, 0, 0, 0, 1, 0, 3, 0, 0, 0],
    learned: [3, 0, 1, 0, 3, 0, 0, 2, 0, 0],
  },
]

export const RANKERS = [
  { key: "keyword" as const, label: "Keyword ranker", color: "var(--color-fg-muted)" },
  { key: "learned" as const, label: "Learned ranker", color: "var(--color-chart-warm)" },
]
export const KS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

/** Scaled dot-product attention on small matrices, so the lab's calculator uses the real formula. */

export type Matrix = number[][]

export function softmax(scores: number[]): number[] {
  const peak = Math.max(...scores)
  const weights = scores.map((s) => (s === Number.NEGATIVE_INFINITY ? 0 : Math.exp(s - peak)))
  const total = weights.reduce((a, b) => a + b, 0)
  return weights.map((w) => w / total)
}

export function matmul(a: Matrix, b: Matrix): Matrix {
  return a.map((row) => b[0].map((_, j) => row.reduce((sum, v, k) => sum + v * b[k][j], 0)))
}

const transpose = (m: Matrix): Matrix => m[0].map((_, j) => m.map((row) => row[j]))

export type AttentionResult = {
  Q: Matrix
  K: Matrix
  V: Matrix
  /** QKᵀ / √d_k, before the mask. */
  scores: Matrix
  /** softmax(scores + M): each query row sums to 1; masked keys are exactly 0. */
  weights: Matrix
  output: Matrix
}

/** `Q = XW_Q`, `K = XW_K`, `V = XW_V`, then `softmax(QKᵀ/√d_k + M)V`; `causal` masks future keys. */
export function scaledDotProductAttention(
  X: Matrix,
  Wq: Matrix,
  Wk: Matrix,
  Wv: Matrix,
  { causal }: { causal: boolean },
): AttentionResult {
  const Q = matmul(X, Wq)
  const K = matmul(X, Wk)
  const V = matmul(X, Wv)
  const scale = Math.sqrt(K[0].length)
  const scores = matmul(Q, transpose(K)).map((row) => row.map((s) => s / scale))
  const weights = scores.map((row, q) =>
    softmax(row.map((s, k) => (causal && k > q ? Number.NEGATIVE_INFINITY : s))),
  )
  return { Q, K, V, scores, weights, output: matmul(weights, V) }
}

/** Average of `weights[head][query][key]` over heads. */
export function meanHeads(weights: Matrix[]): Matrix {
  return weights[0].map((row, q) =>
    row.map((_, k) => weights.reduce((sum, head) => sum + head[q][k], 0) / weights.length),
  )
}

export type Attended = { token: string; weight: number; index: number }

/** The `count` keys one query attends to most, strongest first. */
export function topAttended(tokens: string[], row: number[], count: number): Attended[] {
  return row
    .map((weight, index) => ({ token: tokens[index], weight, index }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, count)
}

/** Three tokens in two dimensions, with fixed projections the student does not edit. */
export const TOY_DEFAULTS = {
  tokens: ["The", "cat", "sat"],
  X: [
    [1, 0],
    [0.5, 1],
    [0, 1],
  ] as Matrix,
  Wq: [
    [1, 0],
    [0, 1],
  ] as Matrix,
  Wk: [
    [1, 0.5],
    [0, 1],
  ] as Matrix,
  Wv: [
    [0.5, 0],
    [0, 0.5],
  ] as Matrix,
}

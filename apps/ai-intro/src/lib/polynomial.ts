/** Solves A·x = b by Gaussian elimination with partial pivoting; A must be square and non-singular. */
function solve(A: number[][], b: number[]): number[] {
  const n = b.length
  const m = A.map((row, i) => [...row, b[i]])
  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let r = col + 1; r < n; r++) if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r
    ;[m[col], m[pivot]] = [m[pivot], m[col]]
    for (let r = col + 1; r < n; r++) {
      const f = m[r][col] / m[col][col]
      for (let c = col; c <= n; c++) m[r][c] -= f * m[col][c]
    }
  }
  const x = new Array<number>(n).fill(0)
  for (let r = n - 1; r >= 0; r--) {
    let sum = m[r][n]
    for (let c = r + 1; c < n; c++) sum -= m[r][c] * x[c]
    x[r] = sum / m[r][r]
  }
  return x
}

/**
 * Least-squares polynomial of the given degree, with a ridge penalty `lambda` for stability.
 * Fits on x rescaled to [−1, 1] over the training range, so high degrees stay well-conditioned.
 */
export function fitPolynomial(
  xs: number[],
  ys: number[],
  degree: number,
  lambda = 1e-6,
): (x: number) => number {
  const lo = Math.min(...xs)
  const span = Math.max(...xs) - lo || 1
  const u = (x: number) => (2 * (x - lo)) / span - 1
  const features = (x: number) => Array.from({ length: degree + 1 }, (_, p) => u(x) ** p)
  const X = xs.map(features)
  const XtX = X[0].map((_, i) =>
    X[0].map(
      (_, j) => X.reduce((s, row) => s + row[i] * row[j], 0) + (i === j && i > 0 ? lambda : 0),
    ),
  )
  const Xty = X[0].map((_, i) => X.reduce((s, row, r) => s + row[i] * ys[r], 0))
  const w = solve(XtX, Xty)
  return (x) => features(x).reduce((s, f, i) => s + f * w[i], 0)
}

export function meanSquaredError(f: (x: number) => number, xs: number[], ys: number[]): number {
  return xs.reduce((s, x, i) => s + (f(x) - ys[i]) ** 2, 0) / xs.length
}

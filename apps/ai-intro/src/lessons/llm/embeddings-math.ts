/** Vector maths for the Embeddings lab, run in the browser on vectors the server returned. */

export type Vector = number[]
export type Metric = "cosine" | "dot" | "euclidean" | "manhattan"
export type PairMetrics = {
  dot: number
  cosine: number
  euclidean: number
  manhattan: number
  norms: [number, number]
}

export const dot = (a: Vector, b: Vector) => a.reduce((sum, v, i) => sum + v * b[i], 0)

export const norm = (a: Vector) => Math.sqrt(dot(a, a))

/** The unit vector in `a`'s direction; the zero vector stays zero. */
export function normalize(a: Vector): Vector {
  const n = norm(a)
  return n === 0 ? a.map(() => 0) : a.map((v) => v / n)
}

/** 0 when either vector is zero. */
export function cosine(a: Vector, b: Vector) {
  const denominator = norm(a) * norm(b)
  return denominator === 0 ? 0 : dot(a, b) / denominator
}

export const euclidean = (a: Vector, b: Vector) =>
  Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0))

export const manhattan = (a: Vector, b: Vector) =>
  a.reduce((sum, v, i) => sum + Math.abs(v - b[i]), 0)

/** With `normalized`, both vectors are scaled to unit length first, so dot equals cosine. */
export function metrics(
  a: Vector,
  b: Vector,
  { normalized }: { normalized: boolean },
): PairMetrics {
  const [x, y] = normalized ? [normalize(a), normalize(b)] : [a, b]
  return {
    dot: dot(x, y),
    cosine: cosine(x, y),
    euclidean: euclidean(x, y),
    manhattan: manhattan(x, y),
    norms: [norm(x), norm(y)],
  }
}

const measures: Record<Metric, (a: Vector, b: Vector) => number> = {
  cosine,
  dot,
  euclidean,
  manhattan,
}

/** `matrix[i][j]` is `metric(vectors[i], vectors[j])`; symmetric by construction. */
export function similarityMatrix(vectors: Vector[], metric: Metric): number[][] {
  const measure = measures[metric]
  const matrix = vectors.map(() => vectors.map(() => 0))
  for (let i = 0; i < vectors.length; i++) {
    for (let j = i; j < vectors.length; j++) {
      const value = measure(vectors[i], vectors[j])
      matrix[i][j] = value
      matrix[j][i] = value
    }
  }
  return matrix
}

/** The `k` items most cosine-similar to `vectors[index]`, best first, excluding itself. */
export function nearest(index: number, vectors: Vector[], k: number) {
  return vectors
    .map((vector, i) => ({ index: i, score: cosine(vectors[index], vector) }))
    .filter((item) => item.index !== index)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
}

/** A point's PCA coordinates: `components · (vector − mean)`, one per component. */
export function projectIntoBasis(vector: Vector, mean: Vector, components: Vector[]): Vector {
  const centered = vector.map((v, i) => v - mean[i])
  return components.map((component) => dot(centered, component))
}

/** `digits` decimals (default 2); a rounded zero never prints a minus sign. */
export function fmt(value: number, digits = 2) {
  const text = value.toFixed(digits)
  return Number(text) === 0 ? (0).toFixed(digits) : text
}

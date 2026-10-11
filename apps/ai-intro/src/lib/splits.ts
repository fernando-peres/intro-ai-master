import { mulberry32 } from "./neural-net"

function shuffled(indices: number[], rand: () => number): number[] {
  const out = [...indices]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Shuffles 0..n−1 and deals them into `k` folds of near-equal size. */
export function randomFolds(n: number, k: number, seed: number): number[][] {
  const folds: number[][] = Array.from({ length: k }, () => [])
  shuffled(
    Array.from({ length: n }, (_, i) => i),
    mulberry32(seed),
  ).forEach((index, i) => {
    folds[i % k].push(index)
  })
  return folds
}

/**
 * Deals each key's members round-robin across `k` folds, so every fold keeps each key's share
 * (within one item). Keys may be composite, e.g. `"fraud|B"`, to stratify on class and group.
 */
export function stratifiedFolds(keys: string[], k: number, seed: number): number[][] {
  const rand = mulberry32(seed)
  const folds: number[][] = Array.from({ length: k }, () => [])
  let next = 0
  for (const key of [...new Set(keys)].sort()) {
    const members = keys.flatMap((x, i) => (x === key ? [i] : []))
    for (const index of shuffled(members, rand)) {
      folds[next % k].push(index)
      next++
    }
  }
  return folds
}

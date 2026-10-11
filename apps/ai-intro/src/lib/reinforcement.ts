import { mulberry32 } from "./neural-net"

export type BanditRun = {
  /** Mean reward at each step, averaged over runs. */
  reward: number[]
  /** Share of runs that pulled the best arm at each step. */
  optimal: number[]
  /** Expected reward lost versus always pulling the best arm, summed up to each step. */
  regret: number[]
}

/**
 * ε-greedy on a Bernoulli bandit (`means` = each arm's payout probability), with sample-average
 * value estimates starting at 0 and ties broken by lowest arm index.
 */
export function runBandit(
  means: number[],
  epsilon: number,
  { steps = 500, runs = 200, seed = 1 } = {},
): BanditRun {
  const rand = mulberry32(seed)
  const best = means.indexOf(Math.max(...means))
  const reward = new Array<number>(steps).fill(0)
  const optimal = new Array<number>(steps).fill(0)
  const regretStep = new Array<number>(steps).fill(0)
  for (let r = 0; r < runs; r++) {
    const value = means.map(() => 0)
    const pulls = means.map(() => 0)
    for (let t = 0; t < steps; t++) {
      const arm =
        rand() < epsilon ? Math.floor(rand() * means.length) : value.indexOf(Math.max(...value))
      const payout = rand() < means[arm] ? 1 : 0
      pulls[arm]++
      value[arm] += (payout - value[arm]) / pulls[arm]
      reward[t] += payout / runs
      optimal[t] += (arm === best ? 1 : 0) / runs
      regretStep[t] += (means[best] - means[arm]) / runs
    }
  }
  let total = 0
  const regret = regretStep.map((v) => (total += v))
  return { reward, optimal, regret }
}

export type GridCell = "." | "S" | "G" | "X"
export const ACTIONS = [
  { name: "up", dr: -1, dc: 0, arrow: "↑" },
  { name: "right", dr: 0, dc: 1, arrow: "→" },
  { name: "down", dr: 1, dc: 0, arrow: "↓" },
  { name: "left", dr: 0, dc: -1, arrow: "←" },
] as const

export type QLearningRun = {
  /** Undiscounted return of each episode, averaged over runs. */
  returns: number[]
  /** Steps taken in each episode, averaged over runs. */
  lengths: number[]
  /** Share of runs whose episode reached the goal. */
  success: number[]
  /** Greedy action index per cell after training, from the first run. */
  policy: number[][]
}

/**
 * Tabular Q-learning on a grid: −1 per step, +10 at G, −10 in a pit X (both end the episode),
 * bumping a wall leaves the agent in place, and an episode is cut off after `maxSteps`.
 */
export function runQLearning(
  grid: GridCell[][],
  {
    episodes = 150,
    runs = 30,
    alpha = 0.5,
    gamma = 0.95,
    epsilon = 0.1,
    maxSteps = 60,
    seed = 1,
  } = {},
): QLearningRun {
  const rand = mulberry32(seed)
  const rows = grid.length
  const cols = grid[0].length
  const start = grid
    .flatMap((row, r) => row.map((c, col) => ({ c, r, col })))
    .find((x) => x.c === "S")
  if (!start) throw new Error("grid needs an S cell")
  const returns = new Array<number>(episodes).fill(0)
  const lengths = new Array<number>(episodes).fill(0)
  const success = new Array<number>(episodes).fill(0)
  let policy: number[][] = []

  for (let run = 0; run < runs; run++) {
    const q = grid.map((row) => row.map(() => ACTIONS.map(() => 0)))
    const greedy = (r: number, c: number) => q[r][c].indexOf(Math.max(...q[r][c]))
    for (let ep = 0; ep < episodes; ep++) {
      let [r, c] = [start.r, start.col]
      let total = 0
      let steps = 0
      let reached = false
      while (steps < maxSteps) {
        const a = rand() < epsilon ? Math.floor(rand() * ACTIONS.length) : greedy(r, c)
        const nr = Math.min(rows - 1, Math.max(0, r + ACTIONS[a].dr))
        const nc = Math.min(cols - 1, Math.max(0, c + ACTIONS[a].dc))
        const cell = grid[nr][nc]
        const reward = cell === "G" ? 10 : cell === "X" ? -10 : -1
        const done = cell === "G" || cell === "X"
        const target = reward + (done ? 0 : gamma * Math.max(...q[nr][nc]))
        q[r][c][a] += alpha * (target - q[r][c][a])
        total += reward
        steps++
        ;[r, c] = [nr, nc]
        if (done) {
          reached = cell === "G"
          break
        }
      }
      returns[ep] += total / runs
      lengths[ep] += steps / runs
      success[ep] += (reached ? 1 : 0) / runs
    }
    if (run === 0) policy = grid.map((row, r) => row.map((_, c) => greedy(r, c)))
  }
  return { returns, lengths, success, policy }
}

/** Trailing moving average over `window` points, for smoothing noisy per-episode curves. */
export function movingAverage(values: number[], window: number): number[] {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1)
    return slice.reduce((s, v) => s + v, 0) / slice.length
  })
}

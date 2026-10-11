import { type GridCell, runBandit, runQLearning } from "@/lib/reinforcement"

/** Five slot machines' payout probabilities; the agent only ever sees the coins that drop. */
export const ARM_MEANS = [0.2, 0.5, 0.35, 0.8, 0.6]
export const BANDIT_STEPS = 500
export const EPSILONS = [0, 0.1, 0.3]
export const BANDIT_RUNS = 300
export const GRID_RUNS = 40
export const GAMMA = 0.95
export const bandits = EPSILONS.map((epsilon) => ({
  epsilon,
  ...runBandit(ARM_MEANS, epsilon, { steps: BANDIT_STEPS, runs: BANDIT_RUNS, seed: 21 }),
}))

/** S = start, G = goal (+10), X = pit (−10), every step −1. */
export const GRID: GridCell[][] = [
  [".", ".", ".", ".", "G"],
  [".", "X", ".", "X", "."],
  [".", ".", ".", ".", "."],
  ["S", ".", "X", ".", "."],
]
export const EPISODES = 150
export const gridRun = runQLearning(GRID, {
  episodes: EPISODES,
  runs: GRID_RUNS,
  gamma: GAMMA,
  seed: 5,
})
/** Fewest steps from S to G, for comparison with what the agent learns. */
export const OPTIMAL_STEPS = 7

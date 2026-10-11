import { type GridCell, movingAverage, runBandit, runQLearning } from "./reinforcement"

test("an exploring bandit agent ends up mostly pulling the best arm", () => {
  const run = runBandit([0.2, 0.8, 0.4], 0.1, { steps: 300, runs: 50 })
  expect(run.optimal.at(-1)).toBeGreaterThan(0.7)
  expect(run.regret.at(-1)).toBeGreaterThan(0)
})

test("regret never decreases", () => {
  const { regret } = runBandit([0.5, 0.6], 0.2, { steps: 100, runs: 10 })
  for (let i = 1; i < regret.length; i++) expect(regret[i]).toBeGreaterThanOrEqual(regret[i - 1])
})

test("Q-learning learns to reach the goal on a small grid", () => {
  const grid: GridCell[][] = [
    [".", ".", "G"],
    ["S", ".", "."],
  ]
  const run = runQLearning(grid, { episodes: 80, runs: 5, epsilon: 0.05 })
  expect(run.success.at(-1)).toBe(1)
  expect(run.lengths.at(-1)).toBeLessThan(5)
})

test("moving average smooths over the trailing window", () => {
  expect(movingAverage([0, 2, 4, 6], 2)).toEqual([0, 1, 3, 5])
})

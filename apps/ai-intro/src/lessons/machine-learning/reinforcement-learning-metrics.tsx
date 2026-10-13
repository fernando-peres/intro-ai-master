import { LineChart } from "@/components/charts/line-chart"
import {
  LessonArticle,
  LessonFooter,
  LessonHero,
  LessonLead,
} from "@/components/course/lesson-layout"
import type { LessonEntry } from "@/curriculum"
import { useTranslation } from "@/i18n/use-translation"
import { ACTIONS, movingAverage } from "@/lib/reinforcement"
import { CheatSheet, MetricSection, OptionList, StatRow, Takeaway } from "./metric-section"
import {
  ARM_MEANS,
  BANDIT_RUNS,
  BANDIT_STEPS,
  bandits,
  EPISODES,
  GAMMA,
  GRID,
  GRID_RUNS,
  gridRun,
  OPTIMAL_STEPS,
} from "./rl-environments"

const COLORS = ["var(--color-fg-muted)", "var(--color-chart-warm)", "var(--color-chart-amber)"]
const SMOOTH = 10
const series = (pick: (b: (typeof bandits)[number]) => number[], smooth = 1) =>
  bandits.map((b, i) => ({
    key: String(b.epsilon),
    label: b.epsilon === 0 ? "greedy (ε = 0)" : `ε = ${b.epsilon}`,
    color: COLORS[i],
    points: movingAverage(pick(b), smooth).map((y, t) => ({ x: t + 1, y })),
  }))
const perEpisode = (values: number[]) =>
  movingAverage(values, SMOOTH).map((y, i) => ({ x: i + 1, y }))

const bestArm = Math.max(...ARM_MEANS)
const smoothedSuccess = movingAverage(gridRun.success, SMOOTH)
const SUCCESS_TARGET = 0.8
const episodesToTarget = smoothedSuccess.findIndex((s) => s >= SUCCESS_TARGET) + 1
const lastWindow = (values: number[]) => values.slice(-SMOOTH).reduce((s, v) => s + v, 0) / SMOOTH
// ---- Worked examples: the ε = 0.1 agent, and the gridworld's last episodes ----
const REWARD_WINDOW = 20
const explorer = bandits[1]
const lastRewards = explorer.reward.slice(-REWARD_WINDOW)
const rewardTotal = lastRewards.reduce((s, v) => s + v, 0) * BANDIT_RUNS
const finalRegret = explorer.regret[explorer.regret.length - 1]
const bestTotal = BANDIT_STEPS * Math.max(...ARM_MEANS)
const finalOptimal = explorer.optimal[explorer.optimal.length - 1]
/** The shortest path: OPTIMAL_STEPS − 1 ordinary steps at −1, then the goal's +10. */
const shortestReturn = -(OPTIMAL_STEPS - 1) + 10
const shortestDiscounted =
  -Array.from({ length: OPTIMAL_STEPS - 1 }, (_, i) => GAMMA ** i).reduce((s, v) => s + v, 0) +
  GAMMA ** (OPTIMAL_STEPS - 1) * 10
const f2 = (v: number) => v.toFixed(2)

const pct = (v: number) => `${Math.round(v * 100)}%`

function GridPolicy() {
  const { t } = useTranslation()
  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${GRID[0].length}, minmax(0, 1fr))` }}
      role="img"
      aria-label={t(
        "Gridworld with the learned greedy action in each cell: S start, G goal, X pits.",
      )}
    >
      {GRID.flatMap((row, r) =>
        row.map((cell, c) => {
          const tone =
            cell === "G"
              ? "border-success text-success"
              : cell === "X"
                ? "border-error text-error"
                : "border-divider text-fg"
          const label = cell === "." || cell === "S" ? ACTIONS[gridRun.policy[r][c]].arrow : cell
          return (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: a cell's row and column are its identity
              key={`${r}-${c}`}
              className={`flex aspect-square flex-col items-center justify-center rounded-[2px] border bg-surface font-ui text-lg ${tone}`}
            >
              {t(label)}
              {cell === "S" && <span className="text-[10px] text-fg-muted">{t("start")}</span>}
              {cell === "G" && <span className="text-[10px]">+10</span>}
              {cell === "X" && <span className="text-[10px]">−10</span>}
            </div>
          )
        }),
      )}
    </div>
  )
}

export function ReinforcementLearningMetricsLesson({ entry }: { entry: LessonEntry }) {
  const { t } = useTranslation()
  return (
    <LessonArticle entry={entry}>
      <LessonHero line1={t("Reinforcement")} line2={t("learning metrics")} />
      <LessonLead>
        {t(
          "In reinforcement learning there is no answer key at all. An agent acts, the world hands back a reward, and the agent must learn which actions pay off — while it is still being scored. So RL metrics track reward over time:",
        )}
      </LessonLead>
      <OptionList
        items={[
          t("how much was earned;"),
          t("how much was lost while learning;"),
          t("how quickly and reliably the agent got good."),
        ]}
      />
      <Takeaway>
        {t("In RL, how an agent learns is measured as carefully as where it ends up.")}
      </Takeaway>
      <p className="text-fg-secondary">
        {t("Two classic examples. A ")}
        <span className="text-fg">{t("multi-armed bandit")}</span>
        {t(": five slot machines paying out with hidden probabilities (")}
        {ARM_MEANS.join(", ")}
        {t("); the agent pulls one per step for ")}
        {BANDIT_STEPS} {t(" steps, averaged over 300 runs. A")}{" "}
        <span className="text-fg">{t("gridworld")}</span>
        {t(": Q-learning finds its way from start to goal around pits, for ")}
        {EPISODES} {t(" episodes, averaged over 40 runs. ")}
      </p>

      <MetricSection
        number="1"
        worked={
          <p>
            {t("ε = 0.1, last {0} steps: ", [REWARD_WINDOW])}r̄ = {rewardTotal.toFixed(0)} / (
            {REWARD_WINDOW}·{BANDIT_RUNS}) = {f2(rewardTotal / (REWARD_WINDOW * BANDIT_RUNS))}
          </p>
        }
        title={t("Average reward per step")}
        what={<p>{t("The reward the agent collects at each step, averaged across runs.")}</p>}
        why={
          <p>
            {t(
              'The most direct reading of "is it learning?". Each agent here explores with probability ε: always exploiting (ε = 0) locks onto the first machine and never finds a better one; exploring a little climbs towards the best payout of ',
            )}
            {bestArm}
            {t("; exploring a lot keeps paying for its curiosity. ")}
          </p>
        }
        formulas={<p>r̄ₜ = (1/runs)·Σ rₜ</p>}
      >
        <LineChart
          series={series((b) => b.reward, 20)}
          xLabel={t("Step")}
          yLabel={t("Reward ({0}-step average)", [20])}
        />
      </MetricSection>

      <MetricSection
        number="2"
        worked={
          <p>
            {t("ε = 0.1: ")}Regret({BANDIT_STEPS}) = {BANDIT_STEPS}·{f2(Math.max(...ARM_MEANS))} −{" "}
            {(bestTotal - finalRegret).toFixed(1)} = {bestTotal.toFixed(0)} −{" "}
            {(bestTotal - finalRegret).toFixed(1)} = {finalRegret.toFixed(1)}
          </p>
        }
        title={t("Cumulative regret")}
        what={
          <p>
            {t(
              "The reward lost, summed over time, compared with an oracle that always pulled the best machine. ",
            )}
          </p>
        }
        why={
          <p>
            {t(
              "It charges the agent for every exploratory or mistaken pull, so it measures the cost of learning itself. A flattening curve means the agent has stopped losing; a straight line means it never learned. Lower is better. ",
            )}
          </p>
        }
        formulas={<p>Regret(T) = T·μ* − Σₜ E[rₜ]</p>}
      >
        <StatRow
          stats={bandits.map((b) => ({
            label: b.epsilon === 0 ? "greedy" : `ε = ${b.epsilon}`,
            value: b.regret[b.regret.length - 1].toFixed(0),
          }))}
        />
        <LineChart
          series={series((b) => b.regret)}
          xLabel={t("Step")}
          yLabel={t("Cumulative regret")}
        />
      </MetricSection>

      <MetricSection
        number="3"
        worked={
          <p>
            {t("ε = 0.1, step {0}: ", [BANDIT_STEPS])}
            {Math.round(finalOptimal * BANDIT_RUNS)} / {BANDIT_RUNS} {t("runs")} ={" "}
            {f2(finalOptimal)}
          </p>
        }
        title={t("Optimal action rate")}
        what={<p>{t("The share of runs that chose the best machine at each step.")}</p>}
        why={
          <p>
            {t(
              'Separates "picks the right action" from "got lucky with a payout". It is only available in a simulation where you know the best action — in the real world you rarely do. ',
            )}
          </p>
        }
        formulas={<p>P(aₜ = a*)</p>}
      >
        <LineChart
          series={series((b) => b.optimal, 20)}
          xLabel={t("Step")}
          yLabel={t("Best machine chosen")}
        />
      </MetricSection>

      <MetricSection
        number="4"
        worked={
          <>
            <p>
              {t("shortest path: ")}G = {OPTIMAL_STEPS - 1}·(−1) + 10 = {shortestReturn}
            </p>
            <p>
              Gᵧ = −(1 + {GAMMA} + … + {GAMMA}^{OPTIMAL_STEPS - 2}) + {GAMMA}^{OPTIMAL_STEPS - 1}·10
              = {f2(shortestDiscounted)}
            </p>
            <p>
              {t("last {0} episodes, mean return: ", [SMOOTH])}
              {f2(lastWindow(gridRun.returns))}
            </p>
          </>
        }
        title={t("Episode return")}
        what={
          <p>
            {t(
              "Many tasks come in episodes — a game, a trip from start to goal. The return is the total reward of one episode: here −1 per step, +10 at the goal, −10 in a pit. Training itself maximizes the ",
            )}
            <em>{t("discounted")}</em> {t(" return, which values sooner rewards more. ")}
          </p>
        }
        why={
          <p>
            {t(
              "The headline metric of most RL papers: plot it per episode (smoothed — single episodes are noisy) and it should rise and level off. The arrows show the action this agent settled on in each cell. ",
            )}
          </p>
        }
        formulas={
          <>
            <p>G = Σₜ rₜ (reported)</p>
            <p>Gᵧ = Σₜ γᵗ·rₜ, γ = 0.95 (optimized)</p>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="w-full max-w-[300px]">
            <GridPolicy />
          </div>
          <LineChart
            series={[
              {
                key: "return",
                label: "return",
                color: "var(--color-fg)",
                points: perEpisode(gridRun.returns),
              },
            ]}
            xLabel={t("Episode")}
            yLabel={t("Return ({0}-episode average)", [SMOOTH])}
          />
        </div>
      </MetricSection>

      <MetricSection
        number="5"
        worked={
          <p>
            {t("last {0} episodes: ", [SMOOTH])}(
            {gridRun.lengths
              .slice(-SMOOTH)
              .map((v) => v.toFixed(1))
              .join(" + ")}
            ) / {SMOOTH} = {lastWindow(gridRun.lengths).toFixed(1)} {t("vs. shortest")}{" "}
            {OPTIMAL_STEPS}
          </p>
        }
        title={t("Episode length")}
        what={<p>{t("Steps taken per episode, until the goal, a pit, or the step limit.")}</p>}
        why={
          <p>
            {t(
              'For "get there" tasks, shorter is better, and comparing against the best possible path ( ',
            )}
            {OPTIMAL_STEPS}{" "}
            {t(" steps here) shows how close to optimal the agent is. It ends at about")}{" "}
            {lastWindow(gridRun.lengths).toFixed(1)} {t(" steps. ")}
          </p>
        }
      >
        <LineChart
          series={[
            {
              key: "length",
              label: t("steps per episode"),
              color: "var(--color-chart-cool)",
              points: perEpisode(gridRun.lengths),
            },
            {
              key: "optimal",
              label: t("shortest path"),
              color: "var(--color-fg-muted)",
              dashed: true,
              points: [
                { x: 1, y: OPTIMAL_STEPS },
                { x: EPISODES, y: OPTIMAL_STEPS },
              ],
            },
          ]}
          xLabel={t("Episode")}
          yLabel="Steps"
        />
      </MetricSection>

      <MetricSection
        number="6"
        worked={
          <p>
            {t("last {0} episodes: ", [SMOOTH])}
            {Math.round(lastWindow(gridRun.success) * SMOOTH * GRID_RUNS)} / ({SMOOTH}·{GRID_RUNS}){" "}
            {t("episodes reached G")} = {pct(lastWindow(gridRun.success))}
          </p>
        }
        title={t("Success rate and sample efficiency")}
        what={
          <p>
            {t(
              "Success rate: the share of episodes that reach the goal. Sample efficiency: how much experience it takes to get there — here, episodes until the smoothed success rate first reaches ",
            )}
            {pct(SUCCESS_TARGET)}.
          </p>
        }
        why={
          <p>
            {t(
              "Success is what a user cares about; sample efficiency is what a robot or a simulator budget cares about. It never reaches 100% here: the agent still explores 10% of the time, and a random step next to a pit can be fatal. Always report results over several random seeds — RL is notoriously variable from run to run. ",
            )}
          </p>
        }
        formulas={<p>success rate = episodes reaching G / episodes</p>}
      >
        <StatRow
          stats={[
            {
              label: t("episodes to {0}", [pct(SUCCESS_TARGET)]),
              value: episodesToTarget > 0 ? String(episodesToTarget) : "—",
            },
            { label: t("last {0} episodes", [SMOOTH]), value: pct(lastWindow(gridRun.success)) },
          ]}
        />
        <LineChart
          series={[
            {
              key: "success",
              label: t("success rate"),
              color: "var(--color-brand)",
              points: perEpisode(gridRun.success),
            },
          ]}
          xLabel={t("Episode")}
          yLabel={t("Success ({0}-episode average)", [SMOOTH])}
          vLines={
            episodesToTarget > 0 ? [{ x: episodesToTarget, label: pct(SUCCESS_TARGET) }] : undefined
          }
        />
      </MetricSection>

      <CheatSheet
        number="7"
        rows={[
          {
            metric: t("Average reward"),
            question: t("Is it earning more over time?"),
            use: t("Continuing tasks with no episodes."),
          },
          {
            metric: t("Cumulative regret"),
            question: t("What did learning cost?"),
            use: t("Bandits, online systems (ads, A/B tests)."),
          },
          {
            metric: t("Optimal action rate"),
            question: t("Does it pick the best action?"),
            use: t("Simulations where the best action is known."),
          },
          {
            metric: t("Episode return"),
            question: t("How good is a whole episode?"),
            use: t("Games, control, most RL benchmarks."),
          },
          {
            metric: t("Episode length"),
            question: t("How fast does it finish?"),
            use: t("Navigation and other get-there tasks."),
          },
          {
            metric: t("Success rate / sample efficiency"),
            question: t("Does it succeed, and how soon?"),
            use: t("Goal tasks; costly real-world experience."),
          },
        ]}
      />

      <LessonFooter entry={entry} />
    </LessonArticle>
  )
}

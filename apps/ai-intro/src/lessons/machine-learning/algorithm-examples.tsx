import { GaugeIcon, NetworkIcon, TargetIcon } from "lucide-react"
import { LineChart } from "@/components/charts/line-chart"
import { ScatterChart } from "@/components/charts/scatter-chart"
import { TreeDiagram, type TreeDiagramNode } from "@/components/charts/tree-diagram"
import { useTranslation } from "@/i18n/use-translation"
import { classifyTree, type DecisionTree, id3, informationGain } from "@/lib/decision-tree"
import { daviesBouldin, kMeans, silhouetteScore } from "@/lib/kmeans"
import { classificationMetrics, regressionMetrics } from "@/lib/metrics"
import { createNetwork, predict } from "@/lib/neural-net"
import { machineReadings } from "../programming-vs-ml/dataset"
import {
  DEFAULT_ACTIVATION,
  DEFAULT_HIDDEN_LAYERS,
  SEED,
  TEMP_DOMAIN,
  toInput,
  trainWithLossHistory,
  VIB_DOMAIN,
} from "../programming-vs-ml/ml-training"
import { NetworkDiagram } from "../programming-vs-ml/network-diagram"
import {
  AlgorithmCard,
  AlgorithmColumn,
  ClassificationEvaluation,
  Explanation,
  Formula,
  MetricList,
} from "./algorithm-card"
import {
  examResults,
  housePrices,
  irisSample,
  playTennis,
  playTennisAttributes,
} from "./classic-datasets"
import {
  areas,
  examFit,
  examScores,
  houseFit,
  irisPoints,
  passProbability,
  priceAt,
  prices,
} from "./classic-models"

const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1)
const signed = (v: number, digits: number) => `${v < 0 ? "−" : "+"} ${Math.abs(v).toFixed(digits)}`
const range = (from: number, to: number, steps: number) =>
  Array.from({ length: steps + 1 }, (_, i) => from + ((to - from) * i) / steps)

// ---- Decision tree: ID3 on Play Tennis ----
const tennisTree = id3(playTennis, playTennisAttributes, "play")
const rootGains = playTennisAttributes
  .map((a) => ({ attribute: a, gain: informationGain(playTennis, a, "play") }))
  .sort((a, b) => b.gain - a.gain)
const tennisTrainCorrect = playTennis.filter((r) => classifyTree(tennisTree, r) === r.play).length
/** Leave-one-out: rebuild the tree without each day, then ask it about that unseen day. */
const tennisHeldOut = classificationMetrics(
  playTennis.map((r) => r.play === "Yes"),
  playTennis.map((r, i) => {
    const tree = id3(
      playTennis.filter((_, j) => j !== i),
      playTennisAttributes,
      "play",
    )
    return classifyTree(tree, r) === "Yes" ? 1 : 0
  }),
)

function toDiagram(tree: DecisionTree): TreeDiagramNode {
  if (tree.kind === "leaf") {
    return {
      label: tree.label,
      color: tree.label === "Yes" ? "var(--color-chart-cool)" : "var(--color-brand)",
    }
  }
  return {
    label: `${capitalize(tree.attribute)}?`,
    children: tree.branches.map((b) => ({ edge: b.value, node: toDiagram(b.child) })),
  }
}

// ---- Linear regression: house prices ----
const houseMetrics = regressionMetrics(prices, areas.map(priceAt))

// ---- Logistic regression: hours studied → pass ----
const passThreshold = -examFit.bias / examFit.weight
const examMetrics = classificationMetrics(
  examResults.map((r) => r.passed === 1),
  examScores,
)

// ---- Clustering: k-means on Iris petals, species hidden ----
const K = 3
const irisClusters = kMeans(irisPoints, K, SEED, 10)
const irisSilhouette = silhouetteScore(irisPoints, irisClusters.assignments)
const irisDaviesBouldin = daviesBouldin(
  irisPoints,
  irisClusters.assignments,
  irisClusters.centroids,
)
/** Final inertia for k = 1..6: the "elbow" where adding a cluster stops paying off. */
const elbow = [1, 2, 3, 4, 5, 6].map((k) => ({
  x: k,
  y: kMeans(irisPoints, k, SEED, 10).inertiaHistory.at(-1) ?? 0,
}))
/** Checked only afterwards: how many flowers share their cluster with their own species' majority. */
const irisAgreement = [0, 1, 2].reduce((sum, c) => {
  const species = irisSample
    .filter((_, i) => irisClusters.assignments[i] === c)
    .map((f) => f.species)
  return sum + Math.max(0, ...species.map((s) => species.filter((t) => t === s).length))
}, 0)
const clusterColors = ["var(--color-chart-cool)", "var(--color-brand)", "var(--color-fg-secondary)"]

// ---- Neural network: the chapter's own machines ----
const nnArchitecture = [2, ...DEFAULT_HIDDEN_LAYERS, 1]
const representationNet = createNetwork(nnArchitecture, SEED, DEFAULT_ACTIVATION)
const nn = trainWithLossHistory(nnArchitecture, DEFAULT_ACTIVATION, 300, 10)
const nnMetrics = classificationMetrics(
  machineReadings.map((r) => r.label === "at-risk"),
  machineReadings.map((r) => predict(nn.net, toInput(r))[0]),
)

function GainBars() {
  const { t } = useTranslation()
  const max = rootGains[0].gain
  return (
    <div
      className="flex flex-col gap-2 rounded-[2px] border border-divider bg-canvas p-3"
      role="img"
      aria-label={t("Information gain at the root: {0}.", [
        rootGains.map((g) => `${g.attribute} ${g.gain.toFixed(2)}`).join(", "),
      ])}
    >
      {rootGains.map((g, i) => (
        <div key={g.attribute} className="grid grid-cols-[88px_1fr_36px] items-center gap-2">
          <span className="font-ui text-xs text-fg-secondary">{capitalize(g.attribute)}</span>
          <div
            className={i === 0 ? "h-3 bg-brand" : "h-3 bg-fg-muted"}
            style={{ width: `${(g.gain / max) * 100}%` }}
          />
          <span className="text-right font-ui text-xs text-fg">{g.gain.toFixed(2)}</span>
        </div>
      ))}
      <p className="font-ui text-[11px] text-fg-muted">
        {t("information gain at the root — highest wins ")}
      </p>
    </div>
  )
}

/** A gallery: the same Representation/Optimization/Evaluation split, on each algorithm's classic dataset. */
export function AlgorithmExamples() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-6">
      <AlgorithmCard
        title={t("Decision tree")}
        task="Classification — should we play tennis today? Yes or No."
        data={t(
          "Mitchell's own example (1997, Table 3.2): {0} days, each with outlook, temperature, humidity and wind.",
          [playTennis.length],
        )}
      >
        <AlgorithmColumn icon={NetworkIcon} label={t("Representation")}>
          <TreeDiagram
            root={toDiagram(tennisTree)}
            ariaLabel={t(
              "Decision tree learned from Play Tennis: split on outlook, then humidity for sunny days and wind for rainy days.",
            )}
          />
          <Explanation>
            {t(
              "A tree of questions. Each node tests one attribute, each branch is one answer, each leaf is a decision. To classify a day, start at the top and follow its answers down. ",
            )}
          </Explanation>
        </AlgorithmColumn>
        <AlgorithmColumn icon={GaugeIcon} label={t("Optimization")}>
          <GainBars />
          <Explanation>
            {t(
              "ID3 grows the tree greedily: at each node it asks the question that removes the most uncertainty (entropy) about the answer, then repeats on every branch until each leaf is pure. Outlook wins the root; Humidity and Wind win below it. ",
            )}
          </Explanation>
          <Formula>
            <p>H(S) = −Σ pᵢ·log₂ pᵢ</p>
            <p>Gain(S, A) = H(S) − Σᵥ |Sᵥ|/|S|·H(Sᵥ)</p>
          </Formula>
        </AlgorithmColumn>
        <AlgorithmColumn icon={TargetIcon} label={t("Evaluation")}>
          <ClassificationEvaluation metrics={tennisHeldOut} positive={t("Yes")} negative={t("No")}>
            {t(
              "Scored on unseen days: rebuild the tree without each day, then ask about that day (leave-one-out). On its own training days it gets ",
            )}
            {tennisTrainCorrect}/{playTennis.length}
            {t(
              ", since a pure tree memorizes them. With only yes/no answers, AUC is the average of recall and specificity. ",
            )}
          </ClassificationEvaluation>
        </AlgorithmColumn>
      </AlgorithmCard>

      <AlgorithmCard
        title={t("Linear regression")}
        task="Regression — what will this house sell for? A number, not a category."
        data={t("{0} illustrative house sales: floor area (m²) → sale price (thousands).", [
          housePrices.length,
        ])}
      >
        <AlgorithmColumn icon={NetworkIcon} label={t("Representation")}>
          <Formula>
            <p>ŷ = w·x + b</p>
            <p>
              {t("price = ")}
              {houseFit.slope.toFixed(2)}
              {t("·area ")}
              {signed(houseFit.intercept, 1)}
            </p>
          </Formula>
          <ScatterChart
            points={housePrices.map((h) => ({ x: h.area, y: h.price, series: "house" }))}
            series={[{ key: "house", label: t("House sale"), color: "var(--color-chart-cool)" }]}
            xLabel={t("Floor area (m²)")}
            yLabel={t("Price (k)")}
            lines={[
              {
                points: [Math.min(...areas), Math.max(...areas)].map((x) => ({ x, y: priceAt(x) })),
                label: "ŷ",
              },
            ]}
          />
          <Explanation>
            {t(
              "A function and its graph: a straight line with two parameters, the price per m² (w) and a base price (b). A 100 m² house → ",
            )}
            {priceAt(100).toFixed(0)}
            {t("k. It can only ever describe a steady trend. ")}
          </Explanation>
        </AlgorithmColumn>
        <AlgorithmColumn icon={GaugeIcon} label={t("Optimization")}>
          <LineChart
            series={[
              {
                key: "rmse",
                label: t("error (RMSE)"),
                color: "var(--color-fg)",
                points: houseFit.rmseHistory,
              },
            ]}
            xLabel={t("Epoch")}
            yLabel="RMSE (k)"
          />
          <Explanation>
            {t(
              "Gradient descent on the mean squared error: start with a flat line, then nudge w and b downhill each epoch. (Least squares can also solve this one directly, in closed form.) ",
            )}
          </Explanation>
          <Formula>
            <p>MSE = (1/n)·Σ(ŷᵢ − yᵢ)²</p>
            <p>w ← w − η·∂MSE/∂w</p>
            <p>b ← b − η·∂MSE/∂b</p>
          </Formula>
        </AlgorithmColumn>
        <AlgorithmColumn icon={TargetIcon} label={t("Evaluation")}>
          <MetricList
            rows={[
              { name: "MAE", hint: "(k)", value: houseMetrics.mae.toFixed(1) },
              { name: "MSE", hint: "(k²)", value: houseMetrics.mse.toFixed(1) },
              { name: "RMSE", hint: "(k)", value: houseMetrics.rmse.toFixed(1) },
              { name: "MAPE", value: `${(houseMetrics.mape * 100).toFixed(1)}%` },
              { name: "R²", value: houseMetrics.r2.toFixed(3) },
            ]}
            lesson={{ slug: "regression-metrics", title: t("Regression Metrics") }}
          />
          <Explanation>
            {t(
              "There's no \"right or wrong\" for a price, so regression measures how far off it is. MAE and RMSE are in the target's own units (RMSE punishes big misses more), MAPE is the typical miss in percent, and R² is the share of the price variation the line explains. ",
            )}
          </Explanation>
          <Formula>
            <p>MAE = (1/n)·Σ|ŷᵢ − yᵢ|</p>
            <p>RMSE = √MSE</p>
            <p>MAPE = (1/n)·Σ|ŷᵢ − yᵢ| / |yᵢ|</p>
            <p>R² = 1 − Σ(yᵢ − ŷᵢ)² / Σ(yᵢ − ȳ)²</p>
          </Formula>
        </AlgorithmColumn>
      </AlgorithmCard>

      <AlgorithmCard
        title={t("Logistic regression")}
        task="Classification — will this student pass the exam? A probability, then a yes/no."
        data={t(
          '{0} students: hours studied → passed or failed (the worked example from Wikipedia\'s "Logistic regression" article).',
          [examResults.length],
        )}
      >
        <AlgorithmColumn icon={NetworkIcon} label={t("Representation")}>
          <Formula>
            <p>p = σ(w·x + b)</p>
            <p>σ(z) = 1 / (1 + e⁻ᶻ)</p>
            <p>
              P(pass) = σ({examFit.weight.toFixed(2)}
              {t("·hours ")}
              {signed(examFit.bias, 2)})
            </p>
          </Formula>
          <ScatterChart
            points={examResults.map((r) => ({
              x: r.hours,
              y: r.passed * 100,
              series: r.passed ? "pass" : "fail",
            }))}
            series={[
              { key: "fail", label: "Failed", color: "var(--color-brand)" },
              { key: "pass", label: "Passed", color: "var(--color-chart-cool)" },
            ]}
            xLabel={t("Hours studied")}
            yLabel="P(pass) %"
            lines={[
              {
                points: range(0, 6, 60).map((h) => ({ x: h, y: passProbability(h) * 100 })),
                label: "p",
              },
            ]}
          />
          <Explanation>
            {t(
              'The same weighted sum as linear regression, squashed by the sigmoid σ into a probability between 0% and 100%. Answer "pass" when p ≥ 50%, i.e. after ',
            )}
            {passThreshold.toFixed(1)} {t("hours: one cut-off, a straight-line boundary. ")}
          </Explanation>
        </AlgorithmColumn>
        <AlgorithmColumn icon={GaugeIcon} label={t("Optimization")}>
          <LineChart
            series={[
              {
                key: "loss",
                label: t("log loss"),
                color: "var(--color-fg)",
                points: examFit.lossHistory,
              },
            ]}
            xLabel={t("Epoch")}
            yLabel={t("Log loss")}
          />
          <Explanation>
            {t(
              "Gradient descent on log loss (cross-entropy), which punishes a confident wrong probability hardest. Unlike linear regression's MSE, there is no closed-form answer, so it must be searched for. ",
            )}
          </Explanation>
          <Formula>
            <p>L = −(1/n)·Σ[y·log p + (1 − y)·log(1 − p)]</p>
            <p>w ← w − η·∂L/∂w</p>
          </Formula>
        </AlgorithmColumn>
        <AlgorithmColumn icon={TargetIcon} label={t("Evaluation")}>
          <ClassificationEvaluation metrics={examMetrics} positive={t("pass")} negative={t("fail")}>
            {t(
              "Accuracy alone hides which mistakes are made. Precision asks how many predicted passes really passed, recall how many real passes were caught, and F1 balances the two. AUC scores the probabilities themselves, before any 50% cut-off. ",
            )}
          </ClassificationEvaluation>
        </AlgorithmColumn>
      </AlgorithmCard>

      <AlgorithmCard
        title={t("Clustering (k-means)")}
        task="Clustering — which flowers belong together? No labels to predict."
        data={t(
          "{0} flowers from Fisher's Iris data (1936): petal length and width. The species is hidden from the algorithm.",
          [irisSample.length],
        )}
      >
        <AlgorithmColumn icon={NetworkIcon} label={t("Representation")}>
          <ScatterChart
            points={irisSample.map((f, i) => ({
              x: f.petalLength,
              y: f.petalWidth,
              series: `cluster-${irisClusters.assignments[i]}`,
            }))}
            series={clusterColors.map((color, i) => ({
              key: `cluster-${i}`,
              label: `c${i + 1}`,
              color,
            }))}
            xLabel={t("Petal length (cm)")}
            yLabel={t("Petal width (cm)")}
            markers={irisClusters.centroids.map(([x, y], i) => ({ x, y, label: `c${i + 1}` }))}
          />
          <Explanation>
            {t("k centre points (×), here k = ")}
            {K}
            {t(". Each flower belongs to whichever centre is nearest, so the whole model is just ")}
            {K} {t(" coordinates. ")}
          </Explanation>
        </AlgorithmColumn>
        <AlgorithmColumn icon={GaugeIcon} label={t("Optimization")}>
          <LineChart
            series={[
              {
                key: "inertia",
                label: "inertia",
                color: "var(--color-fg)",
                points: irisClusters.inertiaHistory.map((y, i) => ({ x: i + 1, y })),
              },
            ]}
            xLabel="Iteration"
            yLabel={t("Inertia")}
          />
          <Explanation>
            {t(
              "k-means alternates two steps: assign every flower to its nearest centre, then move each centre to the mean of its flowers. It repeats until nothing moves, a few rounds here. ",
            )}
          </Explanation>
          <Formula>
            <p>inertia = Σ ‖x − c(x)‖²</p>
            <p>c ← mean of the points assigned to c</p>
          </Formula>
        </AlgorithmColumn>
        <AlgorithmColumn icon={TargetIcon} label={t("Evaluation")}>
          <LineChart
            series={[
              {
                key: "elbow",
                label: t("elbow: inertia per k"),
                color: "var(--color-brand)",
                points: elbow,
              },
            ]}
            xLabel={t("Number of clusters k")}
            yLabel={t("Inertia")}
          />
          <MetricList
            rows={[
              { name: "Silhouette", hint: "(−1..1, ↑)", value: irisSilhouette.toFixed(2) },
              { name: "Davies–Bouldin", hint: "(≥ 0, ↓)", value: irisDaviesBouldin.toFixed(2) },
              { name: "Match species", value: `${irisAgreement}/${irisSample.length}` },
            ]}
            lesson={{ slug: "clustering-metrics", title: t("Clustering Metrics") }}
          />
          <Explanation>
            {t(
              "With no labels, the measures are internal. The elbow shows inertia stops dropping sharply after k = ",
            )}
            {K}
            {t(
              "; silhouette and Davies–Bouldin score how tight and separated the groups are. Iris happens to have known species, so we can also check afterwards. Real clustering problems usually can't. ",
            )}
          </Explanation>
          <Formula>
            <p>s = (b − a) / max(a, b)</p>
            <p>DB = (1/k)·Σᵢ maxⱼ (σᵢ + σⱼ) / d(cᵢ, cⱼ)</p>
          </Formula>
        </AlgorithmColumn>
      </AlgorithmCard>

      <AlgorithmCard
        title={t("Neural network (again, summarized)")}
        task="Classification — is this machine Normal or At Risk?"
        data={t("This chapter's own {0} machines: temperature and vibration.", [
          machineReadings.length,
        ])}
      >
        <AlgorithmColumn icon={NetworkIcon} label={t("Representation")}>
          <NetworkDiagram
            network={representationNet}
            toInput={(x, y) => toInput({ temperature: x, vibration: y })}
            domain={{
              xMin: TEMP_DOMAIN[0],
              xMax: TEMP_DOMAIN[1],
              yMin: VIB_DOMAIN[0],
              yMax: VIB_DOMAIN[1],
            }}
            inputLabels={[t("Temp"), t("Vib")]}
            outputLabel={t("At Risk?")}
          />
          <Explanation>
            {t("Layers of weighted connections, ")}
            {nnArchitecture.join(" → ")}
            {t(
              ": logistic regressions stacked, enough to bend the boundary around the arch, which a single line can't. ",
            )}
          </Explanation>
        </AlgorithmColumn>
        <AlgorithmColumn icon={GaugeIcon} label={t("Optimization")}>
          <LineChart
            series={[{ key: "loss", label: "loss", color: "var(--color-fg)", points: nn.history }]}
            xLabel={t("Epoch")}
            yLabel={t("Loss")}
          />
          <Explanation>
            {t(
              "Backpropagation and gradient descent: the same log loss as logistic regression, pushed back through every layer to update all 25 weights and biases. ",
            )}
          </Explanation>
          <Formula>
            <p>L = −[y·log ŷ + (1 − y)·log(1 − ŷ)]</p>
            <p>w ← w − η·∂L/∂w</p>
          </Formula>
        </AlgorithmColumn>
        <AlgorithmColumn icon={TargetIcon} label={t("Evaluation")}>
          <ClassificationEvaluation metrics={nnMetrics} positive={t("at risk")} negative="normal">
            {t("The same classification metrics, on the ")}
            {machineReadings.length}{" "}
            {t(
              " machines it trained on. Perfect scores here only show it fits this data; new machines are the real test. ",
            )}
          </ClassificationEvaluation>
        </AlgorithmColumn>
      </AlgorithmCard>
    </div>
  )
}

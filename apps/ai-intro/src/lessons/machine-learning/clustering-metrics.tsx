import { BarChart } from "@/components/charts/bar-chart"
import { LineChart } from "@/components/charts/line-chart"
import { ScatterChart } from "@/components/charts/scatter-chart"
import {
  LessonArticle,
  LessonFooter,
  LessonHero,
  LessonLead,
} from "@/components/course/lesson-layout"
import type { LessonEntry } from "@/curriculum"
import { useTranslation } from "@/i18n/use-translation"
import {
  adjustedRandIndex,
  adjustedRandParts,
  calinskiHarabasz,
  daviesBouldin,
  kMeans,
  silhouetteSamples,
  silhouetteScore,
} from "@/lib/kmeans"
import { SEED } from "../programming-vs-ml/ml-training"
import { irisSample } from "./classic-datasets"
import { irisPoints } from "./classic-models"
import { CheatSheet, MetricSection, OptionList, StatRow, Takeaway } from "./metric-section"

const K = 3
const COLORS = ["var(--color-class-1)", "var(--color-class-2)", "var(--color-fg-secondary)"]
const species = irisSample.map((f) => f.species)
const speciesNames = [...new Set(species)]

const runs = [1, 2, 3, 4, 5, 6, 7, 8].map((k) => ({ k, ...kMeans(irisPoints, k, SEED, 10) }))
const multi = runs.filter((r) => r.k >= 2 && r.k <= 6)
const scoreBy = (f: (r: (typeof runs)[number]) => number) => multi.map((r) => ({ x: r.k, y: f(r) }))

const elbow = runs.map((r) => ({ x: r.k, y: r.inertiaHistory.at(-1) ?? 0 }))
const silhouetteByK = scoreBy((r) => silhouetteScore(irisPoints, r.assignments))
const dbByK = scoreBy((r) => daviesBouldin(irisPoints, r.assignments, r.centroids))
const chByK = scoreBy((r) => calinskiHarabasz(irisPoints, r.assignments))
const ariByK = scoreBy((r) => adjustedRandIndex(r.assignments, species))

const chosen = runs[K - 1]
const samples = silhouetteSamples(irisPoints, chosen.assignments)
/** Silhouette plot: points grouped by cluster, each group sorted from best to worst. */
const silhouetteOrder = samples
  .map((s, i) => ({ s, cluster: chosen.assignments[i] }))
  .sort((a, b) => a.cluster - b.cluster || b.s - a.s)

const contingency = [0, 1, 2].map((c) =>
  speciesNames.map(
    (name) => irisSample.filter((f, i) => chosen.assignments[i] === c && f.species === name).length,
  ),
)
const purity = contingency.reduce((s, row) => s + Math.max(...row), 0) / irisSample.length

// ---- Worked examples, all for the chosen k ----
const dist = (p: number[], q: number[]) => Math.hypot(p[0] - q[0], p[1] - q[1])
const members = (c: number) => irisPoints.filter((_, i) => chosen.assignments[i] === c)
const clusterInertia = [0, 1, 2].map((c) =>
  members(c).reduce((sum, p) => sum + dist(p, chosen.centroids[c]) ** 2, 0),
)
/** The flower sitting least comfortably in its cluster, worked through for silhouette. */
const uneasy = samples.indexOf(Math.min(...samples))
const meanDistance = (p: number[], group: number[][]) =>
  group.reduce((sum, q) => sum + dist(p, q), 0) / group.length
const uneasyA = meanDistance(
  irisPoints[uneasy],
  irisPoints.filter((_, i) => i !== uneasy && chosen.assignments[i] === chosen.assignments[uneasy]),
)
const uneasyB = Math.min(
  ...[0, 1, 2]
    .filter((c) => c !== chosen.assignments[uneasy])
    .map((c) => meanDistance(irisPoints[uneasy], members(c))),
)
const spread = [0, 1, 2].map((c) => meanDistance(chosen.centroids[c], members(c)))
const worstRatio = [0, 1, 2].map((i) =>
  Math.max(
    ...[0, 1, 2]
      .filter((j) => j !== i)
      .map((j) => (spread[i] + spread[j]) / dist(chosen.centroids[i], chosen.centroids[j])),
  ),
)
const overallMean = [0, 1].map((d) => irisPoints.reduce((s, p) => s + p[d], 0) / irisPoints.length)
const between = [0, 1, 2].reduce(
  (sum, c) => sum + members(c).length * dist(chosen.centroids[c], overallMean) ** 2,
  0,
)
const within = clusterInertia.reduce((sum, v) => sum + v, 0)
const ariParts = adjustedRandParts(chosen.assignments, species)
const n = irisPoints.length

const best = (points: { x: number; y: number }[], higher: boolean) =>
  points.reduce((a, b) => ((higher ? b.y > a.y : b.y < a.y) ? b : a)).x
const f2 = (v: number) => v.toFixed(2)
const at = (points: { x: number; y: number }[]) => points.find((p) => p.x === K)?.y ?? 0

export function ClusteringMetricsLesson({ entry }: { entry: LessonEntry }) {
  const { t } = useTranslation()
  return (
    <LessonArticle entry={entry}>
      <LessonHero line1={t("Clustering")} line2={t("metrics")} />
      <LessonLead>
        {t(
          "Clustering has no answer key: nobody told the algorithm which groups exist. So its metrics come in two kinds:",
        )}
      </LessonLead>
      <OptionList
        items={[
          <>
            <span className="text-fg">{t("Internal")}</span>
            {t(
              " — they judge the shape of the groups themselves: tight inside, far apart from each other.",
            )}
          </>,
          <>
            <span className="text-fg">{t("External")}</span>
            {t(" — when true labels happen to exist, they check the groups against them.")}
          </>,
        ]}
      />
      <Takeaway>
        {t("Most real clustering problems have only the internal kind to go on.")}
      </Takeaway>
      <p className="text-fg-secondary">
        {t("The running example is k-means on ")}
        {irisSample.length}{" "}
        {t(
          " Iris flowers' petal sizes, as in ML Components. Each metric is computed for several values of k — choosing k is the question most of them help answer. ",
        )}
      </p>
      <ScatterChart
        points={irisSample.map((f, i) => ({
          x: f.petalLength,
          y: f.petalWidth,
          series: `c${chosen.assignments[i]}`,
        }))}
        series={COLORS.map((color, i) => ({
          key: `c${i}`,
          label: t("cluster {0}", [i + 1]),
          color,
        }))}
        xLabel={t("Petal length (cm)")}
        yLabel={t("Petal width (cm)")}
        markers={chosen.centroids.map(([x, y], i) => ({ x, y, label: `c${i + 1}` }))}
      />

      <MetricSection
        number="1"
        worked={
          <p>
            inertia = {clusterInertia.map(f2).join(" + ")} = {f2(within)}{" "}
            {t("(one sum per cluster, k = {0})", [K])}
          </p>
        }
        title={t("Inertia and the elbow")}
        what={
          <p>
            {t(
              "Inertia (within-cluster sum of squares) is the total squared distance from each point to its cluster's centre — exactly what k-means minimizes. ",
            )}
          </p>
        }
        why={
          <p>
            {t(
              "It always falls as k grows (with k = n every point is its own centre), so it can't pick k by itself. Instead look for the ",
            )}
            <em>{t("elbow")}</em>
            {t(
              ": the k after which extra clusters stop buying much. Here the drop flattens after k = ",
            )}
            {K}.
          </p>
        }
        formulas={<p>inertia = Σᵢ ‖xᵢ − c(xᵢ)‖²</p>}
      >
        <LineChart
          series={[{ key: "elbow", label: "inertia", color: "var(--color-fg)", points: elbow }]}
          xLabel={t("Number of clusters k")}
          yLabel={t("Inertia")}
          vLines={[{ x: K, label: t("elbow") }]}
        />
      </MetricSection>

      <MetricSection
        number="2"
        worked={
          <>
            <p>
              {t("flower {0}, the least settled: ", [uneasy + 1])}a = {f2(uneasyA)}, b ={" "}
              {f2(uneasyB)}
            </p>
            <p>
              s = ({f2(uneasyB)} − {f2(uneasyA)}) / {f2(Math.max(uneasyA, uneasyB))} ={" "}
              {f2(samples[uneasy])}
            </p>
            <p>
              {t("score = mean of all {0} = ", [n])}
              {f2(at(silhouetteByK))}
            </p>
          </>
        }
        title={t("Silhouette score")}
        what={
          <p>
            {t(
              "For each point: a = its mean distance to its own cluster, b = its mean distance to the nearest other cluster. Its silhouette compares the two, from −1 (wrong cluster) through 0 (on the border) to 1 (clearly placed). The score is the mean over all points. ",
            )}
          </p>
        }
        why={
          <p>
            {t("It rewards both tightness and separation, and the per-point plot shows ")}
            <em>{t("which")}</em>{" "}
            {t(
              "points sit uneasily. The tall bars are the well-separated setosa cluster; the short ones are versicolor and virginica, which overlap. The mean is highest at k =",
            )}{" "}
            {best(silhouetteByK, true)}
            {t(
              ": setosa on its own against the other two species merged — the most clearly separated split, though not the true number of species. ",
            )}
          </p>
        }
        formulas={
          <>
            <p>s(i) = (b(i) − a(i)) / max(a(i), b(i))</p>
            <p>score = (1/n)·Σ s(i)</p>
          </>
        }
      >
        <StatRow stats={[{ label: t("silhouette, k = {0}", [K]), value: f2(at(silhouetteByK)) }]} />
        <BarChart
          categories={silhouetteOrder.map((_, i) => String(i))}
          series={[
            {
              key: "s",
              label: "silhouette",
              color: COLORS[0],
              values: silhouetteOrder.map((p) => p.s),
              colors: silhouetteOrder.map((p) => COLORS[p.cluster]),
            },
          ]}
          xLabel={t("Each flower, grouped by cluster (k = {0})", [K])}
          yLabel={t("Silhouette")}
          legend={COLORS.map((color, i) => ({ label: t("cluster {0}", [i + 1]), color }))}
        />
        <LineChart
          series={[
            { key: "sil", label: t("mean silhouette"), color: COLORS[0], points: silhouetteByK },
          ]}
          xLabel={t("Number of clusters k")}
          yLabel={t("Silhouette")}
        />
      </MetricSection>

      <MetricSection
        number="3"
        worked={
          <>
            <p>σ = {spread.map(f2).join(", ")}</p>
            <p>
              DB = ({worstRatio.map(f2).join(" + ")}) / {K} = {f2(at(dbByK))}
            </p>
          </>
        }
        title={t("Davies–Bouldin index")}
        what={
          <p>
            {t(
              "For each cluster, find its most similar neighbour: the ratio of their combined spread to the distance between their centres. Average that worst case over all clusters. ",
            )}
          </p>
        }
        why={
          <p>
            {t("Cheap to compute (centres only, no all-pairs distances) and easy to read: ")}
            <em>{t("lower")}</em> {t("is better, 0 is ideal. Here it prefers k = ")}
            {best(dbByK, false)}
            {t(", silhouette prefers")} {best(silhouetteByK, true)} {t(" and the elbow suggests ")}
            {K}
            {t(
              ': each metric encodes its own idea of a "good" cluster, so read several together. ',
            )}
          </p>
        }
        formulas={
          <>
            <p>DB = (1/k)·Σᵢ maxⱼ≠ᵢ (σᵢ + σⱼ) / d(cᵢ, cⱼ)</p>
            <p>σᵢ = mean distance of cluster i's points to cᵢ</p>
          </>
        }
      >
        <StatRow stats={[{ label: `Davies–Bouldin, k = ${K}`, value: f2(at(dbByK)) }]} />
        <LineChart
          series={[{ key: "db", label: "Davies–Bouldin", color: COLORS[1], points: dbByK }]}
          xLabel={t("Number of clusters k")}
          yLabel={t("Davies–Bouldin (lower is better)")}
        />
      </MetricSection>

      <MetricSection
        number="4"
        worked={
          <p>
            CH = [{f2(between)} / ({K} − 1)] / [{f2(within)} / ({n} − {K})] = {at(chByK).toFixed(0)}
          </p>
        }
        title={t("Calinski–Harabasz index")}
        what={
          <p>
            {t("The variance ratio criterion: spread ")}
            <em>{t("between")}</em> {t(" cluster centres divided by spread")} <em>{t("within")}</em>{" "}
            {t(" clusters, each scaled by its degrees of freedom. ")}
          </p>
        }
        why={
          <p>
            {t("Fast, and ")}
            <em>{t("higher")}</em>{" "}
            {t(
              " is better. Like inertia it is built on squared distances, so it favours round, similar-sized clusters — fine for k-means, misleading for long or oddly-shaped groups. Highest here at k = ",
            )}
            {best(chByK, true)}.
          </p>
        }
        formulas={<p>CH = [B / (k − 1)] / [W / (n − k)]</p>}
      >
        <StatRow stats={[{ label: `Calinski–Harabasz, k = ${K}`, value: at(chByK).toFixed(0) }]} />
        <LineChart
          series={[
            { key: "ch", label: "Calinski–Harabasz", color: "var(--color-fg)", points: chByK },
          ]}
          xLabel={t("Number of clusters k")}
          yLabel="Calinski–Harabasz"
        />
      </MetricSection>

      <MetricSection
        number="5"
        worked={
          <>
            <p>
              purity = ({contingency.map((row) => Math.max(...row)).join(" + ")}) / {n} ={" "}
              {f2(purity)}
            </p>
            <p>
              ARI = ({ariParts.index} − {f2(ariParts.expected)}) / ({f2(ariParts.max)} −{" "}
              {f2(ariParts.expected)}) = {f2(ariParts.ari)}
            </p>
          </>
        }
        title={t("External metrics: purity and adjusted Rand index")}
        what={
          <p>
            {t(
              "When true labels exist, compare against them. Purity: the share of points that belong to their cluster's majority label. Adjusted Rand index (ARI): how often pairs of points are grouped the same way in both, corrected so random clusters score about 0. ",
            )}
          </p>
        }
        why={
          <p>
            {t(
              "They test whether the clusters found the categories you care about. Purity is easy to game (k = n gives 100%); ARI is not, and peaks at k = ",
            )}
            {best(ariByK, true)}{" "}
            {t(
              " — the true number of species. Real clustering problems rarely have labels, which is why the internal metrics above exist. ",
            )}
          </p>
        }
        formulas={
          <>
            <p>purity = (1/n)·Σ_clusters max_label |cluster ∩ label|</p>
            <p>ARI = (RI − E[RI]) / (max RI − E[RI])</p>
          </>
        }
      >
        <StatRow
          stats={[
            { label: t("purity, k = {0}", [K]), value: f2(purity) },
            { label: `ARI, k = ${K}`, value: f2(at(ariByK)) },
          ]}
        />
        <div className="overflow-x-auto rounded-[3px] border border-divider">
          <table className="w-full text-center font-ui text-sm">
            <thead className="bg-surface">
              <tr className="text-fg-muted">
                <th className="px-3 py-2 text-left font-normal">{t("cluster ↓ / species →")}</th>
                {speciesNames.map((name) => (
                  <th key={name} className="px-3 py-2 font-normal">
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {contingency.map((row, c) => (
                <tr key={COLORS[c]}>
                  <td className="px-3 py-2 text-left" style={{ color: COLORS[c] }}>
                    {t("cluster ")}
                    {c + 1}
                  </td>
                  {row.map((count, s) => (
                    <td
                      key={speciesNames[s]}
                      className={
                        count === Math.max(...row) ? "px-3 py-2 text-fg" : "px-3 py-2 text-fg-muted"
                      }
                    >
                      {count}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <LineChart
          series={[
            { key: "ari", label: t("adjusted Rand index"), color: COLORS[1], points: ariByK },
          ]}
          xLabel={t("Number of clusters k")}
          yLabel={t("ARI vs species")}
        />
      </MetricSection>

      <CheatSheet
        number="6"
        rows={[
          {
            metric: t("Inertia / elbow"),
            question: t("How compact are the clusters?"),
            use: t("Choosing k for k-means; never on its own."),
          },
          {
            metric: t("Silhouette"),
            question: t("Is each point closer to its own cluster?"),
            use: t("Choosing k; spotting badly placed points."),
          },
          {
            metric: "Davies–Bouldin",
            question: t("Do clusters overlap their neighbours?"),
            use: t("Fast check on large data; lower is better."),
          },
          {
            metric: "Calinski–Harabasz",
            question: t("Between- vs within-cluster spread?"),
            use: t("Fast check for round, similar-sized clusters."),
          },
          {
            metric: t("Purity / ARI"),
            question: t("Do clusters match known labels?"),
            use: t("Benchmarking when ground truth exists."),
          },
        ]}
      />

      <LessonFooter entry={entry} />
    </LessonArticle>
  )
}

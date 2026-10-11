import { BarChart } from "@/components/charts/bar-chart"
import { LineChart } from "@/components/charts/line-chart"
import {
  LessonArticle,
  LessonFooter,
  LessonHero,
  LessonLead,
} from "@/components/course/lesson-layout"
import type { LessonEntry } from "@/curriculum"
import { useTranslation } from "@/i18n/use-translation"
import {
  averagePrecisionAtRanks,
  dcgAtK,
  hitAtK,
  ndcgAtK,
  precisionAtK,
  recallAtK,
  reciprocalRank,
} from "@/lib/ranking"
import { CheatSheet, MetricSection, StatRow } from "./metric-section"
import { KS, queries, RANKERS } from "./search-results"

type RankerKey = (typeof RANKERS)[number]["key"]
type Query = (typeof queries)[number]

const mean = (values: number[]) => values.reduce((s, v) => s + v, 0) / values.length
/** One line per ranker: the metric at each cut-off k, averaged over all queries. */
const atK = (metric: (q: Query, ranker: RankerKey, k: number) => number) =>
  RANKERS.map((r) => ({
    key: r.key,
    label: r.label,
    color: r.color,
    points: KS.map((k) => ({ x: k, y: mean(queries.map((q) => metric(q, r.key, k))) })),
  }))
const perQuery = (metric: (q: Query, ranker: RankerKey) => number) =>
  RANKERS.map((r) => ({
    key: r.key,
    label: r.label,
    color: r.color,
    values: queries.map((q) => metric(q, r.key)),
  }))
const relevantCount = (q: Query) => q.allGrades.length

const rr = perQuery((q, r) => reciprocalRank(q[r]))
const ap = perQuery((q, r) => averagePrecisionAtRanks(q[r], relevantCount(q)))
const queryLabels = queries.map((_, i) => `Q${i + 1}`)
const f2 = (v: number) => v.toFixed(2)

// ---- Worked examples: query 1 and the learned ranker, at k = 5 ----
const K = 5
const q1 = queries[0]
const learnedList = q1.learned
const topK = learnedList.slice(0, K)
const hitsInTopK = topK.filter((g) => g > 0).length
const relevantRanks = learnedList.flatMap((g, i) => (g > 0 ? [i + 1] : []))
const learnedIndex = RANKERS.findIndex((r) => r.key === "learned")
const gainTerm = (grade: number, rank: number) => `(2^${grade} − 1)/log₂(${rank + 1})`
const idealTopK = [...q1.allGrades].sort((a, b) => b - a).slice(0, K)

const GRADE_LABEL = ["not relevant", "somewhat", "relevant", "perfect"]
const GRADE_TONE = ["text-fg-muted", "text-fg-secondary", "text-chart-cool", "text-brand"]

function RankedList({ grades, title }: { grades: number[]; title: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-1">
      <p className="label-ui text-fg-muted">{t(title)}</p>
      <ol className="flex flex-col divide-y divide-divider rounded-[3px] border border-divider bg-surface">
        {grades.map((g, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: a rank position is its identity
          <li key={i} className="flex items-center justify-between px-3 py-1 font-ui text-xs">
            <span className="text-fg-muted">#{i + 1}</span>
            <span className={GRADE_TONE[g]}>
              {"●".repeat(g)}
              {"○".repeat(3 - g)} {t(GRADE_LABEL[g])}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function RankingMetricsLesson({ entry }: { entry: LessonEntry }) {
  const { t } = useTranslation()
  return (
    <LessonArticle entry={entry}>
      <LessonHero line1={t("Ranking")} line2={t("metrics")} />
      <LessonLead>
        {t(
          "Search engines and recommenders don't answer with one label — they answer with an ordered list, and people mostly look at the top. Ranking metrics care about ",
        )}
        <em>{t("where")}</em>{" "}
        {t(
          " the good results land: a perfect answer at position 9 is worth far less than at position 1. ",
        )}
      </LessonLead>
      <p className="text-fg-secondary">
        {t("The running example is illustrative: ")}
        {queries.length}{" "}
        {t(
          ' search queries, each answered with 10 results by two systems — a keyword ranker and a learned ranker. Human judges graded each result from 0 (not relevant) to 3 (perfect). Here is the first query, "',
        )}
        {t(queries[0].query)}":
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {RANKERS.map((r) => (
          <RankedList key={r.key} title={t(r.label)} grades={queries[0][r.key]} />
        ))}
      </div>

      <MetricSection
        number="1"
        worked={
          <p>
            Q1, {t("learned")}: P@{K} = {hitsInTopK} / {K} = {f2(precisionAtK(learnedList, K))}
          </p>
        }
        title={t("Precision@k")}
        what={<p>{t("Of the top k results, the share that are relevant (grade above 0).")}</p>}
        why={
          <p>
            {t(
              "It matches how people use a results page: only the first screen matters. It ignores order ",
            )}
            <em>{t("within")}</em> {t(" the top k and how many relevant items exist overall. ")}
          </p>
        }
        formulas={<p>P@k = |relevant ∩ top k| / k</p>}
      >
        <LineChart
          series={atK((q, r, k) => precisionAtK(q[r], k))}
          xLabel={t("k (results looked at)")}
          yLabel={t("Precision@k")}
        />
      </MetricSection>

      <MetricSection
        number="2"
        worked={
          <p>
            Q1, {t("learned")}: R@{K} = {hitsInTopK} / {relevantCount(q1)} ={" "}
            {f2(recallAtK(learnedList, K, relevantCount(q1)))}
          </p>
        }
        title={t("Recall@k")}
        what={<p>{t("Of all relevant items for the query, the share found in the top k.")}</p>}
        why={
          <p>
            {t("Matters when the user needs ")}
            <em>{t("everything")}</em>{" "}
            {t(
              " — legal discovery, a literature search — or when a first-stage retriever must hand the right candidates to a later stage. It can only rise with k. ",
            )}
          </p>
        }
        formulas={<p>R@k = |relevant ∩ top k| / |relevant|</p>}
      >
        <LineChart
          series={atK((q, r, k) => recallAtK(q[r], k, relevantCount(q)))}
          xLabel="k"
          yLabel={t("Recall@k")}
        />
      </MetricSection>

      <MetricSection
        number="3"
        worked={
          <p>
            {t("learned")}: HR@1 = ({queries.map((q) => hitAtK(q.learned, 1)).join(" + ")}) /{" "}
            {queries.length} = {f2(mean(queries.map((q) => hitAtK(q.learned, 1))))}
          </p>
        }
        title={t("Hit rate@k")}
        what={<p>{t("The share of queries with at least one relevant result in the top k.")}</p>}
        why={
          <p>
            {t(
              'The everyday recommender metric ("did we show them anything useful?"), especially when each user has one item that counts — the next song, the next purchase. ',
            )}
          </p>
        }
        formulas={<p>HR@k = (1/|Q|)·Σ_q 1[relevant ∩ top k ≠ ∅]</p>}
      >
        <LineChart series={atK((q, r, k) => hitAtK(q[r], k))} xLabel="k" yLabel={t("Hit rate@k")} />
      </MetricSection>

      <MetricSection
        number="4"
        worked={
          <p>
            {t("learned")}: MRR = (
            {rr[learnedIndex].values
              .map((v) => (v === 1 ? "1" : `1/${Math.round(1 / v)}`))
              .join(" + ")}
            ) / {queries.length} = {f2(mean(rr[learnedIndex].values))}
          </p>
        }
        title={t("Mean reciprocal rank (MRR)")}
        what={
          <p>
            {t(
              "For each query, 1 divided by the position of the first relevant result (1, ½, ⅓, …); then the mean over queries. ",
            )}
          </p>
        }
        why={
          <p>
            {t(
              'Ideal when one good answer is enough — question answering, navigational search ("open my bank\'s website"). It ignores everything after the first hit. ',
            )}
          </p>
        }
        formulas={<p>MRR = (1/|Q|)·Σ_q 1 / rank_q</p>}
      >
        <StatRow
          stats={RANKERS.map((r, i) => ({
            label: `MRR, ${t(r.label)}`,
            value: f2(mean(rr[i].values)),
          }))}
        />
        <BarChart
          categories={queryLabels}
          series={rr}
          xLabel="Query"
          yLabel={t("Reciprocal rank")}
          yMax={1}
        />
      </MetricSection>

      <MetricSection
        number="5"
        worked={
          <>
            <p>
              Q1, {t("learned")}: AP = (
              {relevantRanks.map((rank, i) => `${i + 1}/${rank}`).join(" + ")}) /{" "}
              {relevantCount(q1)} = {f2(averagePrecisionAtRanks(learnedList, relevantCount(q1)))}
            </p>
            <p>
              MAP = ({ap[learnedIndex].values.map(f2).join(" + ")}) / {queries.length} ={" "}
              {f2(mean(ap[learnedIndex].values))}
            </p>
          </>
        }
        title={t("Mean average precision (MAP)")}
        what={
          <p>
            {t(
              "For each query, average the precision at every position that holds a relevant result, divided by the number of relevant items; then the mean over queries. ",
            )}
          </p>
        }
        why={
          <p>
            {t("One number that rewards finding ")}
            <em>{t("all")}</em> {t(" the relevant results ")}
            <em>{t("and")}</em>{" "}
            {t(
              " putting them early. The long-standing standard in information retrieval benchmarks. ",
            )}
          </p>
        }
        formulas={
          <>
            <p>AP = (1/|relevant|)·Σ_k P@k·rel(k)</p>
            <p>MAP = (1/|Q|)·Σ_q AP_q</p>
          </>
        }
      >
        <StatRow
          stats={RANKERS.map((r, i) => ({
            label: `MAP, ${t(r.label)}`,
            value: f2(mean(ap[i].values)),
          }))}
        />
        <BarChart
          categories={queryLabels}
          series={ap}
          xLabel="Query"
          yLabel={t("Average precision")}
          yMax={1}
        />
      </MetricSection>

      <MetricSection
        number="6"
        worked={
          <>
            <p>
              DCG@{K} = {topK.map((g, i) => gainTerm(g, i + 1)).join(" + ")} ={" "}
              {f2(dcgAtK(learnedList, K))}
            </p>
            <p>
              {t("ideal")} DCG@{K} = {idealTopK.map((g, i) => gainTerm(g, i + 1)).join(" + ")} ={" "}
              {f2(dcgAtK(idealTopK, K))}
            </p>
            <p>
              NDCG@{K} = {f2(dcgAtK(learnedList, K))} / {f2(dcgAtK(idealTopK, K))} ={" "}
              {f2(ndcgAtK(learnedList, K, q1.allGrades))}
            </p>
          </>
        }
        title="NDCG@k"
        what={
          <p>
            {t(
              "Normalized discounted cumulative gain. Each result earns a gain from its grade (2^grade − 1), discounted by log₂ of its position; the sum is divided by the best possible sum for that query. ",
            )}
          </p>
        }
        why={
          <p>
            {t("The only metric here that uses ")}
            <em>{t("graded")}</em>{" "}
            {t(
              " relevance — a perfect result counts more than a somewhat-relevant one — and position at once. From 0 to 1, comparable across queries; the standard for web search and modern recommenders. ",
            )}
          </p>
        }
        formulas={
          <>
            <p>DCG@k = Σᵢ₌₁ᵏ (2^relᵢ − 1) / log₂(i + 1)</p>
            <p>NDCG@k = DCG@k / ideal DCG@k</p>
          </>
        }
      >
        <LineChart
          series={atK((q, r, k) => ndcgAtK(q[r], k, q.allGrades))}
          xLabel="k"
          yLabel="NDCG@k"
        />
      </MetricSection>

      <p className="text-fg-secondary">
        {t("Accuracy-style metrics aren't the whole story for recommenders. Teams also track")}{" "}
        <span className="text-fg">{t("coverage")}</span>{" "}
        {t(" (how much of the catalogue ever gets recommended),")}{" "}
        <span className="text-fg">{t("diversity")}</span>{" "}
        {t(" (how different the items in one list are),")}{" "}
        <span className="text-fg">{t("novelty")}</span>{" "}
        {t(
          " (how unfamiliar they are to the user), and, online, the business outcome itself — clicks, watch time, purchases — through A/B tests. ",
        )}
      </p>

      <CheatSheet
        number="7"
        rows={[
          {
            metric: t("Precision@k"),
            question: t("How much of the first page is useful?"),
            use: t("Users only see the top results."),
          },
          {
            metric: t("Recall@k"),
            question: t("Did we find all the relevant items?"),
            use: t("Completeness matters; candidate retrieval."),
          },
          {
            metric: t("Hit rate@k"),
            question: t("Was anything useful shown?"),
            use: t("Recommenders with one target item."),
          },
          {
            metric: "MRR",
            question: t("How soon is the first good answer?"),
            use: t("One answer is enough (QA, navigation)."),
          },
          {
            metric: "MAP",
            question: t("All relevant items, and early?"),
            use: t("Binary relevance, IR benchmarks."),
          },
          {
            metric: "NDCG@k",
            question: t("Best items at the very top?"),
            use: t("Graded relevance: web search, recommenders."),
          },
        ]}
      />

      <LessonFooter entry={entry} />
    </LessonArticle>
  )
}

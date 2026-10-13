import { BarChart } from "@/components/charts/bar-chart"
import { ScatterChart } from "@/components/charts/scatter-chart"
import {
  LessonArticle,
  LessonFooter,
  LessonHero,
  LessonLead,
} from "@/components/course/lesson-layout"
import type { LessonEntry } from "@/curriculum"
import { useTranslation } from "@/i18n/use-translation"
import { fitLinearRegression } from "@/lib/linear-regression"
import { adjustedR2, regressionMetrics } from "@/lib/metrics"
import { housePrices } from "./classic-datasets"
import { areas, houseFit, priceAt, prices } from "./classic-models"
import { CheatSheet, MetricSection, OptionList, StatRow, Takeaway } from "./metric-section"

const BRAND = "var(--color-brand)"
const COOL = "var(--color-chart-cool)"

const predicted = areas.map(priceAt)
const residuals = prices.map((y, i) => y - predicted[i])
const clean = regressionMetrics(prices, predicted)
const adjusted = adjustedR2(clean.r2, prices.length, 1)

/** The same sales plus one 90 m² house that sold for far more than its size suggests. */
const OUTLIER = { area: 90, price: 420 }
const outlierAreas = [...areas, OUTLIER.area]
const outlierPrices = [...prices, OUTLIER.price]
const outlierFit = fitLinearRegression(outlierAreas, outlierPrices)
const withOutlier = regressionMetrics(
  outlierPrices,
  outlierAreas.map((a) => outlierFit.slope * a + outlierFit.intercept),
)

const houseLabels = areas.map(String)
const n = prices.length
const f1 = (v: number) => v.toFixed(1)
/** The first three terms of a sum, then "…", for the worked examples. */
const firstTerms = (terms: string[]) => `${terms.slice(0, 3).join(" + ")} + …`
const example = areas.indexOf(100)
const sumAbs = residuals.reduce((sum, e) => sum + Math.abs(e), 0)
const sumSquares = residuals.reduce((sum, e) => sum + e * e, 0)
const sumPct = residuals.reduce((sum, e, i) => sum + Math.abs(e) / prices[i], 0)
const meanPrice = prices.reduce((sum, y) => sum + y, 0) / n
const totalSquares = prices.reduce((sum, y) => sum + (y - meanPrice) ** 2, 0)
const k1 = (v: number) => `${v.toFixed(1)}k`

export function RegressionMetricsLesson({ entry }: { entry: LessonEntry }) {
  const { t } = useTranslation()
  return (
    <LessonArticle entry={entry}>
      <LessonHero line1={t("Regression")} line2={t("metrics")} />
      <LessonLead>
        {t(
          "A regression model predicts a number, so it is never simply right or wrong — it is off by some amount. Regression metrics differ in how they add those amounts up:",
        )}
      </LessonLead>
      <OptionList
        ordered={false}
        items={[
          t("in the target's own units, or as a percentage;"),
          t("and how harshly they punish a big miss."),
        ]}
      />
      <Takeaway>{t("Pick the metric whose idea of a bad miss matches yours.")}</Takeaway>
      <p className="text-fg-secondary">
        {t("The running example is the house-price line from ML Components: price =")}{" "}
        {houseFit.slope.toFixed(2)}
        {t("·area + ")}
        {houseFit.intercept.toFixed(1)}
        {t(", fitted to")} {housePrices.length} {t(" illustrative sales (prices in thousands). ")}
      </p>

      <MetricSection
        number="1"
        worked={
          <p>
            {t("{0} m² house: ", [areas[example]])}e = {prices[example]} − {f1(predicted[example])}{" "}
            = {f1(residuals[example])}
          </p>
        }
        title={t("Residuals")}
        what={
          <p>
            {t(
              "A residual is one prediction's error: actual − predicted. Above zero, the house sold for more than the line expected; below, for less. ",
            )}
          </p>
        }
        why={
          <p>
            {t(
              "Every metric below is a summary of this list. Plot it before summarizing: a pattern (a curve, a funnel) means the model is missing structure, which no single number reveals. Here they scatter evenly around zero, as a good fit should. ",
            )}
          </p>
        }
        formulas={<p>eᵢ = yᵢ − ŷᵢ</p>}
      >
        <ScatterChart
          points={areas.map((a, i) => ({ x: a, y: residuals[i], series: "residual" }))}
          series={[{ key: "residual", label: t("Residual (k)"), color: COOL }]}
          xLabel={t("Floor area (m²)")}
          yLabel={t("Actual − predicted (k)")}
          lines={[
            {
              points: [
                { x: Math.min(...areas), y: 0 },
                { x: Math.max(...areas), y: 0 },
              ],
              label: t("perfect"),
              dashed: true,
            },
          ]}
        />
      </MetricSection>

      <MetricSection
        number="2"
        worked={
          <p>
            MAE = ({firstTerms(residuals.map((e) => f1(Math.abs(e))))}) / {n} = {f1(sumAbs)} / {n} ={" "}
            {f1(clean.mae)}
          </p>
        }
        title={t("MAE — mean absolute error")}
        what={
          <p>{t("The average size of a miss, ignoring its direction, in the target's units.")}</p>
        }
        why={
          <p>
            {t("The most readable metric: \"on average we're off by ")}
            {k1(clean.mae)}
            {t(
              "\". Each error counts in proportion to its size, so one wild miss doesn't dominate — useful when outliers are noise rather than the point. ",
            )}
          </p>
        }
        formulas={<p>MAE = (1/n)·Σ|yᵢ − ŷᵢ|</p>}
      >
        <StatRow stats={[{ label: "MAE", value: k1(clean.mae) }]} />
        <BarChart
          categories={houseLabels}
          series={[
            {
              key: "abs",
              label: t("|error| per house (k)"),
              color: COOL,
              values: residuals.map(Math.abs),
            },
          ]}
          xLabel={t("House, by floor area (m²)")}
          yLabel={t("|error| (k)")}
        />
      </MetricSection>

      <MetricSection
        number="3"
        worked={
          <>
            <p>
              MSE = ({firstTerms(residuals.map((e) => `${f1(e)}²`))}) / {n} = {f1(sumSquares)} / {n}{" "}
              = {f1(clean.mse)}
            </p>
            <p>
              RMSE = √{f1(clean.mse)} = {f1(clean.rmse)}
            </p>
            <p>
              {t("with the outlier: ")}RMSE = √{f1(withOutlier.mse)} = {f1(withOutlier.rmse)}
            </p>
          </>
        }
        title={t("MSE and RMSE")}
        what={
          <p>
            {t("MSE averages the ")}
            <em>{t("squared")}</em>{" "}
            {t(" errors; RMSE takes its square root to return to the target's units. ")}
          </p>
        }
        why={
          <p>
            {t(
              "Squaring makes big misses count far more than small ones. MSE is what least squares and gradient descent minimize; RMSE is how you report it. Add one 90 m² house that sold for",
            )}{" "}
            {OUTLIER.price}
            {t("k and RMSE jumps from ")}
            {k1(clean.rmse)} {t(" to ")}
            {k1(withOutlier.rmse)}
            {t(", while MAE only moves from ")}
            {k1(clean.mae)} {t(" to ")}
            {k1(withOutlier.mae)}.
          </p>
        }
        formulas={
          <>
            <p>MSE = (1/n)·Σ(yᵢ − ŷᵢ)²</p>
            <p>RMSE = √MSE</p>
          </>
        }
      >
        <StatRow
          stats={[
            { label: "MSE (k²)", value: clean.mse.toFixed(1) },
            { label: "RMSE", value: k1(clean.rmse) },
          ]}
        />
        <BarChart
          categories={["MAE", "RMSE"]}
          series={[
            {
              key: "clean",
              label: t("14 sales"),
              color: "var(--color-chart-warm)",
              values: [clean.mae, clean.rmse],
            },
            {
              key: "outlier",
              label: t("+ one outlier"),
              color: "var(--color-fg-secondary)",
              values: [withOutlier.mae, withOutlier.rmse],
            },
          ]}
          yLabel={t("Error (k)")}
          showValues
        />
      </MetricSection>

      <MetricSection
        number="4"
        worked={
          <p>
            MAPE = ({firstTerms(residuals.map((e, i) => `${f1(Math.abs(e))}/${prices[i]}`))}) / {n}{" "}
            = {sumPct.toFixed(3)} / {n} = {(clean.mape * 100).toFixed(1)}%
          </p>
        }
        title={t("MAPE — mean absolute percentage error")}
        what={<p>{t("The average miss as a percentage of the true value.")}</p>}
        why={
          <p>
            {t('Scale-free, so it compares models across targets of different sizes ("within')}{" "}
            {(clean.mape * 100).toFixed(1)}
            {t(
              '%"). But it explodes when true values are near zero, and it punishes over-predictions more than under-predictions of the same size. ',
            )}
          </p>
        }
        formulas={<p>MAPE = (100%/n)·Σ|yᵢ − ŷᵢ| / |yᵢ|</p>}
      >
        <StatRow stats={[{ label: "MAPE", value: `${(clean.mape * 100).toFixed(1)}%` }]} />
        <BarChart
          categories={houseLabels}
          series={[
            {
              key: "pct",
              label: t("% error per house"),
              color: BRAND,
              values: residuals.map((e, i) => (Math.abs(e) / prices[i]) * 100),
            },
          ]}
          xLabel={t("House, by floor area (m²)")}
          yLabel={t("|error| / price (%)")}
        />
      </MetricSection>

      <MetricSection
        number="5"
        worked={
          <>
            <p>
              R² = 1 − {f1(sumSquares)} / {f1(totalSquares)} = {clean.r2.toFixed(3)}
            </p>
            <p>
              adj. R² = 1 − (1 − {clean.r2.toFixed(3)})·({n} − 1)/({n} − 1 − 1) ={" "}
              {adjusted.toFixed(3)}
            </p>
          </>
        }
        title={t("R² and adjusted R²")}
        what={
          <p>
            {t(
              "The share of the target's variation the model explains, compared with always predicting the average price. Adjusted R² discounts it for every extra input feature. ",
            )}
          </p>
        }
        why={
          <p>
            {t(
              "Unit-free and easy to compare: 1 is perfect, 0 is no better than the mean, below 0 is worse. Plain R² never drops when you add a feature, even a useless one, so adjusted R² is the fairer comparison between models of different sizes. Points on the dashed line are perfect predictions. ",
            )}
          </p>
        }
        formulas={
          <>
            <p>R² = 1 − Σ(yᵢ − ŷᵢ)² / Σ(yᵢ − ȳ)²</p>
            <p>adj. R² = 1 − (1 − R²)·(n − 1)/(n − p − 1)</p>
          </>
        }
      >
        <StatRow
          stats={[
            { label: "R²", value: clean.r2.toFixed(3) },
            { label: t("adjusted R²"), value: adjusted.toFixed(3) },
          ]}
        />
        <ScatterChart
          points={prices.map((y, i) => ({ x: y, y: predicted[i], series: "house" }))}
          series={[{ key: "house", label: t("House sale"), color: COOL }]}
          xLabel={t("Actual price (k)")}
          yLabel={t("Predicted price (k)")}
          lines={[
            {
              points: [
                { x: Math.min(...prices), y: Math.min(...prices) },
                { x: Math.max(...prices), y: Math.max(...prices) },
              ],
              label: "ŷ = y",
              dashed: true,
            },
          ]}
        />
      </MetricSection>

      <CheatSheet
        number="6"
        rows={[
          {
            metric: "MAE",
            question: t("How far off, on average?"),
            use: t("You want a readable error and outliers are noise."),
          },
          {
            metric: "MSE",
            question: t("What does training minimize?"),
            use: t("Optimizing; big errors are much worse than small ones."),
          },
          {
            metric: "RMSE",
            question: t("Typical error, big misses weighted up?"),
            use: t("Reporting MSE in the target's units."),
          },
          {
            metric: "MAPE",
            question: t("How far off, in percent?"),
            use: t("Comparing across scales; targets never near zero."),
          },
          {
            metric: t("R² / adjusted R²"),
            question: t("How much variation is explained?"),
            use: t("Comparing models on the same data; adjusted for model size."),
          },
        ]}
      />

      <LessonFooter entry={entry} />
    </LessonArticle>
  )
}

import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { LineChart } from "@/components/charts/line-chart"
import { ScatterChart } from "@/components/charts/scatter-chart"
import {
  LessonArticle,
  LessonFooter,
  LessonHero,
  LessonLead,
  SectionTitle,
} from "@/components/course/lesson-layout"
import type { LessonEntry } from "@/curriculum"
import { useTranslation } from "@/i18n/use-translation"
import { meanSquaredError } from "@/lib/polynomial"
import { Formula } from "./algorithm-card"
import { BiasVarianceTargets } from "./bullseye"
import {
  crossValidation,
  DEGREES,
  decomposition,
  errorByDegree,
  fitDegree,
  grid,
  learningCurve,
  NOISE,
  splitFits,
  TRAIN_SIZE,
  test,
  train,
  truth,
} from "./curve-fitting"
import { FoldDiagram, MetricSection, OptionList, Slider, StatRow, Takeaway } from "./metric-section"
import { RUN_COLORS } from "./run-colors"

const BRAND = "var(--color-brand)"
const COOL = "var(--color-chart-cool)"
const FG = "var(--color-fg)"
const MUTED = "var(--color-fg-muted)"
const FOLDS = 5
/** Beyond this degree a 5-fold split leaves too few points per fit, and CV error explodes. */
const CV_MAX_DEGREE = 6

const bestTest = errorByDegree.reduce((a, b) => (b.test < a.test ? b : a))
const cv = crossValidation(FOLDS).filter((r) => r.degree <= CV_MAX_DEGREE)
const bestCv = cv.reduce((a, b) => (b.cv < a.cv ? b : a))
const sizes = [10, 12, 15, 20, 30, 50, 80, 120]
const curveSimple = learningCurve(1, sizes)
const curveFlexible = learningCurve(9, sizes)
const f3 = (v: number) => v.toFixed(3)

function FitChart({ degree }: { degree: number }) {
  const { t } = useTranslation()
  const f = fitDegree(degree)
  return (
    <ScatterChart
      points={train.xs.map((x, i) => ({ x, y: train.ys[i], series: "train" }))}
      series={[{ key: "train", label: t("{0} training points", [TRAIN_SIZE]), color: COOL }]}
      xLabel="x"
      yLabel="y"
      lines={[
        { points: grid.map((x) => ({ x, y: truth(x) })), label: t("truth"), dashed: true },
        { points: grid.map((x) => ({ x, y: f(x) })), label: t("degree {0}", [degree]) },
      ]}
    />
  )
}

/** Seed whose 5 splits show each combination cleanly; values are measured, not chosen. */
const SUPERSCRIPT = "⁰¹²³⁴⁵⁶⁷⁸⁹"
const SUBSCRIPT = "₀₁₂₃₄₅₆₇₈₉"
/** "ŷ = w₀ + w₁x + w₂x² + …" for a polynomial of the given degree. */
const polynomial = (degree: number) =>
  `ŷ = ${Array.from({ length: degree + 1 }, (_, p) =>
    p === 0 ? "w₀" : `w${SUBSCRIPT[p]}x${p > 1 ? SUPERSCRIPT[p] : ""}`,
  ).join(" + ")}`

const SPLIT_SEED = 700
const splitPanels = [
  {
    highBias: false,
    highVariance: false,
    degree: 3,
    n: 30,
    randomX: false,
    caption: "degree 3, 30 points",
    explanation:
      "A cubic can bend twice — enough for one sine wave — and 30 points pin it down. All five runs land on the truth and on each other: low bias, low variance.",
  },
  {
    highBias: true,
    highVariance: false,
    degree: 1,
    n: 30,
    randomX: false,
    caption: "degree 1, 30 points",
    explanation:
      "A straight line can't bend, so every run misses the wave in the same way: high bias. With 30 points each, the five lines barely differ: low variance.",
  },
  {
    highBias: false,
    highVariance: true,
    degree: 9,
    n: 10,
    randomX: false,
    caption: "degree 9, 10 points",
    explanation:
      "Ten coefficients for ten points: every run threads its own noisy points exactly (training MSE 0) and swings wildly between them. On average they follow the wave (low bias), but they disagree with each other (high variance).",
  },
  {
    highBias: true,
    highVariance: true,
    degree: 1,
    n: 3,
    randomX: true,
    caption: "degree 1, 3 points",
    explanation:
      "A line can't bend (high bias), and three random points let one unlucky sample tilt it completely (high variance). Both problems at once — the worst case.",
  },
].map((p) => ({ ...p, ...splitFits(p.degree, p.n, SPLIT_SEED, p.randomX) }))

function SplitPanel({ panel }: { panel: (typeof splitPanels)[number] }) {
  const { t } = useTranslation()
  return (
    <figure className="flex flex-col gap-1 self-start">
      <ScatterChart
        points={[]}
        series={[]}
        xLabel="x"
        yLabel="y"
        lines={[
          { key: "truth", label: "", dashed: true, points: grid.map((x) => ({ x, y: truth(x) })) },
          ...panel.runs.map((run, i) => ({
            key: `split-${i}`,
            label: "",
            color: RUN_COLORS[i],
            points: run.curve,
          })),
        ]}
      />
      <table className="mx-auto font-ui text-[11px] text-fg-secondary">
        <thead>
          <tr className="text-fg-muted">
            <th className="px-2 text-left font-normal">{t("run")}</th>
            <th className="px-2 text-right font-normal">{t("train MSE")}</th>
            <th className="px-2 text-right font-normal">{t("test MSE")}</th>
          </tr>
        </thead>
        <tbody>
          {panel.runs.map((run, i) => (
            <tr key={RUN_COLORS[i]}>
              <td className="px-2">
                <span style={{ color: RUN_COLORS[i] }}>●</span> {i + 1}
              </td>
              <td className="px-2 text-right">{f3(run.train)}</td>
              <td className="px-2 text-right">{f3(run.test)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption className="flex flex-col gap-2">
        <span className="text-center font-ui text-xs text-fg-secondary">
          {t(panel.caption)} · {t("bias²")} {f3(panel.bias2)} · {t("variance")} {f3(panel.variance)}
        </span>
        <span className="border-l-2 border-brand pl-3 text-sm text-fg-secondary">
          {t(panel.explanation)}
        </span>
      </figcaption>
    </figure>
  )
}

export function BiasAndVarianceLesson({ entry }: { entry: LessonEntry }) {
  const { t } = useTranslation()
  const [degree, setDegree] = useState(3)
  const f = fitDegree(degree)
  const trainError = meanSquaredError(f, train.xs, train.ys)
  const testError = meanSquaredError(f, test.xs, test.ys)

  return (
    <LessonArticle entry={entry}>
      <LessonHero line1={t("Bias &")} line2={t("variance")} />
      <LessonLead>{t("A model can fail in two opposite ways:")}</LessonLead>
      <OptionList
        items={[
          <>
            {t("Too simple, and it misses the pattern even in the data it trained on — ")}
            <span className="text-fg">{t("bias")}</span>.
          </>,
          <>
            {t(
              "Too flexible, and it memorizes that data's noise, then stumbles on anything new — ",
            )}
            <span className="text-fg">{t("variance")}</span>.
          </>,
        ]}
      />
      <Takeaway>
        {t(
          "Every metric in this chapter is only meaningful once you know which of the two you're fighting.",
        )}
      </Takeaway>
      <section aria-label={t("Bias and variance as a target")} className="flex flex-col gap-4">
        <p className="text-fg-secondary">
          {t(
            "The classic picture: the bullseye is the true answer, and each dot is the prediction of one model trained on a different sample of data. ",
          )}
        </p>
        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1.4fr_1fr]">
          <BiasVarianceTargets />
          <div className="flex flex-col gap-3">
            <blockquote className="border-l-2 border-brand pl-4 text-fg-secondary">
              <span className="font-display text-xl text-fg">{t("Bias")}</span>{" "}
              {t(" — how far the")} <em>{t("average")}</em>{" "}
              {t(
                " prediction lands from the truth. A systematic error: the model aims at the wrong spot, usually because it is too simple to capture the pattern. ",
              )}
            </blockquote>
            <blockquote className="border-l-2 border-chart-cool pl-4 text-fg-secondary">
              <span className="font-display text-xl text-fg">{t("Variance")}</span>{" "}
              {t(
                " — how much the predictions scatter when the training data changes. An inconsistency error: the model is so flexible it chases the noise in whatever sample it saw. ",
              )}
            </blockquote>
            <p className="text-sm text-fg-secondary">
              {t("The goal is the top-left target: low bias ")}
              <em>{t("and")}</em>{" "}
              {t(
                " low variance. In practice, making a model more flexible moves it right-to-left (less bias) but top-to-bottom (more variance) — the trade-off the rest of this lesson measures. ",
              )}
            </p>
          </div>
        </div>
      </section>
      <p className="text-fg-secondary">
        {t("The running example is the classic curve-fitting demo (Bishop, 2006): ")}
        {TRAIN_SIZE}{" "}
        {t(
          " noisy points drawn from a hidden sine wave, fitted with polynomials of growing degree. The degree is the Representation choice — how wiggly the curve may be. ",
        )}
      </p>
      <p className="text-fg-secondary">
        {t(
          "The degree is the highest power of x in the curve's formula — roughly, how many times the curve can bend:",
        )}
      </p>
      <OptionList
        ordered={false}
        items={[
          <>
            <span className="text-fg">{t("Degree 0")}</span>
            {t(" — a flat line: ŷ = w₀. It can't follow anything.")}
          </>,
          <>
            <span className="text-fg">{t("Degree 1")}</span>
            {t(" — a straight, sloped line: ŷ = w₀ + w₁x. No bends.")}
          </>,
          <>
            <span className="text-fg">{t("Degree 2")}</span>
            {t(" — a parabola: adds w₂x², one bend.")}
          </>,
          <>
            <span className="text-fg">{t("Degree 3")}</span>
            {t(" — a cubic: adds w₃x³, two bends — enough for one sine wave.")}
          </>,
          <>
            <span className="text-fg">{t("Degree 9")}</span>
            {t(
              " — up to eight bends and 10 coefficients: enough to pass exactly through 10 points, noise included.",
            )}
          </>,
        ]}
      />
      <Takeaway>
        {t(
          "Each extra degree adds one more coefficient to learn: more flexibility to follow the pattern — and to follow the noise.",
        )}
      </Takeaway>
      <p className="text-fg-secondary">{t("Try it:")}</p>
      <Slider label={t("Degree")} value={degree} min={0} max={9} step={1} onChange={setDegree} />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.25fr_1fr]">
        <FitChart degree={degree} />
        <div className="flex flex-col gap-3">
          <Formula>
            <p>
              {t("degree {0}: ", [degree])}
              {polynomial(degree)}
            </p>
            <p>
              {degree + 1} {degree === 0 ? t("coefficient to learn") : t("coefficients to learn")}
            </p>
          </Formula>
          <StatRow
            stats={[
              { label: t("training error"), value: f3(trainError) },
              { label: t("test error"), value: f3(testError) },
            ]}
          />
          <p className="text-sm text-fg-secondary">
            {t("Errors are mean squared error: training on the ")}
            {TRAIN_SIZE} {t(" points shown, test on")} {test.xs.length}{" "}
            {t(
              " fresh points from the same sine wave. The noise alone puts a floor under any model's test error: σ² = ",
            )}
            {f3(NOISE ** 2)}.
          </p>
          <p className="text-sm text-fg-secondary">
            {degree <= 2
              ? t(
                  "Underfitting: both errors are high — the curve can't bend enough to follow the wave.",
                )
              : degree >= 8
                ? t(
                    "Overfitting: training error is near zero, yet test error climbs — the curve threads every noisy point.",
                  )
                : t("About right: both errors are low and close together.")}
          </p>
        </div>
      </div>

      <MetricSection
        number="1"
        title={t("Underfitting: high bias")}
        what={
          <p>
            {t("Bias is the error from wrong assumptions: how far the ")}
            <em>{t("average")}</em>{" "}
            {t(
              " fitted model, over many possible training sets, sits from the truth. A straight line through a sine wave is wrong no matter how much data you give it. ",
            )}
          </p>
        }
        why={
          <p>
            {t(
              "Symptom: training error is high, and test error is about as high. More data won't help; a richer representation (more features, higher degree, less regularization) will. ",
            )}
          </p>
        }
        formulas={<p>Bias(x) = E[ŷ(x)] − f(x)</p>}
      >
        <FitChart degree={1} />
      </MetricSection>

      <MetricSection
        number="2"
        title={t("Overfitting: high variance")}
        what={
          <p>
            {t(
              "Variance is how much the fitted model changes when the training set changes. A degree-9 polynomial has 10 coefficients for 10 points, so it can pass through every one — noise included — and a different sample gives a wildly different curve. ",
            )}
          </p>
        }
        why={
          <p>
            {t(
              "Symptom: training error near zero, test error much higher. The gap between them is the tell. Fix it with more data, a simpler representation, regularization, or by averaging many models (ensembles). ",
            )}
          </p>
        }
        formulas={<p>Variance(x) = E[(ŷ(x) − E[ŷ(x)])²]</p>}
      >
        <FitChart degree={9} />
      </MetricSection>

      <MetricSection
        number="3"
        worked={
          <p>
            {t("degree {0}: ", [degree])}
            {t("training")} {f3(trainError)}, {t("test")} {f3(testError)} → {t("gap")}{" "}
            {f3(testError - trainError)}
          </p>
        }
        title={t("The trade-off: training vs. test error")}
        what={
          <p>
            {t(
              "Error on the training data and on unseen data, for every degree. Training error only ever falls as the model gets more flexible; test error falls, bottoms out, then rises. ",
            )}
          </p>
        }
        why={
          <p>
            {t(
              "This U-shape is why you never judge a model on its training data. The best test error here is at degree ",
            )}
            {bestTest.degree} ({f3(bestTest.test)}
            {t("); beyond it, every extra degree of freedom fits noise. ")}
          </p>
        }
        formulas={<p>MSE = (1/n)·Σ(yᵢ − ŷᵢ)²</p>}
      >
        <LineChart
          series={[
            {
              key: "train",
              label: t("training error"),
              color: COOL,
              points: errorByDegree.map((r) => ({ x: r.degree, y: r.train })),
            },
            {
              key: "test",
              label: t("test error"),
              color: BRAND,
              points: errorByDegree.map((r) => ({ x: r.degree, y: r.test })),
            },
          ]}
          xLabel={t("Polynomial degree (model complexity)")}
          yLabel={t("Mean squared error")}
          vLines={[{ x: degree, label: "now" }]}
        />
      </MetricSection>

      <MetricSection
        number="4"
        worked={
          <p>
            {t("degree {0}: ", [degree])}
            {f3(decomposition[degree].bias2)} + {f3(decomposition[degree].variance)} +{" "}
            {f3(NOISE ** 2)} ={" "}
            {f3(decomposition[degree].bias2 + decomposition[degree].variance + NOISE ** 2)}
          </p>
        }
        title={t("The decomposition")}
        what={
          <p>
            {t(
              "Refit each degree on 200 fresh training sets and measure, across x, how far the average curve is from the truth (bias²) and how much the curves disagree with each other (variance). Expected test error is their sum plus the noise. ",
            )}
          </p>
        }
        why={
          <p>
            {t(
              "It names the two forces behind the U-shape: bias² falls with complexity, variance rises. You can trade one for the other, but the noise σ² is irreducible — no model gets below it. ",
            )}
          </p>
        }
        formulas={<p>E[(y − ŷ)²] = Bias² + Variance + σ²</p>}
      >
        <LineChart
          series={[
            {
              key: "bias",
              label: t("bias²"),
              color: COOL,
              points: decomposition.map((r) => ({ x: r.degree, y: r.bias2 })),
            },
            {
              key: "variance",
              label: t("variance"),
              color: BRAND,
              points: decomposition.map((r) => ({ x: r.degree, y: r.variance })),
            },
            {
              key: "total",
              label: t("bias² + variance + σ²"),
              color: FG,
              points: decomposition.map((r) => ({
                x: r.degree,
                y: r.bias2 + r.variance + NOISE ** 2,
              })),
            },
            {
              key: "noise",
              label: t("σ² (noise floor)"),
              color: MUTED,
              dashed: true,
              points: DEGREES.map((d) => ({ x: d, y: NOISE ** 2 })),
            },
          ]}
          xLabel={t("Polynomial degree")}
          yLabel="Error"
        />
      </MetricSection>

      <MetricSection
        number="5"
        title={t("Measuring it: validation and cross-validation")}
        what={
          <p>
            {t(
              "In practice there is no extra test set to peek at. Split the data instead: train on part, validate on the rest, and keep a final test set untouched until the end. k-fold cross-validation rotates the validation part through all k folds and averages. ",
            )}
          </p>
        }
        why={
          <p>
            {t(
              "It estimates test error using only the training data, so you can pick the degree honestly. ",
            )}
            {FOLDS}
            {t("-fold CV on the ")}
            {TRAIN_SIZE} {t(" points picks degree ")}
            {bestCv.degree}
            {t(". With only ")}
            {TRAIN_SIZE - TRAIN_SIZE / FOLDS} {t(" points per fit, degrees above ")}
            {CV_MAX_DEGREE}{" "}
            {t(
              "can't be fitted reliably and are left off — small data limits how complex a model you can even assess. ",
            )}
          </p>
        }
        formulas={<p>CV = (1/k)·Σⱼ error on fold j, trained on the other k − 1</p>}
      >
        <FoldDiagram folds={FOLDS} />
        <p className="text-sm text-fg-secondary">
          {t("Stratified and group-aware splits, for imbalanced data and fairness: ")}
          <Link
            to="/learn/$chapter/$lesson"
            params={{ chapter: "machine-learning", lesson: "data-splits" }}
            className="text-brand hover:text-brand-soft"
          >
            {t("Data Splits →")}
          </Link>
        </p>
        <LineChart
          series={[
            {
              key: "cv",
              label: t("{0}-fold CV error", [FOLDS]),
              color: FG,
              points: cv.map((r) => ({ x: r.degree, y: r.cv })),
            },
            {
              key: "test",
              label: t("true test error"),
              color: BRAND,
              dashed: true,
              points: errorByDegree
                .filter((r) => r.degree <= CV_MAX_DEGREE)
                .map((r) => ({ x: r.degree, y: r.test })),
            },
          ]}
          xLabel={t("Polynomial degree")}
          yLabel={t("Mean squared error")}
        />
      </MetricSection>

      <MetricSection
        number="6"
        title={t("Learning curves")}
        what={
          <p>
            {t(
              "Training and test error as the training set grows, for a fixed model. Here: a straight line (degree 1) and the flexible degree-9 polynomial. ",
            )}
          </p>
        }
        why={
          <p>
            {t(
              "They tell you whether more data is worth collecting. The degree-9 gap closes as data grows — variance shrinks. The straight line's two errors meet at a high plateau straight away — bias doesn't shrink, so more data is wasted on it. ",
            )}
          </p>
        }
      >
        <LineChart
          series={[
            {
              key: "s-test",
              label: t("degree 1, test"),
              color: COOL,
              points: curveSimple.map((r) => ({ x: r.n, y: r.test })),
            },
            {
              key: "s-train",
              label: t("degree 1, train"),
              color: COOL,
              dashed: true,
              points: curveSimple.map((r) => ({ x: r.n, y: r.train })),
            },
            {
              key: "f-test",
              label: t("degree 9, test"),
              color: BRAND,
              points: curveFlexible.map((r) => ({ x: r.n, y: r.test })),
            },
            {
              key: "f-train",
              label: t("degree 9, train"),
              color: BRAND,
              dashed: true,
              points: curveFlexible.map((r) => ({ x: r.n, y: r.train })),
            },
          ]}
          xLabel={t("Training set size")}
          yLabel={t("Mean squared error")}
        />
      </MetricSection>

      <section aria-label={t("Diagnosis")} className="flex flex-col gap-4">
        <SectionTitle number="7">{t("Diagnosis at a glance")}</SectionTitle>
        <div className="overflow-x-auto rounded-[3px] border border-divider">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface">
              <tr className="label-ui text-fg-muted">
                <th className="px-4 py-2 font-normal">{t("Symptom")}</th>
                <th className="px-4 py-2 font-normal">{t("Diagnosis")}</th>
                <th className="px-4 py-2 font-normal">{t("Try")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider text-fg-secondary">
              <tr>
                <td className="px-4 py-2">{t("High training error, test error about the same")}</td>
                <td className="px-4 py-2 text-fg">{t("High bias (underfitting)")}</td>
                <td className="px-4 py-2">
                  {t("Richer model, better features, less regularization, train longer ")}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2">{t("Low training error, much higher test error")}</td>
                <td className="px-4 py-2 text-fg">{t("High variance (overfitting)")}</td>
                <td className="px-4 py-2">
                  {t("More data, simpler model, regularization, early stopping, ensembles ")}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2">{t("Both low and close together")}</td>
                <td className="px-4 py-2 text-fg">{t("A good fit")}</td>
                <td className="px-4 py-2">{t("Confirm once on the untouched test set")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section aria-label={t("Five splits, four combinations")} className="flex flex-col gap-4">
        <SectionTitle number="8">{t("Five splits, four combinations")}</SectionTitle>
        <p className="text-fg-secondary">
          {t(
            "The bullseye from the top of the page, rebuilt from real fits. Each panel trains the same model on 5 different samples of the sine wave — 5 runs, one color each — and draws all 5 curves against the truth (dashed), with each run's error on its own training points and on the shared test set:",
          )}
        </p>
        <OptionList
          ordered={false}
          items={[
            t("bias shows as curves that all miss the truth in the same way;"),
            t("variance shows as curves that disagree with each other;"),
            t("overfitting shows as a test error far above the training error, run after run."),
          ]}
        />
        <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-x-4 gap-y-3">
          <span />
          <p className="label-ui text-center text-fg-muted">{t("Low bias")}</p>
          <p className="label-ui text-center text-fg-muted">{t("High bias")}</p>
          {[false, true].map((highVariance) => (
            <div key={String(highVariance)} className="contents">
              <p className="label-ui rotate-180 text-fg-muted [writing-mode:vertical-rl]">
                {highVariance ? t("High variance") : t("Low variance")}
              </p>
              {splitPanels
                .filter((panel) => panel.highVariance === highVariance)
                .map((panel) => (
                  <SplitPanel key={panel.caption} panel={panel} />
                ))}
            </div>
          ))}
        </div>
        <Takeaway>
          {t(
            "The goal is the top-left panel: the five fits agree with each other and with the truth.",
          )}
        </Takeaway>
      </section>

      <LessonFooter entry={entry} />
    </LessonArticle>
  )
}

import { Code2Icon, PauseIcon, PlayIcon, RotateCcwIcon, WorkflowIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { DecisionChart } from "@/components/charts/decision-chart"
import { LineChart } from "@/components/charts/line-chart"
import { pointKey, type ScatterSeries } from "@/components/charts/scatter-chart"
import { CodeBlock } from "@/components/code-block"
import { ArticleFrame, LessonHero, LessonLead } from "@/components/course/lesson-layout"
import { useTranslation } from "@/i18n/use-translation"
import { cn } from "@/lib/utils"
import { classMeta, machineReadings } from "./dataset"
import { RuleFlowchart } from "./rule-flowchart"
import { classifyByRules, rulesPythonSource, rulesScore } from "./rules"

const series: ScatterSeries[] = [
  {
    key: "normal",
    label: `${classMeta.normal.code} — ${classMeta.normal.name}`,
    color: "var(--color-chart-cool)",
  },
  {
    key: "at-risk",
    label: `${classMeta["at-risk"].code} — ${classMeta["at-risk"].name}`,
    color: "var(--color-brand)",
  },
]

const predictions = machineReadings.map((reading) => ({
  ...reading,
  predicted: classifyByRules(reading),
}))

const points = machineReadings.map((r) => ({ x: r.temperature, y: r.vibration, series: r.label }))

/** The rules as a 0/1 "probability", so they draw the same regions + line as the network. */
const rulesValueAt = (temperature: number, vibration: number) =>
  classifyByRules({ temperature, vibration, label: "normal" }) === "at-risk" ? 1 : 0

/** Accuracy after each machine evaluated, in table order. */
const runningAccuracy = predictions.map((_, i) => {
  const seen = predictions.slice(0, i + 1)
  return {
    x: i + 1,
    y: Math.round((seen.filter((p) => p.predicted === p.label).length / seen.length) * 100),
  }
})

export function ProgrammingLesson() {
  const { t } = useTranslation()
  const [view, setView] = useState<"code" | "flowchart">("code")
  const [revealed, setRevealed] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    if (revealed >= predictions.length) {
      setPlaying(false)
      return
    }
    const timer = setTimeout(() => setRevealed((n) => n + 1), 200)
    return () => clearTimeout(timer)
  }, [playing, revealed])

  const done = revealed >= predictions.length
  const correct = predictions.slice(0, revealed).filter((p) => p.predicted === p.label).length
  const accuracy = revealed > 0 ? Math.round((correct / revealed) * 100) : null

  const togglePlaying = () => {
    if (done) setRevealed(0)
    setPlaying((p) => (done ? true : !p))
  }
  const reset = () => {
    setPlaying(false)
    setRevealed(0)
  }

  const flaggedKeys = useMemo(() => {
    if (!done) return undefined
    const keys = predictions
      .filter((p) => p.predicted !== p.label)
      .map((p) => pointKey({ x: p.temperature, y: p.vibration, series: p.label }))
    return new Set(keys)
  }, [done])

  return (
    <ArticleFrame>
      <LessonHero line1={t("Define the rules")} line2={t("by hand")} />
      <LessonLead>
        {t(
          "Traditionally, we ask a domain expert to define the logic: high temperature is dangerous, high vibration is dangerous, and moderate temperature and vibration together may also indicate a problem. We translate these assumptions into code. ",
        )}
      </LessonLead>

      <section aria-label={t("The algorithm")} className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setView("code")}
            className={cn(
              "label-ui flex items-center gap-1.5 rounded-[2px] border px-3 py-1.5 transition-colors",
              view === "code"
                ? "border-brand text-brand"
                : "border-line text-fg-muted hover:text-fg",
            )}
          >
            <Code2Icon className="size-3.5" aria-hidden /> {t(" Code ")}
          </button>
          <button
            type="button"
            onClick={() => setView("flowchart")}
            className={cn(
              "label-ui flex items-center gap-1.5 rounded-[2px] border px-3 py-1.5 transition-colors",
              view === "flowchart"
                ? "border-brand text-brand"
                : "border-line text-fg-muted hover:text-fg",
            )}
          >
            <WorkflowIcon className="size-3.5" aria-hidden /> {t(" Flowchart ")}
          </button>
        </div>
        {view === "code" ? <CodeBlock code={rulesPythonSource} /> : <RuleFlowchart />}
        <p className="text-sm text-fg-muted">
          {t(
            "This is traditional programming: humans provide the rules, and the computer executes them. ",
          )}
        </p>
      </section>

      <section aria-label={t("Run the algorithm")} className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <h2 className="label-ui text-fg-muted">{t("Run the algorithm")}</h2>
          <button
            type="button"
            onClick={togglePlaying}
            className="label-ui flex items-center gap-1.5 rounded-[2px] border border-line px-3 py-1.5 text-fg-secondary transition-colors hover:border-brand hover:text-brand"
          >
            {playing ? (
              <PauseIcon className="size-3.5" aria-hidden />
            ) : (
              <PlayIcon className="size-3.5" aria-hidden />
            )}
            {done ? t("Run again") : playing ? t("Pause") : t("Play")}
          </button>
          <button
            type="button"
            onClick={reset}
            className="label-ui flex items-center gap-1.5 rounded-[2px] border border-line px-3 py-1.5 text-fg-secondary transition-colors hover:border-brand hover:text-brand"
          >
            <RotateCcwIcon className="size-3.5" aria-hidden /> {t(" Reset ")}
          </button>
          {accuracy !== null && (
            <span className="label-ui ml-auto text-fg-muted">
              {t("Accuracy ")}
              <span className="text-brand">{accuracy}%</span> ({correct}/{revealed})
            </span>
          )}
        </div>

        <div className="max-h-[420px] overflow-auto rounded-[3px] border border-divider">
          <table className="w-full border-collapse font-ui text-sm">
            <thead>
              <tr className="sticky top-0 border-b border-divider bg-canvas text-left text-fg-muted">
                <th className="px-4 py-2 font-normal">{t("Temperature")}</th>
                <th className="px-4 py-2 font-normal">{t("Vibration")}</th>
                <th className="px-4 py-2 font-normal">{t("Actual")}</th>
                <th className="px-4 py-2 font-normal">{t("Predicted")}</th>
                <th className="px-4 py-2 font-normal" />
              </tr>
            </thead>
            <tbody>
              {predictions.map((reading, i) => {
                const isRevealed = i < revealed
                const matches = reading.predicted === reading.label
                return (
                  <tr
                    key={`${reading.temperature}-${reading.vibration}-${reading.label}`}
                    className={cn(
                      "border-b border-divider text-fg-secondary last:border-b-0",
                      isRevealed && !matches && "bg-elevated",
                    )}
                  >
                    <td className="px-4 py-2">{reading.temperature}°C</td>
                    <td className="px-4 py-2">{reading.vibration.toFixed(1)}</td>
                    <td
                      className={
                        reading.label === "normal"
                          ? "px-4 py-2 text-chart-cool"
                          : "px-4 py-2 text-brand"
                      }
                    >
                      {classMeta[reading.label].code}
                    </td>
                    <td className="px-4 py-2">
                      {isRevealed ? classMeta[reading.predicted].code : "—"}
                    </td>
                    <td className="px-4 py-2">{isRevealed ? (matches ? "✓" : "✗") : ""}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <DecisionChart
          points={points}
          series={series}
          xLabel={t("Temperature (°C)")}
          yLabel={t("Vibration (mm/s)")}
          valueAt={revealed > 0 ? rulesValueAt : () => 0.5}
          showBoundaryLine={revealed > 0}
          flaggedKeys={flaggedKeys}
        />
        <p className="text-sm text-fg-secondary">
          {revealed > 0 ? (
            <>
              {t(
                "The shading is what the rules decide everywhere on the chart, and the line is where their decision flips. Every edge is straight and parallel to an axis — each",
              )}{" "}
              <code className="font-ui text-xs text-brand">if</code>{" "}
              {t(
                ' tests one sensor against one threshold, so the "at risk" region is a union of rectangles. ',
              )}
              {done && " Dashed rings mark the machines the rules got wrong."}
            </>
          ) : (
            t("Press Play to run the rules and see the regions they carve out of the chart.")
          )}
        </p>

        {revealed > 1 && (
          <div className="flex flex-col gap-2">
            <LineChart
              series={[
                {
                  key: "rules",
                  label: t("rules accuracy"),
                  color: "var(--color-brand)",
                  points: runningAccuracy.slice(0, revealed),
                },
              ]}
              xLabel={t("Machines evaluated")}
              yLabel={t("Accuracy (%)")}
            />
            <p className="text-sm text-fg-secondary">
              <span className="text-fg">{t("Accuracy")}</span>{" "}
              {t(" is the share of machines whose predicted class matches the real label.")}{" "}
              {done
                ? t(
                    "After all {0} machines the rules finish at {1}% ({2}/{3}). Each dip is a machine on the wrong side of a threshold: the hot-but-normal machines (86–94 °C) and the cool-but-at-risk ones (50–52 °C). Unlike a trained model, nothing improves this number except rewriting the rules by hand.",
                    [rulesScore.total, rulesScore.accuracy, rulesScore.correct, rulesScore.total],
                  )
                : t("Watch it move as each machine is checked.")}
            </p>
          </div>
        )}
      </section>

      <section aria-label={t("Where do these rules break down?")} className="flex flex-col gap-2">
        <h2 className="label-ui text-brand">{t("Where do these rules break down?")}</h2>
        <p className="text-sm text-fg-secondary">
          {t("These rules get ")}
          {rulesScore.correct} {t(" of ")}
          {rulesScore.total} {t(" machines right —")} {rulesScore.accuracy}
          {t(
            "% accuracy. Each rule is a threshold on one feature, so together they can only carve the chart into rectangles. But the at-risk machines form an arch: risk depends on how temperature and vibration combine. Some hot machines with low vibration are fine; some cool machines with moderate vibration are not. We could add more rules, but what about the next exception? ",
          )}
        </p>
        <p className="text-sm text-fg-secondary">
          {t(
            "As sensors, operating conditions, and interactions increase, manually defining and maintaining all the rules becomes expensive and error-prone. The problem is no longer writing code. It is discovering the right rules. ",
          )}
        </p>
      </section>
    </ArticleFrame>
  )
}

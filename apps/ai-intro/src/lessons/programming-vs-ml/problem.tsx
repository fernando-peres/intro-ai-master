import { ActivityIcon, ThermometerIcon } from "lucide-react"
import type { ComponentType } from "react"
import { ScatterChart, type ScatterSeries } from "@/components/charts/scatter-chart"
import { ArticleFrame, LessonHero, LessonLead } from "@/components/course/lesson-layout"
import { useTranslation } from "@/i18n/use-translation"
import { classMeta, machineReadings } from "./dataset"

const features: { icon: ComponentType<{ className?: string }>; title: string; caption: string }[] =
  [
    { icon: ThermometerIcon, title: "Temperature (°C)", caption: "How hot is the machine?" },
    { icon: ActivityIcon, title: "Vibration (mm/s)", caption: "How much is it vibrating?" },
  ]

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

export function ProblemLesson() {
  const { t } = useTranslation()
  return (
    <ArticleFrame>
      <LessonHero line1={t("Can we predict")} line2={t("machine failure?")} />
      <LessonLead>
        {t(
          "Imagine a factory with hundreds of machines. Each machine has sensors that continuously measure its operating conditions. Our goal is to predict whether a machine is operating normally or is at risk of failure. ",
        )}
      </LessonLead>

      <section aria-label={t("Input features")} className="grid gap-10 sm:grid-cols-2">
        {features.map(({ icon: Icon, title, caption }) => (
          <div key={title} className="flex flex-col items-center gap-2 text-center">
            <Icon aria-hidden className="size-6 text-fg-muted" />
            <p className="font-display text-xl text-fg">{t(title)}</p>
            <p className="text-sm text-fg-muted">{t(caption)}</p>
          </div>
        ))}
      </section>

      <p className="text-sm text-fg-secondary">
        {t("Each observation contains two input features and a classification:")}{" "}
        <span className="text-chart-cool">{t("A — Normal")}</span>{" "}
        {t(" (machine is operating safely) or")}{" "}
        <span className="text-brand">{t("B — At Risk")}</span>{" "}
        {t(" (machine may require maintenance). ")}
      </p>

      <section aria-label={t("Example dataset")} className="flex flex-col gap-3">
        <h2 className="label-ui text-fg-muted">
          {t("Example dataset — ")}
          {machineReadings.length} {t(" machines ")}
        </h2>
        <div className="max-h-[420px] overflow-auto rounded-[3px] border border-divider">
          <table className="w-full border-collapse font-ui text-sm">
            <thead>
              <tr className="sticky top-0 border-b border-divider bg-canvas text-left text-fg-muted">
                <th className="px-4 py-2 font-normal">{t("Temperature")}</th>
                <th className="px-4 py-2 font-normal">{t("Vibration")}</th>
                <th className="px-4 py-2 font-normal">{t("Classification")}</th>
              </tr>
            </thead>
            <tbody>
              {machineReadings.map((reading) => (
                <tr
                  key={`${reading.temperature}-${reading.vibration}-${reading.label}`}
                  className="border-b border-divider last:border-b-0"
                >
                  <td className="px-4 py-2 text-fg-secondary">{reading.temperature}°C</td>
                  <td className="px-4 py-2 text-fg-secondary">{reading.vibration.toFixed(1)}</td>
                  <td
                    className={
                      reading.label === "normal"
                        ? "px-4 py-2 text-chart-cool"
                        : "px-4 py-2 text-brand"
                    }
                  >
                    {classMeta[reading.label].code} — {t(classMeta[reading.label].name)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-fg-muted">
          {t(
            "Illustrative synthetic training data, with labels assigned for the lesson — not actual industrial safety thresholds. ",
          )}
        </p>
      </section>

      <section aria-label={t("Visualize the problem")} className="flex flex-col gap-3">
        <h2 className="label-ui text-fg-muted">{t("Visualize the problem")}</h2>
        <ScatterChart
          points={machineReadings.map((r) => ({
            x: r.temperature,
            y: r.vibration,
            series: r.label,
          }))}
          series={series}
          xLabel={t("Temperature (°C)")}
          yLabel={t("Vibration (mm/s)")}
        />
      </section>

      <section className="rounded-[3px] border border-divider bg-surface p-[26px]">
        <p className="label-ui mb-2 text-brand">{t("Think about it")}</p>
        <p className="font-display text-lg text-fg-secondary">
          {t(
            "Can you draw a single line separating normal machines from machines at risk? What happens when new data arrives? ",
          )}
        </p>
      </section>
    </ArticleFrame>
  )
}

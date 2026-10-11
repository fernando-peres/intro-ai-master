import { Link } from "@tanstack/react-router"
import { ChevronDownIcon, InfoIcon, type LucideIcon } from "lucide-react"
import { type ReactNode, useState } from "react"
import { useTranslation } from "@/i18n/use-translation"

import type { ClassificationMetrics } from "@/lib/metrics"
import { metricGlossary } from "./metric-glossary"

export function AlgorithmCard({
  title,
  task,
  data,
  children,
}: {
  title: string
  task: string
  data: string
  children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4 rounded-[3px] border border-divider bg-surface p-[22px]">
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-2xl font-bold text-fg">{t(title)}</h3>
        <p className="text-sm text-fg">
          <span className="label-ui text-brand">{t("Task:")}</span> {task}
        </p>
        <p className="text-sm text-fg-secondary">
          <span className="label-ui text-fg-muted">{t("Data:")}</span> {data}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">{children}</div>
    </div>
  )
}

export function AlgorithmColumn({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon
  label: string
  children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <Icon className="size-4 text-brand" aria-hidden />
        <span className="label-ui text-fg-muted">{t(label)}</span>
      </div>
      {children}
    </div>
  )
}

export function Explanation({ children }: { children: ReactNode }) {
  return <p className="text-xs text-fg-secondary">{children}</p>
}

/** A boxed block of formulas: the model's function, its loss and update rule, or metric definitions. */
export function Formula({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[2px] border border-divider bg-canvas px-3 py-2 font-ui text-xs text-fg">
      {children}
    </div>
  )
}

/** A lesson in this chapter that covers the card's metrics in depth. */
export type MetricsLesson = { slug: string; title: string }

/** Named metric values, one row each, with a toggle revealing what each one measures and why. */
export function MetricList({
  rows,
  lesson,
}: {
  rows: { name: string; value: string; hint?: string }[]
  lesson?: MetricsLesson
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <div className="flex flex-col gap-2">
      <dl className="flex flex-col divide-y divide-divider rounded-[2px] border border-divider bg-canvas">
        {rows.map((r) => (
          <div key={r.name} className="flex flex-col gap-0.5 px-3 py-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="font-ui text-xs text-fg-secondary">
                {t(r.name)}
                {r.hint && <span className="text-fg-muted"> {t(r.hint ?? "")}</span>}
              </dt>
              <dd className="font-display text-lg text-fg">{r.value}</dd>
            </div>
            {open && metricGlossary[r.name] && (
              <p className="text-[11px] leading-snug text-fg-muted">{t(metricGlossary[r.name])}</p>
            )}
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="label-ui flex items-center gap-1.5 text-fg-muted transition-colors hover:text-fg"
        >
          <InfoIcon className="size-3.5" aria-hidden />
          {open ? t("Hide") : t("What do these measure?")}
          <ChevronDownIcon
            className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
        {open && lesson && (
          <Link
            to="/learn/$chapter/$lesson"
            params={{ chapter: "machine-learning", lesson: lesson.slug }}
            className="label-ui text-brand transition-colors hover:text-brand-soft"
          >
            {t(lesson.title)} →
          </Link>
        )}
      </div>
    </div>
  )
}

export function ConfusionMatrix({
  metrics: m,
  positive,
  negative,
}: {
  metrics: ClassificationMetrics
  positive: string
  negative: string
}) {
  const { t } = useTranslation()
  const cell = (value: number, label: string, correct: boolean) => (
    <div
      className={`flex flex-col items-center rounded-[2px] border px-2 py-1 ${correct ? "border-chart-cool" : "border-brand"}`}
    >
      <span className="font-display text-lg text-fg">{value}</span>
      <span className="font-ui text-[10px] text-fg-muted">{t(label)}</span>
    </div>
  )
  return (
    <div
      className="grid grid-cols-[auto_1fr_1fr] items-center gap-1 font-ui text-[11px] text-fg-muted"
      role="img"
      aria-label={t(
        "Confusion matrix: {0} true positives, {1} false negatives, {2} false positives, {3} true negatives.",
        [m.tp, m.fn, m.fp, m.tn],
      )}
    >
      <span />
      <span className="text-center">
        {t("predicted ")}
        {t(positive)}
      </span>
      <span className="text-center">
        {t("predicted ")}
        {t(negative)}
      </span>
      <span>
        {t("actual ")}
        {t(positive)}
      </span>
      {cell(m.tp, "TP", true)}
      {cell(m.fn, "FN", false)}
      <span>
        {t("actual ")}
        {t(negative)}
      </span>
      {cell(m.fp, "FP", false)}
      {cell(m.tn, "TN", true)}
    </div>
  )
}

const fixed2 = (v: number) => v.toFixed(2)

/** Evaluation column body shared by every classifier: confusion matrix, metrics, definitions. */
export function ClassificationEvaluation({
  metrics,
  positive,
  negative,
  children,
}: {
  metrics: ClassificationMetrics
  positive: string
  negative: string
  children: ReactNode
}) {
  const { t } = useTranslation()
  const lesson = { slug: "classification-metrics", title: "Classification Metrics" }
  return (
    <>
      <ConfusionMatrix metrics={metrics} positive={t(positive)} negative={t(negative)} />
      <MetricList
        rows={[
          { name: "Accuracy", value: fixed2(metrics.accuracy) },
          { name: "Precision", value: fixed2(metrics.precision) },
          { name: "Recall", value: fixed2(metrics.recall) },
          { name: "F1", value: fixed2(metrics.f1) },
          { name: "ROC AUC", value: fixed2(metrics.auc) },
        ]}
        lesson={lesson}
      />
      <Explanation>{children}</Explanation>
      <Formula>
        <p>accuracy = (TP + TN) / total</p>
        <p>precision = TP / (TP + FP)</p>
        <p>recall = TP / (TP + FN)</p>
        <p>F1 = 2·P·R / (P + R)</p>
        <p>AUC = P(score⁺ &gt; score⁻)</p>
      </Formula>
    </>
  )
}

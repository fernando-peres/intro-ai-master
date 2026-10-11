import { type ReactNode, useId } from "react"
import { SectionTitle } from "@/components/course/lesson-layout"
import { useTranslation } from "@/i18n/use-translation"
import { Formula } from "./algorithm-card"

/** One metric (or concept): what it measures, why it matters, its formula, beside a chart. */
export function MetricSection({
  number,
  title,
  what,
  why,
  formulas,
  worked,
  children,
  whatLabel = "What it measures",
  whyLabel = "Why it matters",
}: {
  number: string
  title: string
  what: ReactNode
  why: ReactNode
  formulas?: ReactNode
  /** The formulas again, with this lesson's actual numbers substituted in (see `Worked`). */
  worked?: ReactNode
  children: ReactNode
  /** Column headings, e.g. "What it is" for a technique rather than a metric. */
  whatLabel?: string
  whyLabel?: string
}) {
  const { t } = useTranslation()
  return (
    <section aria-label={t(title)} className="flex flex-col gap-4">
      <SectionTitle number={number}>{t(title)}</SectionTitle>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_1.25fr]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="label-ui text-brand">{t(whatLabel)}</p>
            <div className="text-fg-secondary">{what}</div>
          </div>
          <div className="flex flex-col gap-1">
            <p className="label-ui text-brand">{t(whyLabel)}</p>
            <div className="text-fg-secondary">{why}</div>
          </div>
          {formulas && <Formula>{formulas}</Formula>}
          {worked && <Worked>{worked}</Worked>}
        </div>
        <div className="flex flex-col gap-3">{children}</div>
      </div>
    </section>
  )
}

/** A closing table: every metric of the lesson, what it answers and when to reach for it. */
export function CheatSheet({
  number,
  rows,
}: {
  number: string
  rows: { metric: string; question: string; use: string }[]
}) {
  const { t } = useTranslation()
  return (
    <section aria-label={t("Cheat sheet")} className="flex flex-col gap-4">
      <SectionTitle number={number}>{t("Cheat sheet")}</SectionTitle>
      <div className="overflow-x-auto rounded-[3px] border border-divider">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface">
            <tr className="label-ui text-fg-muted">
              <th className="px-4 py-2 font-normal">{t("Metric")}</th>
              <th className="px-4 py-2 font-normal">{t("Answers")}</th>
              <th className="px-4 py-2 font-normal">{t("Reach for it when")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {rows.map((r) => (
              <tr key={r.metric}>
                <td className="px-4 py-2 font-ui text-fg">{t(r.metric)}</td>
                <td className="px-4 py-2 text-fg-secondary">{t(r.question)}</td>
                <td className="px-4 py-2 text-fg-secondary">{t(r.use)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format = (v) => String(v),
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  format?: (value: number) => string
}) {
  const { t } = useTranslation()
  const id = useId()
  return (
    <div className="flex items-center gap-4 rounded-[3px] border border-divider bg-surface px-4 py-3">
      <label htmlFor={id} className="label-ui shrink-0 text-fg-muted">
        {t(label)}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand"
      />
      <span className="w-14 shrink-0 text-right font-display text-xl text-fg">{format(value)}</span>
    </div>
  )
}

/** A row of big numbers, e.g. a metric's value for each model being compared. */
export function StatRow({ stats }: { stats: { label: string; value: string }[] }) {
  const { t } = useTranslation()
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {stats.map((s) => (
        <div key={s.label} className="rounded-[2px] border border-divider bg-surface px-3 py-2">
          <p className="font-display text-2xl text-fg">{s.value}</p>
          <p className="label-ui text-fg-muted">{t(s.label)}</p>
        </div>
      ))}
    </div>
  )
}

/** The one sentence to remember from a passage, set apart as a quote. */
export function Takeaway({ children }: { children: ReactNode }) {
  return (
    <blockquote className="border-l-2 border-brand pl-4 font-display text-[19px] leading-snug text-fg">
      {children}
    </blockquote>
  )
}

/** A numbered or bulleted list of options, in the lesson's body text style. */
export function OptionList({ items, ordered = true }: { items: ReactNode[]; ordered?: boolean }) {
  const List = ordered ? "ol" : "ul"
  return (
    <List
      className={`flex flex-col gap-2 pl-6 text-fg-secondary ${ordered ? "list-decimal" : "list-disc"} marker:text-brand`}
    >
      {items.map((item, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: list items are fixed and ordered
        <li key={i}>{item}</li>
      ))}
    </List>
  )
}

/** k-fold cross-validation: one row per round, the validation fold highlighted. */
export function FoldDiagram({ folds }: { folds: number }) {
  const { t } = useTranslation()
  return (
    <div
      className="flex flex-col gap-1"
      role="img"
      aria-label={t("{0}-fold cross-validation: each round validates on a different fold.", [
        folds,
      ])}
    >
      {Array.from({ length: folds }, (_, round) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: rounds are a fixed, ordered sequence
        <div key={round} className="flex items-center gap-1">
          <span className="w-16 font-ui text-[11px] text-fg-muted">
            {t("round ")}
            {round + 1}
          </span>
          {Array.from({ length: folds }, (_, fold) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: folds are a fixed, ordered sequence
              key={fold}
              className={`h-5 flex-1 rounded-[2px] ${fold === round ? "bg-brand" : "bg-chart-cool/60"}`}
            />
          ))}
        </div>
      ))}
      <p className="font-ui text-[11px] text-fg-muted">
        <span className="text-chart-cool">■</span> {t(" train ")}
        <span className="text-brand">■</span> {t("validate ")}
      </p>
    </div>
  )
}

/** A formula worked through with real numbers, line by line: "precision = 8 / (8 + 2) = 0.80". */
export function Worked({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-1 rounded-[2px] border border-brand/40 bg-brand/5 px-3 py-2">
      <p className="label-ui text-brand">{t("With our numbers")}</p>
      <div className="flex flex-col gap-0.5 font-ui text-xs leading-relaxed text-fg">
        {children}
      </div>
    </div>
  )
}

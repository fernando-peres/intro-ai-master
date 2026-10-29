import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"
import { SectionTitle } from "@/components/course/lesson-layout"
import { useTranslation } from "@/i18n/use-translation"
import { cn } from "@/lib/utils"
import { type ExecutionMode, ModeBadge } from "./stages"
import { TECHNIQUES, type Technique, type TechniqueId } from "./training-intuition-data"

/** Shared pieces of the Training Intuition pages; every size here is larger than the app's defaults. */

export const PROSE = "text-[19px] leading-[1.6] text-fg-secondary"
const EYEBROW = "font-ui text-[12px] uppercase tracking-[0.18em]"

/** Body copy column: paragraphs and `OptionList`s inherit the larger size. */
export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-4", PROSE, className)}>{children}</div>
}

/** A lesson section with its title and, when the numbers are authored, their badge. */
export function IntuitionSection({
  number,
  title,
  mode,
  children,
}: {
  number: string
  title: string
  mode?: ExecutionMode
  children: ReactNode
}) {
  return (
    <section aria-label={title} className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <SectionTitle number={number}>{title}</SectionTitle>
        {mode && <ModeBadge mode={mode} />}
      </div>
      {children}
    </section>
  )
}

/** Eyebrow for one step of a recipe: "Step 1 · Demonstrations". */
export function StepLabel({ number, children }: { number: string; children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <p className={cn(EYEBROW, "flex items-baseline gap-3 text-brand")}>
      <span className="font-display text-5xl font-bold normal-case tracking-normal">{number}</span>
      <span>
        {t("Step")} {number} · {children}
      </span>
    </p>
  )
}

/** One piece of data in big type: an optional prompt in muted serif, then the text itself. */
export function Sample({
  label,
  prompt,
  text,
  code,
  tone,
  aside,
  className,
}: {
  label: string
  prompt?: string
  text: string
  code?: boolean
  /** A preference, not a verdict: chosen is warm, rejected is muted. */
  tone?: "chosen" | "rejected"
  aside?: ReactNode
  className?: string
}) {
  return (
    <article
      aria-label={label}
      className={cn(
        "flex flex-col gap-3 rounded-[3px] border border-divider bg-surface px-5 py-4",
        tone === "chosen" && "border-l-2 border-l-chart-warm",
        tone === "rejected" && "border-l-2 border-l-fg-muted",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={cn(EYEBROW, tone === "chosen" ? "text-chart-warm" : "text-fg-muted")}>
          {label}
        </span>
        {aside}
      </div>
      {prompt && <p className="font-display text-[22px] leading-[1.35] text-fg-muted">{prompt}</p>}
      {code ? (
        <pre className="overflow-x-auto whitespace-pre font-ui text-[15px] leading-[1.6] text-fg">
          {text}
        </pre>
      ) : (
        <p className="font-display text-[26px] leading-[1.3] text-fg">{text}</p>
      )}
    </article>
  )
}

/** A table in the pages' larger type; the first cell of a row is its header. */
export function BigTable({
  head,
  rows,
}: {
  head: string[]
  rows: { key: string; cells: ReactNode[] }[]
}) {
  return (
    <div className="overflow-x-auto rounded-[3px] border border-divider">
      <table className="w-full min-w-[560px] border-collapse text-left">
        <thead className="bg-surface">
          <tr>
            {head.map((cell) => (
              <th key={cell} className={cn(EYEBROW, "px-4 py-3 font-normal text-fg-muted")}>
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-divider">
              {row.cells.map((cell, i) =>
                i === 0 ? (
                  <th
                    // biome-ignore lint/suspicious/noArrayIndexKey: cells are a fixed, ordered sequence
                    key={i}
                    scope="row"
                    className="px-4 py-3 align-top font-display text-[19px] font-normal text-fg"
                  >
                    {cell}
                  </th>
                ) : (
                  <td
                    // biome-ignore lint/suspicious/noArrayIndexKey: cells are a fixed, ordered sequence
                    key={i}
                    className={cn("px-4 py-3 align-top font-display", PROSE, "leading-[1.4]")}
                  >
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** A link to one of the chapter's lessons, inline in prose. */
export function LabLink({ lesson, children }: { lesson: string; children: ReactNode }) {
  return (
    <Link
      to="/learn/$chapter/$lesson"
      params={{ chapter: "generative-ai", lesson }}
      className="text-brand underline-offset-4 hover:underline"
    >
      {children}
    </Link>
  )
}

/** One technique's recipe: the data it eats, where the signal comes from, what changes, what it lacks. */
export function RecipeCard({ technique, active }: { technique: Technique; active?: boolean }) {
  const { t } = useTranslation()
  const rows: [string, string][] = [
    [t("Data"), t(technique.data)],
    [t("Signal"), t(technique.signal)],
    [t("What changes"), t(technique.changes)],
    [t("Does not give"), t(technique.lacks)],
  ]
  return (
    <article
      aria-label={t(technique.title)}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex flex-col gap-4 rounded-[3px] border border-divider border-t-2 bg-surface px-5 py-4",
        technique.top,
        active && "ring-1 ring-brand",
      )}
    >
      <h3 className={cn("font-display text-[28px] font-bold leading-none", technique.text)}>
        {active ? (
          t(technique.title)
        ) : (
          <LabLink lesson={technique.slug}>{t(technique.title)}</LabLink>
        )}
      </h3>
      <dl className="flex flex-col gap-3">
        {rows.map(([term, detail]) => (
          <div key={term} className="flex flex-col gap-0.5">
            <dt className={cn(EYEBROW, "text-fg-muted")}>{term}</dt>
            <dd className="font-display text-[19px] leading-[1.35] text-fg">{detail}</dd>
          </div>
        ))}
      </dl>
    </article>
  )
}

/** The three recipes side by side, the current page's highlighted; closes every page. */
export function TechniqueSummary({ active }: { active: TechniqueId }) {
  const { t } = useTranslation()
  return (
    <section
      aria-label={t("Three kinds of data, three techniques")}
      className="flex flex-col gap-5"
    >
      <h2 className="font-display text-4xl font-bold text-fg">
        {t("Three kinds of data,")}{" "}
        <span className="text-brand italic">{t("three techniques")}</span>
      </h2>
      <div className="grid gap-4 lg:grid-cols-3">
        {TECHNIQUES.map((technique) => (
          <RecipeCard key={technique.id} technique={technique} active={technique.id === active} />
        ))}
      </div>
    </section>
  )
}

import { useTranslation } from "@/i18n/use-translation"

/** One group's 8 applicants: which of the 4 qualified and 4 not-qualified ones were approved. */
type GroupDecisions = { qualifiedApproved: number; unqualifiedApproved: number }
const PER_CLASS = 4

const scenarios: {
  title: string
  body: string
  verdict: string
  tone: "good" | "warn" | "bad"
  groups: [GroupDecisions, GroupDecisions]
}[] = [
  {
    title: "Accurate and fair",
    body: "Good overall performance and similar results across groups.",
    verdict: "Accurate and fair",
    tone: "good",
    groups: [
      { qualifiedApproved: 4, unqualifiedApproved: 1 },
      { qualifiedApproved: 4, unqualifiedApproved: 1 },
    ],
  },
  {
    title: "Accurate but unfair",
    body: "Good overall performance, but one group receives fewer positive decisions.",
    verdict: "Accurate overall, but unfair",
    tone: "warn",
    groups: [
      { qualifiedApproved: 4, unqualifiedApproved: 1 },
      { qualifiedApproved: 2, unqualifiedApproved: 1 },
    ],
  },
  {
    title: "Inaccurate but fair",
    body: "Similar (but poor) results across groups.",
    verdict: "Fair, but inaccurate",
    tone: "warn",
    groups: [
      { qualifiedApproved: 2, unqualifiedApproved: 2 },
      { qualifiedApproved: 2, unqualifiedApproved: 2 },
    ],
  },
  {
    title: "Inaccurate and unfair",
    body: "Poor performance and different results across groups.",
    verdict: "Inaccurate and unfair",
    tone: "bad",
    groups: [
      { qualifiedApproved: 2, unqualifiedApproved: 2 },
      { qualifiedApproved: 0, unqualifiedApproved: 2 },
    ],
  },
]

const TONE = {
  good: "border-chart-cool text-chart-cool",
  warn: "border-fg-secondary text-fg-secondary",
  bad: "border-brand text-brand",
}

function DotRow({ approved, qualified }: { approved: number; qualified: boolean }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: PER_CLASS }, (_, i) => {
        const isApproved = i < approved
        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: a seat's position is its identity
            key={i}
            className={`flex size-6 items-center justify-center rounded-[3px] ${isApproved ? "border-2 border-fg" : "border border-transparent"}`}
          >
            <span
              className="size-3.5 rounded-full"
              style={{
                backgroundColor: qualified ? "var(--color-chart-cool)" : "var(--color-brand)",
              }}
            />
          </span>
        )
      })}
    </div>
  )
}

function GroupBox({ name, decisions }: { name: string; decisions: GroupDecisions }) {
  const { t } = useTranslation()
  const tpr = decisions.qualifiedApproved / PER_CLASS
  const fpr = decisions.unqualifiedApproved / PER_CLASS
  return (
    <div
      className="flex flex-col items-center gap-1"
      role="img"
      aria-label={t("{0}: TPR {1}, FPR {2}", [
        t(name),
        `${Math.round(tpr * 100)}%`,
        `${Math.round(fpr * 100)}%`,
      ])}
    >
      <p className="font-ui text-xs text-fg">{t(name)}</p>
      <DotRow approved={decisions.qualifiedApproved} qualified />
      <DotRow approved={decisions.unqualifiedApproved} qualified={false} />
      <p className="font-ui text-[11px] text-fg-secondary">
        TPR: {decisions.qualifiedApproved}/{PER_CLASS} ({Math.round(tpr * 100)}%)
      </p>
      <p className="font-ui text-[11px] text-fg-secondary">
        FPR: {decisions.unqualifiedApproved}/{PER_CLASS} ({Math.round(fpr * 100)}%)
      </p>
    </div>
  )
}

/** The four accuracy × fairness outcomes, as approval decisions over two groups of 8 applicants. */
export function FairnessSummary() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-ui text-xs text-fg-secondary">
        <span className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-chart-cool" />
          {t("Qualified / should be approved (positive)")}
        </span>
        <span className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-brand" />
          {t("Not qualified (negative)")}
        </span>
        <span className="flex items-center gap-2">
          <span className="size-4 rounded-[3px] border-2 border-fg" />
          {t("Model approved")}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {scenarios.map((s, i) => (
          <div
            key={s.title}
            className="flex flex-col gap-3 rounded-[3px] border border-divider bg-surface p-4"
          >
            <div>
              <p className="font-display text-xl font-bold text-fg">
                <span className="text-brand">{i + 1}. </span>
                {t(s.title)}
              </p>
              <p className="text-sm text-fg-secondary">{t(s.body)}</p>
            </div>
            <div className="flex justify-around gap-4">
              <GroupBox name="Group A" decisions={s.groups[0]} />
              <GroupBox name="Group B" decisions={s.groups[1]} />
            </div>
            <p
              className={`self-center rounded-[3px] border px-3 py-1 font-ui text-xs ${TONE[s.tone]}`}
            >
              {t(s.verdict)}
            </p>
          </div>
        ))}
      </div>
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="font-ui text-xs text-fg">{t("TPR (true-positive rate)")}</dt>
          <dd className="text-fg-secondary">
            {t("Share of qualified people correctly approved.")}
          </dd>
        </div>
        <div>
          <dt className="font-ui text-xs text-fg">{t("FPR (false-positive rate)")}</dt>
          <dd className="text-fg-secondary">
            {t("Share of non-qualified people incorrectly approved.")}
          </dd>
        </div>
        <div>
          <dt className="font-ui text-xs text-fg">{t("Fairness")}</dt>
          <dd className="text-fg-secondary">
            {t(
              "Comparable error rates and outcomes across groups (e.g. equal opportunity: equal TPR).",
            )}
          </dd>
        </div>
      </dl>
    </div>
  )
}

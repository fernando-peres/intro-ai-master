import { useState } from "react"
import { useTranslation } from "@/i18n/use-translation"
import { fmt, norm } from "./embeddings-math"

/** A vector as numbers: the first `preview` dimensions, expandable to all of them. */
export function VectorInspector({
  vector,
  label,
  normalized,
  preview = 12,
}: {
  vector: number[]
  label: string
  normalized: boolean
  preview?: number
}) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? vector : vector.slice(0, preview)
  const stats: [string, string][] = [
    [t("Dimensions"), String(vector.length)],
    [t("Norm"), fmt(norm(vector))],
    [t("Normalized"), normalized ? t("yes") : t("no")],
  ]

  return (
    <div className="flex flex-col gap-3">
      <p className="font-display text-[15px] text-fg">{label}</p>
      <dl className="flex flex-wrap gap-x-6 gap-y-1">
        {stats.map(([name, value]) => (
          <div key={name} className="flex gap-2">
            <dt className="label-ui text-fg-muted">{name}</dt>
            <dd className="font-ui text-sm text-fg tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <ol className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-1 font-ui text-xs">
        {shown.map((value, i) => (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: the dimension index is the identity
            key={i}
            data-testid="vector-dim"
            className="flex justify-between gap-2 rounded-[2px] border border-divider px-2 py-1 tabular-nums"
          >
            <span className="text-fg-muted">{i}</span>
            <span className="text-fg">{fmt(value, 3)}</span>
          </li>
        ))}
      </ol>
      {vector.length > preview && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((open) => !open)}
          className="label-ui self-start text-brand underline-offset-4 hover:underline"
        >
          {expanded ? t("Show fewer") : t("Show all {0}", [vector.length])}
        </button>
      )}
    </div>
  )
}

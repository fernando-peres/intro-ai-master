import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Panel } from "@/components/workbench"
import { useTranslation } from "@/i18n/use-translation"
import { ModeBadge } from "../generative-ai/stages"
import { fmt, type Vector } from "./embeddings-math"

const TOKENS = ["[CLS]", "cats", "purr"]
const DEFAULTS: Vector[] = [
  [0.2, -0.1, 0.4],
  [0.9, 0.3, -0.5],
  [0.7, -0.6, 0.1],
]

const mean = (rows: Vector[]) =>
  rows[0].map((_, j) => rows.reduce((s, r) => s + r[j], 0) / rows.length)
const max = (rows: Vector[]) => rows[0].map((_, j) => Math.max(...rows.map((r) => r[j])))

/** Three editable token vectors pooled into one sentence vector three ways, live. */
export function PoolingToy() {
  const { t } = useTranslation()
  const [rows, setRows] = useState(DEFAULTS)
  const edit = (i: number, j: number, value: string) =>
    setRows((prev) =>
      prev.map((row, r) => (r === i ? row.map((v, c) => (c === j ? Number(value) || 0 : v)) : row)),
    )
  const pooled: { name: string; vector: Vector }[] = [
    { name: t("Mean (trained)"), vector: mean(rows) },
    { name: t("CLS (experiment)"), vector: rows[0] },
    { name: t("Max (experiment)"), vector: max(rows) },
  ]

  return (
    <Panel
      title={t("Pooling toy · 3 tokens × 3 dimensions")}
      aside={<ModeBadge mode="simulation" />}
    >
      <p className="text-sm text-fg-secondary">
        {t(
          "Edit the token vectors. Mean averages each column, CLS keeps the first row, max keeps each column's largest value.",
        )}
      </p>
      <div className="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)]">
        <fieldset className="flex flex-col gap-2">
          <legend className="label-ui pb-1 text-fg-muted">{t("Token vectors")}</legend>
          {TOKENS.map((token, i) => (
            <div key={token} className="flex items-center gap-2">
              <span className="w-12 font-display text-[15px] text-fg">{token}</span>
              {rows[i].map((v, j) => (
                <Input
                  // biome-ignore lint/suspicious/noArrayIndexKey: the dimension index is the identity
                  key={j}
                  type="number"
                  step={0.1}
                  value={v}
                  aria-label={`${token}, ${t("dimension {0}", [j + 1])}`}
                  onChange={(e) => edit(i, j, e.target.value)}
                  className="w-16 font-ui text-xs"
                />
              ))}
            </div>
          ))}
        </fieldset>
        <table className="self-start border-collapse font-ui text-[12px] text-fg-secondary">
          <caption className="label-ui pb-1 text-left text-fg-muted">
            {t("Sentence vector")}
          </caption>
          <tbody>
            {pooled.map(({ name, vector }) => (
              <tr key={name}>
                <th scope="row" className="pr-3 text-left font-normal text-fg-muted">
                  {name}
                </th>
                {vector.map((v, j) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: the dimension index is the identity
                  <td key={j} className="px-1.5 text-right tabular-nums">
                    {fmt(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

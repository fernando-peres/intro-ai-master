import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Panel, PanelNote, Switch } from "@/components/workbench"
import { useTranslation } from "@/i18n/use-translation"
import { AttentionHeatmap } from "./attention-heatmap"
import { type Matrix, scaledDotProductAttention, TOY_DEFAULTS } from "./attention-math"
import { ModeBadge } from "./stages"

const fmt = (v: number) => (Object.is(v, -0) ? "0" : String(Number(v.toFixed(2))))

function MatrixTable({ title, rows, matrix }: { title: string; rows: string[]; matrix: Matrix }) {
  return (
    <table className="border-collapse font-ui text-[12px] text-fg-secondary">
      <caption className="label-ui pb-1 text-left text-fg-muted">{title}</caption>
      <tbody>
        {matrix.map((row, i) => (
          <tr key={rows[i]}>
            <th scope="row" className="pr-2 text-left font-normal text-fg-muted">
              {rows[i]}
            </th>
            {row
              .map((v, j) => ({ key: `${rows[i]}-${j}`, v }))
              .map((cell) => (
                <td key={cell.key} className="px-1.5 text-right tabular-nums">
                  {fmt(cell.v)}
                </td>
              ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Three editable token vectors run through the real attention formula, with fixed projections. */
export function AttentionCalculator() {
  const { t } = useTranslation()
  const [X, setX] = useState<Matrix>(TOY_DEFAULTS.X)
  const [causal, setCausal] = useState(true)
  const [selected, setSelected] = useState(TOY_DEFAULTS.tokens.length - 1)
  const { tokens, Wq, Wk, Wv } = TOY_DEFAULTS
  const out = scaledDotProductAttention(X, Wq, Wk, Wv, { causal })
  const dims = ["d₁", "d₂"]

  const edit = (i: number, j: number, value: string) =>
    setX((prev) =>
      prev.map((row, r) => (r === i ? row.map((v, c) => (c === j ? Number(value) || 0 : v)) : row)),
    )

  return (
    <Panel title={t("Q · K · V calculator")} aside={<ModeBadge mode="simulation" />}>
      <p className="text-sm text-fg-secondary">
        {t(
          "Edit the three token vectors X. Q = XW_Q, K = XW_K and V = XW_V use fixed projections; the weights are softmax(QKᵀ / √d_k + M) and the output is those weights times V.",
        )}
      </p>
      <div className="grid gap-5 lg:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="label-ui pb-1 text-fg-muted">{t("Token vectors X")}</legend>
            {tokens.map((token, i) => (
              <div key={token} className="flex items-center gap-2">
                <span className="w-8 font-display text-[15px] text-fg">{token}</span>
                {X[i].map((v, j) => (
                  <Input
                    key={dims[j]}
                    type="number"
                    step={0.5}
                    value={v}
                    aria-label={`${token}, ${t("dimension {0}", [j + 1])}`}
                    onChange={(e) => edit(i, j, e.target.value)}
                    className="w-16 font-ui text-xs"
                  />
                ))}
              </div>
            ))}
          </fieldset>
          <Switch label={t("Causal mask")} checked={causal} onChange={setCausal} />
          <div className="flex flex-wrap gap-4">
            <MatrixTable title="W_Q" rows={dims} matrix={Wq} />
            <MatrixTable title="W_K" rows={dims} matrix={Wk} />
            <MatrixTable title="W_V" rows={dims} matrix={Wv} />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-5">
            <MatrixTable title="Q" rows={tokens} matrix={out.Q} />
            <MatrixTable title="K" rows={tokens} matrix={out.K} />
            <MatrixTable title="V" rows={tokens} matrix={out.V} />
            <MatrixTable title={t("QKᵀ / √d_k")} rows={tokens} matrix={out.scores} />
            <MatrixTable title={t("Output")} rows={tokens} matrix={out.output} />
          </div>
          <div className="max-w-[260px]">
            <AttentionHeatmap
              tokens={tokens}
              weights={out.weights}
              selected={selected}
              onSelect={setSelected}
              masked={causal}
              label={t("the toy example")}
            />
          </div>
        </div>
      </div>
      <PanelNote>
        {t(
          "Toy numbers you choose; no model involved. In GPT-2 each of the 12 heads in each of the 12 layers has its own W_Q, W_K and W_V, learned during pretraining, and d_k is 64.",
        )}
      </PanelNote>
    </Panel>
  )
}

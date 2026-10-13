import { ChevronDownIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "@/i18n/use-translation"
import { cn } from "@/lib/utils"
import { type MachineClass, riskValue } from "./dataset"

export type RiskRow = {
  key: string
  temperature: number
  vibration: number
  actual: MachineClass
  /** Omitted while this row's prediction hasn't been revealed or computed yet. */
  predicted?: MachineClass
}

/** User-requested highlight color for the predicted column's background, in both header and cells. */
const PREDICTED_BG = "bg-[#281000]"
/** Per-class text color, driven by the `--color-risk-0`/`--color-risk-1` custom properties. */
const riskTextClass = (label: MachineClass) =>
  label === "normal" ? "text-[var(--color-risk-0)]" : "text-[var(--color-risk-1)]"

/** Actual vs. predicted risk, shared by the Programming and Machine Learning pages. */
export function RiskTable({ rows }: { rows: RiskRow[] }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(true)
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="label-ui flex items-center gap-1.5 self-start text-fg-muted transition-colors hover:text-fg"
      >
        <ChevronDownIcon
          className={cn("size-3.5 transition-transform", !open && "-rotate-90")}
          aria-hidden
        />
        {open ? t("Hide {0} machines", [rows.length]) : t("Show {0} machines", [rows.length])}
      </button>
      {open && (
        <>
          <div className="max-h-[420px] overflow-auto rounded-[3px] border border-divider">
            <table className="w-full border-collapse font-ui text-sm">
              <thead>
                <tr className="sticky top-0 border-b border-divider bg-canvas text-left text-fg-muted">
                  <th className="px-4 py-2 font-normal">{t("Temperature")}</th>
                  <th className="px-4 py-2 font-normal">{t("Vibration")}</th>
                  <th className="px-4 py-2 font-normal">{t("Actual risk")}</th>
                  <th className={cn("px-4 py-2 font-normal text-[#ffd7b0]", PREDICTED_BG)}>
                    {t("Predicted risk")}
                  </th>
                  <th className="px-4 py-2 font-normal" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const matches = row.predicted !== undefined && row.predicted === row.actual
                  return (
                    <tr
                      key={row.key}
                      className={cn(
                        "border-b border-divider text-fg-secondary last:border-b-0",
                        row.predicted !== undefined && !matches && "bg-elevated",
                      )}
                    >
                      <td className="px-4 py-2">{row.temperature}°C</td>
                      <td className="px-4 py-2">{row.vibration.toFixed(1)}</td>
                      <td className={cn("px-4 py-2", riskTextClass(row.actual))}>
                        {riskValue(row.actual)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-2",
                          PREDICTED_BG,
                          row.predicted !== undefined
                            ? riskTextClass(row.predicted)
                            : "text-fg-muted",
                        )}
                      >
                        {row.predicted !== undefined ? riskValue(row.predicted) : "—"}
                      </td>
                      <td className="px-4 py-2">
                        {row.predicted !== undefined ? (matches ? "✓" : "✗") : ""}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-fg-muted">
            {t("Risk:")} <span className={cn("font-ui", riskTextClass("at-risk"))}>1</span>{" "}
            {t("= at risk,")} <span className={cn("font-ui", riskTextClass("normal"))}>0</span>{" "}
            {t("= normal.")}
          </p>
        </>
      )}
    </div>
  )
}

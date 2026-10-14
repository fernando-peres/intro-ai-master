import { EraserIcon, MinusIcon } from "lucide-react"
import { useTranslation } from "@/i18n/use-translation"
import { cn } from "@/lib/utils"
import { type MachineClass, riskLabel, riskValue } from "./dataset"
import type { SketchMode } from "./sketch"

const CLASSES: MachineClass[] = ["normal", "at-risk"]

/** Add-a-line, per-class point, and clear controls for the chart's hand-drawn layer. */
export function SketchControls({
  mode,
  label,
  onAddLine,
  onAddPoint,
  onClear,
}: {
  mode: SketchMode
  label: MachineClass
  onAddLine: () => void
  onAddPoint: (label: MachineClass) => void
  onClear: () => void
}) {
  const { t } = useTranslation()
  const button = (active: boolean) =>
    cn(
      "label-ui flex items-center gap-1.5 rounded-[2px] border px-3 py-1.5 transition-colors",
      active ? "border-brand text-brand" : "border-line text-fg-muted hover:text-fg",
    )

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={onAddLine} className={button(mode === "line")}>
        <MinusIcon className="size-3.5" aria-hidden /> {t("Add a line")}
      </button>
      {CLASSES.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onAddPoint(c)}
          className={button(mode === "point" && label === c)}
        >
          <span
            aria-hidden
            className="size-2.5 rounded-full"
            style={{ backgroundColor: `var(--color-risk-${riskValue(c)})` }}
          />
          {t(riskLabel(c))}
        </button>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="label-ui ml-auto flex items-center gap-1.5 rounded-[2px] border border-line px-3 py-1.5 text-fg-secondary transition-colors hover:border-brand hover:text-brand"
      >
        <EraserIcon className="size-3.5" aria-hidden /> {t("Clear drawing")}
      </button>
    </div>
  )
}

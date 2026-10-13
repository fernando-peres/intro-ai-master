import { type ReactNode, useId, useState } from "react"
import { useTranslation } from "@/i18n/use-translation"

/** Lets the reader shrink a chart that sits alone in its row, so content below stays in view. */
export function Resizable({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const id = useId()
  const [percent, setPercent] = useState(100)

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="label-ui flex items-center justify-end gap-2 text-fg-muted">
        {t("Chart size")}
        <input
          id={id}
          type="range"
          min={40}
          max={100}
          step={5}
          value={percent}
          onChange={(e) => setPercent(Number(e.target.value))}
          className="w-32 accent-brand"
        />
      </label>
      <div
        data-testid="resizable-body"
        className="mx-auto w-full"
        style={{ maxWidth: `${percent}%` }}
      >
        {children}
      </div>
    </div>
  )
}

import { type CSSProperties, createContext, type ReactNode, useContext, useState } from "react"
import { useTranslation } from "@/i18n/use-translation"

const STORAGE_KEY = "ai-intro-risk-colors"
/** In-palette defaults — the app's own purple/green accent hexes, just assigned to risk. */
const DEFAULTS = { normal: "#34d399", atRisk: "#c084fc" }

type RiskColors = typeof DEFAULTS

function loadStored(): RiskColors {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw)
    return {
      normal: typeof parsed.normal === "string" ? parsed.normal : DEFAULTS.normal,
      atRisk: typeof parsed.atRisk === "string" ? parsed.atRisk : DEFAULTS.atRisk,
    }
  } catch {
    return DEFAULTS
  }
}

function save(colors: RiskColors) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors))
  } catch {
    // Private browsing or a full quota: the picker still works for this page view.
  }
}

const RiskColorsContext = createContext<{
  colors: RiskColors
  setNormal: (color: string) => void
  setAtRisk: (color: string) => void
} | null>(null)

/**
 * Lets the student recolor the "normal"/"at risk" classes; the choice is exposed as
 * `--color-risk-0`/`--color-risk-1`, which every table and chart inside reads from, and is
 * remembered (localStorage) across the Programming and Machine Learning pages.
 */
export function RiskColorsProvider({ children }: { children: ReactNode }) {
  const [colors, setColors] = useState<RiskColors>(loadStored)

  const setNormal = (normal: string) =>
    setColors((c) => {
      const next = { ...c, normal }
      save(next)
      return next
    })
  const setAtRisk = (atRisk: string) =>
    setColors((c) => {
      const next = { ...c, atRisk }
      save(next)
      return next
    })

  const style = {
    "--color-risk-0": colors.normal,
    "--color-risk-1": colors.atRisk,
  } as CSSProperties

  return (
    <RiskColorsContext.Provider value={{ colors, setNormal, setAtRisk }}>
      <div className="contents" style={style}>
        {children}
      </div>
    </RiskColorsContext.Provider>
  )
}

function useRiskColors() {
  const ctx = useContext(RiskColorsContext)
  if (!ctx) throw new Error("useRiskColors must be used within RiskColorsProvider")
  return ctx
}

/** Two color swatches; picking one updates every "0"/"1" and every chart series on the page. */
export function RiskColorPicker() {
  const { t } = useTranslation()
  const { colors, setNormal, setAtRisk } = useRiskColors()
  const swatchClass =
    "size-7 cursor-pointer rounded-[2px] border border-divider bg-transparent p-0.5"
  return (
    <fieldset className="flex flex-wrap items-center gap-4 rounded-[3px] border border-divider bg-surface px-3.5 py-2.5">
      <legend className="label-ui px-0.5 text-fg-muted">{t("Class colors")}</legend>
      <label className="flex items-center gap-2 text-sm text-fg-secondary">
        <input
          type="color"
          value={colors.normal}
          onChange={(e) => setNormal(e.target.value)}
          aria-label={t("Color for 0 — normal")}
          className={swatchClass}
        />
        {t("0 — Normal")}
      </label>
      <label className="flex items-center gap-2 text-sm text-fg-secondary">
        <input
          type="color"
          value={colors.atRisk}
          onChange={(e) => setAtRisk(e.target.value)}
          aria-label={t("Color for 1 — at risk")}
          className={swatchClass}
        />
        {t("1 — At risk")}
      </label>
    </fieldset>
  )
}

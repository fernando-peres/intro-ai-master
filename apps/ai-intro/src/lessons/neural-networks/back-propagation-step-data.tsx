import { RotateCcwIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { DecisionChart } from "@/components/charts/decision-chart"
import { LineChart } from "@/components/charts/line-chart"
import { pointKey } from "@/components/charts/scatter-chart"
import { useTranslation } from "@/i18n/use-translation"
import { forward, type Network } from "@/lib/neural-net"
import { cn } from "@/lib/utils"
import { resolveThemeColor } from "./back-propagation-grid"
import {
  DATASET_IDS,
  type DatasetId,
  type Row,
  type stepByStep,
} from "./back-propagation-step-by-step-math"
import { StepGradient } from "./back-propagation-step-gradient"
import { fmt, stepNetwork } from "./back-propagation-step-network"

/** What the native color input shows until the student picks one (the dark-theme tokens). */
const CLASS_SWATCHES = ["#c084fc", "#34d399"] as const
const CLASS_TOKENS = ["var(--color-class-1)", "var(--color-class-2)"] as const
const DATASET_LABELS: Record<DatasetId, string> = { and: "AND", or: "OR", xor: "XOR" }

/**
 * The data box: dataset choice, the rows with a cursor on the active one, the network's decision
 * boundary over them in the class colors, and the gradient step of one weight below it.
 */
export function StepData({
  dataset,
  onDataset,
  rows,
  active,
  pass,
  step,
  epochNets,
  epochsDone,
}: {
  /** The network at the end of each epoch (index 0 = untrained), and how many epochs are done. */
  epochNets: Network[]
  epochsDone: number
  dataset: DatasetId
  onDataset: (id: DatasetId) => void
  rows: Row[]
  active: number
  pass: ReturnType<typeof stepByStep>
  step: number
}) {
  const { t } = useTranslation()
  const [overrides, setOverrides] = useState<[string | null, string | null]>([null, null])
  const colors = useMemo(() => CLASS_TOKENS.map((token, i) => overrides[i] ?? token), [overrides])
  const points = useMemo(
    () => rows.map((r) => ({ x: r.x[0], y: r.x[1], series: String(r.y) })),
    [rows],
  )
  // Steps 1–4 draw the same parameters, so the grid and contour are rebuilt only at the update.
  const updated = step === 4
  const network = useMemo(() => stepNetwork(pass, updated ? 4 : 0), [pass, updated])
  const boundary = useMemo(
    () => ({ valueAt: (x: number, y: number) => forward(network, [x, y])[2][0] }),
    [network],
  )
  const flagged = pointKey(points[active])
  // One 0.5 contour per finished epoch, newest strongest, under the bold line of the network now.
  const history = useMemo(() => {
    // SVG stroke attributes can't take var() or color-mix(), so resolve the theme color to hex.
    const resolved = resolveThemeColor("--ae-accent", "#d9742e")
    const hex = /^#[0-9a-f]{6}$/i.test(resolved) ? resolved : "#d9742e"
    return epochNets.slice(0, epochsDone + 1).map((net, e) => {
      const alpha = Math.round(255 * (0.15 + (0.7 * e) / Math.max(epochsDone, 1)))
      return {
        key: `epoch-${e}`,
        valueAt: (x: number, y: number) => forward(net, [x, y])[2][0],
        color: `${hex}${alpha.toString(16).padStart(2, "0")}`,
      }
    })
  }, [epochNets, epochsDone])
  const chart = useMemo(
    () => (
      <DecisionChart
        points={points}
        series={[0, 1].map((y) => ({
          key: String(y),
          label: t("Class {0}", [String(y)]),
          color: colors[y],
        }))}
        valueAt={boundary.valueAt}
        negativeColor={colors[0]}
        positiveColor={colors[1]}
        showBoundaryLine
        boundaries={history}
        flaggedKeys={new Set([flagged])}
        xLabel="x₁"
        yLabel="x₂"
      />
    ),
    [boundary, points, colors, flagged, history, t],
  )
  return (
    <section aria-label={t("Data")} className="flex flex-col gap-4 rounded border border-line p-4">
      <p className="label-ui text-brand">{t("Data")}</p>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[auto_1fr]">
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm text-fg-secondary">
            {t("Dataset")}
            <select
              value={dataset}
              onChange={(e) => onDataset(e.target.value as DatasetId)}
              aria-label={t("Dataset")}
              className="rounded-[2px] border border-divider bg-canvas px-2 py-1 font-ui text-xs text-fg"
            >
              {DATASET_IDS.map((id) => (
                <option key={id} value={id}>
                  {DATASET_LABELS[id]}
                </option>
              ))}
            </select>
          </label>
          <table className="w-fit border-collapse font-ui text-sm text-fg">
            <thead>
              <tr className="border-b border-line text-fg-muted">
                <th aria-hidden className="w-6" />
                <th className="px-4 py-1 text-left font-normal">x₁</th>
                <th className="px-4 py-1 text-left font-normal">x₂</th>
                <th className="px-4 py-1 text-left font-normal">y</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.x.join("-")}
                  aria-current={i === active ? "true" : undefined}
                  className={cn(i === active && "bg-brand/25 text-brand")}
                >
                  <td aria-hidden className="pl-2">
                    {i === active ? "▶" : ""}
                  </td>
                  <td className="px-4 py-1">{r.x[0]}</td>
                  <td className="px-4 py-1">{r.x[1]}</td>
                  <td className="px-4 py-1">
                    <span
                      aria-hidden
                      className="mr-2 inline-block size-2 rounded-full"
                      style={{ background: colors[r.y] }}
                    />
                    {r.y}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="max-w-xs text-fg-muted">
            {t("input (x₁, x₂) → Input Layer → Hidden Layer → Output")}
          </p>
          <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <legend className="label-ui mb-1 text-brand">{t("Class colors")}</legend>
            {[0, 1].map((y) => (
              <label key={y} className="flex items-center gap-2">
                <span className="text-sm text-fg-secondary">{t("Class {0}", [String(y)])}</span>
                <input
                  type="color"
                  value={overrides[y] ?? CLASS_SWATCHES[y]}
                  onChange={(e) => {
                    const color = e.target.value
                    setOverrides((prev) => (y === 0 ? [color, prev[1]] : [prev[0], color]))
                  }}
                  aria-label={t("Color for {0}", [t("Class {0}", [String(y)])])}
                  className="size-7 cursor-pointer rounded-[2px] border border-divider bg-transparent p-0.5"
                />
              </label>
            ))}
            <button
              type="button"
              onClick={() => setOverrides([null, null])}
              disabled={overrides[0] === null && overrides[1] === null}
              className="label-ui flex cursor-pointer items-center gap-1 text-fg-muted hover:text-fg disabled:cursor-default disabled:opacity-40"
            >
              <RotateCcwIcon className="size-3" aria-hidden /> {t("Reset colors")}
            </button>
          </fieldset>
        </div>

        <div className="flex max-w-lg flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="label-ui text-fg-secondary">{t("Decision boundary")}</p>
            {chart}
          </div>
        </div>
      </div>
    </section>
  )
}

/** Loss and accuracy of the whole dataset after each completed update (index 0 = untrained). */
export function StepCharts({
  points,
  pass,
  step,
}: {
  points: { loss: number; accuracy: number }[]
  pass: ReturnType<typeof stepByStep>
  step: number
}) {
  const { t } = useTranslation()
  const last = points[points.length - 1]
  const series = (key: "loss" | "accuracy", color: string, scale = 1) => [
    {
      key,
      label: key === "loss" ? "Loss" : "Accuracy",
      color,
      points: points.map((p, x) => ({ x, y: p[key] * scale })),
    },
  ]
  return (
    <section aria-label={t("Loss and accuracy")} className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <StepGradient pass={pass} step={step} />
      <div className="flex flex-col gap-2">
        <p className="label-ui text-brand">
          {t("Loss")}: {fmt(last.loss)}
        </p>
        <LineChart
          series={series("loss", "var(--color-brand)")}
          xLabel="Updates"
          yLabel="Loss"
          showPoints
        />
      </div>
      <div className="flex flex-col gap-2">
        <p className="label-ui text-brand">
          {t("Accuracy")}: {Math.round(last.accuracy * 100)}%
        </p>
        <LineChart
          series={series("accuracy", "var(--color-brand)", 100)}
          xLabel="Updates"
          yLabel="Accuracy (%)"
          showPoints
        />
      </div>
    </section>
  )
}

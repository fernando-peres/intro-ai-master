import { PlusIcon, XIcon } from "lucide-react"
import { seriesColor } from "@/artifacts/plugins/slide/chart-layout"
import { useSlideActions } from "@/artifacts/plugins/slide/editor-context"
import {
  CHART_TYPES,
  type ChartData,
  type ChartElement,
  SLIDE_THEMES,
  type SlideContent,
} from "@/artifacts/plugins/slide/model"
import { updateElement } from "@/artifacts/plugins/slide/ops"
import { PanelHeading } from "@/components/workspace/inspector"
import { cn } from "@/lib/utils"

type Props = {
  chart: ChartElement
  content: SlideContent
  onChange: (next: SlideContent) => void
  readOnly: boolean
}

const cell =
  "h-6 w-full min-w-0 rounded-[4px] border border-transparent bg-transparent px-1.5 text-[10.5px] text-gc-text outline-none hover:border-gc-border focus:border-gc-primary focus:bg-gc-raised disabled:opacity-60"

/** Edits the chart's data and options; the drawing re-renders from them on every change. */
export function ChartEditor({ chart, content, onChange, readOnly }: Props) {
  const actions = useSlideActions(content, onChange)
  const theme = SLIDE_THEMES[content.theme]
  const { data, options } = chart
  const setData = (next: ChartData, group: string | null = "chart:data") =>
    actions.apply(updateElement(content, chart.id, { data: next }), group)
  const setOptions = (patch: Partial<ChartElement["options"]>, group: string | null = null) =>
    actions.apply(updateElement(content, chart.id, { options: { ...options, ...patch } }), group)

  const addRow = () =>
    setData(
      {
        labels: [...data.labels, `Item ${data.labels.length + 1}`],
        series: data.series.map((series) => ({ ...series, values: [...series.values, 0] })),
      },
      null,
    )
  const removeRow = (index: number) =>
    setData(
      {
        labels: data.labels.filter((_, i) => i !== index),
        series: data.series.map((series) => ({
          ...series,
          values: series.values.filter((_, i) => i !== index),
        })),
      },
      null,
    )
  const addSeries = () =>
    setData(
      {
        ...data,
        series: [
          ...data.series,
          { name: `Series ${data.series.length + 1}`, values: data.labels.map(() => 0) },
        ],
      },
      null,
    )
  const removeSeries = (index: number) =>
    setData({ ...data, series: data.series.filter((_, i) => i !== index) }, null)

  const setValue = (row: number, column: number, raw: string) => {
    const value = Number(raw)
    if (raw === "" || !Number.isFinite(value)) return
    setData({
      ...data,
      series: data.series.map((series, s) =>
        s === column
          ? { ...series, values: series.values.map((v, i) => (i === row ? value : v)) }
          : series,
      ),
    })
  }

  return (
    <>
      <PanelHeading label="Chart" right={chart.chartType} />
      <div className="grid grid-cols-3 gap-1 rounded-md border border-gc-border bg-gc-sunken p-0.5">
        {CHART_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            aria-pressed={chart.chartType === type}
            disabled={readOnly}
            onClick={() => actions.apply(updateElement(content, chart.id, { chartType: type }))}
            className={cn(
              "h-6 rounded-[5px] text-[10.5px] capitalize",
              chart.chartType === type
                ? "bg-gc-row-bg font-semibold text-gc-nav-ink"
                : "text-gc-ink3",
            )}
          >
            {type}
          </button>
        ))}
      </div>
      <input
        aria-label="Chart title"
        placeholder="Chart title (optional)"
        disabled={readOnly}
        value={options.title ?? ""}
        onChange={(event) => setOptions({ title: event.target.value || undefined }, "chart:title")}
        className="h-7 rounded-[5px] border border-gc-border bg-gc-sunken px-2 text-[11px] text-gc-text outline-none focus:border-gc-primary"
      />
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10.5px] text-gc-ink2">
        {(
          [
            ["showLegend", "Legend"],
            ["showGrid", "Grid"],
            ["showValues", "Values"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-1.5">
            <input
              type="checkbox"
              disabled={readOnly}
              checked={options[key]}
              onChange={() => setOptions({ [key]: !options[key] })}
              className="accent-gc-primary"
            />
            {label}
          </label>
        ))}
      </div>
      {chart.chartType === "pie" && data.series.length > 1 && (
        <p className="text-[10.5px] text-gc-ink3">A pie chart draws the first series only.</p>
      )}

      <div className="overflow-x-auto rounded-md border border-gc-border bg-gc-sunken">
        <table aria-label="Chart data" className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gc-border">
              <th className="w-[38%] px-1 py-1 text-left font-mono text-[8.5px] font-normal tracking-[0.8px] text-gc-ink3">
                LABEL
              </th>
              {data.series.map((series, s) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: series columns are positional; names may repeat
                <th key={s} className="px-0.5 py-1 font-normal">
                  <span className="flex items-center gap-1">
                    <input
                      type="color"
                      aria-label={`${series.name} colour`}
                      disabled={readOnly}
                      value={seriesColor(s, theme, series.color).slice(0, 7)}
                      onChange={(event) =>
                        setData(
                          {
                            ...data,
                            series: data.series.map((entry, i) =>
                              i === s
                                ? { ...entry, color: event.target.value.toUpperCase() }
                                : entry,
                            ),
                          },
                          `chart:color:${s}`,
                        )
                      }
                      className="size-3.5 shrink-0 cursor-pointer border-0 bg-transparent p-0"
                    />
                    <input
                      aria-label={`Series ${s + 1} name`}
                      disabled={readOnly}
                      value={series.name}
                      onChange={(event) =>
                        setData({
                          ...data,
                          series: data.series.map((entry, i) =>
                            i === s ? { ...entry, name: event.target.value } : entry,
                          ),
                        })
                      }
                      className={cn(cell, "min-w-[84px] font-semibold")}
                    />
                    {data.series.length > 1 && !readOnly && (
                      <button
                        type="button"
                        aria-label={`Remove ${series.name}`}
                        onClick={() => removeSeries(s)}
                        className="text-gc-ink3 hover:text-gc-fail-ink"
                      >
                        <XIcon className="size-3" />
                      </button>
                    )}
                  </span>
                </th>
              ))}
              <th className="w-5" />
            </tr>
          </thead>
          <tbody>
            {data.labels.map((label, row) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional; labels may repeat
              <tr key={row} className="border-b border-gc-divider last:border-b-0">
                <td className="px-0.5">
                  <input
                    aria-label={`Label ${row + 1}`}
                    disabled={readOnly}
                    value={label}
                    onChange={(event) =>
                      setData({
                        ...data,
                        labels: data.labels.map((l, i) => (i === row ? event.target.value : l)),
                      })
                    }
                    className={cell}
                  />
                </td>
                {data.series.map((series, s) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: series columns are positional; names may repeat
                  <td key={s} className="px-0.5">
                    <input
                      type="number"
                      aria-label={`${series.name}, ${label}`}
                      disabled={readOnly}
                      value={series.values[row]}
                      onChange={(event) => setValue(row, s, event.target.value)}
                      className={cn(cell, "text-right font-mono")}
                    />
                  </td>
                ))}
                <td>
                  {data.labels.length > 1 && !readOnly && (
                    <button
                      type="button"
                      aria-label={`Remove row ${label}`}
                      onClick={() => removeRow(row)}
                      className="flex text-gc-ink3 hover:text-gc-fail-ink"
                    >
                      <XIcon className="size-3" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!readOnly && (
        <div className="flex gap-1.5">
          <AddButton onClick={addRow}>Row</AddButton>
          <AddButton onClick={addSeries}>Series</AddButton>
        </div>
      )}
    </>
  )
}

function AddButton({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-6 flex-1 items-center justify-center gap-1 rounded-[5px] border border-dashed border-gc-border text-[10.5px] text-gc-ink2 hover:text-gc-text"
    >
      <PlusIcon className="size-3" />
      {children}
    </button>
  )
}

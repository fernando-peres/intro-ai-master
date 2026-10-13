import { useId } from "react"
import { useTranslation } from "@/i18n/use-translation"

import { classMeta } from "./dataset"

const CX = 230
const DIAMOND_W = 300
const DIAMOND_H = 104
const BOX_W = 170
const BOX_H = 44
const RISK_X = 560
const decisions = [
  { y: 150, lines: ["temperature > 85 ?"] },
  { y: 300, lines: ["vibration > 6 ?"] },
  { y: 450, lines: ["temperature > 75", "and vibration > 4 ?"] },
]
const NORMAL_Y = 590
const WIDTH = RISK_X + BOX_W + 10
const HEIGHT = NORMAL_Y + BOX_H / 2 + 10

function Terminal({ x, y, label, color }: { x: number; y: number; label: string; color: string }) {
  const { t } = useTranslation()
  return (
    <g>
      <rect
        x={x - BOX_W / 2}
        y={y - BOX_H / 2}
        width={BOX_W}
        height={BOX_H}
        rx={BOX_H / 2}
        fill="var(--color-surface)"
        stroke={color}
        strokeWidth={2}
      />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        className="font-display text-[16px]"
      >
        {t(label)}
      </text>
    </g>
  )
}

function EdgeLabel({ x, y, children }: { x: number; y: number; children: string }) {
  return (
    <text x={x} y={y} className="fill-fg-muted font-ui text-[13px]" dominantBaseline="middle">
      {children}
    </text>
  )
}

/** A static flowchart of `classifyByRules`: each diamond is one `if`, read top to bottom. */
export function RuleFlowchart() {
  const { t } = useTranslation()
  const arrowId = `arrow-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`
  const arrow = `url(#${arrowId})`
  const risk = classMeta["at-risk"]
  const normal = classMeta.normal
  const riskLabel = `${risk.code} — ${t(risk.name)}`
  const normalLabel = `${normal.code} — ${t(normal.name)}`
  const riskColor = "var(--color-class-2)"
  const normalColor = "var(--color-class-1)"

  return (
    <div className="rounded-[3px] border border-divider p-4">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="mx-auto h-auto w-full max-w-[680px]"
        role="img"
        aria-label={t(
          "Flowchart: three yes/no checks in order; any yes ends at {0}, three no's end at {1}.",
          [riskLabel, normalLabel],
        )}
      >
        <defs>
          <marker
            id={arrowId}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" className="fill-fg-muted" />
          </marker>
        </defs>

        <Terminal x={CX} y={30} label={t("Start: read sensors")} color="var(--color-fg-muted)" />
        <line
          x1={CX}
          y1={30 + BOX_H / 2}
          x2={CX}
          y2={decisions[0].y - DIAMOND_H / 2}
          className="stroke-fg-muted"
          strokeWidth={1.5}
          markerEnd={arrow}
        />

        {decisions.map((d, i) => {
          const top = d.y - DIAMOND_H / 2
          const bottom = d.y + DIAMOND_H / 2
          const right = CX + DIAMOND_W / 2
          const nextTop =
            i < decisions.length - 1 ? decisions[i + 1].y - DIAMOND_H / 2 : NORMAL_Y - BOX_H / 2
          return (
            <g key={d.lines.join(" ")}>
              <polygon
                points={`${CX},${top} ${right},${d.y} ${CX},${bottom} ${CX - DIAMOND_W / 2},${d.y}`}
                fill="var(--color-surface)"
                className="stroke-fg-muted"
                strokeWidth={1.5}
              />
              {d.lines.map((line, li) => (
                <text
                  key={line}
                  x={CX}
                  y={d.y + (li - (d.lines.length - 1) / 2) * 18}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-fg font-ui text-[14px]"
                >
                  {t(line)}
                </text>
              ))}
              <line
                x1={right}
                y1={d.y}
                x2={RISK_X - BOX_W / 2}
                y2={d.y}
                className="stroke-fg-muted"
                strokeWidth={1.5}
                markerEnd={arrow}
              />
              <EdgeLabel x={right + 8} y={d.y - 12}>
                {t("yes ")}
              </EdgeLabel>
              <Terminal x={RISK_X} y={d.y} label={t(riskLabel)} color={riskColor} />
              <line
                x1={CX}
                y1={bottom}
                x2={CX}
                y2={nextTop}
                className="stroke-fg-muted"
                strokeWidth={1.5}
                markerEnd={arrow}
              />
              <EdgeLabel x={CX + 8} y={(bottom + nextTop) / 2}>
                {t("no ")}
              </EdgeLabel>
            </g>
          )
        })}

        <Terminal x={CX} y={NORMAL_Y} label={t(normalLabel)} color={normalColor} />
      </svg>
    </div>
  )
}

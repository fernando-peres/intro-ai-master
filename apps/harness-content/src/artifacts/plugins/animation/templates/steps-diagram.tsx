import { z } from "zod"
import {
  backgroundCss,
  commonProps,
  enterKeyframes,
  FONTS,
  field,
  hiddenStyle,
  schemeOf,
} from "@/artifacts/plugins/animation/templates/shared"
import type {
  AnimationTemplate,
  Keyframes,
  SceneProps,
  Segment,
} from "@/artifacts/plugins/animation/templates/types"

const props = z.object({
  title: field.text("Title", "From trace to verdict"),
  steps: z
    .array(
      z.object({
        label: field.text("Label", "New step", 40),
        detail: field.text("Detail", "What happens here", 90),
      }),
    )
    .min(2)
    .max(6)
    .default([
      { label: "Record", detail: "Capture the agent's trace" },
      { label: "Replay", detail: "Run it against the new build" },
      { label: "Score", detail: "Apply the rubric per step" },
      { label: "Report", detail: "Publish pass rate and diffs" },
    ])
    .meta({ title: "Steps" }),
  layout: field.choice("Layout", ["row", "column"], "row", { row: "Row", column: "Column" }),
  showNumbers: field.toggle("Show numbers", true),
  ...commonProps,
  stepDuration: field.range("Step duration", 0.7, 0.2, 3, 0.1, "s"),
  pause: field.range("Pause between steps", 0.4, 0, 2, 0.1, "s"),
})

type StepsProps = z.output<typeof props>
const NODE = 112

function StepsScene({ props: p, hidden }: SceneProps<StepsProps>) {
  const theme = schemeOf(p)
  const enter = hidden ? hiddenStyle(p.transition) : undefined
  const row = p.layout === "row"
  return (
    <div
      className="flex size-full flex-col gap-16 px-[140px] py-[110px]"
      style={{ background: backgroundCss(theme), color: theme.text, fontFamily: FONTS.ui }}
    >
      <h2
        data-anim="title"
        style={{ ...enter, margin: 0, fontFamily: FONTS.display, fontSize: 104, fontWeight: 600 }}
      >
        {p.title}
      </h2>
      <ol
        className={
          row ? "m-0 flex flex-1 list-none items-start p-0" : "m-0 flex list-none flex-col p-0"
        }
      >
        {p.steps.map((step, i) => (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: steps are positional and may repeat
            key={i}
            className={row ? "flex flex-1 flex-col gap-8" : "flex items-center gap-10"}
            style={row ? undefined : { minHeight: NODE + 26 }}
          >
            <div className={row ? "flex items-center" : "relative self-stretch"}>
              <div
                data-anim={`node-${i}`}
                className="relative z-10 flex shrink-0 items-center justify-center rounded-full"
                style={{
                  ...enter,
                  width: NODE,
                  height: NODE,
                  border: `6px solid ${p.accent}`,
                  background: theme.surface,
                  color: p.accent,
                  fontFamily: FONTS.mono,
                  fontSize: 44,
                  fontWeight: 600,
                }}
              >
                {p.showNumbers ? String(i + 1).padStart(2, "0") : ""}
              </div>
              {i < p.steps.length - 1 && (
                <div
                  data-anim={`line-${i + 1}`}
                  className={row ? "h-1.5 flex-1" : "absolute w-1.5"}
                  style={{
                    background: theme.line,
                    transformOrigin: row ? "left center" : "center top",
                    transform: hidden ? (row ? "scaleX(0)" : "scaleY(0)") : undefined,
                    ...(row ? {} : { left: NODE / 2 - 3, top: NODE, bottom: -26 }),
                  }}
                />
              )}
            </div>
            <div data-anim={`label-${i}`} className="flex flex-col gap-2 pr-8" style={enter}>
              <span style={{ fontSize: 50, fontWeight: 600 }}>{step.label}</span>
              <span style={{ color: theme.body, fontSize: 32, lineHeight: 1.3 }}>
                {step.detail}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

export const stepsDiagramTemplate: AnimationTemplate<typeof props, "animation.stepsDiagram"> = {
  id: "animation.stepsDiagram",
  label: "Steps diagram",
  description: "Numbered steps joined by connectors, revealed one at a time.",
  props,
  Scene: StepsScene,
  sequence: (p) => {
    const enter = enterKeyframes(p.transition)
    const grow: Keyframes = p.layout === "row" ? { scaleX: [0, 1] } : { scaleY: [0, 1] }
    const ease = p.easing
    const connector = p.stepDuration * 0.5
    const segments: Segment[] = [
      { target: "title", keyframes: enter, at: 0, duration: p.stepDuration, ease },
    ]
    let at = 0.4
    p.steps.forEach((_, i) => {
      if (i > 0) {
        segments.push({ target: `line-${i}`, keyframes: grow, at, duration: connector, ease })
        at += connector
      }
      segments.push({ target: `node-${i}`, keyframes: enter, at, duration: p.stepDuration, ease })
      segments.push({
        target: `label-${i}`,
        keyframes: enter,
        at: at + 0.12,
        duration: p.stepDuration,
        ease,
      })
      at += p.stepDuration + p.pause
    })
    return segments
  },
  searchText: (p) => [p.title, ...p.steps.flatMap((s) => [s.label, s.detail])].join(" "),
}

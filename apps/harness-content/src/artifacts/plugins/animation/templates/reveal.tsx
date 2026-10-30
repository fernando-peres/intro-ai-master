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
import type { AnimationTemplate, SceneProps } from "@/artifacts/plugins/animation/templates/types"

const props = z.object({
  eyebrow: field.text("Eyebrow", "01 · Overview", 60),
  title: field.text("Title", "What a harness checks"),
  points: z
    .array(z.object({ text: field.text("Point", "A new point") }))
    .min(1)
    .max(6)
    .default([
      { text: "Replays recorded traces" },
      { text: "Scores answers against a rubric" },
      { text: "Flags regressions before release" },
    ])
    .meta({ title: "Points" }),
  ...commonProps,
  duration: field.range("Duration", 0.8, 0.2, 3, 0.1, "s"),
  stagger: field.range("Stagger", 0.35, 0, 1.5, 0.05, "s"),
})

type RevealProps = z.output<typeof props>

function RevealScene({ props: p, hidden }: SceneProps<RevealProps>) {
  const theme = schemeOf(p)
  const enter = hidden ? hiddenStyle(p.transition) : undefined
  return (
    <div
      className="flex size-full flex-col justify-center gap-10 px-[160px]"
      style={{ background: backgroundCss(theme), color: theme.text, fontFamily: FONTS.ui }}
    >
      <div
        data-anim="eyebrow"
        style={{
          ...enter,
          color: p.accent,
          fontFamily: FONTS.mono,
          fontSize: 34,
          letterSpacing: 4,
          textTransform: "uppercase",
        }}
      >
        {p.eyebrow}
      </div>
      <div
        data-anim="bar"
        style={{
          width: 140,
          height: 8,
          borderRadius: 4,
          background: p.accent,
          transformOrigin: "left center",
          transform: hidden ? "scaleX(0)" : undefined,
        }}
      />
      <h2
        data-anim="title"
        style={{
          ...enter,
          margin: 0,
          fontFamily: FONTS.display,
          fontSize: 124,
          fontWeight: 600,
          lineHeight: 1.05,
        }}
      >
        {p.title}
      </h2>
      <ul className="m-0 flex list-none flex-col gap-7 p-0">
        {p.points.map((point, i) => (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: points are positional and may repeat
            key={i}
            data-anim={`point-${i}`}
            className="flex items-center gap-7"
            style={{ ...enter, color: theme.body, fontSize: 46 }}
          >
            <span
              className="shrink-0 rounded-full"
              style={{ width: 18, height: 18, background: p.accent }}
            />
            {point.text}
          </li>
        ))}
      </ul>
    </div>
  )
}

export const revealTemplate: AnimationTemplate<typeof props, "animation.reveal"> = {
  id: "animation.reveal",
  label: "Reveal",
  description: "Eyebrow, title and points that enter one after another.",
  props,
  Scene: RevealScene,
  sequence: (p) => {
    const enter = enterKeyframes(p.transition)
    const step = { duration: p.duration, ease: p.easing }
    const pointsAt = 0.3 + p.duration * 0.6
    return [
      { target: "eyebrow", keyframes: enter, at: 0, ...step },
      { target: "bar", keyframes: { scaleX: [0, 1] }, at: 0.1, ...step },
      { target: "title", keyframes: enter, at: 0.2, ...step },
      ...p.points.map((_, i) => ({
        target: `point-${i}`,
        keyframes: enter,
        at: pointsAt + i * p.stagger,
        ...step,
      })),
    ]
  },
  searchText: (p) => [p.eyebrow, p.title, ...p.points.map((point) => point.text)].join(" "),
}

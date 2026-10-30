import type { CSSProperties } from "react"
import { z } from "zod"
import {
  backgroundToCss,
  FONTS,
  SLIDE_THEMES,
  type SlideTheme,
  type SlideThemeId,
} from "@/artifacts/plugins/slide/model"

/**
 * Field builders for template props. Each carries `.meta()` the inspector form reads from the
 * JSON Schema (`title`, `control`, `step`, `unit`, `labels`), and a default so partial (generated)
 * props fill in. Templates must build props only from these so every field gets a control.
 */
export const field = {
  text: (title: string, fallback: string, maxLength = 120) =>
    z.string().max(maxLength).default(fallback).meta({ title }),
  longText: (title: string, fallback: string, maxLength = 280) =>
    z.string().max(maxLength).default(fallback).meta({ title, control: "textarea" }),
  color: (title: string, fallback: string) =>
    z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Expected a #RRGGBB colour")
      .default(fallback)
      .meta({ title, control: "color" }),
  range: (title: string, fallback: number, min: number, max: number, step: number, unit = "") =>
    z.number().min(min).max(max).default(fallback).meta({ title, step, unit }),
  toggle: (title: string, fallback: boolean) => z.boolean().default(fallback).meta({ title }),
  choice: <const T extends readonly [string, ...string[]]>(
    title: string,
    values: T,
    fallback: T[number],
    labels?: Record<T[number], string>,
  ) => z.enum(values).default(fallback).meta({ title, labels }),
}

const THEME_IDS = Object.keys(SLIDE_THEMES) as [SlideThemeId, ...SlideThemeId[]]
const THEME_LABELS = Object.fromEntries(
  THEME_IDS.map((id) => [id, SLIDE_THEMES[id].label]),
) as Record<SlideThemeId, string>

export const TRANSITIONS = ["fade", "rise", "slide", "zoom", "blur"] as const
export type Transition = (typeof TRANSITIONS)[number]
export const EASINGS = ["easeOut", "easeInOut", "linear", "backOut"] as const

/** The look-and-timing fields both templates share; keys carry over when switching templates. */
export const commonProps = {
  scheme: field.choice("Colour scheme", THEME_IDS, "dark", THEME_LABELS),
  accent: field.color("Accent", "#7C6CF0"),
  transition: field.choice("Transition", TRANSITIONS, "rise"),
  easing: field.choice("Easing", EASINGS, "easeOut", {
    easeOut: "Ease out",
    easeInOut: "Ease in-out",
    linear: "Linear",
    backOut: "Overshoot",
  }),
  loop: field.toggle("Loop playback", false),
}

export type CommonProps = { [K in keyof typeof commonProps]: z.output<(typeof commonProps)[K]> }

/** Motion keyframes for an element entering with `transition`; index 0 is the hidden state. */
export function enterKeyframes(transition: Transition): Record<string, (string | number)[]> {
  switch (transition) {
    case "fade":
      return { opacity: [0, 1] }
    case "rise":
      return { opacity: [0, 1], y: [48, 0] }
    case "slide":
      return { opacity: [0, 1], x: [-96, 0] }
    case "zoom":
      return { opacity: [0, 1], scale: [0.82, 1] }
    case "blur":
      return { opacity: [0, 1], filter: ["blur(18px)", "blur(0px)"] }
  }
}

/** The same hidden state as inline CSS, so nothing flashes before the first frame. */
export function hiddenStyle(transition: Transition): CSSProperties {
  const transform = {
    fade: undefined,
    rise: "translateY(48px)",
    slide: "translateX(-96px)",
    zoom: "scale(0.82)",
    blur: undefined,
  }[transition]
  return { opacity: 0, transform, filter: transition === "blur" ? "blur(18px)" : undefined }
}

export function schemeOf(props: CommonProps): SlideTheme {
  return SLIDE_THEMES[props.scheme]
}

export function backgroundCss(theme: SlideTheme): string {
  return backgroundToCss(theme.background)
}

export { FONTS }

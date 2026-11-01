import { z } from "zod"
import {
  getSlideTheme,
  SLIDE_THEMES,
  type SlideTheme,
  type SlideThemeId,
} from "@/artifacts/plugins/slide/themes"
import type { EmbedRef } from "@/lib/embeds"

export { SLIDE_THEMES, type SlideTheme, type SlideThemeId }

/** Canvas units: every position, size and font size is stored at 1920×1080. */
export const CANVAS = { width: 1920, height: 1080 } as const

export const FONTS = {
  display: "Cormorant Garamond",
  ui: "Inter Variable",
  mono: "IBM Plex Mono",
  borna: "Borna",
  prompt: "Prompt",
  cmuSerif: "CMU Serif",
  lexend: "Lexend",
  firaCode: "Fira Code",
} as const

const color = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/, "Expected #RRGGBB or #RRGGBBAA")

const background = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("flat"), color }),
  z.object({ kind: z.literal("gradient"), from: color, to: color, angle: z.number() }),
])
export type SlideBackground = z.infer<typeof background>

const box = {
  id: z.string().min(1),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  // Defaults keep imported or generated elements terse; the editor always writes them.
  rotation: z.number().default(0),
  visible: z.boolean().default(true),
  locked: z.boolean().default(false),
  name: z.string().optional(),
  /** Elements sharing a groupId select, move and reorder together. */
  groupId: z.string().optional(),
}

/** Explicit style overrides; anything absent comes from the theme ("reset to theme" clears them). */
const textStyle = z.object({
  fontFamily: z.string().optional(),
  fontSize: z.number().positive().optional(),
  fontWeight: z.number().int().min(100).max(900).optional(),
  color: color.optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  lineHeight: z.number().positive().optional(),
})

const shapeStyle = z.object({
  fill: color.optional(),
  stroke: color.optional(),
  strokeWidth: z.number().min(0).optional(),
  cornerRadius: z.number().min(0).optional(),
})

export const TEXT_VARIANTS = ["eyebrow", "title", "body", "bullets"] as const

export const CHART_TYPES = ["line", "bar", "pie"] as const

/**
 * The chart's source of truth: categories and numeric series. The drawing is derived from
 * it on every render, so editing a value re-renders without losing editability.
 */
const chartData = z
  .object({
    labels: z.array(z.string()),
    series: z
      .array(z.object({ name: z.string(), values: z.array(z.number()), color: color.optional() }))
      .min(1),
  })
  .refine((data) => data.series.every((series) => series.values.length === data.labels.length), {
    message: "Every series needs one value per label",
  })

const chartOptions = z.object({
  title: z.string().optional(),
  showLegend: z.boolean().default(true),
  showGrid: z.boolean().default(true),
  showValues: z.boolean().default(false),
  yMin: z.number().optional(),
  yMax: z.number().optional(),
})
export type ChartData = z.infer<typeof chartData>

export const SLIDE_EMBED_TYPES = ["diagram", "animation"] as const

const element = z.discriminatedUnion("type", [
  z.object({
    ...box,
    type: z.literal("text"),
    variant: z.enum(TEXT_VARIANTS),
    text: z.string(),
    style: textStyle.default({}),
  }),
  z.object({ ...box, type: z.enum(["rect", "ellipse"]), style: shapeStyle.default({}) }),
  z.object({ ...box, type: z.enum(["line", "arrow"]), style: shapeStyle.default({}) }),
  z.object({
    ...box,
    type: z.literal("image"),
    src: z.string(),
    alt: z.string().default(""),
    fit: z.enum(["cover", "contain"]).default("cover"),
  }),
  z.object({
    ...box,
    type: z.literal("embed"),
    ref: z.object({
      artifactId: z.string().min(1),
      versionId: z.string().min(1),
      locale: z.string().default("en"),
      title: z.string().default(""),
      artifactType: z.enum(SLIDE_EMBED_TYPES),
      versionNumber: z.number().int().min(0).default(0),
    }),
    lockAspect: z.boolean().default(true),
    playback: z.enum(["static", "auto"]).default("static"),
  }),
  z.object({
    ...box,
    type: z.literal("chart"),
    chartType: z.enum(CHART_TYPES),
    data: chartData,
    options: chartOptions.prefault({}),
  }),
])

export type SlideElement = z.infer<typeof element>
export type TextElement = Extract<SlideElement, { type: "text" }>
export type ChartElement = Extract<SlideElement, { type: "chart" }>
export type EmbeddedElement = Extract<SlideElement, { type: "embed" }>
export type ElementType = SlideElement["type"]

/**
 * Persisted slide: one 16:9 canvas, a theme id, an optional background override and
 * elements in paint order (later elements draw on top).
 */
export const slideSchema = z.object({
  schemaVersion: z.literal(1),
  type: z.literal("slide"),
  canvas: z
    .object({ width: z.literal(CANVAS.width), height: z.literal(CANVAS.height) })
    .default(CANVAS),
  theme: z.string().min(1).default("dark"),
  background: background.optional(),
  elements: z.array(element).default([]),
})

export type SlideContent = z.infer<typeof slideSchema>

export type InsertKind =
  | "eyebrow"
  | "title"
  | "body"
  | "bullets"
  | "rect"
  | "ellipse"
  | "line"
  | "arrow"
  | "image"
  | "chart"

const SIZES: Record<InsertKind, { width: number; height: number }> = {
  eyebrow: { width: 900, height: 50 },
  title: { width: 1300, height: 150 },
  body: { width: 1200, height: 180 },
  bullets: { width: 1100, height: 240 },
  rect: { width: 400, height: 240 },
  ellipse: { width: 300, height: 300 },
  line: { width: 500, height: 24 },
  arrow: { width: 500, height: 40 },
  image: { width: 640, height: 360 },
  chart: { width: 1100, height: 620 },
}

const TEXT_DEFAULTS: Record<TextElement["variant"], string> = {
  eyebrow: "03 · SECTION",
  title: "Slide title",
  body: "Body copy. Two or three sentences that carry the point of the slide without repeating the title.",
  bullets: "Replay the trace\nApply the rubric\nReconcile the axes",
}

/** A new element of `kind` centred on (cx, cy), clamped inside the canvas. */
export function createElement(
  kind: InsertKind,
  cx = CANVAS.width / 2,
  cy = CANVAS.height / 2,
): SlideElement {
  const { width, height } = SIZES[kind]
  const base = {
    id: crypto.randomUUID(),
    x: clamp(cx - width / 2, 0, CANVAS.width - width),
    y: clamp(cy - height / 2, 0, CANVAS.height - height),
    width,
    height,
    rotation: 0,
    visible: true,
    locked: false,
  }
  switch (kind) {
    case "eyebrow":
    case "title":
    case "body":
    case "bullets":
      return { ...base, type: "text", variant: kind, text: TEXT_DEFAULTS[kind], style: {} }
    case "rect":
    case "ellipse":
    case "line":
    case "arrow":
      return { ...base, type: kind, style: {} }
    case "image":
      return { ...base, type: "image", src: "", alt: "", fit: "cover" }
    case "chart":
      return {
        ...base,
        type: "chart",
        chartType: "line",
        data: {
          labels: ["Q1", "Q2", "Q3", "Q4"],
          series: [
            { name: "Trace replay", values: [62, 70, 78, 84] },
            { name: "Rubric pass", values: [48, 55, 66, 72] },
          ],
        },
        options: { showLegend: true, showGrid: true, showValues: false },
      }
  }
}

const EMBED_SIZE = { width: 960, height: 540 }

/** A new embed centred on the canvas. */
export function createEmbed(ref: EmbedRef): EmbeddedElement {
  return {
    id: crypto.randomUUID(),
    x: (CANVAS.width - EMBED_SIZE.width) / 2,
    y: (CANVAS.height - EMBED_SIZE.height) / 2,
    ...EMBED_SIZE,
    rotation: 0,
    visible: true,
    locked: false,
    type: "embed",
    ref: ref as EmbeddedElement["ref"],
    lockAspect: true,
    playback: "static",
  }
}

/** Keeps the width and sets the height from width ÷ height. */
export function fitEmbedToAspect(element: EmbeddedElement, aspect: number) {
  return { width: element.width, height: Math.max(1, Math.round(element.width / aspect)) }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

export function createEmptySlide(): SlideContent {
  const eyebrow = { ...createElement("eyebrow"), x: 140, y: 150 }
  const title = { ...createElement("title"), x: 140, y: 220, text: "Untitled slide" }
  const body = { ...createElement("body"), x: 140, y: 400 }
  return {
    schemaVersion: 1,
    type: "slide",
    canvas: CANVAS,
    theme: "dark",
    elements: [eyebrow, title, body],
  }
}

export type ResolvedText = {
  fontFamily: string
  fontSize: number
  fontWeight: number
  color: string
  align: "left" | "center" | "right"
  lineHeight: number
  letterSpacing: number
  uppercase: boolean
}

/** Theme + variant defaults with the element's explicit overrides on top. */
export function resolveText(element: TextElement, theme: SlideTheme): ResolvedText {
  const variant = {
    eyebrow: {
      fontFamily: theme.fonts?.eyebrow ?? FONTS.mono,
      fontSize: 31,
      fontWeight: theme.fonts?.eyebrowWeight ?? 400,
      color: theme.muted,
      lineHeight: 1.2,
      letterSpacing: 4.8,
      uppercase: true,
    },
    title: {
      fontFamily: theme.fonts?.title ?? FONTS.display,
      fontSize: 103,
      fontWeight: 600,
      color: theme.text,
      lineHeight: 1.1,
      letterSpacing: 0,
      uppercase: false,
    },
    body: {
      fontFamily: theme.fonts?.body ?? FONTS.ui,
      fontSize: 39,
      fontWeight: 400,
      color: theme.body,
      lineHeight: 1.6,
      letterSpacing: 0,
      uppercase: false,
    },
    bullets: {
      fontFamily: theme.fonts?.body ?? FONTS.ui,
      fontSize: 39,
      fontWeight: 400,
      color: theme.body,
      lineHeight: 1.6,
      letterSpacing: 0,
      uppercase: false,
    },
  }[element.variant]
  const { style } = element
  return {
    ...variant,
    fontFamily: style.fontFamily ?? variant.fontFamily,
    fontSize: style.fontSize ?? variant.fontSize,
    fontWeight: style.fontWeight ?? variant.fontWeight,
    color: style.color ?? variant.color,
    align: style.align ?? "left",
    lineHeight: style.lineHeight ?? variant.lineHeight,
  }
}

export type ResolvedShape = {
  fill: string
  stroke: string
  strokeWidth: number
  cornerRadius: number
}

export function resolveShape(element: SlideElement, theme: SlideTheme): ResolvedShape {
  const style = "style" in element ? (element.style as z.infer<typeof shapeStyle>) : {}
  const lineLike = element.type === "line" || element.type === "arrow"
  return {
    fill: style.fill ?? (lineLike ? theme.line : theme.surface),
    stroke: style.stroke ?? (lineLike ? theme.muted : theme.line),
    strokeWidth: style.strokeWidth ?? (lineLike ? 6 : 3),
    cornerRadius: style.cornerRadius ?? (element.type === "rect" ? 17 : 0),
  }
}

export function resolveBackground(content: SlideContent): SlideBackground {
  return content.background ?? getSlideTheme(content.theme).background
}

export function backgroundToCss(bg: SlideBackground): string {
  return bg.kind === "flat" ? bg.color : `linear-gradient(${bg.angle}deg, ${bg.from}, ${bg.to})`
}

export function slideSearchText(content: SlideContent): string {
  return content.elements
    .flatMap((el): string[] => {
      switch (el.type) {
        case "text":
          return [el.text]
        case "embed":
          return [el.ref.title]
        case "image":
          return [el.alt]
        case "chart":
          return [el.options.title ?? "", ...el.data.labels, ...el.data.series.map((s) => s.name)]
        default:
          return []
      }
    })
    .filter(Boolean)
    .join("\n")
}

export function slideAssets(content: SlideContent): string[] {
  return content.elements.flatMap((el) => (el.type === "image" && el.src ? [el.src] : []))
}

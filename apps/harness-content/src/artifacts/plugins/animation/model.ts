import { z } from "zod"
import { revealTemplate } from "@/artifacts/plugins/animation/templates/reveal"
import { stepsDiagramTemplate } from "@/artifacts/plugins/animation/templates/steps-diagram"
import type { AnimationTemplate } from "@/artifacts/plugins/animation/templates/types"

export const TEMPLATES = [revealTemplate, stepsDiagramTemplate] as const
export type TemplateId = (typeof TEMPLATES)[number]["id"]

const base = { schemaVersion: z.literal(1), type: z.literal("animation") }
const variants = [
  z.object({
    ...base,
    template: z.literal(revealTemplate.id),
    props: revealTemplate.props.prefault({}),
  }),
  z.object({
    ...base,
    template: z.literal(stepsDiagramTemplate.id),
    props: stepsDiagramTemplate.props.prefault({}),
  }),
] as const

/**
 * Animation content: a registered template id plus its props, never component source.
 * Content saved before this plugin existed (no `template`) opens as the first template.
 */
export const animationSchema = z.preprocess(
  (raw) =>
    raw && typeof raw === "object" && !("template" in raw)
      ? { ...raw, template: TEMPLATES[0].id, props: {} }
      : raw,
  z.discriminatedUnion("template", variants),
)

export type AnimationContent = z.output<typeof animationSchema>

export function getTemplate(id: string): AnimationTemplate {
  const found = TEMPLATES.find((template) => template.id === id)
  if (!found) throw new Error(`Unknown animation template: ${id}`)
  return found as unknown as AnimationTemplate
}

export function createEmptyAnimation(template: TemplateId = TEMPLATES[0].id): AnimationContent {
  return animationSchema.parse({ schemaVersion: 1, type: "animation", template, props: {} })
}

/** Switches template, keeping every prop value the new template accepts under the same key. */
export function switchTemplate(content: AnimationContent, template: TemplateId): AnimationContent {
  if (content.template === template) return content
  const { shape } = getTemplate(template).props
  const old = content.props as Record<string, unknown>
  const kept = Object.fromEntries(
    Object.entries(shape)
      .filter(([key, schema]) => key in old && schema.safeParse(old[key]).success)
      .map(([key]) => [key, old[key]]),
  )
  return animationSchema.parse({ schemaVersion: 1, type: "animation", template, props: kept })
}

export function animationSearchText(content: AnimationContent): string {
  return getTemplate(content.template).searchText(content.props)
}

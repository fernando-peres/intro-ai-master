import { z } from "zod"
import {
  animationContentSchema,
  createEmptyAnimation,
  TEMPLATES,
} from "@/artifacts/plugins/animation/model"
import { DOC_BLOCK_TYPES, docSchema } from "@/artifacts/plugins/doc/content"
import { slideSchema } from "@/artifacts/plugins/slide/model"
import { BUILTIN_TOKENS } from "@/artifacts/plugins/slide/themes"

/** Bumped when the manifest's own shape changes (not when a component is added). */
export const REGISTRY_VERSION = 1

const SLIDE_COMPONENTS = [
  ["text", "Text (eyebrow, title, body, bullets)"],
  ["rect", "Rectangle"],
  ["ellipse", "Ellipse"],
  ["line", "Line"],
  ["arrow", "Arrow"],
  ["image", "Image"],
  ["diagram", "Diagram"],
  ["chart", "Chart (line, bar, pie) with editable data"],
] as const

export type ComponentEntry = {
  componentType: string
  componentVersion: number
  label: string
  description?: string
  /** JSON Schema of the component's editable props, when it has its own (animation templates). */
  props?: unknown
}

export type TypeEntry = {
  schemaVersion: number
  schema: string
  /** Where content names its components; the API checks these against `components`. */
  componentField: "elements[].type" | "blocks[].type" | "template"
  emptyContent: unknown
  components: ComponentEntry[]
}

export type Registry = { registryVersion: number; types: Record<string, TypeEntry> }

const toJson = (schema: z.ZodType) =>
  z.toJSONSchema(schema, { io: "input", target: "draft-2020-12", unrepresentable: "any" })

/**
 * The allowlisted component registry and one JSON Schema per artifact type, derived from the
 * plugins' Zod schemas. Output is deterministic, so the committed copy can be checked for drift.
 */
export function buildRegistry(): { registry: Registry; schemas: Record<string, unknown> } {
  const types: Record<string, TypeEntry> = {
    slide: {
      schemaVersion: 1,
      schema: "slide.v1.json",
      componentField: "elements[].type",
      emptyContent: slideSchema.parse({ schemaVersion: 1, type: "slide" }),
      components: SLIDE_COMPONENTS.map(([type, label]) => ({
        componentType: `slide.${type}`,
        componentVersion: 1,
        label,
      })),
    },
    doc: {
      schemaVersion: 1,
      schema: "doc.v1.json",
      componentField: "blocks[].type",
      emptyContent: docSchema.parse({ schemaVersion: 1, type: "doc" }),
      components: DOC_BLOCK_TYPES.map((type) => ({
        componentType: `doc.${type}`,
        componentVersion: 1,
        label: type.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
      })),
    },
    animation: {
      schemaVersion: 1,
      schema: "animation.v1.json",
      componentField: "template",
      emptyContent: createEmptyAnimation(),
      components: TEMPLATES.map((template) => ({
        componentType: template.id,
        componentVersion: 1,
        label: template.label,
        description: template.description,
        props: toJson(template.props),
      })),
    },
  }
  return {
    registry: { registryVersion: REGISTRY_VERSION, types },
    schemas: {
      "builtin-themes.json": BUILTIN_TOKENS,
      "slide.v1.json": toJson(slideSchema),
      "doc.v1.json": toJson(docSchema),
      "animation.v1.json": toJson(animationContentSchema),
    },
  }
}

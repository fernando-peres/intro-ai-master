import { z } from "zod"

/** One generated form control; `key` is the prop name inside its parent object. */
export type FieldSpec =
  | { kind: "text"; key: string; label: string; maxLength?: number; multiline: boolean }
  | { kind: "color"; key: string; label: string }
  | {
      kind: "range"
      key: string
      label: string
      min: number
      max: number
      step: number
      unit: string
    }
  | { kind: "number"; key: string; label: string; min?: number; max?: number }
  | { kind: "enum"; key: string; label: string; options: { value: string; label: string }[] }
  | { kind: "toggle"; key: string; label: string }
  | {
      kind: "list"
      key: string
      label: string
      minItems: number
      maxItems: number
      item: FieldSpec[]
      itemDefault: Record<string, unknown>
    }

type JsonSchema = {
  type?: string
  title?: string
  control?: string
  enum?: string[]
  labels?: Record<string, string>
  minimum?: number
  maximum?: number
  maxLength?: number
  step?: number
  unit?: string
  default?: unknown
  minItems?: number
  maxItems?: number
  items?: JsonSchema
  properties?: Record<string, JsonSchema>
}

const humanize = (key: string) =>
  key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())

/**
 * Derives form controls from a props schema via its JSON Schema, the same document the registry
 * export publishes. A property type this cannot map throws, so a template cannot ship a prop
 * the inspector silently drops.
 */
export function describeFields(schema: z.ZodObject): FieldSpec[] {
  const json = z.toJSONSchema(schema, { io: "input", unrepresentable: "any" }) as JsonSchema
  return fieldsOf(json)
}

function fieldsOf(object: JsonSchema): FieldSpec[] {
  return Object.entries(object.properties ?? {}).map(([key, prop]) => fieldOf(key, prop))
}

function fieldOf(key: string, prop: JsonSchema): FieldSpec {
  const label = prop.title ?? humanize(key)
  if (prop.type === "string" && prop.enum) {
    const options = prop.enum.map((value) => ({
      value,
      label: prop.labels?.[value] ?? humanize(value),
    }))
    return { kind: "enum", key, label, options }
  }
  if (prop.type === "string" && prop.control === "color") return { kind: "color", key, label }
  if (prop.type === "string") {
    return {
      kind: "text",
      key,
      label,
      maxLength: prop.maxLength,
      multiline: prop.control === "textarea",
    }
  }
  if (prop.type === "number" && prop.minimum !== undefined && prop.maximum !== undefined) {
    const { minimum: min, maximum: max } = prop
    return { kind: "range", key, label, min, max, step: prop.step ?? 1, unit: prop.unit ?? "" }
  }
  if (prop.type === "number" || prop.type === "integer") {
    return { kind: "number", key, label, min: prop.minimum, max: prop.maximum }
  }
  if (prop.type === "boolean") return { kind: "toggle", key, label }
  if (prop.type === "array" && prop.items?.type === "object") {
    const item = fieldsOf(prop.items)
    const itemDefault = Object.fromEntries(
      Object.entries(prop.items.properties ?? {}).map(([k, p]) => [k, p.default]),
    )
    return {
      kind: "list",
      key,
      label,
      minItems: prop.minItems ?? 0,
      maxItems: prop.maxItems ?? 20,
      item,
      itemDefault,
    }
  }
  throw new Error(`No form control for prop "${key}" (${prop.type ?? "unknown"})`)
}

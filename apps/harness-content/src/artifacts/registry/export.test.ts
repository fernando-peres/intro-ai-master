import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { getPlugin } from "@/artifacts"
import { buildRegistry } from "@/artifacts/registry/export"

const API_SCHEMAS = join(
  import.meta.dirname,
  "../../../../harness-content-api/src/harness_content_api/schemas",
)
const committed = (name: string) => JSON.parse(readFileSync(join(API_SCHEMAS, name), "utf8"))

describe("component registry", () => {
  const { registry, schemas } = buildRegistry()

  it("matches the copy the API validates against (run `pnpm export:schemas` if not)", () => {
    expect(committed("registry.json")).toEqual(registry)
    for (const [name, schema] of Object.entries(schemas)) expect(committed(name)).toEqual(schema)
  })

  it("lists every type with valid empty content and namespaced, versioned components", () => {
    expect(Object.keys(registry.types).sort()).toEqual(["animation", "doc", "slide"])
    for (const [type, entry] of Object.entries(registry.types)) {
      const plugin = getPlugin(type as "slide")
      expect(plugin.schema.safeParse(entry.emptyContent).success).toBe(true)
      expect(entry.components.every((c) => c.componentType.startsWith(`${type}.`))).toBe(true)
      expect(schemas[entry.schema]).toBeDefined()
    }
    expect(registry.types.animation.components.map((c) => c.componentType)).toEqual([
      "animation.reveal",
      "animation.stepsDiagram",
    ])
  })
})

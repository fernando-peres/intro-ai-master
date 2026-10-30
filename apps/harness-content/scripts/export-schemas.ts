// Writes the component registry and content JSON Schemas into harness-content-api, which
// validates saves, publishes and imports against them. Run: pnpm export:schemas
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { buildRegistry } from "../src/artifacts/registry/export"

export const OUT_DIR = join(
  import.meta.dirname,
  "../../harness-content-api/src/harness_content_api/schemas",
)

const { registry, schemas } = buildRegistry()
mkdirSync(OUT_DIR, { recursive: true })
const write = (name: string, value: unknown) =>
  writeFileSync(join(OUT_DIR, name), `${JSON.stringify(value, null, 2)}\n`)
write("registry.json", registry)
for (const [name, schema] of Object.entries(schemas)) write(name, schema)
console.log(`wrote registry.json + ${Object.keys(schemas).length} schemas to ${OUT_DIR}`)

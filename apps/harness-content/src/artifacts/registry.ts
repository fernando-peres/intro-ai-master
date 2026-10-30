import type { ArtifactType } from "@/api/client"
import type { ArtifactPlugin, ValidationResult } from "@/artifacts/plugin"

const plugins = new Map<ArtifactType, ArtifactPlugin<unknown>>()

/** Registers (or replaces) the plugin for its type; later phases swap stubs for real editors. */
export function registerPlugin<C>(plugin: ArtifactPlugin<C>): void {
  plugins.set(plugin.type, plugin as ArtifactPlugin<unknown>)
}

export function getPlugin(type: ArtifactType): ArtifactPlugin<unknown> {
  const plugin = plugins.get(type)
  if (!plugin) throw new Error(`No plugin registered for artifact type "${type}"`)
  return plugin
}

export function listPlugins(): ArtifactPlugin<unknown>[] {
  return [...plugins.values()]
}

/** Migrates stored content to the plugin's schema version, then validates it. */
export function validateContent<C>(plugin: ArtifactPlugin<C>, raw: unknown): ValidationResult<C> {
  const stored = (raw as { schemaVersion?: unknown } | null)?.schemaVersion
  const from = typeof stored === "number" ? stored : plugin.schemaVersion
  const migrated = from < plugin.schemaVersion ? plugin.migrate(from, raw) : raw
  const parsed = plugin.schema.safeParse(migrated)
  if (parsed.success) return { ok: true, content: parsed.data }
  return {
    ok: false,
    issues: parsed.error.issues.map((issue) => {
      const path = issue.path.join(".")
      return path ? `${path}: ${issue.message}` : issue.message
    }),
  }
}

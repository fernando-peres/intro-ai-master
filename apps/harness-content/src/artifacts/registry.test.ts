import { describe, expect, it } from "vitest"
import { z } from "zod"
import { getPlugin, listPlugins, validateContent } from "@/artifacts"
import type { ArtifactPlugin } from "@/artifacts/plugin"
import { registerPlugin } from "@/artifacts/registry"

describe("plugin registry", () => {
  it("has a plugin for every artifact type", () => {
    expect(
      listPlugins()
        .map((plugin) => plugin.type)
        .sort(),
    ).toEqual(["animation", "doc", "slide"])
    for (const plugin of listPlugins()) {
      expect(validateContent(plugin, plugin.createEmpty())).toMatchObject({ ok: true })
    }
  })

  it("rejects content of another type with readable issues", () => {
    const result = validateContent(getPlugin("slide"), { schemaVersion: 1, type: "doc" })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issues[0]).toMatch(/^type: /)
  })

  it("migrates older content before validating, and later registrations replace stubs", () => {
    const plugin: ArtifactPlugin<{ schemaVersion: 2; type: "doc"; title: string }> = {
      ...getPlugin("doc"),
      schemaVersion: 2,
      schema: z.object({ schemaVersion: z.literal(2), type: z.literal("doc"), title: z.string() }),
      createEmpty: () => ({ schemaVersion: 2, type: "doc", title: "" }),
      migrate: (_from, content) => ({
        ...(content as object),
        schemaVersion: 2,
        title: "Untitled",
      }),
    } as ArtifactPlugin<{ schemaVersion: 2; type: "doc"; title: string }>
    registerPlugin(plugin)
    expect(getPlugin("doc")).toBe(plugin)
    expect(validateContent(plugin, { schemaVersion: 1, type: "doc" })).toEqual({
      ok: true,
      content: { schemaVersion: 2, type: "doc", title: "Untitled" },
    })
  })

  it("throws for an unregistered type", () => {
    expect(() => getPlugin("video" as never)).toThrow(/No plugin/)
  })
})

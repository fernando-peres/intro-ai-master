import { Suspense } from "react"
import type { ArtifactType } from "@/api/client"
import { getPlugin, validateContent } from "@/artifacts"
import { Caption } from "@/components/labels"
import { resolveTheme, type ThemeSource } from "@/lib/trail"

type Themed = { content: unknown; theme: string | undefined; source: ThemeSource }

/** A pinned version's content as the trail plays it: restyled unless the step keeps its own. */
export function themedContent(
  type: ArtifactType,
  raw: unknown,
  override: string | null | undefined,
  trailTheme: string | null | undefined,
): Themed | { error: string } {
  const plugin = getPlugin(type)
  const valid = validateContent(plugin, raw)
  if (!valid.ok) return { error: valid.issues[0] ?? "Content does not match its schema" }
  const own = plugin.contentTheme?.(valid.content)
  const { theme, source } = resolveTheme(override, trailTheme, own)
  const content =
    theme && theme !== own && plugin.withTheme
      ? plugin.withTheme(valid.content, theme)
      : valid.content
  return { content, theme, source }
}

/** Renders a pinned version through its plugin's Renderer, themed for the trail. */
export function StepRenderer({
  type,
  content,
  override,
  trailTheme,
}: {
  type: ArtifactType
  content: unknown
  override: string | null | undefined
  trailTheme: string | null | undefined
}) {
  const plugin = getPlugin(type)
  const themed = themedContent(type, content, override, trailTheme)
  if ("error" in themed) {
    return (
      <p role="alert" className="p-4 text-[11px] text-gc-fail-ink">
        {themed.error}
      </p>
    )
  }
  return (
    <Suspense fallback={<Caption>Loading…</Caption>}>
      <plugin.Renderer content={themed.content} />
    </Suspense>
  )
}

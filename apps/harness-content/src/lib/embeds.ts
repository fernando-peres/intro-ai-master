import type { ArtifactListItem, ArtifactType } from "@/api/client"

/** A reference, not a copy: pins one published version; the rest is a snapshot for the chip. */
export type EmbedRef = {
  artifactId: string
  versionId: string
  locale: string
  title: string
  artifactType: ArtifactType
  versionNumber: number
}

export type EmbedUse = { path: string; ref: EmbedRef }

type Block = { type?: unknown; props?: unknown; children?: unknown }

function docEmbeds(blocks: unknown, path: string): EmbedUse[] {
  if (!Array.isArray(blocks)) return []
  return (blocks as Block[]).flatMap((block, index) => {
    const here = `${path}.${index}`
    const own = block.type === "raEmbed" ? [{ path: here, ref: block.props as EmbedRef }] : []
    return [...own, ...docEmbeds(block.children, `${here}.children`)]
  })
}

/** Every embed in doc or slide content, with its path; other types have none. */
export function embedsOf(content: unknown): EmbedUse[] {
  const record = (content ?? {}) as { blocks?: unknown; elements?: unknown }
  const elements = Array.isArray(record.elements) ? record.elements : []
  return [
    ...docEmbeds(record.blocks, "blocks"),
    ...elements.flatMap((element: { type?: unknown; ref?: unknown }, index) =>
      element.type === "embed" ? [{ path: `elements.${index}`, ref: element.ref as EmbedRef }] : [],
    ),
  ]
}

/** The version a new embed pins: the default in `locale`, else any default. */
export function embedTarget(item: ArtifactListItem, locale: string) {
  const chosen = item.defaults[locale] ? locale : Object.keys(item.defaults)[0]
  if (!chosen) return null
  const number = item.localeVersions.find((entry) => entry.locale === chosen)?.defaultNumber
  return { locale: chosen, versionId: item.defaults[chosen], versionNumber: number ?? 0 }
}

type VersionRow = {
  id: string
  locale: string
  isDefault: boolean
  versionNumber?: number | null
}

/** `ref` moved to its artifact's current default in the same locale; null when already there. */
export function repinned(ref: EmbedRef, versions: readonly VersionRow[]): EmbedRef | null {
  const current = versions.find((v) => v.isDefault && v.locale === ref.locale)
  if (!current || current.id === ref.versionId) return null
  return { ...ref, versionId: current.id, versionNumber: current.versionNumber ?? 0 }
}

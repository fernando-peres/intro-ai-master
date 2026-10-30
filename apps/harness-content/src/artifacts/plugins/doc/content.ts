import { z } from "zod"

/** Block types a document may persist; anything else is rejected rather than dropped. */
export const DOC_BLOCK_TYPES = [
  "paragraph",
  "heading",
  "bulletListItem",
  "numberedListItem",
  "checkListItem",
  "toggleListItem",
  "quote",
  "codeBlock",
  "table",
  "divider",
  "image",
  "callout",
  "raEmbed",
] as const

export type DocBlock = {
  id: string
  type: (typeof DOC_BLOCK_TYPES)[number]
  props: Record<string, unknown>
  content?: unknown
  children: DocBlock[]
}

const block: z.ZodType<DocBlock> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    type: z.enum(DOC_BLOCK_TYPES),
    props: z.record(z.string(), z.unknown()),
    content: z.unknown().optional(),
    children: z.array(block),
  }),
)

/**
 * Persisted document: BlockNote's block JSON (stable block ids, typed props, inline content)
 * restricted to the registered block types.
 */
export const docSchema = z.object({
  schemaVersion: z.literal(1),
  type: z.literal("doc"),
  // Absent on docs created before the editor existed.
  blocks: z.array(block).default([]),
})

export type DocContent = z.infer<typeof docSchema>

export function createEmptyDoc(): DocContent {
  return {
    schemaVersion: 1,
    type: "doc",
    blocks: [block_("heading", { level: 1 }, "Untitled document"), block_("paragraph", {}, "")],
  }
}

function block_(type: DocBlock["type"], props: Record<string, unknown>, text: string): DocBlock {
  return {
    id: crypto.randomUUID(),
    type,
    props,
    content: text ? [{ type: "text", text, styles: {} }] : [],
    children: [],
  }
}

/** Plain text of inline content (text runs, links), table cells included. */
export function inlineText(content: unknown): string {
  if (typeof content === "string") return content
  if (Array.isArray(content)) return content.map(inlineText).join("")
  if (!content || typeof content !== "object") return ""
  const node = content as { type?: string; text?: string; content?: unknown; rows?: unknown }
  if (node.type === "text") return node.text ?? ""
  if (node.type === "tableContent" && Array.isArray(node.rows)) {
    return node.rows
      .map((row) => ((row as { cells?: unknown[] }).cells ?? []).map(inlineText).join(" "))
      .join(" ")
  }
  return inlineText(node.content)
}

export function* walkBlocks(blocks: DocBlock[]): Generator<DocBlock> {
  for (const entry of blocks) {
    yield entry
    yield* walkBlocks(entry.children)
  }
}

export type OutlineEntry = { id: string; level: number; text: string }

export function docOutline(content: DocContent): OutlineEntry[] {
  return [...walkBlocks(content.blocks)]
    .filter((entry) => entry.type === "heading")
    .map((entry) => ({
      id: entry.id,
      level: Number(entry.props.level ?? 1),
      text: inlineText(entry.content) || "Untitled heading",
    }))
}

/** Reading speed used for "N min read". */
export const READ_WORDS_PER_MINUTE = 200

export function docStats(content: DocContent) {
  const blocks = [...walkBlocks(content.blocks)]
  const words = blocks
    .map((entry) => inlineText(entry.content))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length
  return {
    words,
    readMinutes: Math.max(1, Math.ceil(words / READ_WORDS_PER_MINUTE)),
    blocks: blocks.length,
  }
}

export function docSearchText(content: DocContent): string {
  return [...walkBlocks(content.blocks)].map((entry) => inlineText(entry.content)).join("\n")
}

export function docAssets(content: DocContent): string[] {
  return [...walkBlocks(content.blocks)]
    .filter((entry) => entry.type === "image" && typeof entry.props.url === "string")
    .map((entry) => entry.props.url as string)
    .filter(Boolean)
}

/** Artifact versions this document embeds; each embed pins one version id. */
export function docEmbeds(content: DocContent): { artifactId: string; versionId: string }[] {
  return [...walkBlocks(content.blocks)]
    .filter((entry) => entry.type === "raEmbed")
    .map((entry) => ({
      artifactId: String(entry.props.artifactId ?? ""),
      versionId: String(entry.props.versionId ?? ""),
    }))
}

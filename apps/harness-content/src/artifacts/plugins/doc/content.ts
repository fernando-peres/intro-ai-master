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

type DocBlockInput = Omit<DocBlock, "props" | "children"> & {
  props?: Record<string, unknown>
  children?: DocBlockInput[]
}

export const CALLOUT_TONE_IDS = ["note", "warning", "rule"] as const

const CUSTOM_BLOCKS = ["callout", "raEmbed"] as const
const BUILT_IN_BLOCKS = DOC_BLOCK_TYPES.filter(
  (type): type is Exclude<(typeof DOC_BLOCK_TYPES)[number], (typeof CUSTOM_BLOCKS)[number]> =>
    !(CUSTOM_BLOCKS as readonly string[]).includes(type),
) as [string, ...string[]]

// Built-in BlockNote props stay open; the custom blocks' props are typed, because their
// renderers look the values up.
const block: z.ZodType<DocBlock, DocBlockInput> = z.lazy(() => {
  const shared = {
    id: z.string().min(1),
    content: z.unknown().optional(),
    children: z.array(block).default([]),
  }
  return z.discriminatedUnion("type", [
    z.object({
      ...shared,
      type: z.literal("callout"),
      props: z.looseObject({ tone: z.enum(CALLOUT_TONE_IDS).default("warning") }).prefault({}),
    }),
    z.object({
      ...shared,
      type: z.literal("raEmbed"),
      props: z
        .looseObject({
          artifactId: z.string().default(""),
          versionId: z.string().default(""),
          locale: z.string().default("en"),
          title: z.string().default(""),
          artifactType: z.enum(["slide", "doc", "animation"]).default("slide"),
          versionNumber: z.number().int().min(0).default(0),
        })
        .prefault({}),
    }),
    z.object({
      ...shared,
      type: z.enum(BUILT_IN_BLOCKS),
      props: z.record(z.string(), z.unknown()).default({}),
    }),
  ]) as unknown as z.ZodType<DocBlock, DocBlockInput>
})

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

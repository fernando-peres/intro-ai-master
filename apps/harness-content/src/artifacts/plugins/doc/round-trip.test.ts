import { BlockNoteEditor } from "@blocknote/core"
import { describe, expect, it } from "vitest"
import { type DocPartialBlock, docEditorSchema } from "@/artifacts/plugins/doc/blocks"
import {
  type DocContent,
  docAssets,
  docEmbeds,
  docOutline,
  docSchema,
  docStats,
} from "@/artifacts/plugins/doc/content"

const SAMPLE: DocPartialBlock[] = [
  { type: "heading", props: { level: 1 }, content: "Evaluation rubric, end to end" },
  {
    type: "paragraph",
    content: [
      { type: "text", text: "Every run is scored on ", styles: {} },
      { type: "text", text: "three independent axes", styles: { bold: true } },
      { type: "link", href: "https://example.com/rubric", content: "rubric" },
    ],
  },
  { type: "heading", props: { level: 2 }, content: "Three independent axes" },
  { type: "bulletListItem", content: "Trace replay is deterministic" },
  { type: "numberedListItem", content: "Collect the run trace" },
  { type: "checkListItem", props: { checked: true }, content: "Draft the rubric wording" },
  { type: "callout", props: { tone: "rule" }, content: "If it cannot explain, it does not ship." },
  { type: "quote", content: "Disagreement blocks, it never averages." },
  { type: "codeBlock", props: { language: "python" }, content: "verdict = reconcile(a, b, c)" },
  {
    type: "table",
    content: {
      type: "tableContent",
      rows: [{ cells: ["Axis", "Weight"] }, { cells: ["Trace replay", "40%"] }],
    },
  },
  {
    type: "toggleListItem",
    content: "Toggle section",
    children: [{ type: "paragraph", content: "Hidden detail" }],
  },
  { type: "divider" },
  { type: "image", props: { url: "https://example.com/axes.png", caption: "Axes" } },
  {
    type: "raEmbed",
    props: {
      artifactId: "ra_1",
      versionId: "rav_2",
      locale: "en",
      title: "Harness scoring",
      artifactType: "slide",
      versionNumber: 2,
    },
  },
  {
    type: "raEmbed",
    props: {
      artifactId: "ra_3",
      versionId: "rav_4",
      locale: "en",
      title: "Pipeline",
      artifactType: "diagram",
      versionNumber: 1,
      width: 45,
      aspect: "3:4",
      align: "right",
    },
  },
  { type: "heading", props: { level: 3 }, content: "Edge cases" },
]

/**
 * What a save does: load persisted blocks into BlockNote, read `editor.document`, and
 * serialize it as the API stores it (JSON, so `undefined` keys drop out).
 */
function throughEditor(content: DocContent): DocContent {
  const editor = BlockNoteEditor.create({
    schema: docEditorSchema,
    initialContent: content.blocks as DocPartialBlock[],
  })
  return JSON.parse(JSON.stringify({ ...content, blocks: editor.document }))
}

describe("doc content round trip", () => {
  const authored = throughEditor({
    schemaVersion: 1,
    type: "doc",
    blocks: SAMPLE as DocContent["blocks"],
  })

  it("persists as schema-valid JSON", () => {
    expect(docSchema.safeParse(authored).success).toBe(true)
  })

  it("loses nothing through editor → JSON → editor", () => {
    expect(throughEditor(authored)).toEqual(authored)
    expect(throughEditor(throughEditor(authored))).toEqual(authored)
  })

  it("keeps custom block props and the pinned embed", () => {
    const callout = authored.blocks.find((entry) => entry.type === "callout")
    expect(callout?.props.tone).toBe("rule")
    expect(docEmbeds(authored)).toEqual([
      { artifactId: "ra_1", versionId: "rav_2" },
      { artifactId: "ra_3", versionId: "rav_4" },
    ])
    const resized = authored.blocks.find((entry) => entry.props.artifactId === "ra_3")
    expect(resized?.props).toMatchObject({ width: 45, aspect: "3:4", align: "right" })
    expect(docAssets(authored)).toEqual(["https://example.com/axes.png"])
  })

  it("derives the outline and stats from headings and text", () => {
    expect(docOutline(authored).map((entry) => [entry.level, entry.text])).toEqual([
      [1, "Evaluation rubric, end to end"],
      [2, "Three independent axes"],
      [3, "Edge cases"],
    ])
    const stats = docStats(authored)
    expect(stats.blocks).toBe(SAMPLE.length + 1)
    expect(stats.words).toBeGreaterThan(30)
    expect(stats.readMinutes).toBe(1)
  })

  it("rejects unregistered block types", () => {
    const bad = { ...authored, blocks: [{ ...authored.blocks[0], type: "video" }] }
    expect(docSchema.safeParse(bad).success).toBe(false)
  })
})

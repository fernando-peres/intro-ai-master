import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core"
import { createReactBlockSpec } from "@blocknote/react"
import { InfoIcon, OctagonAlertIcon, ScaleIcon } from "lucide-react"
import type { CALLOUT_TONE_IDS } from "@/artifacts/plugins/doc/content"
import {
  DocEmbed,
  type DocEmbedProps,
  EMBED_ALIGNS,
  EMBED_ASPECTS,
  type EmbedAlign,
  type EmbedAspect,
} from "@/artifacts/plugins/doc/embed-block"
import { cn } from "@/lib/utils"

const CALLOUT_TONES = {
  note: { icon: InfoIcon, label: "Note", ink: "text-gc-done-base" },
  warning: { icon: OctagonAlertIcon, label: "Warning", ink: "text-gc-risk-base" },
  rule: { icon: ScaleIcon, label: "Rule", ink: "text-gc-primary-ink" },
} as const satisfies Record<(typeof CALLOUT_TONE_IDS)[number], unknown>
type CalloutTone = keyof typeof CALLOUT_TONES
const TONE_ORDER = Object.keys(CALLOUT_TONES) as CalloutTone[]

export const calloutBlock = createReactBlockSpec(
  {
    type: "callout",
    propSchema: { tone: { default: "warning" as CalloutTone, values: TONE_ORDER } },
    content: "inline",
  },
  {
    render: ({ block, editor, contentRef }) => {
      // Content is schema-checked, but never let a stray tone take the editor down.
      const tone = CALLOUT_TONES[block.props.tone] ?? CALLOUT_TONES.warning
      const next = TONE_ORDER[(TONE_ORDER.indexOf(block.props.tone) + 1) % TONE_ORDER.length]
      return (
        <div className="flex w-full gap-2.5 rounded-md border-l-2 border-gc-primary bg-gc-sunken p-[11px]">
          <button
            type="button"
            contentEditable={false}
            disabled={!editor.isEditable}
            aria-label={`${tone.label} callout; switch to ${CALLOUT_TONES[next].label}`}
            title={editor.isEditable ? `Switch to ${CALLOUT_TONES[next].label}` : tone.label}
            onClick={() => editor.updateBlock(block, { props: { tone: next } })}
            className={cn("mt-0.5 shrink-0", tone.ink)}
          >
            <tone.icon className="size-3.5" />
          </button>
          <div ref={contentRef} className="min-w-0 flex-1 text-gc-text" />
        </div>
      )
    },
  },
)

export const raEmbedBlock = createReactBlockSpec(
  {
    type: "raEmbed",
    propSchema: {
      artifactId: { default: "" },
      versionId: { default: "" },
      locale: { default: "en" },
      title: { default: "" },
      artifactType: { default: "slide" },
      versionNumber: { default: 0 },
      width: { default: 100 },
      aspect: { default: "16:9" as EmbedAspect, values: EMBED_ASPECTS },
      align: { default: "center" as EmbedAlign, values: EMBED_ALIGNS },
    },
    content: "none",
  },
  {
    render: ({ block, editor }) => (
      <DocEmbed
        embed={block.props as DocEmbedProps}
        editable={editor.isEditable}
        onChange={(props) => editor.updateBlock(block, { props })}
        onSelect={() => editor.isEditable && editor.setTextCursorPosition(block)}
      />
    ),
  },
)

const { audio: _audio, video: _video, file: _file, ...documentBlocks } = defaultBlockSpecs

/** The editor schema: BlockNote's text and structure blocks, minus media we do not host yet. */
export const docEditorSchema = BlockNoteSchema.create({
  blockSpecs: { ...documentBlocks, callout: calloutBlock(), raEmbed: raEmbedBlock() },
})

export type DocEditor = typeof docEditorSchema.BlockNoteEditor
export type DocPartialBlock = typeof docEditorSchema.PartialBlock

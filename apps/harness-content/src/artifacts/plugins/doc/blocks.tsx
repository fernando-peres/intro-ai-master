import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core"
import { createReactBlockSpec } from "@blocknote/react"
import { InfoIcon, OctagonAlertIcon, ScaleIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { api } from "@/api/client"
import { cn } from "@/lib/utils"

const CALLOUT_TONES = {
  note: { icon: InfoIcon, label: "Note", ink: "text-gc-done-base" },
  warning: { icon: OctagonAlertIcon, label: "Warning", ink: "text-gc-risk-base" },
  rule: { icon: ScaleIcon, label: "Rule", ink: "text-gc-primary" },
} as const
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
      const tone = CALLOUT_TONES[block.props.tone]
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

type EmbedProps = {
  artifactId: string
  versionId: string
  locale: string
  title: string
  artifactType: string
  versionNumber: number
}

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
    },
    content: "none",
  },
  { render: ({ block }) => <EmbedChip {...(block.props as EmbedProps)} /> },
)

/**
 * A reference, not a copy: the block pins one published version id. Title, type and number
 * are a snapshot taken at insert time so the chip renders without a request.
 */
function EmbedChip({ artifactId, locale, title, artifactType, versionNumber }: EmbedProps) {
  const [usage, setUsage] = useState<number | null>(null)
  useEffect(() => {
    if (!artifactId) return
    let live = true
    api
      .GET("/api/v1/artifacts/{artifact_id}/usages", {
        params: { path: { artifact_id: artifactId } },
      })
      .then(({ data }) => {
        if (live && data) setUsage(new Set(data.map((entry) => entry.flowId)).size)
      })
    return () => {
      live = false
    }
  }, [artifactId])
  return (
    <div
      contentEditable={false}
      className="flex w-full items-center gap-[11px] rounded-[7px] border border-gc-border bg-gc-sunken p-2.5"
    >
      <div className="flex h-9 w-16 shrink-0 items-center justify-center rounded border border-gc-border bg-gradient-to-br from-[#2E2750] to-[#14131C] font-mono text-[8px] text-[#9D93C9] uppercase">
        {artifactType}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-[12px] font-semibold text-gc-text">
          {title || "Missing artifact"}
        </span>
        <span className="font-mono text-[8.5px] tracking-[0.6px] text-gc-ink3 uppercase">
          Embedded {artifactType} · {locale} v{versionNumber}
          {usage !== null && ` · used in ${usage} flow${usage === 1 ? "" : "s"}`}
        </span>
      </div>
    </div>
  )
}

const { audio: _audio, video: _video, file: _file, ...documentBlocks } = defaultBlockSpecs

/** The editor schema: BlockNote's text and structure blocks, minus media we do not host yet. */
export const docEditorSchema = BlockNoteSchema.create({
  blockSpecs: { ...documentBlocks, callout: calloutBlock(), raEmbed: raEmbedBlock() },
})

export type DocEditor = typeof docEditorSchema.BlockNoteEditor
export type DocPartialBlock = typeof docEditorSchema.PartialBlock

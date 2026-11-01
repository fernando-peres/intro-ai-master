import {
  CheckSquareIcon,
  ChevronRightIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  ImageIcon,
  ListIcon,
  ListOrderedIcon,
  type LucideIcon,
  MessageSquareWarningIcon,
  MinusIcon,
  PilcrowIcon,
  QuoteIcon,
  SparklesIcon,
  TableIcon,
  WorkflowIcon,
} from "lucide-react"
import { useEffect, useState } from "react"
import type { ArtifactType } from "@/api/client"
import type { EditorProps } from "@/artifacts/plugin"
import type { DocPartialBlock } from "@/artifacts/plugins/doc/blocks"
import { type DocContent, docOutline, docStats } from "@/artifacts/plugins/doc/content"
import { useDocEditor } from "@/artifacts/plugins/doc/editor-context"
import {
  type DocEmbedProps,
  EMBED_ALIGNS,
  EMBED_ASPECTS,
  EMBED_MAX_WIDTH,
  EMBED_MIN_WIDTH,
} from "@/artifacts/plugins/doc/embed-block"
import { insertBlock } from "@/artifacts/plugins/doc/insert"
import { EmbedPicker } from "@/components/embed/embed-picker"
import { EmbedRepin, isLiveEmbed } from "@/components/embed/embedded-artifact"
import { Field, Select } from "@/components/shell/form-controls"
import { PanelHeading, Placeholder } from "@/components/workspace/inspector"
import { cn } from "@/lib/utils"

type PaletteItem = {
  label: string
  icon: LucideIcon
  block?: DocPartialBlock
  /** Opens the embed picker for this type instead of inserting a block. */
  embed?: ArtifactType
}

const PALETTE: { group: string; items: PaletteItem[] }[] = [
  {
    group: "Text",
    items: [
      { label: "Heading 1", icon: Heading1Icon, block: { type: "heading", props: { level: 1 } } },
      { label: "Heading 2", icon: Heading2Icon, block: { type: "heading", props: { level: 2 } } },
      { label: "Paragraph", icon: PilcrowIcon, block: { type: "paragraph" } },
      { label: "Bullets", icon: ListIcon, block: { type: "bulletListItem" } },
      { label: "Numbered", icon: ListOrderedIcon, block: { type: "numberedListItem" } },
      { label: "To-do", icon: CheckSquareIcon, block: { type: "checkListItem" } },
    ],
  },
  {
    group: "Blocks",
    items: [
      { label: "Callout", icon: MessageSquareWarningIcon, block: { type: "callout" } },
      { label: "Quote", icon: QuoteIcon, block: { type: "quote" } },
      { label: "Code", icon: CodeIcon, block: { type: "codeBlock" } },
      {
        label: "Table",
        icon: TableIcon,
        block: {
          type: "table",
          content: { type: "tableContent", rows: [{ cells: ["", ""] }, { cells: ["", ""] }] },
        },
      },
      { label: "Divider", icon: MinusIcon, block: { type: "divider" } },
      { label: "Toggle", icon: ChevronRightIcon, block: { type: "toggleListItem" } },
    ],
  },
  {
    group: "Media & reuse",
    items: [
      { label: "Image", icon: ImageIcon, block: { type: "image" } },
      { label: "Diagram", icon: WorkflowIcon, embed: "diagram" },
      { label: "Animation", icon: SparklesIcon, embed: "animation" },
    ],
  },
]

export function DocInsertPanel({ readOnly, artifactId, locale }: EditorProps<DocContent>) {
  const { editor, setEmbedPicker } = useDocEditor()
  if (readOnly || !editor) {
    return <Placeholder>Blocks can be inserted into drafts you can edit.</Placeholder>
  }
  return (
    <>
      {PALETTE.map(({ group, items }) => (
        <section key={group} className="flex flex-col gap-1.5">
          <PanelHeading label={group} />
          <div className="grid grid-cols-2 gap-1.5">
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() =>
                  item.embed
                    ? setEmbedPicker(item.embed)
                    : item.block && insertBlock(editor, item.block)
                }
                className="flex h-8 items-center gap-2 rounded-md border border-gc-border bg-gc-sunken px-2.5 text-ui text-gc-ink2 hover:text-gc-text"
              >
                <item.icon className="size-3.5 text-gc-ink3" />
                {item.label}
              </button>
            ))}
          </div>
        </section>
      ))}
      <EmbedPicker
        excludeId={artifactId}
        locale={locale}
        onPick={(props) => insertBlock(editor, { type: "raEmbed", props })}
      />
      <Placeholder>Or type / in the page to insert inline.</Placeholder>
    </>
  )
}

/** Outline from headings (click to jump) and document stats. */
export function DocFormatPanel({ content, readOnly }: EditorProps<DocContent>) {
  const { editor } = useDocEditor()
  const outline = docOutline(content)
  const stats = docStats(content)
  const jump = (blockId: string) => {
    if (!editor) return
    editor.setTextCursorPosition(blockId, "start")
    editor.focus()
    editor.domElement
      ?.querySelector(`[data-id="${blockId}"]`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" })
  }
  return (
    <>
      <SelectedEmbed content={content} readOnly={readOnly} />
      <PanelHeading label="Outline" right={`${outline.length} headings`} />
      {outline.length === 0 && <Placeholder>Add headings to build an outline.</Placeholder>}
      <ol className="flex flex-col gap-0.5">
        {outline.map((entry, index) => (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => jump(entry.id)}
              className={cn(
                "flex h-[26px] w-full items-center gap-2 rounded-[5px] pr-2 text-left",
                index === 0 ? "bg-gc-row-bg" : "hover:bg-gc-sunken",
              )}
              style={{ paddingLeft: 8 + (Math.min(entry.level, 3) - 1) * 11 }}
            >
              <span
                className={cn(
                  "font-mono text-label tracking-[0.5px]",
                  index === 0 ? "text-gc-nav-ink" : "text-gc-ink3",
                )}
              >
                H{entry.level}
              </span>
              <span
                className={cn(
                  "truncate text-label",
                  index === 0 ? "font-semibold text-gc-nav-ink" : "text-gc-ink2",
                )}
              >
                {entry.text}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <div className="h-px shrink-0 bg-gc-divider" />
      <PanelHeading label="Document" />
      <div className="grid grid-cols-2 gap-2">
        <Stat value={stats.words.toLocaleString("en")} label="Words" />
        <Stat value={`${stats.readMinutes} min`} label="Read time" />
        <Stat value={String(stats.blocks)} label="Blocks" />
        <Stat value={String(outline.length)} label="Headings" />
      </div>
    </>
  )
}

/** Width, aspect, align and re-pin for the embed holding the cursor. */
function SelectedEmbed({ content, readOnly }: { content: DocContent; readOnly: boolean }) {
  const { editor } = useDocEditor()
  const [blockId, setBlockId] = useState<string | null>(null)
  useEffect(() => {
    if (!editor) return
    const read = () => {
      const block = editor.getTextCursorPosition().block
      setBlockId(block.type === "raEmbed" ? block.id : null)
    }
    read()
    return editor.onSelectionChange(read)
  }, [editor])
  // `content` re-renders this panel on every edit, so the block read here is current.
  const block = editor && blockId ? editor.getBlock(blockId) : undefined
  if (!editor || !block || block.type !== "raEmbed" || !content) return null
  const embed = block.props as DocEmbedProps
  const patch = (props: Partial<DocEmbedProps>) => editor.updateBlock(block, { props })
  return (
    <>
      <PanelHeading label="Embed" right={`${embed.locale} v${embed.versionNumber}`} />
      {isLiveEmbed(embed) ? (
        <>
          <Field label={`Width ${embed.width}%`}>
            <input
              type="range"
              aria-label="Embed width"
              disabled={readOnly}
              min={EMBED_MIN_WIDTH}
              max={EMBED_MAX_WIDTH}
              value={embed.width}
              onChange={(event) => patch({ width: Number(event.target.value) })}
              className="accent-gc-primary"
            />
          </Field>
          <Field label="Aspect">
            <Select
              disabled={readOnly}
              value={embed.aspect}
              onChange={(event) => patch({ aspect: event.target.value as DocEmbedProps["aspect"] })}
            >
              {EMBED_ASPECTS.map((aspect) => (
                <option key={aspect} value={aspect}>
                  {aspect === "auto" ? "Auto (fixed height)" : aspect}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Align">
            <Select
              disabled={readOnly}
              value={embed.align}
              onChange={(event) => patch({ align: event.target.value as DocEmbedProps["align"] })}
            >
              {EMBED_ALIGNS.map((align) => (
                <option key={align} value={align}>
                  {align.charAt(0).toUpperCase() + align.slice(1)}
                </option>
              ))}
            </Select>
          </Field>
        </>
      ) : (
        <Placeholder>This type shows as a chip, so it has no size to edit.</Placeholder>
      )}
      {!readOnly && embed.artifactId && <EmbedRepin embed={embed} onRepin={patch} />}
      <div className="h-px shrink-0 bg-gc-divider" />
    </>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-[3px] rounded-md border border-gc-border bg-gc-sunken p-[9px]">
      <span className="font-mono text-body text-gc-text">{value}</span>
      <span className="font-mono text-label tracking-[0.6px] text-gc-ink3 uppercase">{label}</span>
    </div>
  )
}

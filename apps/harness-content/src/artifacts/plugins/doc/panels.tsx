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
  SearchIcon,
  TableIcon,
  WorkflowIcon,
} from "lucide-react"
import { useState } from "react"
import type { ArtifactListItem } from "@/api/client"
import { useArtifactSearch } from "@/api/queries"
import type { EditorProps } from "@/artifacts/plugin"
import type { DocEditor, DocPartialBlock } from "@/artifacts/plugins/doc/blocks"
import { type DocContent, docOutline, docStats } from "@/artifacts/plugins/doc/content"
import { useDocEditor } from "@/artifacts/plugins/doc/editor-context"
import { typeInfo } from "@/components/artifact-types"
import { PanelHeading, Placeholder } from "@/components/workspace/inspector"
import { cn } from "@/lib/utils"

type PaletteItem = { label: string; icon: LucideIcon; block?: DocPartialBlock; hint?: string }

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
      { label: "Diagram", icon: WorkflowIcon, hint: "Diagram artifacts arrive later" },
    ],
  },
]

/** Inserts after the block holding the cursor, replacing it when it is an empty paragraph. */
export function insertBlock(editor: DocEditor, block: DocPartialBlock): void {
  const current = editor.getTextCursorPosition().block
  const empty =
    current.type === "paragraph" && Array.isArray(current.content) && current.content.length === 0
  const [inserted] = empty
    ? [editor.updateBlock(current, block)]
    : editor.insertBlocks([block], current, "after")
  if (inserted && inserted.content !== undefined) editor.setTextCursorPosition(inserted, "end")
  editor.focus()
}

export function DocInsertPanel({ readOnly, artifactId, locale }: EditorProps<DocContent>) {
  const { editor } = useDocEditor()
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
                disabled={!item.block}
                title={item.hint}
                onClick={() => item.block && insertBlock(editor, item.block)}
                className="flex h-8 items-center gap-2 rounded-md border border-gc-border bg-gc-sunken px-2.5 text-[11px] text-gc-ink2 hover:text-gc-text disabled:cursor-not-allowed disabled:opacity-45"
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
        onPick={(block) => insertBlock(editor, block)}
      />
      <Placeholder>Or type / in the page to insert inline.</Placeholder>
    </>
  )
}

/** The pinned version an embed would use: the default in `locale`, else any default. */
export function embedTarget(item: ArtifactListItem, locale: string) {
  const chosen = item.defaults[locale] ? locale : Object.keys(item.defaults)[0]
  if (!chosen) return null
  const number = item.localeVersions.find((entry) => entry.locale === chosen)?.defaultNumber
  return { locale: chosen, versionId: item.defaults[chosen], versionNumber: number ?? 0 }
}

function EmbedPicker({
  excludeId,
  locale,
  onPick,
}: {
  excludeId: string
  locale: string
  onPick: (block: DocPartialBlock) => void
}) {
  const [query, setQuery] = useState("")
  const results = useArtifactSearch({
    query: query || undefined,
    status: "has-published",
    limit: 6,
  })
  const items = (results.data?.items ?? []).filter((item) => item.id !== excludeId)
  return (
    <section className="flex flex-col gap-1.5">
      <PanelHeading label="Embed artifact" right="pins a version" />
      <label className="flex h-[30px] items-center gap-2 rounded-md border border-gc-border bg-gc-sunken px-2.5 focus-within:border-gc-primary">
        <SearchIcon aria-hidden className="size-3 text-gc-ink3" />
        <input
          aria-label="Search published artifacts"
          placeholder="Search published artifacts"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[11px] text-gc-text outline-none placeholder:text-gc-ink3"
        />
      </label>
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const target = embedTarget(item, locale)
          const info = typeInfo(item.type)
          if (!target) return null
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() =>
                  onPick({
                    type: "raEmbed",
                    props: {
                      artifactId: item.id,
                      versionId: target.versionId,
                      locale: target.locale,
                      title: item.title,
                      artifactType: item.type,
                      versionNumber: target.versionNumber,
                    },
                  })
                }
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-gc-sunken"
              >
                <info.icon className={cn("size-3 shrink-0", info.ink)} />
                <span className="min-w-0 flex-1 truncate text-[11px] text-gc-ink2">
                  {item.title}
                </span>
                <span className="font-mono text-[8.5px] text-gc-ink3 uppercase">
                  {target.locale} v{target.versionNumber}
                </span>
              </button>
            </li>
          )
        })}
        {results.isSuccess && items.length === 0 && (
          <li className="px-2 text-[11px] text-gc-ink3">No published artifacts match.</li>
        )}
      </ul>
    </section>
  )
}

/** Outline from headings (click to jump) and document stats. */
export function DocFormatPanel({ content }: EditorProps<DocContent>) {
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
                  "font-mono text-[8px] tracking-[0.5px]",
                  index === 0 ? "text-gc-nav-ink" : "text-gc-ink3",
                )}
              >
                H{entry.level}
              </span>
              <span
                className={cn(
                  "truncate text-[10.5px]",
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

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-[3px] rounded-md border border-gc-border bg-gc-sunken p-[9px]">
      <span className="font-mono text-[13px] text-gc-text">{value}</span>
      <span className="font-mono text-[8px] tracking-[0.6px] text-gc-ink3 uppercase">{label}</span>
    </div>
  )
}

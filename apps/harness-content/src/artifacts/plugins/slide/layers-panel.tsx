import {
  AlignCenterHorizontalIcon,
  AlignCenterVerticalIcon,
  AlignEndHorizontalIcon,
  AlignEndVerticalIcon,
  AlignHorizontalDistributeCenterIcon,
  AlignStartHorizontalIcon,
  AlignStartVerticalIcon,
  AlignVerticalDistributeCenterIcon,
  ArrowDownIcon,
  ArrowDownToLineIcon,
  ArrowUpIcon,
  ArrowUpToLineIcon,
  BarChart3Icon,
  BoxSelectIcon,
  CircleIcon,
  EyeIcon,
  EyeOffIcon,
  GroupIcon,
  ImageIcon,
  LockIcon,
  type LucideIcon,
  MinusIcon,
  SquareIcon,
  TypeIcon,
  UngroupIcon,
  UnlockIcon,
  WorkflowIcon,
} from "lucide-react"
import type { ReactNode } from "react"
import { useSlideActions, useSlideEditor } from "@/artifacts/plugins/slide/editor-context"
import { CANVAS, type SlideContent, type SlideElement } from "@/artifacts/plugins/slide/model"
import {
  type Align,
  alignElements,
  distributeElements,
  expandToGroups,
  groupElements,
  type Reorder,
  reorder,
  ungroupElements,
  updateElement,
} from "@/artifacts/plugins/slide/ops"
import { PanelHeading } from "@/components/workspace/inspector"
import { cn } from "@/lib/utils"

const TYPE_ICON: Record<SlideElement["type"], LucideIcon> = {
  text: TypeIcon,
  rect: SquareIcon,
  ellipse: CircleIcon,
  line: MinusIcon,
  arrow: MinusIcon,
  image: ImageIcon,
  diagram: WorkflowIcon,
  chart: BarChart3Icon,
}

export function layerLabel(element: SlideElement): string {
  if (element.name) return element.name
  if (element.type === "text") return element.text.split("\n")[0].slice(0, 40) || element.variant
  if (element.type === "chart") return element.options.title || `${element.chartType} chart`
  if (element.type === "image") return element.alt || "Image"
  return element.type.replace(/^./, (c) => c.toUpperCase())
}

type Row =
  | { kind: "group"; groupId: string; members: SlideElement[] }
  | { kind: "element"; element: SlideElement }

/** Top-most first; a group appears once, where its top-most member is, with its members under it. */
export function layerRows(content: SlideContent): Row[] {
  const rows: Row[] = []
  const seen = new Set<string>()
  for (const element of [...content.elements].reverse()) {
    if (!element.groupId) {
      rows.push({ kind: "element", element })
      continue
    }
    if (seen.has(element.groupId)) continue
    seen.add(element.groupId)
    const members = [...content.elements].reverse().filter((el) => el.groupId === element.groupId)
    rows.push({ kind: "group", groupId: element.groupId, members })
  }
  return rows
}

type Props = { content: SlideContent; onChange: (next: SlideContent) => void; readOnly: boolean }

export function LayersPanel({ content, onChange, readOnly }: Props) {
  const actions = useSlideActions(content, onChange)
  const { selected, setSelected } = useSlideEditor()
  const rows = layerRows(content)
  const grouped = content.elements.some((el) => selected.includes(el.id) && el.groupId)
  const order = (move: Reorder) => actions.apply(reorder(content, selected, move))

  return (
    <>
      <PanelHeading label="Layers" right={`${content.elements.length} elements`} />
      <div className="flex flex-wrap items-center gap-1">
        <IconButton
          label="Group (⌘G)"
          disabled={readOnly || selected.length < 2}
          onClick={() => actions.apply(groupElements(content, selected))}
        >
          <GroupIcon />
        </IconButton>
        <IconButton
          label="Ungroup (⇧⌘G)"
          disabled={readOnly || !grouped}
          onClick={() => actions.apply(ungroupElements(content, selected))}
        >
          <UngroupIcon />
        </IconButton>
        <span className="mx-1 h-4 w-px bg-gc-divider" />
        <IconButton
          label="Bring to front (⌥⌘])"
          disabled={readOnly || !selected.length}
          onClick={() => order("front")}
        >
          <ArrowUpToLineIcon />
        </IconButton>
        <IconButton
          label="Bring forward (⌘])"
          disabled={readOnly || !selected.length}
          onClick={() => order("forward")}
        >
          <ArrowUpIcon />
        </IconButton>
        <IconButton
          label="Send backward (⌘[)"
          disabled={readOnly || !selected.length}
          onClick={() => order("backward")}
        >
          <ArrowDownIcon />
        </IconButton>
        <IconButton
          label="Send to back (⌥⌘[)"
          disabled={readOnly || !selected.length}
          onClick={() => order("back")}
        >
          <ArrowDownToLineIcon />
        </IconButton>
      </div>
      <ul
        aria-label="Layers"
        className="flex max-h-64 flex-col gap-px overflow-y-auto rounded-md border border-gc-border bg-gc-sunken p-1"
      >
        {rows.map((row) =>
          row.kind === "element" ? (
            <LayerRow
              key={row.element.id}
              element={row.element}
              depth={0}
              selected={selected.includes(row.element.id)}
              readOnly={readOnly}
              onSelect={(additive) =>
                setSelected(
                  additive
                    ? selected.includes(row.element.id)
                      ? selected.filter((id) => id !== row.element.id)
                      : [...selected, row.element.id]
                    : [row.element.id],
                )
              }
              onToggle={(key) =>
                actions.apply(updateElement(content, row.element.id, { [key]: !row.element[key] }))
              }
            />
          ) : (
            <li key={row.groupId}>
              <button
                type="button"
                onClick={() => setSelected(expandToGroups(content, [row.members[0].id]))}
                className={cn(
                  "flex h-[26px] w-full items-center gap-2 rounded-[5px] px-2 text-left text-[10.5px]",
                  row.members.every((m) => selected.includes(m.id))
                    ? "bg-gc-row-bg font-semibold text-gc-nav-ink"
                    : "text-gc-ink2 hover:bg-gc-raised",
                )}
              >
                <BoxSelectIcon className="size-3 text-gc-ink3" />
                Group · {row.members.length}
              </button>
              <ul className="flex flex-col gap-px">
                {row.members.map((member) => (
                  <LayerRow
                    key={member.id}
                    element={member}
                    depth={1}
                    selected={selected.includes(member.id)}
                    readOnly={readOnly}
                    onSelect={() => setSelected([member.id])}
                    onToggle={(key) =>
                      actions.apply(updateElement(content, member.id, { [key]: !member[key] }))
                    }
                  />
                ))}
              </ul>
            </li>
          ),
        )}
      </ul>
    </>
  )
}

function LayerRow({
  element,
  depth,
  selected,
  readOnly,
  onSelect,
  onToggle,
}: {
  element: SlideElement
  depth: number
  selected: boolean
  readOnly: boolean
  onSelect: (additive: boolean) => void
  onToggle: (key: "visible" | "locked") => void
}) {
  const Icon = TYPE_ICON[element.type]
  return (
    <li
      className={cn(
        "flex h-[26px] items-center gap-1 rounded-[5px] pr-1",
        selected ? "bg-gc-row-bg" : "hover:bg-gc-raised",
      )}
      style={{ paddingLeft: 8 + depth * 14 }}
    >
      <button
        type="button"
        onClick={(event) => onSelect(event.shiftKey || event.metaKey)}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 text-left text-[10.5px]",
          selected ? "font-semibold text-gc-nav-ink" : "text-gc-ink2",
          !element.visible && "opacity-50",
        )}
      >
        <Icon className="size-3 shrink-0 text-gc-ink3" />
        <span className="truncate">{layerLabel(element)}</span>
      </button>
      <IconButton
        label={element.visible ? `Hide ${layerLabel(element)}` : `Show ${layerLabel(element)}`}
        disabled={readOnly}
        onClick={() => onToggle("visible")}
        quiet
      >
        {element.visible ? <EyeIcon /> : <EyeOffIcon />}
      </IconButton>
      <IconButton
        label={element.locked ? `Unlock ${layerLabel(element)}` : `Lock ${layerLabel(element)}`}
        disabled={readOnly}
        onClick={() => onToggle("locked")}
        quiet
      >
        {element.locked ? <LockIcon /> : <UnlockIcon />}
      </IconButton>
    </li>
  )
}

const ALIGNS: { align: Align; label: string; icon: LucideIcon }[] = [
  { align: "left", label: "Align left", icon: AlignStartVerticalIcon },
  { align: "center", label: "Align centre", icon: AlignCenterVerticalIcon },
  { align: "right", label: "Align right", icon: AlignEndVerticalIcon },
  { align: "top", label: "Align top", icon: AlignStartHorizontalIcon },
  { align: "middle", label: "Align middle", icon: AlignCenterHorizontalIcon },
  { align: "bottom", label: "Align bottom", icon: AlignEndHorizontalIcon },
]

export function AlignPanel({ content, onChange, readOnly }: Props) {
  const actions = useSlideActions(content, onChange)
  const { selected } = useSlideEditor()
  const units = new Set(
    content.elements.filter((el) => selected.includes(el.id)).map((el) => el.groupId ?? el.id),
  )
  if (!selected.length) return null
  return (
    <>
      <PanelHeading label="Align" right={units.size === 1 ? "to slide" : "to selection"} />
      <div className="flex flex-wrap items-center gap-1">
        {ALIGNS.map((entry) => (
          <IconButton
            key={entry.align}
            label={entry.label}
            disabled={readOnly}
            onClick={() => actions.apply(alignElements(content, selected, entry.align, CANVAS))}
          >
            <entry.icon />
          </IconButton>
        ))}
        <span className="mx-1 h-4 w-px bg-gc-divider" />
        <IconButton
          label="Distribute horizontally"
          disabled={readOnly || selected.length < 3}
          onClick={() => actions.apply(distributeElements(content, selected, "horizontal"))}
        >
          <AlignHorizontalDistributeCenterIcon />
        </IconButton>
        <IconButton
          label="Distribute vertically"
          disabled={readOnly || selected.length < 3}
          onClick={() => actions.apply(distributeElements(content, selected, "vertical"))}
        >
          <AlignVerticalDistributeCenterIcon />
        </IconButton>
      </div>
    </>
  )
}

function IconButton({
  label,
  onClick,
  disabled,
  quiet,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  quiet?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-[5px] text-gc-ink2 hover:text-gc-text disabled:opacity-35 [&_svg]:size-3",
        !quiet && "border border-gc-border bg-gc-sunken",
      )}
    >
      {children}
    </button>
  )
}

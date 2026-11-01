import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ChevronDownIcon,
  ChevronRightIcon,
  GripVerticalIcon,
  ListChecksIcon,
  ListPlusIcon,
  PaletteIcon,
  PlusIcon,
  TimerIcon,
  XIcon,
} from "lucide-react"
import { type ReactNode, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { typeInfo } from "@/components/artifact-types"
import { LocaleLabel } from "@/components/labels"
import {
  addPill,
  type ContainerKey,
  flattenSteps,
  type GroupNode,
  groupSteps,
  moveWithin,
  nodeId,
  type OutlineNode,
  patchGroup,
  removeGroup,
  removeStep,
  type TrailOutline,
} from "@/lib/outline"
import { formatClock, stepSeconds, type TrailStep, totalSeconds } from "@/lib/trail"
import { cn, formatCount } from "@/lib/utils"

type Props = {
  outline: TrailOutline
  /** A step key or a unit/pill key. */
  selected: string | null
  /** Keys of steps whose pin is behind the artifact's current default. */
  behind: Set<string>
  readOnly: boolean
  onSelect: (key: string) => void
  onRationale: (groupKey: string) => void
  onAddStep: (container: ContainerKey) => void
  onChange: (outline: TrailOutline) => void
}

type Row = Omit<Props, "outline" | "onChange"> & {
  outline: TrailOutline
  positions: Map<string, number>
  collapsed: Set<string>
  onCollapse: (key: string) => void
  onChange: (outline: TrailOutline) => void
}

/**
 * Units, pills and steps in play order. Drag by the grip (or focus it and use Space + arrows)
 * to reorder inside a level; a step's Placement setting moves it between levels.
 */
export function OutlineList({ outline, onChange, ...rest }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const positions = useMemo(
    () => new Map(flattenSteps(outline).map((step, index) => [step.key, index + 1])),
    [outline],
  )
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const container = active.data.current?.container as ContainerKey | undefined
    if (!over || active.id === over.id || container === undefined) return
    if (over.data.current?.container !== container) return
    onChange(moveWithin(outline, container, String(active.id), String(over.id)))
  }
  const row: Row = {
    ...rest,
    outline,
    positions,
    collapsed,
    onCollapse: (key) =>
      setCollapsed((prev) => {
        const next = new Set(prev)
        if (!next.delete(key)) next.add(key)
        return next
      }),
    onChange,
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <Level label="Trail outline" container={null} nodes={outline.nodes} row={row} />
    </DndContext>
  )
}

function Level({
  label,
  container,
  nodes,
  row,
}: {
  label: string
  container: ContainerKey
  nodes: OutlineNode[]
  row: Row
}) {
  return (
    <SortableContext items={nodes.map(nodeId)} strategy={verticalListSortingStrategy}>
      <ol aria-label={label} className="flex flex-col gap-1.5">
        {nodes.map((node) =>
          node.kind === "step" ? (
            <StepRow key={node.step.key} step={node.step} container={container} row={row} />
          ) : (
            <GroupBlock key={node.key} group={node} container={container} row={row} />
          ),
        )}
      </ol>
    </SortableContext>
  )
}

function useRowSortable(id: string, container: ContainerKey, readOnly: boolean) {
  const sortable = useSortable({ id, data: { container }, disabled: readOnly })
  return {
    sortable,
    style: {
      transform: CSS.Transform.toString(sortable.transform),
      transition: sortable.transition,
    },
  }
}

function Grip({
  label,
  readOnly,
  selected,
  sortable,
}: {
  label: string
  readOnly: boolean
  selected: boolean
  sortable: ReturnType<typeof useSortable>
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={readOnly}
      className={cn(
        "relative z-10 flex h-6 w-5 cursor-grab touch-none items-center justify-center disabled:cursor-default disabled:opacity-40",
        selected ? "text-gc-primary-ink" : "text-gc-ink3",
      )}
      {...sortable.attributes}
      {...sortable.listeners}
    >
      <GripVerticalIcon className="size-3" />
    </button>
  )
}

function IconButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string
  onClick: () => void
  danger?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "relative z-10 flex size-6 items-center justify-center rounded-md text-gc-ink3 [&_svg]:size-3",
        danger ? "hover:text-gc-fail-ink" : "hover:bg-gc-sunken hover:text-gc-text",
      )}
    >
      {children}
    </button>
  )
}

const UNDO_MS = 8_000

/** Removal is autosaved at once, so it stays undoable (the toast's button) for a few seconds. */
function removeWithUndo(row: Row, message: string, next: TrailOutline) {
  const previous = row.outline
  row.onChange(next)
  toast(message, {
    duration: UNDO_MS,
    action: { label: "Undo", onClick: () => row.onChange(previous) },
  })
}

function GroupBlock({
  group,
  container,
  row,
}: {
  group: GroupNode
  container: ContainerKey
  row: Row
}) {
  const { sortable, style } = useRowSortable(group.key, container, row.readOnly)
  const [title, setTitle] = useState(group.title)
  useEffect(() => setTitle(group.title), [group.title])
  const kind = group.kind === "unit" ? "Unit" : "Pill"
  const steps = groupSteps(group)
  const open = !row.collapsed.has(group.key)
  const selected = row.selected === group.key
  const save = () => {
    const next = title.trim()
    if (!next) setTitle(group.title)
    else if (next !== group.title) row.onChange(patchGroup(row.outline, group.key, { title: next }))
  }

  return (
    <li
      ref={sortable.setNodeRef}
      style={style}
      className={cn(
        "flex flex-col gap-1.5 rounded-lg border p-1.5",
        group.kind === "unit" ? "bg-gc-raised/60" : "bg-gc-sunken",
        selected ? "border-gc-primary ring-1 ring-gc-primary" : "border-gc-border",
        sortable.isDragging && "z-10 opacity-90 shadow-lg",
      )}
    >
      <div className="flex h-8 items-center gap-1.5 px-1">
        <Grip
          label={`Move ${kind.toLowerCase()} ${group.title}`}
          readOnly={row.readOnly}
          selected={selected}
          sortable={sortable}
        />
        <button
          type="button"
          aria-expanded={open}
          aria-label={`${open ? "Collapse" : "Expand"} ${group.title}`}
          onClick={() => row.onCollapse(group.key)}
          className="flex size-6 items-center justify-center text-gc-ink3 hover:text-gc-text"
        >
          {open ? (
            <ChevronDownIcon className="size-3.5" />
          ) : (
            <ChevronRightIcon className="size-3.5" />
          )}
        </button>
        <span
          className={cn(
            "rounded-[3px] px-[5px] py-0.5 font-mono text-label tracking-[0.6px] uppercase",
            group.kind === "unit" ? "bg-gc-nav-bg text-gc-nav-ink" : "bg-gc-row-bg text-gc-ink2",
          )}
        >
          {kind}
        </span>
        <input
          aria-label={`${kind} title`}
          readOnly={row.readOnly}
          value={title}
          onFocus={() => row.onSelect(group.key)}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={save}
          onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
          className="h-6 min-w-0 flex-1 rounded-[5px] border border-transparent bg-transparent px-1.5 text-ui font-semibold text-gc-text outline-none hover:border-gc-border focus:border-gc-primary read-only:hover:border-transparent"
        />
        <span className="font-mono text-label text-gc-ink3">
          {formatCount(steps.length, "step")} · {formatClock(totalSeconds(steps))}
        </span>
        <IconButton label={`${group.title} rationale`} onClick={() => row.onRationale(group.key)}>
          <ListChecksIcon />
        </IconButton>
        {!row.readOnly && (
          <>
            {group.kind === "unit" && (
              <IconButton
                label={`Add a pill to ${group.title}`}
                onClick={() => row.onChange(addPill(row.outline, group.key, "New pill")[0])}
              >
                <ListPlusIcon />
              </IconButton>
            )}
            <IconButton
              label={`Add a step to ${group.title}`}
              onClick={() => row.onAddStep(group.key)}
            >
              <PlusIcon />
            </IconButton>
            <IconButton
              danger
              label={`Remove ${kind.toLowerCase()} ${group.title} (keeps its steps)`}
              onClick={() =>
                removeWithUndo(
                  row,
                  `Removed ${kind.toLowerCase()} “${group.title}”`,
                  removeGroup(row.outline, group.key),
                )
              }
            >
              <XIcon />
            </IconButton>
          </>
        )}
      </div>
      {open &&
        (group.children.length > 0 ? (
          <div className="border-l border-gc-border pl-2.5 ml-3">
            <Level
              label={`${kind} ${group.title}`}
              container={group.key}
              nodes={group.children}
              row={row}
            />
          </div>
        ) : (
          <p className="px-8 pb-1 text-label text-gc-ink3">
            Empty {kind.toLowerCase()}.{" "}
            {!row.readOnly && "Add a step here, or move one in from its Placement setting."}
          </p>
        ))}
    </li>
  )
}

function StepRow({ step, container, row }: { step: TrailStep; container: ContainerKey; row: Row }) {
  const { sortable, style } = useRowSortable(step.key, container, row.readOnly)
  const position = row.positions.get(step.key) ?? 0
  const selected = step.key === row.selected
  const info = typeInfo(step.artifactType)
  const title = step.label || step.artifactTitle
  return (
    <li
      ref={sortable.setNodeRef}
      style={style}
      className={cn(
        "relative flex h-14 items-center gap-2.5 rounded-lg border bg-gc-raised px-[11px]",
        selected ? "border-gc-primary ring-1 ring-gc-primary" : "border-gc-border",
        sortable.isDragging && "z-10 opacity-90 shadow-lg",
      )}
    >
      <Grip
        label={`Move step ${position}`}
        readOnly={row.readOnly}
        selected={selected}
        sortable={sortable}
      />
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-md font-mono text-label font-bold",
          selected ? "bg-gc-primary text-gc-on-solid" : "bg-gc-sunken text-gc-ink2",
        )}
      >
        {position}
      </span>
      <span
        className={cn("flex size-6 shrink-0 items-center justify-center rounded-md", info.chip)}
      >
        <info.icon className="size-3" />
      </span>
      <button
        type="button"
        onClick={() => row.onSelect(step.key)}
        aria-current={selected ? "step" : undefined}
        className="flex min-w-0 flex-1 flex-col gap-1 text-left after:absolute after:inset-0 after:content-['']"
      >
        <span className="flex items-center gap-[7px]">
          <span className="truncate text-ui font-semibold text-gc-text">{title}</span>
          {step.themeOverride && (
            <span className="flex items-center gap-1 rounded-[3px] bg-gc-risk-tint px-[5px] py-0.5 font-mono text-label tracking-[0.4px] text-gc-risk-ink">
              <PaletteIcon className="size-[9px]" />
              OVERRIDE
            </span>
          )}
        </span>
        <span className="flex items-center gap-1.5">
          <LocaleLabel
            locale={step.locale}
            version={step.versionNumber ?? null}
            published={step.versionState === "published"}
          />
          {row.behind.has(step.key) && (
            <span className="rounded-[3px] bg-gc-warn-tint px-[5px] py-0.5 font-mono text-label tracking-[0.4px] text-gc-warn-ink">
              BEHIND
            </span>
          )}
          {step.advanceSeconds && (
            <TimerIcon aria-label="Advances automatically" className="size-3 text-gc-ink3" />
          )}
        </span>
      </button>
      <span className="font-mono text-label text-gc-ink3">{formatClock(stepSeconds(step))}</span>
      {!row.readOnly && (
        <button
          type="button"
          aria-label={`Remove step ${position}`}
          onClick={() =>
            removeWithUndo(row, `Removed step “${title}”`, removeStep(row.outline, step.key))
          }
          className="relative z-10 flex size-6 items-center justify-center text-gc-ink3 hover:text-gc-fail-ink"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </li>
  )
}

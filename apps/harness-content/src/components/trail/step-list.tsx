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
import { GripVerticalIcon, PaletteIcon, TimerIcon, XIcon } from "lucide-react"
import { typeInfo } from "@/components/artifact-types"
import { LocaleLabel } from "@/components/labels"
import { formatClock, moveItem, stepSeconds, type TrailStep } from "@/lib/trail"
import { cn } from "@/lib/utils"

type Props = {
  steps: TrailStep[]
  selected: string | null
  /** Keys of steps whose pin is behind the artifact's current default. */
  behind: Set<string>
  readOnly: boolean
  onSelect: (key: string) => void
  onChange: (steps: TrailStep[]) => void
}

/** Ordered steps; drag by the grip (or focus it and use Space + arrows) to reorder. */
export function StepList({ steps, selected, behind, readOnly, onSelect, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = steps.findIndex((step) => step.key === active.id)
    const to = steps.findIndex((step) => step.key === over.id)
    onChange(moveItem(steps, from, to))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={steps.map((step) => step.key)} strategy={verticalListSortingStrategy}>
        <ol aria-label="Trail steps" className="flex flex-col gap-1.5">
          {steps.map((step, index) => (
            <StepRow
              key={step.key}
              step={step}
              position={index + 1}
              selected={step.key === selected}
              behind={behind.has(step.key)}
              readOnly={readOnly}
              onSelect={() => onSelect(step.key)}
              onRemove={() => onChange(steps.filter((other) => other.key !== step.key))}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  )
}

function StepRow({
  step,
  position,
  selected,
  behind,
  readOnly,
  onSelect,
  onRemove,
}: {
  step: TrailStep
  position: number
  selected: boolean
  behind: boolean
  readOnly: boolean
  onSelect: () => void
  onRemove: () => void
}) {
  const sortable = useSortable({ id: step.key, disabled: readOnly })
  const info = typeInfo(step.artifactType)
  const title = step.label || step.artifactTitle
  return (
    <li
      ref={sortable.setNodeRef}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      }}
      className={cn(
        "relative flex h-12 items-center gap-2.5 rounded-lg border bg-gc-raised px-[11px]",
        selected ? "border-gc-primary ring-1 ring-gc-primary" : "border-gc-border",
        sortable.isDragging && "z-10 opacity-90 shadow-lg",
      )}
    >
      <button
        type="button"
        aria-label={`Move step ${position}`}
        disabled={readOnly}
        className={cn(
          "relative z-10 cursor-grab touch-none disabled:cursor-default disabled:opacity-40",
          selected ? "text-gc-primary" : "text-gc-ink3",
        )}
        {...sortable.attributes}
        {...sortable.listeners}
      >
        <GripVerticalIcon className="size-3" />
      </button>
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-md font-mono text-[9px] font-bold",
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
        onClick={onSelect}
        aria-current={selected ? "step" : undefined}
        className="flex min-w-0 flex-1 flex-col gap-1 text-left after:absolute after:inset-0 after:content-['']"
      >
        <span className="flex items-center gap-[7px]">
          <span className="truncate text-[11px] font-semibold text-gc-text">{title}</span>
          {step.themeOverride && (
            <span className="flex items-center gap-1 rounded-[3px] bg-gc-risk-tint px-[5px] py-0.5 font-mono text-[7.5px] tracking-[0.4px] text-gc-risk-ink">
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
          {behind && (
            <span className="rounded-[3px] bg-gc-warn-tint px-[5px] py-0.5 font-mono text-[7.5px] tracking-[0.4px] text-gc-warn-ink">
              BEHIND
            </span>
          )}
          {step.advanceSeconds && (
            <TimerIcon aria-label="Advances automatically" className="size-3 text-gc-ink3" />
          )}
        </span>
      </button>
      <span className="font-mono text-[9px] text-gc-ink3">{formatClock(stepSeconds(step))}</span>
      {!readOnly && (
        <button
          type="button"
          aria-label={`Remove step ${position}`}
          onClick={onRemove}
          className="relative z-10 text-gc-ink3 hover:text-gc-fail-ink"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </li>
  )
}

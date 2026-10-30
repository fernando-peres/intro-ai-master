import {
  FileTextIcon,
  type LucideIcon,
  MicIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  SquarePlusIcon,
  TagIcon,
  XIcon,
} from "lucide-react"
import { type ReactNode, Suspense, useEffect, useState } from "react"
import type { Schemas } from "@/api/client"
import { useUpdateArtifact, useUsers } from "@/api/queries"
import { Caption, type StatusKind, StatusLabel } from "@/components/labels"
import { cn } from "@/lib/utils"
import { formatDuration, parseDuration, scriptStats } from "@/lib/workflow"

export type InspectorTab = "metadata" | "format" | "script" | "insert"

const TABS: { id: InspectorTab; label: string; icon: LucideIcon }[] = [
  { id: "metadata", label: "Metadata", icon: FileTextIcon },
  { id: "format", label: "Format", icon: SlidersHorizontalIcon },
  { id: "script", label: "Script", icon: MicIcon },
  { id: "insert", label: "Insert", icon: SquarePlusIcon },
]

type Props = {
  tab: InspectorTab
  onTab: (tab: InspectorTab) => void
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
  panels: Record<InspectorTab, ReactNode>
}

export function Inspector({ tab, onTab, collapsed, onCollapse, panels }: Props) {
  if (collapsed) {
    return (
      <aside
        aria-label="Inspector"
        className="flex w-11 shrink-0 flex-col items-center gap-1.5 border-l border-gc-border bg-gc-raised py-2.5"
      >
        <RailButton label="Expand inspector" onClick={() => onCollapse(false)} bordered>
          <PanelRightOpenIcon />
        </RailButton>
        {TABS.slice(0, 3).map((entry) => (
          <RailButton
            key={entry.id}
            label={entry.label}
            selected={entry.id === tab}
            onClick={() => {
              onTab(entry.id)
              onCollapse(false)
            }}
          >
            <entry.icon />
          </RailButton>
        ))}
      </aside>
    )
  }
  return (
    <aside
      aria-label="Inspector"
      className="flex w-[300px] shrink-0 flex-col border-l border-gc-border bg-gc-raised"
    >
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-gc-border px-3">
        <span className="font-mono text-[9px] tracking-[1px] text-gc-ink3">INSPECTOR</span>
        <RailButton label="Collapse inspector" onClick={() => onCollapse(true)} bordered small>
          <PanelRightCloseIcon />
        </RailButton>
      </div>
      <div
        role="tablist"
        className="flex h-9 shrink-0 items-center gap-[3px] border-b border-gc-border px-2"
      >
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={entry.id === tab}
            onClick={() => onTab(entry.id)}
            className={cn(
              "rounded-[5px] px-2.5 py-[5px] text-[11px]",
              entry.id === tab
                ? "bg-gc-row-bg font-semibold text-gc-nav-ink"
                : "text-gc-ink3 hover:text-gc-ink2",
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="flex min-h-0 flex-1 flex-col gap-[13px] overflow-y-auto p-3">
        <Suspense fallback={<Placeholder>Loading…</Placeholder>}>{panels[tab]}</Suspense>
      </div>
    </aside>
  )
}

function RailButton({
  label,
  onClick,
  selected,
  bordered,
  small,
  children,
}: {
  label: string
  onClick: () => void
  selected?: boolean
  bordered?: boolean
  small?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-md text-gc-ink2 hover:text-gc-text [&_svg]:size-3",
        small ? "size-[22px]" : "size-[26px]",
        bordered && "border border-gc-border bg-gc-sunken",
        selected && "bg-gc-row-bg text-gc-nav-ink",
      )}
    >
      {children}
    </button>
  )
}

export function PanelHeading({ label, right }: { label: string; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-[9px] tracking-[1px] text-gc-ink3 uppercase">{label}</span>
      {right && (
        <span className="font-mono text-[8.5px] tracking-[0.5px] text-gc-ink3 uppercase">
          {right}
        </span>
      )}
    </div>
  )
}

export function Placeholder({ children }: { children: ReactNode }) {
  return <p className="text-[11px] leading-relaxed text-gc-ink3">{children}</p>
}

const fieldInput =
  "h-[30px] w-full rounded-[5px] border border-gc-border bg-gc-sunken px-[9px] text-[11.5px] text-gc-text outline-none read-only:text-gc-ink2 focus:border-gc-primary"

function LabeledField({ label, children }: { label: string; children: ReactNode }) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is passed in as children
    <label className="flex min-w-0 flex-1 flex-col gap-[5px]">
      <span className="font-mono text-[8.5px] tracking-[0.8px] text-gc-ink3 uppercase">
        {label}
      </span>
      {children}
    </label>
  )
}

type ChecklistItem = { label: string; done: boolean }

function readChecklist(design: Record<string, unknown>): ChecklistItem[] {
  const raw = design.checklist
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) =>
    item && typeof item === "object" && typeof (item as ChecklistItem).label === "string"
      ? [{ label: (item as ChecklistItem).label, done: Boolean((item as ChecklistItem).done) }]
      : [],
  )
}

type MetadataProps = {
  artifact: Schemas["ArtifactOut"]
  status: StatusKind
  readOnly: boolean
}

/** Artifact-level metadata (shared by every version); saved on blur or toggle. */
export function MetadataPanel({ artifact, status, readOnly }: MetadataProps) {
  const update = useUpdateArtifact(artifact.id)
  const owner = useUsers().data?.find((user) => user.id === artifact.createdBy)
  const design = artifact.instructionalDesign ?? {}
  const durationSeconds = typeof design.durationSeconds === "number" ? design.durationSeconds : 0
  const [title, setTitle] = useState(artifact.title)
  const [duration, setDuration] = useState(formatDuration(durationSeconds))
  const [newTag, setNewTag] = useState("")
  const [newItem, setNewItem] = useState("")
  const checklist = readChecklist(design)
  const done = checklist.filter((item) => item.done).length

  useEffect(() => setTitle(artifact.title), [artifact.title])
  useEffect(() => setDuration(formatDuration(durationSeconds)), [durationSeconds])

  const saveDesign = (patch: Record<string, unknown>) =>
    update.mutate({ instructionalDesign: { ...design, ...patch } })

  return (
    <>
      <PanelHeading label="Metadata" />
      <div className="flex flex-col gap-2.5">
        <LabeledField label="Title">
          <input
            className={fieldInput}
            value={title}
            readOnly={readOnly}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={() =>
              title.trim() && title !== artifact.title && update.mutate({ title: title.trim() })
            }
          />
        </LabeledField>
        <div className="flex gap-2.5">
          <LabeledField label="ID">
            <input
              className={cn(fieldInput, "font-mono text-[10px]")}
              readOnly
              value={artifact.slug}
            />
          </LabeledField>
          <LabeledField label="Duration">
            <input
              className={cn(fieldInput, "font-mono")}
              value={duration}
              readOnly={readOnly}
              onChange={(event) => setDuration(event.target.value)}
              onBlur={() => {
                const seconds = parseDuration(duration)
                if (seconds === null) setDuration(formatDuration(durationSeconds))
                else if (seconds !== durationSeconds) saveDesign({ durationSeconds: seconds })
              }}
            />
          </LabeledField>
        </div>
        <div className="flex gap-2.5">
          <LabeledField label="Owner">
            <input className={fieldInput} readOnly value={owner?.name ?? artifact.createdBy} />
          </LabeledField>
          <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
            <span className="font-mono text-[8.5px] tracking-[0.8px] text-gc-ink3">STATUS</span>
            <span className="flex h-[30px] items-center">
              <StatusLabel kind={status} />
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[8.5px] tracking-[0.8px] text-gc-ink3">TAGS</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {artifact.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex h-[22px] items-center gap-1 rounded-full border border-gc-border bg-gc-sunken px-2 font-mono text-[9px] text-gc-ink2"
              >
                <TagIcon aria-hidden className="size-2.5 text-gc-ink3" />
                {tag}
                {!readOnly && (
                  <button
                    type="button"
                    aria-label={`Remove tag ${tag}`}
                    onClick={() => update.mutate({ tags: artifact.tags.filter((t) => t !== tag) })}
                  >
                    <XIcon className="size-2.5" />
                  </button>
                )}
              </span>
            ))}
            {!readOnly && (
              <input
                aria-label="Add tag"
                placeholder="+ tag"
                value={newTag}
                onChange={(event) => setNewTag(event.target.value)}
                onKeyDown={(event) => {
                  const tag = newTag.trim().toLowerCase()
                  if (event.key !== "Enter" || !tag) return
                  event.preventDefault()
                  if (!artifact.tags.includes(tag)) update.mutate({ tags: [...artifact.tags, tag] })
                  setNewTag("")
                }}
                className="h-[22px] w-20 rounded-full border border-dashed border-gc-border bg-transparent px-2 font-mono text-[9px] text-gc-ink2 outline-none focus:border-gc-primary"
              />
            )}
          </div>
        </div>
      </div>

      <div className="h-px shrink-0 bg-gc-divider" />
      <PanelHeading label="Checklist" right={`${done} / ${checklist.length}`} />
      <div className="h-1 shrink-0 overflow-hidden rounded-sm bg-gc-sunken">
        <div
          className="h-full rounded-sm bg-gc-pass-base"
          style={{ width: checklist.length ? `${(done / checklist.length) * 100}%` : 0 }}
        />
      </div>
      <ul className="flex flex-col gap-[9px]">
        {checklist.map((item, index) => (
          <li key={item.label}>
            <label className="flex items-center gap-[9px] text-[11px]">
              <input
                type="checkbox"
                checked={item.done}
                disabled={readOnly}
                onChange={() =>
                  saveDesign({
                    checklist: checklist.map((entry, i) =>
                      i === index ? { ...entry, done: !entry.done } : entry,
                    ),
                  })
                }
                className="size-3.5 accent-gc-pass-base"
              />
              <span className={item.done ? "text-gc-ink3 line-through" : "text-gc-text"}>
                {item.label}
              </span>
            </label>
          </li>
        ))}
      </ul>
      {!readOnly && (
        <form
          className="flex items-center gap-1.5"
          onSubmit={(event) => {
            event.preventDefault()
            const label = newItem.trim()
            if (!label || checklist.some((entry) => entry.label === label)) return
            saveDesign({ checklist: [...checklist, { label, done: false }] })
            setNewItem("")
          }}
        >
          <input
            aria-label="New checklist item"
            placeholder="Add a check"
            value={newItem}
            onChange={(event) => setNewItem(event.target.value)}
            className={cn(fieldInput, "h-7")}
          />
          <button
            type="submit"
            aria-label="Add check"
            className="flex size-7 shrink-0 items-center justify-center rounded-[5px] border border-gc-border bg-gc-sunken text-gc-ink2"
          >
            <PlusIcon className="size-3" />
          </button>
        </form>
      )}
      {update.isError && <Caption className="text-gc-fail-ink">{update.error.message}</Caption>}
    </>
  )
}

type ScriptProps = { script: string; onChange: (script: string) => void; readOnly: boolean }

/** Narration text, saved with the version's autosave (and approved with it). */
export function ScriptPanel({ script, onChange, readOnly }: ScriptProps) {
  const { words, seconds } = scriptStats(script)
  return (
    <>
      <PanelHeading
        label="Narration script"
        right={`${words} words · ${formatDuration(seconds)}`}
      />
      <textarea
        aria-label="Narration script"
        readOnly={readOnly}
        value={script}
        onChange={(event) => onChange(event.target.value)}
        placeholder="What the presenter says on this artifact. Cues like [[pause 0.4s]] are not counted."
        className="h-[168px] shrink-0 resize-none rounded-md border border-gc-border bg-gc-sunken p-2.5 text-[10.5px] leading-[1.6] text-gc-ink2 outline-none focus:border-gc-primary"
      />
      <div className="h-px shrink-0 bg-gc-divider" />
      <PanelHeading label="Audio" />
      <Placeholder>Voice generation and uploaded narration arrive in a later phase.</Placeholder>
    </>
  )
}

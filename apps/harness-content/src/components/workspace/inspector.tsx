import {
  FileTextIcon,
  type LucideIcon,
  MicIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  SlidersHorizontalIcon,
  SquarePlusIcon,
  TagIcon,
  XIcon,
} from "lucide-react"
import { type ReactNode, Suspense, useEffect, useState } from "react"
import type { Schemas } from "@/api/client"
import { useUpdateArtifact, useUsers } from "@/api/queries"
import { type StatusKind, StatusLabel } from "@/components/labels"
import { AreaTabs, tabIds } from "@/components/shell/area-tabs"
import { ChecklistEditor } from "@/components/workspace/checklist"
import { friendlyError } from "@/lib/errors"
import type { ChecklistItem } from "@/lib/outline"
import { cn } from "@/lib/utils"
import { formatDuration, parseDuration, scriptStats } from "@/lib/workflow"

export type InspectorTab = "metadata" | "format" | "script" | "insert"

export type InspectorTabDef<T extends string> = { id: T; label: string; icon: LucideIcon }

export const ARTIFACT_TABS: InspectorTabDef<InspectorTab>[] = [
  { id: "metadata", label: "Metadata", icon: FileTextIcon },
  { id: "format", label: "Format", icon: SlidersHorizontalIcon },
  { id: "script", label: "Script", icon: MicIcon },
  { id: "insert", label: "Insert", icon: SquarePlusIcon },
]

type Props<T extends string> = {
  tabs: InspectorTabDef<T>[]
  tab: T
  onTab: (tab: T) => void
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
  panels: Record<T, ReactNode>
}

export function Inspector<T extends string>({
  tabs,
  tab,
  onTab,
  collapsed,
  onCollapse,
  panels,
}: Props<T>) {
  if (collapsed) {
    return (
      <aside
        aria-label="Inspector"
        className="flex w-11 shrink-0 flex-col items-center gap-1.5 border-l border-gc-border bg-gc-raised py-2.5"
      >
        <RailButton label="Expand inspector" onClick={() => onCollapse(false)} bordered>
          <PanelRightOpenIcon />
        </RailButton>
        {tabs.slice(0, 3).map((entry) => (
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
        <span className="font-mono text-label tracking-[0.5px] text-gc-ink3">INSPECTOR</span>
        <RailButton label="Collapse inspector" onClick={() => onCollapse(true)} bordered small>
          <PanelRightCloseIcon />
        </RailButton>
      </div>
      <div className="flex h-9 shrink-0 items-center border-b border-gc-border px-2">
        <AreaTabs
          label="Inspector sections"
          prefix="inspector"
          variant="pill"
          tabs={tabs.map(({ id, label }) => ({ id, label }))}
          value={tab}
          onChange={onTab}
        />
      </div>
      <div
        role="tabpanel"
        id={tabIds(tab, "inspector").panel}
        aria-labelledby={tabIds(tab, "inspector").tab}
        className="flex min-h-0 flex-1 flex-col gap-[13px] overflow-y-auto p-3 *:shrink-0"
      >
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
        small ? "size-6" : "size-[26px]",
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
      <span className="font-mono text-label tracking-[0.5px] text-gc-ink3 uppercase">{label}</span>
      {right && (
        <span className="font-mono text-label tracking-[0.5px] text-gc-ink3 uppercase">
          {right}
        </span>
      )}
    </div>
  )
}

export function Placeholder({ children }: { children: ReactNode }) {
  return <p className="text-ui leading-relaxed text-gc-ink3">{children}</p>
}

const fieldInput =
  "h-[30px] w-full rounded-[5px] border border-gc-border bg-gc-sunken px-[9px] text-ui text-gc-text outline-none read-only:text-gc-ink2 focus:border-gc-primary"

function LabeledField({ label, children }: { label: string; children: ReactNode }) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is passed in as children
    <label className="flex min-w-0 flex-1 flex-col gap-[5px]">
      <span className="font-mono text-label tracking-[0.5px] text-gc-ink3 uppercase">{label}</span>
      {children}
    </label>
  )
}

export function readChecklist(design: Record<string, unknown>): ChecklistItem[] {
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
  const checklist = readChecklist(design)

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
              className={cn(fieldInput, "font-mono text-label")}
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
            <span className="font-mono text-label tracking-[0.5px] text-gc-ink3">STATUS</span>
            <span className="flex h-[30px] items-center">
              <StatusLabel kind={status} />
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-label tracking-[0.5px] text-gc-ink3">TAGS</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {artifact.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex h-[22px] items-center gap-1 rounded-full border border-gc-border bg-gc-sunken px-2 font-mono text-label text-gc-ink2"
              >
                <TagIcon aria-hidden className="size-2.5 text-gc-ink3" />
                {tag}
                {!readOnly && (
                  <button
                    type="button"
                    className="-mr-1.5 flex size-5 items-center justify-center"
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
                className="h-[22px] w-20 rounded-full border border-dashed border-gc-border bg-transparent px-2 font-mono text-label text-gc-ink2 outline-none focus:border-gc-primary"
              />
            )}
          </div>
        </div>
      </div>

      <div className="h-px shrink-0 bg-gc-divider" />
      <ChecklistEditor
        items={checklist}
        readOnly={readOnly}
        onChange={(items) => saveDesign({ checklist: items })}
      />
      {update.isError && (
        <p role="alert" className="text-ui text-gc-fail-ink">
          {friendlyError(update.error)}
        </p>
      )}
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
        className="h-[168px] shrink-0 resize-none rounded-md border border-gc-border bg-gc-sunken p-2.5 text-label leading-[1.6] text-gc-ink2 outline-none focus:border-gc-primary"
      />
      <div className="h-px shrink-0 bg-gc-divider" />
      <PanelHeading label="Audio" />
      <Placeholder>Voice generation and uploaded narration arrive in a later phase.</Placeholder>
    </>
  )
}

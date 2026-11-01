import { Link } from "@tanstack/react-router"
import { DownloadIcon, ExternalLinkIcon, LayersIcon, RouteIcon, TagIcon } from "lucide-react"
import type { ReactNode } from "react"
import { downloadAsset, useAssets, useAssetText } from "@/api/assets"
import type { Schemas } from "@/api/client"
import { useArtifact, useLocations, useUsers } from "@/api/queries"
import { typeInfo } from "@/components/artifact-types"
import { Caption, LocaleLabel } from "@/components/labels"
import { ChecklistEditor, StringListEditor } from "@/components/workspace/checklist"
import { PanelHeading, Placeholder, readChecklist } from "@/components/workspace/inspector"
import { MarkdownPreview } from "@/components/workspace/resources"
import { friendlyError } from "@/lib/errors"
import { locationTrail } from "@/lib/library-tree"
import {
  type ContainerKey,
  findGroup,
  flattenSteps,
  groupSteps,
  type OutlineNode,
  patchRationale,
  placementOf,
  type Rationale,
  type TrailOutline,
} from "@/lib/outline"
import { type Asset, formatBytes, resourceKind, typeChip } from "@/lib/resources"
import { formatClock, stepSeconds, type TrailStep, totalSeconds } from "@/lib/trail"
import { cn } from "@/lib/utils"
import { formatDuration } from "@/lib/workflow"

/** The trail root's selection key in the navigator. */
export const TRAIL_KEY = "trail"

type Props = {
  flow: Schemas["FlowOut"]
  outline: TrailOutline
  /** {@link TRAIL_KEY}, a unit/pill key or a step key. */
  selected: string | null
  readOnly: boolean
  onSelect: (key: string) => void
  onChange: (outline: TrailOutline) => void
}

/** The trail's instructional design: an outline navigator beside the selected item's rationale. */
export function RationaleView({ flow, outline, selected, readOnly, onSelect, onChange }: Props) {
  const steps = flattenSteps(outline)
  const group = selected ? findGroup(outline, selected) : undefined
  const stepIndex = steps.findIndex((step) => step.key === selected)
  const key: ContainerKey = group?.key ?? null

  return (
    <div className="flex min-h-0 flex-1">
      <nav
        aria-label="Trail outline"
        className="w-[260px] shrink-0 overflow-y-auto border-r border-gc-border bg-gc-raised p-2"
      >
        <ul className="flex flex-col gap-0.5">
          <NavItem
            depth={0}
            selected={!group && stepIndex < 0}
            onClick={() => onSelect(TRAIL_KEY)}
            icon={<RouteIcon className="size-3" />}
            label={flow.title}
            meta={formatClock(totalSeconds(steps))}
          />
          <NavNodes
            nodes={outline.nodes}
            depth={1}
            steps={steps}
            selected={selected}
            onSelect={onSelect}
          />
        </ul>
      </nav>
      <div className="min-w-0 flex-1 overflow-y-auto bg-gc-sunken">
        <div className="mx-auto flex max-w-[640px] flex-col gap-[13px] p-5 *:shrink-0">
          {stepIndex >= 0 ? (
            <ArtifactInfo
              key={steps[stepIndex].key}
              flowId={flow.id}
              step={steps[stepIndex]}
              position={stepIndex + 1}
              placement={placementOf(outline, steps[stepIndex].key)}
            />
          ) : (
            <RationaleEditor
              kind={group ? (group.kind === "unit" ? "Unit" : "Pill") : "Trail"}
              title={group?.title ?? flow.title}
              rationale={group?.rationale ?? outline.rationale}
              steps={group ? groupSteps(group) : steps}
              readOnly={readOnly}
              onChange={(rationale) => onChange(patchRationale(outline, key, rationale))}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function NavNodes({
  nodes,
  depth,
  steps,
  selected,
  onSelect,
}: {
  nodes: OutlineNode[]
  depth: number
  steps: TrailStep[]
  selected: string | null
  onSelect: (key: string) => void
}) {
  return nodes.map((node) => {
    if (node.kind === "step") {
      const info = typeInfo(node.step.artifactType)
      return (
        <NavItem
          key={node.step.key}
          depth={depth}
          selected={selected === node.step.key}
          onClick={() => onSelect(node.step.key)}
          icon={<info.icon className="size-3" />}
          label={`${steps.indexOf(node.step) + 1}. ${node.step.label || node.step.artifactTitle}`}
          meta={formatClock(stepSeconds(node.step))}
        />
      )
    }
    return (
      <li key={node.key}>
        <ul className="flex flex-col gap-0.5">
          <NavItem
            depth={depth}
            selected={selected === node.key}
            onClick={() => onSelect(node.key)}
            icon={<LayersIcon className="size-3" />}
            label={node.title}
            tag={node.kind}
            meta={formatClock(totalSeconds(groupSteps(node)))}
          />
          <NavNodes
            nodes={node.children}
            depth={depth + 1}
            steps={steps}
            selected={selected}
            onSelect={onSelect}
          />
        </ul>
      </li>
    )
  })
}

function NavItem({
  depth,
  selected,
  onClick,
  icon,
  label,
  tag,
  meta,
}: {
  depth: number
  selected: boolean
  onClick: () => void
  icon: ReactNode
  label: string
  tag?: string
  meta: string
}) {
  return (
    <li>
      <button
        type="button"
        aria-current={selected ? "true" : undefined}
        onClick={onClick}
        style={{ paddingLeft: 8 + depth * 14 }}
        className={cn(
          "flex h-7 w-full items-center gap-1.5 rounded-md pr-2 text-left text-ui",
          selected
            ? "bg-gc-row-bg font-semibold text-gc-nav-ink"
            : "text-gc-ink2 hover:bg-gc-sunken",
        )}
      >
        <span className="shrink-0 text-gc-ink3">{icon}</span>
        {tag && (
          <span className="font-mono text-label tracking-[0.6px] text-gc-ink3 uppercase">
            {tag}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <span className="font-mono text-label text-gc-ink3">{meta}</span>
      </button>
    </li>
  )
}

const textArea =
  "min-h-16 rounded-md border border-gc-border bg-gc-raised px-2.5 py-2 text-ui leading-[1.55] text-gc-text outline-none read-only:text-gc-ink2 focus-visible:border-gc-primary"

function Divider() {
  return <div className="h-px bg-gc-divider" />
}

function RationaleEditor({
  kind,
  title,
  rationale,
  steps,
  readOnly,
  onChange,
}: {
  kind: "Trail" | "Unit" | "Pill"
  title: string
  rationale: Rationale
  steps: TrailStep[]
  readOnly: boolean
  onChange: (rationale: Rationale) => void
}) {
  const set = (patch: Partial<Rationale>) => onChange({ ...rationale, ...patch })
  return (
    <>
      <header className="flex items-end justify-between gap-4">
        <span className="flex min-w-0 flex-col gap-1">
          <span className="font-mono text-label tracking-[0.5px] text-gc-ink3 uppercase">
            {kind} rationale
          </span>
          <h2 className="truncate text-title font-semibold text-gc-text">{title}</h2>
        </span>
        <span className="flex flex-col items-end gap-1 font-mono text-label text-gc-ink3">
          <span>PLANNED {formatClock(totalSeconds(steps))}</span>
          <span>{steps.length} STEPS</span>
        </span>
      </header>
      <PanelHeading label="Summary" />
      <textarea
        aria-label="Summary"
        readOnly={readOnly}
        value={rationale.summary}
        placeholder={`Why this ${kind.toLowerCase()} exists and how it fits the trail`}
        onChange={(event) => set({ summary: event.target.value })}
        className={textArea}
      />
      <Divider />
      <StringListEditor
        label="Objectives"
        items={rationale.objectives}
        readOnly={readOnly}
        placeholder="Add objective"
        onChange={(objectives) => set({ objectives })}
      />
      <Divider />
      <StringListEditor
        label="Prerequisites"
        items={rationale.prerequisites}
        readOnly={readOnly}
        placeholder="Add prerequisite"
        onChange={(prerequisites) => set({ prerequisites })}
      />
      <Divider />
      <PanelHeading label="Assessment" />
      <textarea
        aria-label="Assessment"
        readOnly={readOnly}
        value={rationale.assessment}
        placeholder="How mastery of the objectives is checked"
        onChange={(event) => set({ assessment: event.target.value })}
        className={textArea}
      />
      <Divider />
      <ChecklistEditor
        items={rationale.checklist}
        readOnly={readOnly}
        onChange={(checklist) => set({ checklist })}
      />
    </>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="font-mono text-label tracking-[0.5px] text-gc-ink3 uppercase">{label}</dt>
      <dd className="min-w-0 text-ui text-gc-text">{children}</dd>
    </div>
  )
}

function ArtifactInfo({
  flowId,
  step,
  position,
  placement,
}: {
  flowId: string
  step: TrailStep
  position: number
  placement: ReturnType<typeof placementOf>
}) {
  const artifact = useArtifact(step.artifactId)
  const locations = useLocations().data ?? []
  const owner = useUsers().data?.find((user) => user.id === artifact.data?.createdBy)
  const assets = useAssets(step.artifactId).data ?? []
  const info = typeInfo(step.artifactType)

  if (artifact.error) return <Caption>{friendlyError(artifact.error)}</Caption>
  if (!artifact.data) return <Placeholder>Loading the artifact…</Placeholder>
  const data = artifact.data
  const design = data.instructionalDesign ?? {}
  const duration = typeof design.durationSeconds === "number" ? design.durationSeconds : 0
  const checklist = readChecklist(design)
  const notes = assets.filter((asset) => resourceKind(asset) === "note")
  const files = assets.filter((asset) => resourceKind(asset) !== "note")
  const where = [placement.unit?.title, placement.pill?.title].filter(Boolean).join(" › ")

  return (
    <>
      <header className="flex items-end justify-between gap-4">
        <span className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn("flex size-8 shrink-0 items-center justify-center rounded-md", info.chip)}
          >
            <info.icon className="size-4" />
          </span>
          <span className="flex min-w-0 flex-col gap-1">
            <span className="font-mono text-label tracking-[0.5px] text-gc-ink3 uppercase">
              Step {position} · {info.label}
              {where ? ` · ${where}` : ""}
            </span>
            <h2 className="truncate text-title font-semibold text-gc-text">
              {step.label || data.title}
            </h2>
          </span>
        </span>
        <Link
          to="/artifacts/$artifactId"
          params={{ artifactId: step.artifactId }}
          search={{ v: step.artifactVersionId ?? undefined, trail: flowId, step: position }}
          className="flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-gc-border bg-gc-raised px-[11px] text-ui text-gc-ink2 hover:text-gc-text"
        >
          <ExternalLinkIcon className="size-[11px]" />
          Open artifact
        </Link>
      </header>

      <PanelHeading label="Metadata" right={data.slug} />
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-[7px] border border-gc-border bg-gc-raised p-3">
        <Fact label="Title">{data.title}</Fact>
        <Fact label="Pinned">
          <LocaleLabel
            locale={step.locale}
            version={step.versionNumber ?? null}
            published={step.versionState === "published"}
          />
        </Fact>
        <Fact label="Location">{locationTrail(locations, data.locationId).join(" › ") || "—"}</Fact>
        <Fact label="Owner">{owner?.name ?? data.createdBy}</Fact>
        <Fact label="Planned duration">{duration ? formatDuration(duration) : "—"}</Fact>
        <Fact label="Plays for">{formatClock(stepSeconds(step))}</Fact>
        <div className="col-span-2">
          <Fact label="Description">
            {data.description || <span className="text-gc-ink3">No description</span>}
          </Fact>
        </div>
        <div className="col-span-2">
          <Fact label="Tags">
            {data.tags.length ? (
              <span className="flex flex-wrap gap-1.5">
                {data.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex h-[22px] items-center gap-1 rounded-full border border-gc-border bg-gc-sunken px-2 font-mono text-label text-gc-ink2"
                  >
                    <TagIcon aria-hidden className="size-2.5 text-gc-ink3" />
                    {tag}
                  </span>
                ))}
              </span>
            ) : (
              <span className="text-gc-ink3">No tags</span>
            )}
          </Fact>
        </div>
      </dl>
      {checklist.length > 0 && (
        <ChecklistEditor items={checklist} readOnly onChange={() => undefined} />
      )}

      <Divider />
      <PanelHeading label="Notes" right={`${notes.length + (step.presenterNote ? 1 : 0)}`} />
      {step.presenterNote && (
        <section className="rounded-[7px] border border-gc-border bg-gc-raised px-3 py-2.5">
          <span className="font-mono text-label tracking-[0.5px] text-gc-ink3 uppercase">
            Presenter note on this step
          </span>
          <p className="mt-1 text-ui whitespace-pre-wrap text-gc-ink2">{step.presenterNote}</p>
        </section>
      )}
      {notes.map((asset) => (
        <NoteCard key={asset.id} asset={asset} />
      ))}
      {notes.length === 0 && !step.presenterNote && <Placeholder>No notes.</Placeholder>}

      <Divider />
      <PanelHeading label="Resources" right={`${files.length}`} />
      {files.length === 0 ? (
        <Placeholder>No files attached to this artifact.</Placeholder>
      ) : (
        <ul className="flex flex-col gap-1">
          {files.map((asset) => (
            <li
              key={asset.id}
              className="flex h-9 items-center gap-2.5 rounded-md border border-gc-border bg-gc-raised px-2.5"
            >
              <span className="rounded-[3px] bg-gc-sunken px-[5px] py-0.5 font-mono text-label text-gc-ink2">
                {typeChip(asset)}
              </span>
              <span className="min-w-0 flex-1 truncate text-ui text-gc-text">{asset.name}</span>
              <span className="font-mono text-label text-gc-ink3">
                {formatBytes(asset.sizeBytes)}
              </span>
              <button
                type="button"
                aria-label={`Download ${asset.name}`}
                title="Download"
                onClick={() => downloadAsset(asset.id, asset.name)}
                className="text-gc-ink3 hover:text-gc-text"
              >
                <DownloadIcon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function NoteCard({ asset }: { asset: Asset }) {
  const text = useAssetText(asset.id, asset.revision).data
  return (
    <section aria-label={asset.name} className="rounded-[7px] border border-gc-border bg-gc-raised">
      <span className="block border-b border-gc-divider px-3 py-2 font-mono text-label text-gc-ink2">
        {asset.name}
      </span>
      {text === undefined ? <Placeholder>Loading…</Placeholder> : <MarkdownPreview text={text} />}
    </section>
  )
}

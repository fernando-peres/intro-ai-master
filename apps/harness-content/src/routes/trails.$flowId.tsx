import { useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import {
  EyeIcon,
  FileDownIcon,
  FileTextIcon,
  FolderPlusIcon,
  PaletteIcon,
  PlayIcon,
  PlusIcon,
  SendIcon,
  SlidersHorizontalIcon,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import type { Schemas } from "@/api/client"
import {
  fetchFlowDraft,
  flowDraftKey,
  type RevisionWithEtag,
  saveFlowSteps,
  useBehind,
  useCurrentDefaults,
  useFlowDraft,
  useRevision,
} from "@/api/flows"
import { useFlow, useMe } from "@/api/queries"
import { AreaTabs } from "@/components/shell/area-tabs"
import { DesktopOnly } from "@/components/shell/desktop-only"
import { ActionButton } from "@/components/shell/form-controls"
import { ErrorState, WorkspaceSkeleton } from "@/components/shell/page-states"
import { SaveIndicator } from "@/components/shell/save-indicator"
import { TopBarSlot } from "@/components/shell/top-bar-slots"
import { ExportDialog } from "@/components/trail/export-dialog"
import { LibraryPicker } from "@/components/trail/library-picker"
import { OutlineList } from "@/components/trail/outline-list"
import { RationaleView } from "@/components/trail/rationale"
import {
  TrailMetadataPanel,
  TrailPreviewPanel,
  TrailPublishPanel,
  TrailThemePanel,
} from "@/components/trail/trail-panels"
import { Inspector, type InspectorTabDef } from "@/components/workspace/inspector"
import { useAutosave } from "@/hooks/use-autosave"
import { COMPACT, matchesMedia } from "@/hooks/use-media-query"
import { usePageTitle } from "@/hooks/use-page-title"
import { friendlyError } from "@/lib/errors"
import {
  addStep,
  addUnit,
  type ContainerKey,
  containerOf,
  containers,
  flattenSteps,
  fromRevision,
  moveStepTo,
  patchStep,
  type TrailOutline,
  toDraftIn,
} from "@/lib/outline"
import { formatClock, type TrailStep, totalSeconds } from "@/lib/trail"
import { formatCount } from "@/lib/utils"

export const Route = createFileRoute("/trails/$flowId")({
  component: () => (
    <DesktopOnly>
      <TrailRoute />
    </DesktopOnly>
  ),
})

type TrailTab = "metadata" | "theme" | "preview" | "step" | "publish"
const TRAIL_TABS: InspectorTabDef<TrailTab>[] = [
  { id: "metadata", label: "Metadata", icon: FileTextIcon },
  { id: "theme", label: "Theme", icon: PaletteIcon },
  { id: "preview", label: "Preview", icon: EyeIcon },
  { id: "step", label: "Step", icon: SlidersHorizontalIcon },
  { id: "publish", label: "Publish", icon: SendIcon },
]
type View = "flow" | "rationale"
const VIEWS: { id: View; label: string }[] = [
  { id: "flow", label: "Flow" },
  { id: "rationale", label: "Rationale" },
]
const EDITORS = new Set(["admin", "author", "reviewer"])
const PUBLISHERS = new Set(["admin", "reviewer"])

function TrailRoute() {
  const { flowId } = Route.useParams()
  const flow = useFlow(flowId)
  const me = useMe().data
  const editor = Boolean(me && EDITORS.has(me.role))
  const draft = useFlowDraft(flowId, editor)
  const published = useRevision(flowId, me && !editor ? flow.data?.latestRevisionId : null)
  const loaded = editor ? draft.data : published.data

  const contentQuery = editor ? draft : published
  const failure = flow.error ?? contentQuery.error
  if (failure && !loaded) {
    return (
      <ErrorState
        title="Could not open this trail"
        error={failure}
        onRetry={() => {
          flow.refetch()
          if (flow.data) contentQuery.refetch()
        }}
      />
    )
  }
  if (flow.data && me && !editor && !flow.data.latestRevisionId) {
    return (
      <ErrorState
        title="Nothing to show yet"
        message="This trail has not been published. It will appear here once it is."
      />
    )
  }
  if (!flow.data || !me || !loaded) return <WorkspaceSkeleton label="Loading trail" />
  return (
    <TrailBuilder
      key={loaded.revision.id}
      flow={flow.data}
      loaded={loaded}
      editable={editor}
      canPublish={PUBLISHERS.has(me.role)}
    />
  )
}

type BuilderProps = {
  flow: Schemas["FlowOut"]
  loaded: RevisionWithEtag
  editable: boolean
  canPublish: boolean
}

function TrailBuilder({ flow, loaded, editable, canPublish }: BuilderProps) {
  usePageTitle(flow.title)
  const navigate = useNavigate()
  const client = useQueryClient()
  const [outline, setOutline] = useState<TrailOutline>(() => fromRevision(loaded.revision))
  const steps = useMemo(() => flattenSteps(outline), [outline])
  const [etag, setEtag] = useState(loaded.etag)
  const [selected, setSelected] = useState<string | null>(steps[0]?.key ?? null)
  const [tab, setTab] = useState<TrailTab>("preview")
  const [view, setView] = useState<View>("flow")
  const [collapsed, setCollapsed] = useState(() => matchesMedia(COMPACT))
  /** Where the library picker adds a step; `undefined` while it is closed. */
  const [picking, setPicking] = useState<ContainerKey | undefined>(undefined)
  const defaults = useCurrentDefaults(flow.id)
  const [exporting, setExporting] = useState(false)

  const payload = useMemo(() => toDraftIn(outline), [outline])
  const save = useCallback(
    async (value: Schemas["DraftSteps"], tag: string) => {
      const saved = await saveFlowSteps(flow.id, tag, value)
      // The draft query never refetches on its own: coming back must not restore an old copy.
      client.setQueryData(flowDraftKey(flow.id), saved)
      return saved.etag
    },
    [flow.id, client],
  )
  const autosave = useAutosave({ value: payload, etag, enabled: editable, save })
  const behind = useBehind(flow.id, loaded.revision.id)
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-read the report after each save
  useEffect(() => {
    behind.refetch()
  }, [autosave.savedAt])
  const behindKeys = useMemo(
    () =>
      new Set(
        (behind.data?.steps ?? [])
          .filter((entry) => entry.behind)
          .map((entry) => steps[entry.position - 1]?.key)
          .filter(Boolean) as string[],
      ),
    [behind.data, steps],
  )

  const position = steps.findIndex((step) => step.key === selected) + 1
  const onStep = (key: string, patch: Partial<TrailStep>) =>
    setOutline((prev) => patchStep(prev, key, patch))
  const selectedStep = steps[position - 1]

  const pinDefaults = async () => {
    try {
      await autosave.flush()
      const tag = autosave.currentEtag()
      if (!tag) return
      const result = await defaults.mutateAsync(tag)
      client.setQueryData(flowDraftKey(flow.id), result)
      setOutline(fromRevision(result.revision))
      setEtag(result.etag)
      setSelected(null)
      behind.refetch()
    } catch (error) {
      toast.error(friendlyError(error))
    }
  }

  const exportPdf = async (positions: number[]) => {
    // Opened before awaiting: browsers block a pop-up that follows the click asynchronously.
    const tab = window.open("", "_blank")
    try {
      if (editable) await autosave.flush()
      if (tab) {
        tab.location.href = `/print/${flow.id}/${loaded.revision.id}?steps=${positions.join(",")}`
      }
      setExporting(false)
    } catch (error) {
      tab?.close()
      toast.error(friendlyError(error))
    }
  }

  const beforePublish = async () => {
    if (!(await autosave.flush())) throw new Error("Save the draft before publishing")
  }

  const reload = async () => {
    const fresh = await client.fetchQuery({
      queryKey: flowDraftKey(flow.id),
      staleTime: 0,
      queryFn: () => fetchFlowDraft(flow.id),
    })
    setOutline(fromRevision(fresh.revision))
    setEtag(fresh.etag)
    setSelected(null)
  }

  const pinned = steps.filter((step) => step.artifactVersionId)
  /** Saves first, then plays what is on screen; the player leaves out unpinned steps. */
  const play = async (position: number) => {
    if (editable && !(await autosave.flush())) {
      toast.error("Save the trail before presenting it")
      return
    }
    const target = steps[position - 1]
    navigate({
      to: "/play/$flowId/$revisionId/$step",
      params: {
        flowId: flow.id,
        revisionId: loaded.revision.id,
        step: String(Math.max(pinned.indexOf(target) + 1, 1)),
      },
    })
  }
  const playPublished = flow.latestRevisionId
    ? () =>
        navigate({
          to: "/play/$flowId/$revisionId/$step",
          params: { flowId: flow.id, revisionId: flow.latestRevisionId as string, step: "1" },
        })
    : undefined

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBarSlot side="start">
        <Link to="/trails" className="shrink-0 text-ui text-gc-ink3 hover:text-gc-ink2">
          Trails
        </Link>
        <span className="text-ui text-gc-ink3">/</span>
        <h1 className="truncate text-body font-semibold text-gc-text">{flow.title}</h1>
        <span className="rounded bg-gc-nav-bg px-[7px] max-xl:hidden py-[3px] font-mono text-label tracking-[0.5px] text-gc-nav-ink uppercase">
          Trail
        </span>
        <span className="rounded border border-gc-border bg-gc-sunken px-[7px] py-[3px] font-mono text-label tracking-[0.5px] text-gc-ink2">
          {editable
            ? `REV ${(flow.latestRevision ?? 0) + 1} · DRAFT`
            : `REV ${loaded.revision.revision}`}
        </span>
      </TopBarSlot>
      <TopBarSlot side="end">
        <ActionButton disabled={steps.length === 0} onClick={() => setExporting(true)}>
          <FileDownIcon />
          Export PDF
        </ActionButton>
        {editable && playPublished && (
          <ActionButton
            onClick={playPublished}
            title={`Plays revision ${flow.latestRevision}, without draft changes`}
          >
            Published r{flow.latestRevision}
          </ActionButton>
        )}
        <ActionButton
          variant="primary"
          disabled={pinned.length === 0}
          onClick={() => play(1)}
          title={pinned.length ? "Plays the trail as it is now" : "Add a step to present the trail"}
        >
          <PlayIcon />
          Present
        </ActionButton>
        <SaveIndicator
          autosave={autosave}
          editable={editable}
          updatedAt={loaded.revision.updatedAt}
          onReload={reload}
        />
      </TopBarSlot>

      <div className="flex min-h-0 flex-1">
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-10 shrink-0 items-center justify-between gap-4 border-b border-gc-border px-4">
            <AreaTabs label="Trail areas" tabs={VIEWS} value={view} onChange={setView} />
            <div className="flex items-center gap-2">
              <span className="font-mono text-label text-gc-ink3">
                {formatCount(steps.length, "step")} · {formatClock(totalSeconds(steps))}
              </span>
              {editable && (
                <>
                  <ActionButton
                    className="h-6"
                    onClick={() => {
                      const [next, key] = addUnit(outline, "New unit")
                      setOutline(next)
                      setSelected(key)
                    }}
                  >
                    <FolderPlusIcon />
                    Add unit
                  </ActionButton>
                  <ActionButton className="h-6" onClick={() => setPicking(null)}>
                    <PlusIcon />
                    Add step
                  </ActionButton>
                </>
              )}
            </div>
          </div>
          {view === "rationale" ? (
            <div
              role="tabpanel"
              id="area-rationale"
              aria-labelledby="tab-rationale"
              className="flex min-h-0 flex-1"
            >
              <RationaleView
                flow={flow}
                outline={outline}
                selected={selected}
                readOnly={!editable}
                onSelect={setSelected}
                onChange={setOutline}
              />
            </div>
          ) : (
            <div
              role="tabpanel"
              id="area-flow"
              aria-labelledby="tab-flow"
              className="min-h-0 flex-1 overflow-y-auto bg-gc-sunken p-4"
            >
              {outline.nodes.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-ui text-gc-ink3">
                  <p>This trail has no steps yet.</p>
                  {editable && (
                    <ActionButton onClick={() => setPicking(null)}>
                      <PlusIcon />
                      Add the first step
                    </ActionButton>
                  )}
                </div>
              ) : (
                <OutlineList
                  outline={outline}
                  selected={selected}
                  behind={behindKeys}
                  readOnly={!editable}
                  onSelect={(key) => {
                    setSelected(key)
                    if (steps.some((step) => step.key === key) && tab !== "step") setTab("preview")
                  }}
                  onRationale={(key) => {
                    setSelected(key)
                    setView("rationale")
                  }}
                  onAddStep={setPicking}
                  onChange={setOutline}
                />
              )}
            </div>
          )}
        </section>

        <Inspector
          tabs={TRAIL_TABS}
          tab={tab}
          onTab={setTab}
          collapsed={collapsed}
          onCollapse={setCollapsed}
          panels={{
            metadata: <TrailMetadataPanel flow={flow} readOnly={!editable} />,
            theme: (
              <TrailThemePanel flow={flow} steps={steps} readOnly={!editable} onStep={onStep} />
            ),
            preview: (
              <TrailPreviewPanel
                section="preview"
                flow={flow}
                step={selectedStep}
                position={position}
                readOnly={!editable}
                onStep={onStep}
                onPlay={play}
              />
            ),
            step: (
              <TrailPreviewPanel
                section="settings"
                flow={flow}
                step={selectedStep}
                position={position}
                readOnly={!editable}
                onStep={onStep}
                onPlay={play}
                placement={
                  selectedStep && {
                    value: containerOf(outline, selectedStep.key),
                    options: containers(outline),
                    onChange: (container) =>
                      setOutline((prev) => moveStepTo(prev, selectedStep.key, container)),
                  }
                }
              />
            ),
            publish: (
              <>
                {editable && behind.data && behind.data.behindCount > 0 && (
                  <ActionButton disabled={defaults.isPending} onClick={pinDefaults}>
                    Use current defaults for all steps
                  </ActionButton>
                )}
                <TrailPublishPanel
                  flow={flow}
                  steps={steps}
                  report={behind.data}
                  readOnly={!editable}
                  canPublish={editable && canPublish}
                  onStep={onStep}
                  beforePublish={beforePublish}
                />
              </>
            ),
          }}
        />
      </div>

      {exporting && (
        <ExportDialog steps={steps} onExport={exportPdf} onClose={() => setExporting(false)} />
      )}
      {picking !== undefined && (
        <LibraryPicker
          locale={flow.locale}
          onClose={() => setPicking(undefined)}
          onAdd={(step) => {
            setOutline((prev) => addStep(prev, step, picking))
            setSelected(step.key)
            setTab("preview")
            client.invalidateQueries({ queryKey: ["flows"], exact: true })
          }}
        />
      )}
    </div>
  )
}

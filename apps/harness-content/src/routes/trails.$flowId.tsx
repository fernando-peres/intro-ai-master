import { useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { EyeIcon, FileTextIcon, PaletteIcon, PlayIcon, PlusIcon, SendIcon } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import type { Schemas } from "@/api/client"
import {
  type RevisionWithEtag,
  saveFlowSteps,
  useBehind,
  useCurrentDefaults,
  useFlowDraft,
  useRevision,
} from "@/api/flows"
import { useFlow, useMe } from "@/api/queries"
import { Caption } from "@/components/labels"
import { ActionButton } from "@/components/shell/form-controls"
import { TopBarSlot } from "@/components/shell/top-bar-slots"
import { LibraryPicker } from "@/components/trail/library-picker"
import { StepList } from "@/components/trail/step-list"
import {
  TrailMetadataPanel,
  TrailPreviewPanel,
  TrailPublishPanel,
  TrailThemePanel,
} from "@/components/trail/trail-panels"
import { Inspector, type InspectorTabDef } from "@/components/workspace/inspector"
import { useAutosave } from "@/hooks/use-autosave"
import { relativeTime } from "@/lib/stamps"
import { formatClock, fromServer, type TrailStep, toStepIn, totalSeconds } from "@/lib/trail"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/trails/$flowId")({ component: TrailRoute })

type TrailTab = "metadata" | "theme" | "preview" | "publish"
const TRAIL_TABS: InspectorTabDef<TrailTab>[] = [
  { id: "metadata", label: "Metadata", icon: FileTextIcon },
  { id: "theme", label: "Theme", icon: PaletteIcon },
  { id: "preview", label: "Preview", icon: EyeIcon },
  { id: "publish", label: "Publish", icon: SendIcon },
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

  if (flow.error) return <Caption className="p-10">{flow.error.message}</Caption>
  if (!flow.data || !me) return <Caption className="p-10">Loading trail…</Caption>
  if (!editor && !flow.data.latestRevisionId) {
    return <Caption className="p-10">This trail has not been published yet.</Caption>
  }
  if (!loaded) return <Caption className="p-10">Loading trail…</Caption>
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
  const navigate = useNavigate()
  const client = useQueryClient()
  const [steps, setSteps] = useState<TrailStep[]>(() => fromServer(loaded.revision.steps))
  const [etag, setEtag] = useState(loaded.etag)
  const [selected, setSelected] = useState<string | null>(steps[0]?.key ?? null)
  const [tab, setTab] = useState<TrailTab>("preview")
  const [collapsed, setCollapsed] = useState(false)
  const [picking, setPicking] = useState(false)
  const defaults = useCurrentDefaults(flow.id)

  const payload = useMemo(() => steps.map(toStepIn), [steps])
  const save = useCallback(
    (value: Schemas["StepIn"][], tag: string) => saveFlowSteps(flow.id, tag, value),
    [flow.id],
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
    setSteps((prev) => prev.map((step) => (step.key === key ? { ...step, ...patch } : step)))

  const pinDefaults = async () => {
    try {
      await autosave.flush()
      const tag = autosave.currentEtag()
      if (!tag) return
      const result = await defaults.mutateAsync(tag)
      setSteps(fromServer(result.revision.steps))
      setEtag(result.etag)
      setSelected(null)
      behind.refetch()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the pins")
    }
  }

  const beforePublish = async () => {
    await autosave.flush()
    if (autosave.status === "error" || autosave.status === "conflict") {
      throw new Error(autosave.error ?? "Save the draft before publishing")
    }
  }

  const present = flow.latestRevisionId
    ? () =>
        navigate({
          to: "/play/$flowId/$revisionId/$step",
          params: { flowId: flow.id, revisionId: flow.latestRevisionId as string, step: "1" },
        })
    : undefined

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBarSlot side="start">
        <Link to="/" className="text-xs text-gc-ink3 hover:text-gc-ink2">
          Trails
        </Link>
        <span className="text-xs text-gc-ink3">/</span>
        <h1 className="truncate text-[12.5px] font-semibold text-gc-text">{flow.title}</h1>
        <span className="rounded bg-gc-nav-bg px-[7px] py-[3px] font-mono text-[9px] tracking-[0.8px] text-gc-nav-ink uppercase">
          Trail
        </span>
        <span className="rounded border border-gc-border bg-gc-sunken px-[7px] py-[3px] font-mono text-[9px] tracking-[0.8px] text-gc-ink2">
          {editable
            ? `REV ${(flow.latestRevision ?? 0) + 1} · DRAFT`
            : `REV ${loaded.revision.revision}`}
        </span>
      </TopBarSlot>
      <TopBarSlot side="end">
        <ActionButton
          disabled={!present}
          onClick={present}
          title="Plays the latest published revision"
        >
          Preview
        </ActionButton>
        {editable && (
          <ActionButton variant="primary" onClick={() => autosave.flush()}>
            Save flow
          </ActionButton>
        )}
        <span className="flex items-center gap-[7px] pl-2 font-mono text-[9.5px] tracking-[0.6px] text-gc-ink3">
          <span
            aria-hidden
            className={cn(
              "size-1.5 rounded-full",
              autosave.status === "error" || autosave.status === "conflict"
                ? "bg-gc-fail-base"
                : autosave.status === "dirty" || autosave.status === "saving"
                  ? "bg-gc-warn-base"
                  : "bg-gc-pass-base",
            )}
          />
          <span role="status">
            {!editable
              ? "READ ONLY"
              : autosave.status === "conflict"
                ? "CHANGED ELSEWHERE — RELOAD"
                : autosave.status === "error"
                  ? "SAVE FAILED"
                  : autosave.status === "dirty" || autosave.status === "saving"
                    ? "SAVING…"
                    : autosave.savedAt
                      ? "SAVED"
                      : `SAVED ${relativeTime(loaded.revision.updatedAt).toUpperCase()}`}
          </span>
        </span>
      </TopBarSlot>

      <div className="flex min-h-0 flex-1">
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-10 shrink-0 items-center justify-between gap-4 border-b border-gc-border px-4">
            <div className="flex h-full items-center gap-1">
              <span className="flex h-full items-center border-b-2 border-gc-primary px-3 text-xs font-semibold text-gc-text">
                Flow
              </span>
              <span
                title="Notes and files arrive in a later phase"
                className="flex h-full items-center px-3 text-xs text-gc-ink3"
              >
                Resources
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[8.5px] tracking-[0.5px] text-gc-ink3">
                {steps.length} STEPS · {formatClock(totalSeconds(steps))}
              </span>
              {editable && (
                <ActionButton className="h-6" onClick={() => setPicking(true)}>
                  <PlusIcon />
                  Add step
                </ActionButton>
              )}
              <ActionButton
                variant="primary"
                className="h-6"
                disabled={!present}
                onClick={present}
                title={present ? "Play the published trail" : "Publish the trail to present it"}
              >
                <PlayIcon />
                Present
              </ActionButton>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto bg-gc-sunken p-4">
            {steps.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-[11.5px] text-gc-ink3">
                <p>This trail has no steps yet.</p>
                {editable && (
                  <ActionButton onClick={() => setPicking(true)}>
                    <PlusIcon />
                    Add the first step
                  </ActionButton>
                )}
              </div>
            ) : (
              <StepList
                steps={steps}
                selected={selected}
                behind={behindKeys}
                readOnly={!editable}
                onSelect={(key) => {
                  setSelected(key)
                  setTab("preview")
                }}
                onChange={setSteps}
              />
            )}
          </div>
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
                flow={flow}
                step={steps[position - 1]}
                position={position}
                readOnly={!editable}
                onStep={onStep}
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

      {picking && (
        <LibraryPicker
          locale={flow.locale}
          onClose={() => setPicking(false)}
          onAdd={(step) => {
            setSteps((prev) => [...prev, step])
            setSelected(step.key)
            setTab("preview")
            client.invalidateQueries({ queryKey: ["flows"], exact: true })
          }}
        />
      )}
    </div>
  )
}

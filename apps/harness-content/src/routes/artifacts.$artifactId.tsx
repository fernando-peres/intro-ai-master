import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router"
import { ArrowLeftIcon, ChevronDownIcon } from "lucide-react"
import { Fragment, Suspense, useCallback, useState } from "react"
import { toast } from "sonner"
import type { Schemas } from "@/api/client"
import {
  saveDraft,
  useArtifact,
  useArtifactVersions,
  useFlow,
  useForkDraft,
  useLocations,
  useMe,
  useReviews,
  useVersion,
  type VersionWithEtag,
} from "@/api/queries"
import { getPlugin, validateContent } from "@/artifacts"
import { typeInfo } from "@/components/artifact-types"
import { Caption, LocaleLabel, type StatusKind, StatusLabel } from "@/components/labels"
import { ActionButton } from "@/components/shell/form-controls"
import { TopBarSlot } from "@/components/shell/top-bar-slots"
import {
  ARTIFACT_TABS,
  Inspector,
  type InspectorTab,
  MetadataPanel,
  Placeholder,
  ScriptPanel,
} from "@/components/workspace/inspector"
import {
  DecideReviewDialog,
  PublishDialog,
  SubmitReviewDialog,
} from "@/components/workspace/review-dialogs"
import { type Autosave, useAutosave } from "@/hooks/use-autosave"
import { locationTrail } from "@/lib/library-tree"
import { relativeTime } from "@/lib/stamps"
import { cn } from "@/lib/utils"
import { canEditDraft, nextReviewAction, pickVersion, type ReviewAction } from "@/lib/workflow"

type WorkspaceSearch = { v?: string; trail?: string; step?: number }

export const Route = createFileRoute("/artifacts/$artifactId")({
  validateSearch: (raw: Record<string, unknown>): WorkspaceSearch => {
    const step = Number(raw.step)
    return {
      v: typeof raw.v === "string" ? raw.v : undefined,
      trail: typeof raw.trail === "string" ? raw.trail : undefined,
      step: Number.isInteger(step) && step > 0 ? step : undefined,
    }
  },
  component: ArtifactWorkspace,
})

function ArtifactWorkspace() {
  const { artifactId } = Route.useParams()
  const search = Route.useSearch()
  const artifact = useArtifact(artifactId)
  const versions = useArtifactVersions(artifactId).data ?? []
  const selected = pickVersion(versions, search.v)
  const loaded = useVersion(selected?.id)

  if (artifact.isError) {
    return (
      <p role="alert" className="p-6 text-[11.5px] text-gc-fail-ink">
        {artifact.error.message}
      </p>
    )
  }
  if (!artifact.data || !loaded.data) return null
  return (
    <VersionEditor
      key={`${loaded.data.version.id}:${loaded.data.etag}`}
      artifact={artifact.data}
      versions={versions}
      loaded={loaded.data}
      reload={() => loaded.refetch()}
    />
  )
}

type EditorProps = {
  artifact: Schemas["ArtifactOut"]
  versions: Schemas["VersionSummary"][]
  loaded: VersionWithEtag
  reload: () => void
}

type Draft = { content: unknown; script: string }
type DialogKind = "submit" | "decide" | "publish" | null

function VersionEditor({ artifact, versions, loaded, reload }: EditorProps) {
  const { version, etag } = loaded
  const search = Route.useSearch()
  const navigate = useNavigate({ from: "/artifacts/$artifactId" })
  const me = useMe().data
  const locations = useLocations().data ?? []
  const latestReview = useReviews({ versionId: version.id }).data?.[0]
  const fork = useForkDraft(artifact.id)
  const plugin = getPlugin(artifact.type)
  const validation = validateContent(plugin, version.content)

  const [draft, setDraft] = useState<Draft>(() => ({
    content: validation.ok ? validation.content : version.content,
    script: version.script,
  }))
  const [preview, setPreview] = useState(false)
  const [tab, setTab] = useState<InspectorTab>("metadata")
  const [collapsed, setCollapsed] = useState(false)
  const [dialog, setDialog] = useState<DialogKind>(null)

  const editable = canEditDraft(version, me) && validation.ok
  const save = useCallback(
    (value: Draft, tag: string) =>
      saveDraft(version.id, tag, {
        content: value.content as Schemas["VersionUpdate"]["content"],
        script: value.script,
      }),
    [version.id],
  )
  const autosave = useAutosave({ value: draft, etag, enabled: editable, save })
  const action = nextReviewAction(version, latestReview, me)
  const status: StatusKind =
    version.state === "draft" && latestReview?.status === "pending" ? "review" : version.state
  const info = typeInfo(artifact.type)
  const trail = locationTrail(locations, artifact.locationId)
  const setContent = (content: unknown) => setDraft((prev) => ({ ...prev, content }))
  const editorProps = {
    content: draft.content,
    readOnly: !editable,
    onChange: setContent,
    artifactId: artifact.id,
    locale: version.locale,
  }
  const Provider = plugin.Provider ?? Fragment

  const runAction = async () => {
    if (action.kind === "edit") {
      try {
        const created = await fork.mutateAsync(version.id)
        navigate({ search: (prev) => ({ ...prev, v: created.id }) })
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not start a draft")
      }
      return
    }
    if (action.kind === "submit") {
      await autosave.flush()
      setDialog("submit")
    }
    if (action.kind === "decide") setDialog("decide")
    if (action.kind === "publish") setDialog("publish")
  }

  return (
    <Provider>
      <div className="flex min-h-0 flex-1 flex-col">
        <TopBarSlot side="start">
          <BackButton />
          {trail.length > 0 && (
            <Link
              to="/"
              search={{ location: artifact.locationId }}
              className="truncate text-xs text-gc-ink3 hover:text-gc-ink2"
            >
              {trail.at(-1)}
            </Link>
          )}
          <span className="text-xs text-gc-ink3">/</span>
          <span className="truncate text-[12.5px] font-semibold text-gc-text">
            {artifact.title}
          </span>
          <span className="rounded bg-gc-nav-bg px-[7px] py-[3px] font-mono text-[9px] tracking-[0.8px] text-gc-nav-ink uppercase">
            {info.label}
          </span>
          <VersionSwitcher
            versions={versions}
            current={version}
            onSelect={(id) => navigate({ search: (prev) => ({ ...prev, v: id }) })}
          />
          <StatusLabel kind={status} />
        </TopBarSlot>
        <TopBarSlot side="end">
          <ActionButton aria-pressed={preview} onClick={() => setPreview(!preview)}>
            {preview ? "Back to editor" : "Preview"}
          </ActionButton>
          <ReviewActionButton action={action} busy={fork.isPending} onRun={runAction} />
          {editable && (
            <ActionButton
              variant="primary"
              onClick={() => autosave.flush()}
              disabled={autosave.status === "saving"}
            >
              Save {info.label.toLowerCase()}
            </ActionButton>
          )}
          <SaveMeta autosave={autosave} version={version} editable={editable} onReload={reload} />
        </TopBarSlot>

        {search.trail && <TrailBanner flowId={search.trail} step={search.step} />}

        <div className="flex min-h-0 flex-1">
          <section className="flex min-w-0 flex-1 flex-col">
            <div className="flex h-10 shrink-0 items-center justify-between gap-4 border-b border-gc-border px-4">
              <div className="flex h-full items-center gap-1">
                <span className="flex h-full items-center border-b-2 border-gc-primary px-3 text-xs font-semibold text-gc-text">
                  Content Design
                </span>
                <span
                  title="Notes and files arrive in a later phase"
                  className="flex h-full items-center px-3 text-xs text-gc-ink3"
                >
                  Resources
                </span>
              </div>
              {latestReview?.status === "changes_requested" && latestReview.decisionComment && (
                <span className="truncate text-[11px] text-gc-risk-ink">
                  Changes requested: {latestReview.decisionComment}
                </span>
              )}
            </div>
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3.5 bg-gc-sunken p-6">
              <Suspense fallback={<Caption>Loading editor…</Caption>}>
                {!validation.ok ? (
                  <div role="alert" className="max-w-xl text-[11.5px] text-gc-fail-ink">
                    <p className="font-semibold">
                      This content does not match the {info.label} schema:
                    </p>
                    <ul className="mt-2 list-disc pl-5">
                      {validation.issues.map((issue) => (
                        <li key={issue}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                ) : preview ? (
                  <plugin.Renderer content={draft.content} />
                ) : (
                  <plugin.Editor {...editorProps} />
                )}
              </Suspense>
              <Caption className="tracking-[0.8px]">
                Reusable artifact · {plugin.stageLabel ?? info.label} · {version.locale}{" "}
                {version.versionNumber ? `v${version.versionNumber}` : "draft"}
              </Caption>
            </div>
          </section>

          <Inspector
            tabs={ARTIFACT_TABS}
            tab={tab}
            onTab={setTab}
            collapsed={collapsed}
            onCollapse={setCollapsed}
            panels={{
              metadata: (
                <MetadataPanel
                  artifact={artifact}
                  status={status}
                  readOnly={!me || me.role === "viewer"}
                />
              ),
              format: plugin.FormatPanel ? (
                <plugin.FormatPanel {...editorProps} />
              ) : (
                <Placeholder>No format options for this artifact type yet.</Placeholder>
              ),
              script: (
                <ScriptPanel
                  script={draft.script}
                  readOnly={!editable}
                  onChange={(script) => setDraft((prev) => ({ ...prev, script }))}
                />
              ),
              insert: plugin.InsertPanel ? (
                <plugin.InsertPanel {...editorProps} />
              ) : (
                <Placeholder>No insertable blocks for this artifact type yet.</Placeholder>
              ),
            }}
          />
        </div>

        {dialog === "submit" && (
          <SubmitReviewDialog versionId={version.id} onClose={() => setDialog(null)} />
        )}
        {dialog === "decide" && action.kind === "decide" && (
          <DecideReviewDialog review={action.review} onClose={() => setDialog(null)} />
        )}
        {dialog === "publish" && (
          <PublishDialog
            versionId={version.id}
            locale={version.locale}
            onClose={() => setDialog(null)}
          />
        )}
      </div>
    </Provider>
  )
}

function BackButton() {
  const router = useRouter()
  return (
    <button
      type="button"
      aria-label="Back"
      onClick={() => router.history.back()}
      className="flex size-6 shrink-0 items-center justify-center rounded-md border border-gc-border bg-gc-sunken text-gc-ink2 hover:text-gc-text"
    >
      <ArrowLeftIcon className="size-3" />
    </button>
  )
}

/** The locale/version pill, with a native select over it grouped by locale. */
function VersionSwitcher({
  versions,
  current,
  onSelect,
}: {
  versions: Schemas["VersionSummary"][]
  current: Schemas["VersionSummary"]
  onSelect: (versionId: string) => void
}) {
  const locales = [...new Set(versions.map((version) => version.locale))]
  return (
    <span className="relative inline-flex items-center gap-1">
      <LocaleLabel
        locale={current.locale}
        version={current.versionNumber}
        published={current.state !== "draft"}
      />
      <ChevronDownIcon aria-hidden className="size-3 text-gc-ink3" />
      <select
        aria-label="Version"
        value={current.id}
        onChange={(event) => onSelect(event.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {locales.map((locale) => (
          <optgroup key={locale} label={locale.toUpperCase()}>
            {versions
              .filter((version) => version.locale === locale)
              .map((version) => (
                <option key={version.id} value={version.id}>
                  {version.versionNumber ? `v${version.versionNumber}` : "Draft"} · {version.state}
                  {version.isDefault ? " · default" : ""} · {relativeTime(version.updatedAt)}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </span>
  )
}

const ACTION_LABELS = {
  decide: "Review",
  publish: "Publish",
  edit: "Edit as new draft",
} as const

function ReviewActionButton({
  action,
  busy,
  onRun,
}: {
  action: ReviewAction
  busy: boolean
  onRun: () => void
}) {
  if (action.kind === "none") return null
  if (action.kind === "awaiting") {
    return <Caption className="px-1 tracking-[0.6px]">{action.reason}</Caption>
  }
  const label =
    action.kind === "submit"
      ? action.resubmit
        ? "Resubmit for review"
        : "Submit for review"
      : ACTION_LABELS[action.kind]
  return (
    <ActionButton onClick={onRun} disabled={busy}>
      {label}
    </ActionButton>
  )
}

function SaveMeta({
  autosave,
  version,
  editable,
  onReload,
}: {
  autosave: Autosave
  version: Schemas["VersionOut"]
  editable: boolean
  onReload: () => void
}) {
  if (autosave.status === "conflict") {
    return (
      <span className="flex items-center gap-2 pl-2 font-mono text-[9.5px] tracking-[0.6px] text-gc-fail-ink">
        CHANGED ELSEWHERE
        <ActionButton className="h-6" onClick={onReload}>
          Reload
        </ActionButton>
      </span>
    )
  }
  const { text, tone, title } = describeSave(autosave, version, editable)
  return (
    <span
      title={title}
      className="flex items-center gap-[7px] pl-2 font-mono text-[9.5px] tracking-[0.6px] text-gc-ink3"
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", tone)} />
      <span role="status">{text}</span>
    </span>
  )
}

/** Header save indicator; the tooltip carries the exact UTC stamp. */
function describeSave(autosave: Autosave, version: Schemas["VersionOut"], editable: boolean) {
  if (!editable) {
    const frozen = version.state !== "draft"
    return { text: frozen ? "READ ONLY · FROZEN" : "READ ONLY", tone: "bg-gc-ink3", title: "" }
  }
  switch (autosave.status) {
    case "dirty":
      return { text: "UNSAVED", tone: "bg-gc-warn-base", title: "" }
    case "saving":
      return { text: "SAVING…", tone: "bg-gc-warn-base", title: "" }
    case "error":
      return { text: "SAVE FAILED", tone: "bg-gc-fail-base", title: autosave.error ?? "" }
    default: {
      const at = autosave.savedAt
      return {
        text: at ? "SAVED" : `SAVED ${relativeTime(version.updatedAt).toUpperCase()}`,
        tone: "bg-gc-pass-base",
        title: at ? toStamp(at) : version.updatedAt,
      }
    }
  }
}

const toStamp = (date: Date) => date.toISOString().slice(0, 19).replace(/[T:]/g, "-")

function TrailBanner({ flowId, step }: { flowId: string; step?: number }) {
  const flow = useFlow(flowId).data
  const router = useRouter()
  if (!flow) return null
  return (
    <div className="flex h-8 shrink-0 items-center justify-between border-b border-gc-border bg-gc-row-bg px-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-[22px] items-center gap-1.5 rounded-[5px] border border-gc-border bg-gc-raised px-2 text-[11px] font-semibold text-gc-nav-ink">
          <ArrowLeftIcon className="size-3" />
          {flow.title}
        </span>
        <span className="font-mono text-[8.5px] tracking-[0.8px] text-gc-nav-ink">
          EDITING STEP {step ?? "?"} OF {flow.stepCount}
        </span>
        <span className="font-mono text-[8px] tracking-[0.4px] text-gc-ink3">
          · CHANGES AFFECT EVERY FLOW USING THIS ARTIFACT
        </span>
      </div>
      <button
        type="button"
        onClick={() => router.history.back()}
        className="h-[22px] rounded-[5px] bg-gc-primary px-2.5 text-[11px] font-semibold text-gc-on-solid"
      >
        Done
      </button>
    </div>
  )
}

import { Link } from "@tanstack/react-router"
import { ExternalLinkIcon, MaximizeIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import type { Schemas } from "@/api/client"
import { usePublishFlow, useRevisions, useUpdateFlow } from "@/api/flows"
import { useArtifactVersions, useVersion } from "@/api/queries"
import { getPlugin, validateContent } from "@/artifacts"
import { typeInfo } from "@/components/artifact-types"
import { LocaleLabel } from "@/components/labels"
import { ActionButton, Field, Select, TextInput } from "@/components/shell/form-controls"
import { StepRenderer } from "@/components/trail/themed-content"
import { PanelHeading, Placeholder } from "@/components/workspace/inspector"
import { LOCALES } from "@/lib/locales"
import type { ContainerKey } from "@/lib/outline"
import {
  formatClock,
  resolveTheme,
  stepSeconds,
  type TrailStep,
  themeLabel,
  themeSwatches,
  USE_ARTIFACT_THEME,
  useTrailThemes,
} from "@/lib/trail"
import { cn } from "@/lib/utils"

type Flow = Schemas["FlowOut"]

/** Where a step sits in the outline, and the places it can move to. */
export type Placement = {
  value: ContainerKey
  options: { key: ContainerKey; label: string }[]
  onChange: (container: ContainerKey) => void
}

export function TrailMetadataPanel({ flow, readOnly }: { flow: Flow; readOnly: boolean }) {
  const update = useUpdateFlow(flow.id)
  const revisions = useRevisions(flow.id).data ?? []
  const [title, setTitle] = useState(flow.title)
  const [description, setDescription] = useState(flow.description)
  useEffect(() => setTitle(flow.title), [flow.title])
  const save = (body: Schemas["FlowUpdate"]) =>
    update.mutate(body, { onError: (error) => toast.error(error.message) })

  return (
    <>
      <PanelHeading label="Trail" right={flow.id} />
      <Field label="Title">
        <TextInput
          disabled={readOnly}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => title.trim() && title !== flow.title && save({ title })}
        />
      </Field>
      <Field label="Description">
        <textarea
          disabled={readOnly}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          onBlur={() => description !== flow.description && save({ description })}
          className="min-h-16 rounded-md border border-gc-border bg-gc-sunken px-2.5 py-2 text-[11.5px] text-gc-text outline-none focus-visible:border-gc-primary"
        />
      </Field>
      <Field label="Locale">
        <Select
          disabled={readOnly}
          value={flow.locale}
          onChange={(event) => save({ locale: event.target.value })}
        >
          {LOCALES.map((locale) => (
            <option key={locale} value={locale}>
              {locale}
            </option>
          ))}
        </Select>
      </Field>
      <PanelHeading label="Revisions" right={`${revisions.length}`} />
      <ul className="flex flex-col gap-1">
        {revisions.map((revision) => (
          <li
            key={revision.id}
            className="flex flex-col gap-0.5 rounded-md border border-gc-border bg-gc-sunken px-2.5 py-2"
          >
            <span className="flex items-center justify-between font-mono text-[9px] text-gc-ink2">
              <span>{revision.revision ? `REV ${revision.revision}` : "DRAFT"}</span>
              <span className="text-gc-ink3">{revision.publishedAt ?? revision.updatedAt}</span>
            </span>
            {revision.changeComment && (
              <span className="text-[10.5px] text-gc-ink2">{revision.changeComment}</span>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}

function Swatches({ theme }: { theme: string | null | undefined }) {
  return (
    <span className="flex items-center gap-0.5">
      {(themeSwatches(theme) ?? ["#00000000", "#00000000", "#00000000"]).map((color, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: three fixed swatch slots
          key={i}
          className="h-[22px] w-1.5 rounded-[2px] border border-gc-border"
          style={{ background: color }}
        />
      ))}
    </span>
  )
}

type StepsProps = {
  flow: Flow
  steps: TrailStep[]
  readOnly: boolean
  onStep: (key: string, patch: Partial<TrailStep>) => void
}

export function TrailThemePanel({ flow, steps, readOnly, onStep }: StepsProps) {
  const trailThemes = useTrailThemes()
  const update = useUpdateFlow(flow.id)
  const themeable = steps.filter((step) => getPlugin(step.artifactType).contentTheme)
  const overriding = steps.filter((step) => step.themeOverride).length
  return (
    <>
      <PanelHeading label="Trail theme" />
      <div className="flex items-center gap-2.5 rounded-[7px] border border-gc-border bg-gc-sunken p-2.5">
        <Swatches theme={flow.theme} />
        <Select
          aria-label="Trail theme"
          disabled={readOnly}
          value={flow.theme ?? ""}
          onChange={(event) =>
            update.mutate(
              { theme: event.target.value || null },
              { onError: (error) => toast.error(error.message) },
            )
          }
          className="min-w-0 flex-1"
        >
          <option value="">None — artifacts keep their own</option>
          {trailThemes.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.label}
            </option>
          ))}
        </Select>
      </div>
      <Placeholder>
        Every step follows this theme unless it keeps its artifact's own theme. Documents follow the
        studio theme.
      </Placeholder>
      <PanelHeading label="Theme overrides" right={`${overriding} of ${steps.length} steps`} />
      {themeable.length === 0 && <Placeholder>No themed steps yet.</Placeholder>}
      {themeable.map((step) => (
        <ThemeOverrideRow
          key={step.key}
          step={step}
          position={steps.indexOf(step) + 1}
          readOnly={readOnly}
          onChange={(themeOverride) => onStep(step.key, { themeOverride })}
        />
      ))}
      <Placeholder>
        In the artifact editor a step previews with its own theme. The trail only decides what plays
        in this flow.
      </Placeholder>
    </>
  )
}

function ThemeOverrideRow({
  step,
  position,
  readOnly,
  onChange,
}: {
  step: TrailStep
  position: number
  readOnly: boolean
  onChange: (override: string | null) => void
}) {
  const version = useVersion(step.artifactVersionId ?? undefined).data?.version
  const plugin = getPlugin(step.artifactType)
  const valid = version && validateContent(plugin, version.content)
  const own = valid?.ok ? plugin.contentTheme?.(valid.content) : undefined
  const keeps = step.themeOverride === USE_ARTIFACT_THEME
  return (
    <div className="flex flex-col gap-2 rounded-[7px] border border-gc-border bg-gc-sunken p-2.5">
      <span className="flex items-center justify-between">
        <span className="truncate text-[11px] font-semibold text-gc-text">
          {position}. {step.label || step.artifactTitle}
        </span>
        <span className="font-mono text-[8px] tracking-[0.4px] text-gc-ink3 uppercase">
          Artifact theme · {themeLabel(own)}
        </span>
      </span>
      <span className="grid grid-cols-2 gap-1 rounded-md border border-gc-border bg-gc-raised p-0.5">
        {(
          [
            [null, "Follow trail"],
            [USE_ARTIFACT_THEME, "Use artifact"],
          ] as const
        ).map(([value, label]) => {
          const active = value === null ? !keeps : keeps
          return (
            <button
              key={label}
              type="button"
              aria-pressed={active}
              aria-label={`Step ${position}: ${label}`}
              disabled={readOnly}
              onClick={() => onChange(value)}
              className={cn(
                "h-6 rounded-[5px] text-[10.5px]",
                active ? "bg-gc-row-bg font-semibold text-gc-nav-ink" : "text-gc-ink3",
              )}
            >
              {label}
            </button>
          )
        })}
      </span>
    </div>
  )
}

export function TrailPreviewPanel({
  flow,
  step,
  position,
  readOnly,
  onStep,
  placement,
}: {
  flow: Flow
  step: TrailStep | undefined
  position: number
  readOnly: boolean
  onStep: (key: string, patch: Partial<TrailStep>) => void
  placement?: Placement
}) {
  if (!step) return <Placeholder>Select a step to preview it and change its settings.</Placeholder>
  return (
    <StepSettings
      key={step.key}
      flow={flow}
      step={step}
      position={position}
      readOnly={readOnly}
      onStep={onStep}
      placement={placement}
    />
  )
}

function StepSettings({
  flow,
  step,
  position,
  readOnly,
  onStep,
  placement,
}: {
  flow: Flow
  step: TrailStep
  position: number
  readOnly: boolean
  onStep: (key: string, patch: Partial<TrailStep>) => void
  placement?: Placement
}) {
  const trailThemes = useTrailThemes()
  const version = useVersion(step.artifactVersionId ?? undefined).data?.version
  const versions = (useArtifactVersions(step.artifactId).data ?? []).filter(
    (entry) => entry.state === "published" && entry.locale === step.locale,
  )

  const info = typeInfo(step.artifactType)
  const own = (() => {
    const plugin = getPlugin(step.artifactType)
    const valid = version && validateContent(plugin, version.content)
    return valid?.ok ? plugin.contentTheme?.(valid.content) : undefined
  })()
  const resolved = resolveTheme(step.themeOverride, flow.theme, own)
  const set = (patch: Partial<TrailStep>) => onStep(step.key, patch)

  return (
    <>
      <PanelHeading label="Preview" right={`Step ${position} · ${info.label}`} />
      <div className="aspect-video w-full overflow-hidden rounded-md border border-gc-border bg-[#08080B]">
        {version ? (
          <StepRenderer
            type={step.artifactType}
            content={version.content}
            override={step.themeOverride}
            trailTheme={flow.theme}
          />
        ) : (
          <Placeholder>Loading the pinned version…</Placeholder>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-[11.5px] font-semibold text-gc-text">
            {step.label || step.artifactTitle}
          </span>
          <span className="font-mono text-[8px] tracking-[0.4px] text-gc-ink3 uppercase">
            {info.label} · {formatClock(stepSeconds(step))}
          </span>
        </span>
        <LocaleLabel
          locale={step.locale}
          version={step.versionNumber ?? null}
          published={step.versionState === "published"}
        />
      </div>
      <div className="flex gap-[7px]">
        <Link
          to="/artifacts/$artifactId"
          params={{ artifactId: step.artifactId }}
          search={{ v: step.artifactVersionId ?? undefined, trail: flow.id, step: position }}
          className="flex h-[30px] flex-1 items-center justify-center gap-1.5 rounded-md border border-gc-border bg-gc-sunken text-[11px] text-gc-ink2 hover:text-gc-text"
        >
          <ExternalLinkIcon className="size-[11px]" />
          Edit artifact
        </Link>
        {flow.latestRevisionId ? (
          <Link
            to="/play/$flowId/$revisionId/$step"
            params={{
              flowId: flow.id,
              revisionId: flow.latestRevisionId,
              step: String(position),
            }}
            aria-label="Play from this step"
            title="Play the published trail from this step"
            className="flex size-[30px] items-center justify-center rounded-md border border-gc-border bg-gc-sunken text-gc-ink2 hover:text-gc-text"
          >
            <MaximizeIcon className="size-3" />
          </Link>
        ) : null}
      </div>
      <div className="h-px bg-gc-divider" />
      <PanelHeading label="Step settings" />
      {placement && (
        <Field label="Placement">
          <Select
            disabled={readOnly}
            value={placement.value ?? ""}
            onChange={(event) => placement.onChange(event.target.value || null)}
          >
            {placement.options.map((option) => (
              <option key={option.key ?? ""} value={option.key ?? ""}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field label="Pinned version">
        <Select
          disabled={readOnly}
          value={step.artifactVersionId ?? ""}
          onChange={(event) => {
            const picked = versions.find((entry) => entry.id === event.target.value)
            if (picked) {
              set({
                artifactVersionId: picked.id,
                versionNumber: picked.versionNumber,
                versionState: picked.state,
              })
            }
          }}
        >
          {versions.map((entry) => (
            <option key={entry.id} value={entry.id}>
              v{entry.versionNumber}
              {entry.isDefault ? " · default" : ""}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Label">
        <TextInput
          disabled={readOnly}
          value={step.label ?? ""}
          placeholder={step.artifactTitle}
          onChange={(event) => set({ label: event.target.value || null })}
        />
      </Field>
      <div className="grid grid-cols-[1fr_88px] items-end gap-2">
        <Field label="Advance on">
          <Select
            disabled={readOnly}
            value={step.advanceSeconds ? "timer" : "manual"}
            onChange={(event) =>
              set({
                advanceSeconds:
                  event.target.value === "timer" ? (step.durationSeconds ?? 30) : null,
              })
            }
          >
            <option value="manual">Manual (next button)</option>
            <option value="timer">After a duration</option>
          </Select>
        </Field>
        <Field label="Seconds">
          <TextInput
            type="number"
            min={1}
            aria-label="Advance after seconds"
            disabled={readOnly || !step.advanceSeconds}
            value={step.advanceSeconds ?? ""}
            onChange={(event) => {
              const seconds = Math.round(Number(event.target.value))
              if (seconds >= 1) set({ advanceSeconds: seconds })
            }}
          />
        </Field>
      </div>
      <Field label="Presenter note">
        <textarea
          disabled={readOnly}
          value={step.presenterNote ?? ""}
          onChange={(event) => set({ presenterNote: event.target.value || null })}
          className="min-h-14 rounded-md border border-gc-border bg-gc-sunken px-2.5 py-2 text-[11.5px] text-gc-text outline-none focus-visible:border-gc-primary"
        />
      </Field>
      <Field label="Theme">
        <Select
          disabled={readOnly || !getPlugin(step.artifactType).contentTheme}
          value={step.themeOverride ?? ""}
          onChange={(event) => set({ themeOverride: event.target.value || null })}
        >
          <option value="">Follow trail theme</option>
          <option value={USE_ARTIFACT_THEME}>Keep the artifact's theme</option>
          {trailThemes.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.label}
            </option>
          ))}
        </Select>
      </Field>
      <div className="flex h-14 items-center gap-2.5 rounded-[7px] border border-gc-border bg-gc-sunken px-[11px]">
        <Swatches theme={resolved.theme} />
        <span className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-gc-text">
            {resolved.source === "trail"
              ? "Follows trail theme"
              : resolved.source === "step"
                ? "Theme set on this step"
                : "Keeps the artifact's theme"}
          </span>
          <span className="font-mono text-[8px] tracking-[0.4px] text-gc-ink3 uppercase">
            {themeLabel(resolved.theme)} ·{" "}
            {resolved.source === "trail" ? "inherited" : resolved.source}
          </span>
        </span>
      </div>
    </>
  )
}

export function TrailPublishPanel({
  flow,
  steps,
  report,
  readOnly,
  canPublish,
  onStep,
  beforePublish,
}: StepsProps & {
  report: Schemas["BehindReport"] | undefined
  canPublish: boolean
  /** Flushes pending edits; publishing reads the server copy of the draft. */
  beforePublish: () => Promise<void>
}) {
  const publish = usePublishFlow(flow.id)
  const [comment, setComment] = useState("")

  const next = (flow.latestRevision ?? 0) + 1
  const run = async () => {
    try {
      await beforePublish()
      const published = await publish.mutateAsync(comment)
      setComment("")
      toast.success(`Published revision ${published.revision}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not publish the trail")
    }
  }

  return (
    <>
      <PanelHeading
        label="Flow revision"
        right={flow.latestRevision ? `live: rev ${flow.latestRevision}` : "never published"}
      />
      <div className="flex items-center gap-2.5 rounded-[7px] border border-gc-border bg-gc-sunken px-[11px] py-2.5">
        <span className="flex size-8 items-center justify-center rounded-md bg-gc-nav-bg font-mono text-[13px] font-bold text-gc-nav-ink">
          {next}
        </span>
        <span className="flex flex-col gap-1">
          <span className="text-[11.5px] font-semibold text-gc-text">Revision {next} · draft</span>
          <span className="font-mono text-[8px] tracking-[0.4px] text-gc-ink3 uppercase">
            {steps.length} steps pinned
          </span>
        </span>
      </div>
      <PanelHeading
        label="Pinned references"
        right={report ? `${report.behindCount} behind` : "…"}
      />
      <ul className="flex flex-col gap-1">
        {report?.steps.map((entry) => {
          const step = steps[entry.position - 1]
          return (
            <li
              key={entry.stepId}
              className="flex h-9 items-center justify-between gap-2 rounded-md border border-gc-border bg-gc-sunken px-2.5"
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[11px] text-gc-text">
                  {entry.position}. {entry.artifactTitle}
                </span>
                <span className="font-mono text-[8px] text-gc-ink3">
                  {entry.locale} · pinned v{entry.pinnedNumber ?? "?"}
                  {entry.behind ? ` → v${entry.defaultNumber} available` : ""}
                </span>
              </span>
              {entry.behind && step && entry.defaultVersionId ? (
                <ActionButton
                  disabled={readOnly}
                  aria-label={`Update step ${entry.position} to v${entry.defaultNumber}`}
                  onClick={() =>
                    onStep(step.key, {
                      artifactVersionId: entry.defaultVersionId,
                      versionNumber: entry.defaultNumber,
                      versionState: "published",
                    })
                  }
                >
                  Update
                </ActionButton>
              ) : (
                <span className="font-mono text-[8px] tracking-[0.5px] text-gc-pass-ink">
                  LATEST
                </span>
              )}
            </li>
          )
        })}
      </ul>
      <Field label="Change comment">
        <textarea
          aria-label="Change comment"
          disabled={!canPublish}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="What changed in this revision?"
          className="min-h-14 rounded-md border border-gc-border bg-gc-sunken px-2.5 py-2 text-[11.5px] text-gc-text outline-none focus-visible:border-gc-primary"
        />
      </Field>
      <ActionButton
        variant="primary"
        className="justify-center"
        disabled={!canPublish || !comment.trim() || publish.isPending || steps.length === 0}
        onClick={run}
      >
        {flow.latestRevision ? "Republish trail" : "Publish trail"}
      </ActionButton>
      <Placeholder>
        {canPublish
          ? `Publishing freezes these pins as revision ${next}.${flow.latestRevision ? ` Revision ${flow.latestRevision} stays playable at its own link.` : ""}`
          : "Only reviewers and admins can publish trails."}
      </Placeholder>
    </>
  )
}

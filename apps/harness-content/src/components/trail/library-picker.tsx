import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Link } from "@tanstack/react-router"
import { SearchIcon } from "lucide-react"
import { useEffect, useState } from "react"
import type { ArtifactListItem, ArtifactType } from "@/api/client"
import {
  useArtifact,
  useArtifactSearch,
  useArtifactVersions,
  useTags,
  useVersion,
} from "@/api/queries"
import { ArtifactMetadata } from "@/components/artifact-metadata"
import { ARTIFACT_TYPES, typeInfo } from "@/components/artifact-types"
import { FilterPill } from "@/components/search/filter-pill"
import { ActionButton, Field, Select, TextInput } from "@/components/shell/form-controls"
import { StepRenderer } from "@/components/trail/themed-content"
import { newStep, type TrailStep } from "@/lib/trail"
import { cn } from "@/lib/utils"

const RESULT_LIMIT = 50

type Props = {
  /** The trail's locale, preselected when the artifact has a published version in it. */
  locale: string
  onAdd: (step: TrailStep) => void
  onClose: () => void
}

/** Finds a published artifact and pins one of its published versions as a new step. */
export function LibraryPicker({ locale, onAdd, onClose }: Props) {
  const [query, setQuery] = useState("")
  const [picked, setPicked] = useState<ArtifactListItem | null>(null)
  const [pinnedId, setPinnedId] = useState<string | undefined>(undefined)
  const [type, setType] = useState<ArtifactType | undefined>(undefined)
  const [tags, setTags] = useState<string[]>([])
  const allTags = useTags().data ?? []
  const search = useArtifactSearch({
    query: query || undefined,
    type,
    tag: tags.length > 0 ? tags : undefined,
    limit: RESULT_LIMIT,
  }).data
  const results = search?.items ?? []
  const toggleTag = (tag: string) =>
    setTags((current) =>
      current.includes(tag) ? current.filter((entry) => entry !== tag) : [...current, tag],
    )

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-[#06060ACC]" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 flex h-[80vh] w-[960px] max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[10px] border border-gc-border bg-gc-raised outline-none">
          <div className="border-b border-gc-border px-[18px] py-4">
            <DialogPrimitive.Title className="text-title font-bold text-gc-text">
              Add step
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-[3px] text-ui text-gc-ink3">
              Only artifacts with a published version can be added; others are listed greyed out.
            </DialogPrimitive.Description>
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-2">
            <div className="flex min-h-0 flex-col gap-3 border-r border-gc-border p-[18px]">
              <label className="flex h-[30px] items-center gap-2 rounded-md border border-gc-border bg-gc-sunken px-2.5">
                <SearchIcon className="size-3 text-gc-ink3" />
                <input
                  aria-label="Search artifacts"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by title, tag or description"
                  className="min-w-0 flex-1 bg-transparent text-ui text-gc-text outline-none placeholder:text-gc-ink3"
                />
              </label>
              <div className="flex items-center justify-between gap-2">
                <FilterPill
                  label="Type"
                  value={type}
                  options={ARTIFACT_TYPES.map((entry) => ({
                    value: entry.type,
                    label: entry.label,
                  }))}
                  onChange={(value) => setType(value as ArtifactType | undefined)}
                />
                {search && search.total > results.length && (
                  <span className="text-label text-gc-ink3">
                    Showing {results.length} of {search.total}
                  </span>
                )}
              </div>
              {allTags.length > 0 && (
                <ul
                  aria-label="Filter by tag"
                  className="flex max-h-16 flex-wrap gap-1 overflow-y-auto"
                >
                  {allTags.map(({ tag }) => (
                    <li key={tag}>
                      <button
                        type="button"
                        aria-pressed={tags.includes(tag)}
                        onClick={() => toggleTag(tag)}
                        className={cn(
                          "rounded border border-gc-border px-1.5 py-0.5 font-mono text-label",
                          tags.includes(tag)
                            ? "bg-gc-nav-bg text-gc-nav-ink"
                            : "bg-gc-sunken text-gc-ink2",
                        )}
                      >
                        {tag}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <ul aria-label="Artifacts" className="flex min-h-24 flex-col gap-px overflow-y-auto">
                {results.length === 0 && (
                  <li className="px-2 py-3 text-ui text-gc-ink3">No artifacts match.</li>
                )}
                {results.map((item) => {
                  const info = typeInfo(item.type)
                  if (Object.keys(item.defaults).length === 0) {
                    return (
                      <li
                        key={item.id}
                        className="flex h-8 items-center gap-2 rounded-md px-2 opacity-60"
                      >
                        <info.icon className={cn("size-3 shrink-0", info.ink)} />
                        <span className="min-w-0 flex-1 truncate text-ui text-gc-ink2">
                          {item.title}
                        </span>
                        <Link
                          to="/artifacts/$artifactId"
                          params={{ artifactId: item.id }}
                          className="font-mono text-label text-gc-ink2 uppercase underline"
                        >
                          {item.status} · open
                        </Link>
                      </li>
                    )
                  }
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        aria-pressed={picked?.id === item.id}
                        onClick={() => setPicked(item)}
                        className={cn(
                          "flex h-8 w-full items-center gap-2 rounded-md px-2 text-left",
                          picked?.id === item.id ? "bg-gc-row-bg" : "hover:bg-gc-sunken",
                        )}
                      >
                        <info.icon className={cn("size-3 shrink-0", info.ink)} />
                        <span className="min-w-0 flex-1 truncate text-ui text-gc-text">
                          {item.title}
                        </span>
                        {item.tags.length > 0 && (
                          <span className="max-w-[35%] truncate text-label text-gc-ink3">
                            {item.tags.join(", ")}
                          </span>
                        )}
                        <span className="font-mono text-label text-gc-ink3 uppercase">
                          {Object.keys(item.defaults).join(" · ")}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              {picked && (
                <PinPicker
                  key={picked.id}
                  artifact={picked}
                  locale={locale}
                  onPinned={setPinnedId}
                  onAdd={(step) => {
                    onAdd(step)
                    onClose()
                  }}
                />
              )}
            </div>
            <div className="min-h-0 overflow-y-auto p-[18px]">
              {picked ? (
                <ArtifactPreview artifactId={picked.id} versionId={pinnedId} />
              ) : (
                <p className="text-ui text-gc-ink3">Select an artifact to preview it.</p>
              )}
            </div>
          </div>
          {!picked && (
            <div className="flex justify-end border-t border-gc-border bg-gc-sunken px-[18px] py-[13px]">
              <ActionButton onClick={onClose}>Cancel</ActionButton>
            </div>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/** The pinned version as it will play, above the artifact's metadata. */
function ArtifactPreview({
  artifactId,
  versionId,
}: {
  artifactId: string
  versionId: string | undefined
}) {
  const artifact = useArtifact(artifactId).data
  const version = useVersion(versionId).data?.version
  return (
    <div className="flex flex-col gap-3" data-testid="step-preview">
      <div className="aspect-video w-full shrink-0 overflow-auto rounded-md border border-gc-border bg-gc-sunken">
        {artifact && version && version.id === versionId && (
          <StepRenderer
            type={artifact.type}
            content={version.content}
            override={null}
            trailTheme={null}
            showControls={false}
          />
        )}
      </div>
      {artifact && <ArtifactMetadata artifact={artifact} />}
    </div>
  )
}

function PinPicker({
  artifact,
  locale,
  onPinned,
  onAdd,
}: {
  artifact: ArtifactListItem
  locale: string
  onPinned: (versionId: string | undefined) => void
  onAdd: (step: TrailStep) => void
}) {
  const locales = Object.keys(artifact.defaults)
  const [chosenLocale, setLocale] = useState(locales.includes(locale) ? locale : locales[0])
  const versions = (useArtifactVersions(artifact.id).data ?? []).filter(
    (version) => version.state === "published" && version.locale === chosenLocale,
  )
  const [versionId, setVersionId] = useState<string | null>(null)
  const [label, setLabel] = useState("")
  const pinned = versionId ?? artifact.defaults[chosenLocale]
  const version = versions.find((entry) => entry.id === pinned)
  const planned = artifact.instructionalDesign?.durationSeconds
  useEffect(() => onPinned(pinned), [pinned, onPinned])

  return (
    <div className="flex flex-col gap-3 border-t border-gc-divider pt-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Locale">
          <Select
            value={chosenLocale}
            onChange={(event) => {
              setLocale(event.target.value)
              setVersionId(null)
            }}
          >
            {locales.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Pinned version">
          <Select value={pinned} onChange={(event) => setVersionId(event.target.value)}>
            {versions.map((entry) => (
              <option key={entry.id} value={entry.id}>
                v{entry.versionNumber}
                {entry.isDefault ? " · default" : ""}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Step label (optional)">
        <TextInput
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder={artifact.title}
        />
      </Field>
      <div className="flex justify-end">
        <ActionButton
          variant="primary"
          disabled={!version}
          onClick={() => {
            if (!version) return
            onAdd(
              newStep({
                artifactId: artifact.id,
                artifactTitle: artifact.title,
                artifactType: artifact.type,
                locale: chosenLocale,
                artifactVersionId: version.id,
                versionNumber: version.versionNumber,
                versionState: version.state,
                durationSeconds: typeof planned === "number" ? planned : null,
                label: label.trim() || null,
              }),
            )
          }}
        >
          Add to trail
        </ActionButton>
      </div>
    </div>
  )
}

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { SearchIcon } from "lucide-react"
import { useState } from "react"
import type { ArtifactListItem } from "@/api/client"
import { useArtifactSearch, useArtifactVersions } from "@/api/queries"
import { typeInfo } from "@/components/artifact-types"
import { ActionButton, Field, Select, TextInput } from "@/components/shell/form-controls"
import { newStep, type TrailStep } from "@/lib/trail"
import { cn } from "@/lib/utils"

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
  const results = useArtifactSearch({ query: query || undefined, limit: 30 }).data?.items ?? []
  const playable = results.filter((item) => Object.keys(item.defaults).length > 0)

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-[#06060ACC]" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 flex max-h-[80vh] w-[520px] max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[10px] border border-gc-border bg-gc-raised outline-none">
          <div className="border-b border-gc-border px-[18px] py-4">
            <DialogPrimitive.Title className="text-[15px] font-bold text-gc-text">
              Add step
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-[3px] text-[11.5px] text-gc-ink3">
              Only artifacts with a published version can join a trail.
            </DialogPrimitive.Description>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-[18px]">
            <label className="flex h-[30px] items-center gap-2 rounded-md border border-gc-border bg-gc-sunken px-2.5">
              <SearchIcon className="size-3 text-gc-ink3" />
              <input
                aria-label="Search artifacts"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by title, tag or description"
                className="min-w-0 flex-1 bg-transparent text-[11.5px] text-gc-text outline-none placeholder:text-gc-ink3"
              />
            </label>
            <ul aria-label="Artifacts" className="flex min-h-24 flex-col gap-px overflow-y-auto">
              {playable.length === 0 && (
                <li className="px-2 py-3 text-[11px] text-gc-ink3">
                  No published artifacts match.
                </li>
              )}
              {playable.map((item) => {
                const info = typeInfo(item.type)
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
                      <span className="min-w-0 flex-1 truncate text-[11.5px] text-gc-text">
                        {item.title}
                      </span>
                      <span className="font-mono text-[8.5px] text-gc-ink3 uppercase">
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
                onAdd={(step) => {
                  onAdd(step)
                  onClose()
                }}
              />
            )}
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

function PinPicker({
  artifact,
  locale,
  onAdd,
}: {
  artifact: ArtifactListItem
  locale: string
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

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { useNavigate } from "@tanstack/react-router"
import { XIcon } from "lucide-react"
import { type FormEvent, useState } from "react"
import { toast } from "sonner"
import type { ArtifactType } from "@/api/client"
import { useCreateArtifact, useImportArtifact, useLocations, useTemplates } from "@/api/queries"
import { getPlugin } from "@/artifacts"
import { ARTIFACT_TYPES } from "@/components/artifact-types"
import { Caption } from "@/components/labels"
import { ActionButton, Field, Select, TextInput } from "@/components/shell/form-controls"
import { type ImportIssue, issuesOf, readImport } from "@/lib/import"
import { locationTrail } from "@/lib/library-tree"
import { LOCALES } from "@/lib/locales"
import { cn } from "@/lib/utils"

type Props = { initialLocationId?: string; onClose: () => void }

export function NewArtifactDialog({ initialLocationId, onClose }: Props) {
  const locations = useLocations().data ?? []
  const create = useCreateArtifact()
  const templates = useTemplates().data ?? []
  const [templateId, setTemplateId] = useState("")
  const importArtifact = useImportArtifact()
  const navigate = useNavigate()
  const [mode, setMode] = useState<"empty" | "import">("empty")
  const [json, setJson] = useState("")
  const [issues, setIssues] = useState<ImportIssue[]>([])
  const [type, setType] = useState<ArtifactType>("slide")
  const [title, setTitle] = useState("")
  const [locale, setLocale] = useState("en")
  const [locationId, setLocationId] = useState(initialLocationId ?? "")
  const trail = locationTrail(locations, locationId || undefined)
  const typeLabel = ARTIFACT_TYPES.find((entry) => entry.type === type)?.label ?? type

  const read = json.trim() ? readImport(json) : null
  const open = (artifactId: string) => {
    onClose()
    navigate({ to: "/artifacts/$artifactId", params: { artifactId } })
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (mode === "import") {
      if (!read?.ok) {
        setIssues(read?.issues ?? [{ path: "", message: "Paste or load the JSON first" }])
        return
      }
      try {
        const body = { title: title || read.title || "", locale, locationId, content: read.content }
        open((await importArtifact.mutateAsync(body)).artifact.id)
      } catch (error) {
        setIssues(issuesOf(error))
      }
      return
    }
    try {
      const start =
        type === "slide" && templateId
          ? { templateId }
          : { content: getPlugin(type).createEmpty() as Record<string, unknown> }
      open((await create.mutateAsync({ type, title, locale, locationId, ...start })).artifact.id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the artifact")
    }
  }

  const loadFile = async (file: File | undefined) => {
    if (!file) return
    setJson(await file.text())
    setIssues([])
  }

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-[#06060ACC]" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 w-[640px] max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[10px] border border-gc-border bg-gc-raised outline-none">
          <form onSubmit={submit}>
            <div className="flex items-center justify-between border-b border-gc-border px-[18px] py-4">
              <div className="flex flex-col gap-[3px]">
                <DialogPrimitive.Title className="text-[15px] font-bold text-gc-text">
                  New reusable artifact
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-[11.5px] text-gc-ink3">
                  {trail.length
                    ? `Choose what to create in ${trail.join(" › ")}.`
                    : "Choose what to create and where it lives."}
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close
                aria-label="Close"
                className="flex size-[26px] items-center justify-center rounded-md border border-gc-border bg-gc-sunken text-gc-ink2"
              >
                <XIcon className="size-3" />
              </DialogPrimitive.Close>
            </div>

            <div className="flex flex-col gap-3 p-[18px]">
              <div
                role="tablist"
                aria-label="How to start"
                className="grid w-[260px] grid-cols-2 gap-1 rounded-md border border-gc-border bg-gc-sunken p-0.5"
              >
                {(
                  [
                    ["empty", "Start empty"],
                    ["import", "Import JSON"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={mode === value}
                    onClick={() => {
                      setMode(value)
                      setIssues([])
                    }}
                    className={cn(
                      "h-6 rounded-[5px] text-[11px]",
                      mode === value
                        ? "bg-gc-row-bg font-semibold text-gc-nav-ink"
                        : "text-gc-ink3 hover:text-gc-ink2",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {mode === "import" ? (
                <ImportField
                  json={json}
                  detected={read?.ok ? read.type : null}
                  issues={issues}
                  onJson={(next) => {
                    setJson(next)
                    setIssues([])
                  }}
                  onFile={loadFile}
                />
              ) : (
                <>
                  <Caption aria-hidden className="text-[9px]">
                    Artifact type
                  </Caption>
                  <fieldset className="grid grid-cols-3 gap-2.5">
                    <legend className="sr-only">Artifact type</legend>
                    {ARTIFACT_TYPES.map((entry) => {
                      const available = entry.type !== null
                      return (
                        <label
                          key={entry.label}
                          title={available ? undefined : "Coming later"}
                          className={cn(
                            "flex flex-col items-start gap-[9px] rounded-lg border border-gc-border bg-gc-sunken p-[13px] has-checked:border-gc-primary has-checked:bg-gc-row-bg has-focus-visible:ring-2 has-focus-visible:ring-gc-primary/50",
                            available ? "cursor-pointer" : "cursor-not-allowed opacity-45",
                          )}
                        >
                          <input
                            type="radio"
                            name="artifact-type"
                            value={entry.type ?? ""}
                            checked={entry.type === type}
                            disabled={!available}
                            onChange={() => entry.type && setType(entry.type)}
                            className="sr-only"
                          />
                          <span
                            className={cn(
                              "flex size-7 items-center justify-center rounded-[7px]",
                              entry.chip,
                            )}
                          >
                            <entry.icon aria-hidden className="size-3.5" />
                          </span>
                          <span className="text-[12.5px] font-semibold text-gc-text">
                            {entry.label}
                          </span>
                          <span className="text-[10.5px] leading-[1.45] text-gc-ink3">
                            {available ? entry.description : `${entry.description} Coming later.`}
                          </span>
                        </label>
                      )
                    })}
                  </fieldset>
                  {type === "slide" && templates.length > 0 && (
                    <Field label="Start from template">
                      <Select
                        value={templateId}
                        onChange={(event) => setTemplateId(event.target.value)}
                      >
                        <option value="">Empty slide</option>
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  )}
                </>
              )}

              <div className="grid grid-cols-[1fr_1fr_120px] gap-2.5 pt-1">
                <Field label="Title">
                  <TextInput
                    required={mode === "empty" || !read?.ok || !read.title}
                    autoFocus
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={(read?.ok && read.title) || "How the Harness Evaluates"}
                  />
                </Field>
                <Field label="Location">
                  <Select
                    required
                    value={locationId}
                    onChange={(event) => setLocationId(event.target.value)}
                  >
                    <option value="" disabled>
                      Choose a box, unit or section
                    </option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {locationTrail(locations, location.id).join(" › ")}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Locale">
                  <Select value={locale} onChange={(event) => setLocale(event.target.value)}>
                    {LOCALES.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gc-border bg-gc-sunken px-[18px] py-[13px]">
              <span className="font-mono text-[9px] tracking-[0.8px] text-gc-ink3">
                ESC TO CANCEL
              </span>
              <div className="flex items-center gap-2">
                <ActionButton onClick={onClose}>Cancel</ActionButton>
                {mode === "import" ? (
                  <ActionButton
                    type="submit"
                    variant="primary"
                    disabled={
                      importArtifact.isPending ||
                      !locationId ||
                      !read ||
                      (!title.trim() && !(read.ok && read.title))
                    }
                  >
                    Import {read?.ok ? read.type : "JSON"}
                  </ActionButton>
                ) : (
                  <ActionButton
                    type="submit"
                    variant="primary"
                    disabled={create.isPending || !title.trim() || !locationId}
                  >
                    Create {typeLabel.toLowerCase()}
                  </ActionButton>
                )}
              </div>
            </div>
          </form>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

type ImportFieldProps = {
  json: string
  detected: ArtifactType | null
  issues: ImportIssue[]
  onJson: (json: string) => void
  onFile: (file: File | undefined) => void
}

/** Paste or load generated JSON; problems from the reader or the API are listed by path. */
function ImportField({ json, detected, issues, onJson, onFile }: ImportFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Caption className="text-[9px]">Structured JSON (content or version envelope)</Caption>
        <label className="cursor-pointer text-[10.5px] text-gc-primary-ink hover:underline">
          Load .json file
          <input
            type="file"
            accept="application/json,.json"
            aria-label="Load JSON file"
            onChange={(event) => onFile(event.target.files?.[0])}
            className="sr-only"
          />
        </label>
      </div>
      <textarea
        aria-label="Artifact JSON"
        spellCheck={false}
        value={json}
        onChange={(event) => onJson(event.target.value)}
        placeholder={'{ "schemaVersion": 1, "type": "slide", "elements": [ … ] }'}
        className="h-44 resize-none rounded-md border border-gc-border bg-gc-sunken p-2.5 font-mono text-[10.5px] leading-relaxed text-gc-text outline-none focus:border-gc-primary"
      />
      {issues.length > 0 ? (
        <ul
          role="alert"
          aria-label="Import problems"
          className="flex max-h-28 flex-col gap-1 overflow-y-auto rounded-md border border-gc-fail-base/40 bg-gc-fail-tint p-2 text-[10.5px] text-gc-fail-ink"
        >
          {issues.map((issue) => (
            <li key={`${issue.path}:${issue.message}`}>
              {issue.path && <span className="font-mono">{issue.path}: </span>}
              {issue.message}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[10.5px] text-gc-ink3">
          {detected
            ? `Detected a ${detected}. Components and fields are checked against the registry on import.`
            : "Paste JSON generated from the component registry (GET /api/v1/registry)."}
        </p>
      )}
    </div>
  )
}

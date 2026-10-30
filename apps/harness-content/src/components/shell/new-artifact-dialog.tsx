import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { useNavigate } from "@tanstack/react-router"
import { XIcon } from "lucide-react"
import { type FormEvent, useState } from "react"
import { toast } from "sonner"
import type { ArtifactType } from "@/api/client"
import { useCreateArtifact, useLocations } from "@/api/queries"
import { getPlugin } from "@/artifacts"
import { ARTIFACT_TYPES } from "@/components/artifact-types"
import { Caption } from "@/components/labels"
import { ActionButton, Field, Select, TextInput } from "@/components/shell/form-controls"
import { locationTrail } from "@/lib/library-tree"
import { LOCALES } from "@/lib/locales"
import { cn } from "@/lib/utils"

type Props = { initialLocationId?: string; onClose: () => void }

export function NewArtifactDialog({ initialLocationId, onClose }: Props) {
  const locations = useLocations().data ?? []
  const create = useCreateArtifact()
  const navigate = useNavigate()
  const [type, setType] = useState<ArtifactType>("slide")
  const [title, setTitle] = useState("")
  const [locale, setLocale] = useState("en")
  const [locationId, setLocationId] = useState(initialLocationId ?? "")
  const trail = locationTrail(locations, locationId || undefined)
  const typeLabel = ARTIFACT_TYPES.find((entry) => entry.type === type)?.label ?? type

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const content = getPlugin(type).createEmpty() as Record<string, unknown>
      const created = await create.mutateAsync({ type, title, locale, locationId, content })
      onClose()
      navigate({ to: "/artifacts/$artifactId", params: { artifactId: created.artifact.id } })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the artifact")
    }
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

              <div className="grid grid-cols-[1fr_1fr_120px] gap-2.5 pt-1">
                <Field label="Title">
                  <TextInput
                    required
                    autoFocus
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="How the Harness Evaluates"
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
                <ActionButton
                  type="submit"
                  variant="primary"
                  disabled={create.isPending || !title.trim() || !locationId}
                >
                  Create {typeLabel.toLowerCase()}
                </ActionButton>
              </div>
            </div>
          </form>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

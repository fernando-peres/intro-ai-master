import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { type FormEvent, useState } from "react"
import { toast } from "sonner"
import type { Schemas } from "@/api/client"
import { useCreateLocation, useLocations } from "@/api/queries"
import { ActionButton, Field, Select, TextInput } from "@/components/shell/form-controls"
import { locationTrail } from "@/lib/library-tree"

type Kind = Schemas["LocationKind"]
const CHILD_KIND: Record<Kind, Kind | null> = { box: "unit", unit: "section", section: null }

/** Creates a box (no parent) or a child of `parentId` one level down the tree. */
export function NewLocationDialog({
  parentId,
  onClose,
}: {
  parentId?: string
  onClose: () => void
}) {
  const locations = useLocations().data ?? []
  const create = useCreateLocation()
  const [parent, setParent] = useState(parentId ?? "")
  const [title, setTitle] = useState("")
  const parentKind = locations.find((location) => location.id === parent)?.kind
  const kind: Kind | null = parentKind ? CHILD_KIND[parentKind] : "box"
  const parents = locations.filter((location) => CHILD_KIND[location.kind] !== null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!kind) return
    try {
      await create.mutateAsync({ kind, title, parentId: parent || null })
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the location")
    }
  }

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-[#06060ACC]" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 w-[420px] max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[10px] border border-gc-border bg-gc-raised outline-none">
          <form onSubmit={submit}>
            <div className="border-b border-gc-border px-[18px] py-4">
              <DialogPrimitive.Title className="text-[15px] font-bold text-gc-text">
                New {kind ?? "location"}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-[3px] text-[11.5px] text-gc-ink3">
                Boxes hold units, units hold sections. Artifacts can live at any level.
              </DialogPrimitive.Description>
            </div>
            <div className="flex flex-col gap-3 p-[18px]">
              <Field label="Parent">
                <Select value={parent} onChange={(event) => setParent(event.target.value)}>
                  <option value="">None — create a box</option>
                  {parents.map((location) => (
                    <option key={location.id} value={location.id}>
                      {locationTrail(locations, location.id).join(" › ")} ({location.kind})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Title">
                <TextInput
                  required
                  autoFocus
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={kind === "box" ? "Intro to AI" : "Foundations"}
                />
              </Field>
            </div>
            <div className="flex justify-end gap-2 border-t border-gc-border bg-gc-sunken px-[18px] py-[13px]">
              <ActionButton onClick={onClose}>Cancel</ActionButton>
              <ActionButton
                type="submit"
                variant="primary"
                disabled={create.isPending || !title.trim() || !kind}
              >
                Create {kind}
              </ActionButton>
            </div>
          </form>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

import { Menu } from "@base-ui/react/menu"
import { useNavigate } from "@tanstack/react-router"
import { PlusIcon } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"
import type { Location } from "@/api/client"
import { useCreateLocation, useUpdateLocation } from "@/api/queries"
import { useStudioDialogs } from "@/components/shell/studio-dialogs"
import { friendlyError } from "@/lib/errors"
import { CHILD_KIND, UNTITLED } from "@/lib/library-tree"
import { cn } from "@/lib/utils"

/** Creates a location straight away and opens its sidebar row for naming. */
export function useAddLocation() {
  const create = useCreateLocation()
  const navigate = useNavigate()
  const { setRenamingId } = useStudioDialogs()
  return async (kind: Location["kind"], parentId: string | null = null) => {
    try {
      const created = await create.mutateAsync({ kind, title: UNTITLED[kind], parentId })
      setRenamingId(created.id)
      if (kind === "box") navigate({ to: "/", search: { location: created.id } })
    } catch (error) {
      toast.error(friendlyError(error))
    }
  }
}

const capitalize = (text: string) => text.replace(/^./, (c) => c.toUpperCase())

/** A section can only hold artifacts, so its button skips the menu. */
export function LocationAddButton({
  location,
  className,
}: {
  location: Location
  className?: string
}) {
  const { newArtifact } = useStudioDialogs()
  const add = useAddLocation()
  const childKind = CHILD_KIND[location.kind]
  const label = `Add to ${location.title}`
  const button = cn(
    "flex size-6 shrink-0 items-center justify-center rounded text-gc-ink3 hover:text-gc-text",
    className,
  )

  if (!childKind) {
    return (
      <button
        type="button"
        aria-label={`New artifact in ${location.title}`}
        title="New artifact"
        className={button}
        onClick={() => newArtifact(location.id)}
      >
        <PlusIcon aria-hidden className="size-3" />
      </button>
    )
  }
  const item =
    "flex h-7 cursor-default items-center rounded px-2 text-ui text-gc-ink2 outline-none data-[highlighted]:bg-gc-sunken data-[highlighted]:text-gc-text"
  return (
    <Menu.Root>
      <Menu.Trigger aria-label={label} title={label} className={button}>
        <PlusIcon aria-hidden className="size-3" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={4} align="start" className="z-50">
          <Menu.Popup className="flex min-w-[120px] flex-col rounded-md border border-gc-border bg-gc-raised p-1 outline-none">
            <Menu.Item className={item} onClick={() => newArtifact(location.id)}>
              Artifact
            </Menu.Item>
            <Menu.Item className={item} onClick={() => add(childKind, location.id)}>
              {capitalize(childKind)}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}

/** Enter or blur saves, Esc cancels; an empty or unchanged name saves nothing. */
export function LocationNameInput({
  location,
  onDone,
  className,
}: {
  location: Location
  onDone: () => void
  className?: string
}) {
  const update = useUpdateLocation()
  const [title, setTitle] = useState(location.title)
  // Enter blurs nothing but unmounting does, so each edit must only finish once.
  const finished = useRef(false)

  const finish = async (save: boolean) => {
    if (finished.current) return
    finished.current = true
    const next = title.trim()
    if (save && next && next !== location.title) {
      try {
        await update.mutateAsync({ id: location.id, title: next })
      } catch (error) {
        toast.error(friendlyError(error))
      }
    }
    onDone()
  }

  return (
    <input
      // biome-ignore lint/a11y/noAutofocus: appears only in response to a create or rename action
      autoFocus
      aria-label={`Name of ${location.title}`}
      value={title}
      onChange={(event) => setTitle(event.target.value)}
      onFocus={(event) => event.target.select()}
      onBlur={() => finish(true)}
      onKeyDown={(event) => {
        if (event.key === "Enter") finish(true)
        if (event.key === "Escape") finish(false)
      }}
      className={cn(
        "h-6 min-w-0 flex-1 rounded border border-gc-primary bg-gc-sunken px-1 text-ui text-gc-text outline-none",
        className,
      )}
    />
  )
}

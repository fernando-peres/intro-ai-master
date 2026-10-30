import { createContext, type ReactNode, useContext, useMemo, useState } from "react"
import { NewArtifactDialog } from "@/components/shell/new-artifact-dialog"
import { NewLocationDialog } from "@/components/shell/new-location-dialog"
import { NewTrailDialog } from "@/components/trail/new-trail-dialog"

type StudioDialogs = {
  newArtifact: (locationId?: string) => void
  newLocation: (parentId?: string) => void
  newTrail: () => void
}

const Context = createContext<StudioDialogs | null>(null)

type Open = { kind: "artifact" | "location" | "trail"; targetId?: string } | null

/** Hosts the create dialogs once so the sidebar and any page can open them. */
export function StudioDialogsProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<Open>(null)
  const value = useMemo<StudioDialogs>(
    () => ({
      newArtifact: (locationId) => setOpen({ kind: "artifact", targetId: locationId }),
      newLocation: (parentId) => setOpen({ kind: "location", targetId: parentId }),
      newTrail: () => setOpen({ kind: "trail" }),
    }),
    [],
  )
  const close = () => setOpen(null)
  return (
    <Context value={value}>
      {children}
      {open?.kind === "artifact" && (
        <NewArtifactDialog initialLocationId={open.targetId} onClose={close} />
      )}
      {open?.kind === "location" && <NewLocationDialog parentId={open.targetId} onClose={close} />}
      {open?.kind === "trail" && <NewTrailDialog onClose={close} />}
    </Context>
  )
}

export function useStudioDialogs(): StudioDialogs {
  const value = useContext(Context)
  if (!value) throw new Error("useStudioDialogs needs <StudioDialogsProvider>")
  return value
}

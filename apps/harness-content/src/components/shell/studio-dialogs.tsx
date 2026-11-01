import { createContext, type ReactNode, useContext, useMemo, useState } from "react"
import { NewArtifactDialog } from "@/components/shell/new-artifact-dialog"
import { NewTrailDialog } from "@/components/trail/new-trail-dialog"

type StudioDialogs = {
  newArtifact: (locationId?: string) => void
  newTrail: () => void
  /** The location whose sidebar row is being named; set after creating one. */
  renamingId: string | null
  setRenamingId: (locationId: string | null) => void
}

const Context = createContext<StudioDialogs | null>(null)

type Open = { kind: "artifact" | "trail"; targetId?: string } | null

/** Hosts the create dialogs once so the sidebar and any page can open them. */
export function StudioDialogsProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<Open>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const value = useMemo<StudioDialogs>(
    () => ({
      newArtifact: (locationId) => setOpen({ kind: "artifact", targetId: locationId }),
      newTrail: () => setOpen({ kind: "trail" }),
      renamingId,
      setRenamingId,
    }),
    [renamingId],
  )
  const close = () => setOpen(null)
  return (
    <Context value={value}>
      {children}
      {open?.kind === "artifact" && (
        <NewArtifactDialog initialLocationId={open.targetId} onClose={close} />
      )}
      {open?.kind === "trail" && <NewTrailDialog onClose={close} />}
    </Context>
  )
}

export function useStudioDialogs(): StudioDialogs {
  const value = useContext(Context)
  if (!value) throw new Error("useStudioDialogs needs <StudioDialogsProvider>")
  return value
}

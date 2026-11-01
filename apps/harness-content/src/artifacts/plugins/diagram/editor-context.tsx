import { createContext, type ReactNode, useContext, useMemo, useState } from "react"

export type DiagramSelection = { nodes: string[]; edges: string[] }

const EMPTY: DiagramSelection = { nodes: [], edges: [] }

type DiagramEditor = {
  selection: DiagramSelection
  select: (selection: DiagramSelection) => void
}

const Context = createContext<DiagramEditor>({ selection: EMPTY, select: () => {} })

/** Shares the canvas selection between the editor and the inspector panels. */
export function DiagramEditorProvider({ children }: { children: ReactNode }) {
  const [selection, select] = useState(EMPTY)
  const value = useMemo(() => ({ selection, select }), [selection])
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const useDiagramEditor = () => useContext(Context)

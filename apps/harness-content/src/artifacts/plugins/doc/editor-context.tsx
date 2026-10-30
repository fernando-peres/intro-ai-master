import { createContext, type ReactNode, useContext, useState } from "react"
import type { DocEditor } from "@/artifacts/plugins/doc/blocks"

type Value = { editor: DocEditor | null; setEditor: (editor: DocEditor | null) => void }

const Context = createContext<Value>({ editor: null, setEditor: () => {} })

/** Shares the mounted BlockNote editor with the Insert and Format panels. */
export function DocEditorProvider({ children }: { children: ReactNode }) {
  const [editor, setEditor] = useState<DocEditor | null>(null)
  return <Context value={{ editor, setEditor }}>{children}</Context>
}

export function useDocEditor(): Value {
  return useContext(Context)
}

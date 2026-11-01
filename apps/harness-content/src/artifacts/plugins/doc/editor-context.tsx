import { createContext, type ReactNode, useContext, useState } from "react"
import type { ArtifactType } from "@/api/client"
import type { DocEditor } from "@/artifacts/plugins/doc/blocks"

type Value = {
  editor: DocEditor | null
  setEditor: (editor: DocEditor | null) => void
  /** The type the embed picker dialog is open for; null when closed. */
  embedPicker: ArtifactType | null
  setEmbedPicker: (type: ArtifactType | null) => void
}

const Context = createContext<Value>({
  editor: null,
  setEditor: () => {},
  embedPicker: null,
  setEmbedPicker: () => {},
})

/** Shares the mounted BlockNote editor with the Insert and Format panels. */
export function DocEditorProvider({ children }: { children: ReactNode }) {
  const [editor, setEditor] = useState<DocEditor | null>(null)
  const [embedPicker, setEmbedPicker] = useState<ArtifactType | null>(null)
  return <Context value={{ editor, setEditor, embedPicker, setEmbedPicker }}>{children}</Context>
}

export function useDocEditor(): Value {
  return useContext(Context)
}

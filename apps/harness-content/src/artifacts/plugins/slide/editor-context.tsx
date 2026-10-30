import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from "react"
import { emptyHistory, type History, record, redo, undo } from "@/artifacts/plugins/slide/history"
import type { SlideContent } from "@/artifacts/plugins/slide/model"

type Value = {
  selected: string[]
  setSelected: (ids: string[]) => void
  history: React.RefObject<History<SlideContent>>
  /** Re-renders consumers after undo/redo availability changes. */
  bump: () => void
}

const Context = createContext<Value | null>(null)

/** Selection and undo history shared by the canvas and the Format/Insert panels. */
export function SlideEditorProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<string[]>([])
  const history = useRef(emptyHistory<SlideContent>())
  const [, setTick] = useState(0)
  const bump = useCallback(() => setTick((tick) => tick + 1), [])
  return <Context value={{ selected, setSelected, history, bump }}>{children}</Context>
}

export function useSlideEditor(): Value {
  const value = useContext(Context)
  if (!value) throw new Error("Slide editing needs <SlideEditorProvider>")
  return value
}

/** Edits that go through undo history; `group` merges a burst (typing, nudging) into one step. */
export function useSlideActions(content: SlideContent, onChange: (next: SlideContent) => void) {
  const { history, bump } = useSlideEditor()
  return {
    apply: (next: SlideContent, group: string | null = null) => {
      history.current = record(history.current, content, group, Date.now())
      onChange(next)
      bump()
    },
    undo: () => {
      const step = undo(history.current, content)
      if (!step) return
      history.current = step[0]
      onChange(step[1])
      bump()
    },
    redo: () => {
      const step = redo(history.current, content)
      if (!step) return
      history.current = step[0]
      onChange(step[1])
      bump()
    },
    canUndo: history.current.past.length > 0,
    canRedo: history.current.future.length > 0,
  }
}

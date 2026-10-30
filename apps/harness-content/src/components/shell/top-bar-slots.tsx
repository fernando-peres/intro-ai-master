import { createContext, type ReactNode, useContext, useState } from "react"
import { createPortal } from "react-dom"

type Slots = {
  start: HTMLElement | null
  end: HTMLElement | null
  setStart: (node: HTMLElement | null) => void
  setEnd: (node: HTMLElement | null) => void
}

const Context = createContext<Slots | null>(null)

/** Lets a page put its breadcrumb (start) and actions (end) into the global top bar. */
export function TopBarSlotsProvider({ children }: { children: ReactNode }) {
  const [start, setStart] = useState<HTMLElement | null>(null)
  const [end, setEnd] = useState<HTMLElement | null>(null)
  return <Context value={{ start, end, setStart, setEnd }}>{children}</Context>
}

function useSlots(): Slots {
  const slots = useContext(Context)
  if (!slots) throw new Error("Top bar slots need <TopBarSlotsProvider>")
  return slots
}

/** Ref callbacks for the top bar's own slot containers. */
export function useSlotTargets() {
  const { setStart, setEnd } = useSlots()
  return { start: setStart, end: setEnd }
}

export function TopBarSlot({ side, children }: { side: "start" | "end"; children: ReactNode }) {
  const target = useSlots()[side]
  return target ? createPortal(children, target) : null
}

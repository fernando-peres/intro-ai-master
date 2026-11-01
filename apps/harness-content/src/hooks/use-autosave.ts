import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { ApiError } from "@/api/client"

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error" | "conflict"

type Options<T> = {
  value: T
  /** ETag of the server copy `value` started from; saves send it as If-Match. */
  etag: string | undefined
  enabled: boolean
  /** Persists `value` and resolves to the new ETag. */
  save: (value: T, etag: string) => Promise<string>
  delayMs?: number
}

export type Autosave = {
  status: SaveStatus
  savedAt: Date | null
  error: string | null
  /** Saves now instead of waiting for the debounce; resolves to whether nothing is left unsaved. */
  flush: () => Promise<boolean>
  /** The ETag of the last successful save, for other writes to the same resource. */
  currentEtag: () => string | undefined
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/**
 * Debounced save of `value` with optimistic concurrency: one request in flight at a time,
 * a 412 stops saving (`conflict`) until the caller reloads with a fresh `etag`. Pending edits are
 * saved on unmount, and closing the tab warns while anything is unsaved.
 */
export function useAutosave<T>({
  value,
  etag,
  enabled,
  save,
  delayMs = 800,
}: Options<T>): Autosave {
  const [status, setStatus] = useState<SaveStatus>("idle")
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const saved = useRef(value)
  const tag = useRef(etag)
  const latest = useRef(value)
  const inFlight = useRef<Promise<void> | null>(null)
  const stopped = useRef(false)
  const saveRef = useRef(save)
  const enabledRef = useRef(enabled)
  saveRef.current = save
  enabledRef.current = enabled
  latest.current = value

  // A new server copy (other version, reload after conflict) resets the baseline.
  useEffect(() => {
    tag.current = etag
    saved.current = latest.current
    stopped.current = false
    setStatus("idle")
    setError(null)
  }, [etag])

  const run = useCallback(async (): Promise<boolean> => {
    if (inFlight.current) {
      await inFlight.current
      return run()
    }
    if (same(latest.current, saved.current)) return true
    if (stopped.current || !tag.current) return false
    const snapshot = latest.current
    setStatus("saving")
    const attempt = (async () => {
      try {
        tag.current = await saveRef.current(snapshot, tag.current as string)
        saved.current = snapshot
        setSavedAt(new Date())
        setError(null)
        setStatus(same(latest.current, snapshot) ? "saved" : "dirty")
      } catch (caught) {
        const conflict = caught instanceof ApiError && caught.status === 412
        if (conflict) stopped.current = true
        setError(caught instanceof Error ? caught.message : "Save failed")
        setStatus(conflict ? "conflict" : "error")
      }
    })()
    inFlight.current = attempt
    await attempt
    inFlight.current = null
    return same(latest.current, saved.current)
  }, [])

  useEffect(() => {
    if (!enabled || stopped.current) return
    if (same(value, saved.current)) {
      // An edit undone before its save ran leaves nothing pending.
      setStatus((current) => (current === "dirty" ? "idle" : current))
      return
    }
    setStatus("dirty")
    const timer = setTimeout(run, delayMs)
    return () => clearTimeout(timer)
  }, [value, enabled, delayMs, run])

  useEffect(
    () => () => {
      if (!enabledRef.current || stopped.current || !tag.current) return
      run().then((clean) => {
        if (!clean) toast.error("Your last edit could not be saved. Reopen the page and try again.")
      })
    },
    [run],
  )

  const unsafe =
    status === "dirty" || status === "saving" || status === "error" || status === "conflict"
  useEffect(() => {
    if (!unsafe) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [unsafe])

  const currentEtag = useCallback(() => tag.current, [])
  return { status, savedAt, error, flush: run, currentEtag }
}

/** Undo/redo stacks of whole-content snapshots; consecutive edits in one group merge into one step. */
export type History<T> = { past: T[]; future: T[]; group: string | null; at: number }

export const LIMIT = 100
/** Edits in the same group within this window (ms) undo together, e.g. typing or nudging. */
export const MERGE_WINDOW = 1000

export function emptyHistory<T>(): History<T> {
  return { past: [], future: [], group: null, at: 0 }
}

/** Records that `previous` is being replaced; call before applying the new content. */
export function record<T>(
  history: History<T>,
  previous: T,
  group: string | null,
  now: number,
): History<T> {
  const merge = group !== null && group === history.group && now - history.at < MERGE_WINDOW
  if (merge) return { ...history, at: now, future: [] }
  return { past: [...history.past, previous].slice(-LIMIT), future: [], group, at: now }
}

export function undo<T>(history: History<T>, present: T): [History<T>, T] | null {
  const previous = history.past.at(-1)
  if (previous === undefined) return null
  return [
    { past: history.past.slice(0, -1), future: [present, ...history.future], group: null, at: 0 },
    previous,
  ]
}

export function redo<T>(history: History<T>, present: T): [History<T>, T] | null {
  const [next, ...rest] = history.future
  if (next === undefined) return null
  return [{ past: [...history.past, present], future: rest, group: null, at: 0 }, next]
}

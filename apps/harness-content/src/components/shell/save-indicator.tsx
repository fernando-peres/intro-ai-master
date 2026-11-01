import { ActionButton } from "@/components/shell/form-controls"
import type { Autosave } from "@/hooks/use-autosave"
import { relativeTime } from "@/lib/stamps"
import { cn } from "@/lib/utils"

type Props = {
  autosave: Autosave
  editable: boolean
  /** UTC stamp of the server copy, shown until the first save of this session. */
  updatedAt: string
  readOnlyLabel?: string
  /** Replaces local edits with the server copy after a conflict. */
  onReload: () => void
}

const toStamp = (date: Date) => date.toISOString().slice(0, 19).replace(/[T:]/g, "-")

/** The header save state; each failure offers its way out. The tooltip has the exact UTC stamp. */
export function SaveIndicator({
  autosave,
  editable,
  updatedAt,
  readOnlyLabel = "Read only",
  onReload,
}: Props) {
  const { text, tone, title } = describe(autosave, editable, updatedAt, readOnlyLabel)
  const failed = editable && (autosave.status === "error" || autosave.status === "conflict")
  return (
    <span
      title={title}
      className={cn(
        "flex shrink-0 items-center gap-[7px] pl-2 font-mono text-label whitespace-nowrap",
        failed ? "text-gc-fail-ink" : "text-gc-ink3",
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", tone)} />
      <span role="status">{text}</span>
      {editable && autosave.status === "error" && (
        <ActionButton className="h-6" onClick={() => autosave.flush()}>
          Retry
        </ActionButton>
      )}
      {editable && autosave.status === "conflict" && (
        <ActionButton
          className="h-6"
          title="Discards your unsaved edits and loads the latest copy"
          onClick={onReload}
        >
          Reload
        </ActionButton>
      )}
    </span>
  )
}

function describe(autosave: Autosave, editable: boolean, updatedAt: string, readOnly: string) {
  if (!editable) return { text: readOnly, tone: "bg-gc-ink3", title: "" }
  switch (autosave.status) {
    case "dirty":
      return { text: "Unsaved", tone: "bg-gc-warn-base", title: "" }
    case "saving":
      return { text: "Saving…", tone: "bg-gc-warn-base", title: "" }
    case "error":
      return { text: "Save failed", tone: "bg-gc-fail-base", title: autosave.error ?? "" }
    case "conflict":
      return { text: "Changed elsewhere", tone: "bg-gc-fail-base", title: autosave.error ?? "" }
    default: {
      const at = autosave.savedAt
      return {
        text: at ? "Saved" : `Saved ${relativeTime(updatedAt)}`,
        tone: "bg-gc-pass-base",
        title: at ? toStamp(at) : updatedAt,
      }
    }
  }
}

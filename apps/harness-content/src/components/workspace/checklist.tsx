import { PlusIcon, XIcon } from "lucide-react"
import { useState } from "react"
import { PanelHeading } from "@/components/workspace/inspector"
import type { ChecklistItem } from "@/lib/outline"
import { cn } from "@/lib/utils"

const addInput =
  "h-7 w-full rounded-[5px] border border-gc-border bg-gc-sunken px-[9px] text-[11.5px] text-gc-text outline-none focus:border-gc-primary"

function AddForm({
  label,
  placeholder,
  onAdd,
}: {
  label: string
  placeholder: string
  onAdd: (text: string) => void
}) {
  const [text, setText] = useState("")
  return (
    <form
      className="flex items-center gap-1.5"
      onSubmit={(event) => {
        event.preventDefault()
        if (!text.trim()) return
        onAdd(text.trim())
        setText("")
      }}
    >
      <input
        aria-label={label}
        placeholder={placeholder}
        value={text}
        onChange={(event) => setText(event.target.value)}
        className={addInput}
      />
      <button
        type="submit"
        aria-label={placeholder}
        className="flex size-7 shrink-0 items-center justify-center rounded-[5px] border border-gc-border bg-gc-sunken text-gc-ink2"
      >
        <PlusIcon className="size-3" />
      </button>
    </form>
  )
}

type ChecklistProps = {
  items: ChecklistItem[]
  readOnly: boolean
  onChange: (items: ChecklistItem[]) => void
}

/** Heading with done count, progress bar, toggles and an add form; labels are unique. */
export function ChecklistEditor({ items, readOnly, onChange }: ChecklistProps) {
  const done = items.filter((item) => item.done).length
  return (
    <>
      <PanelHeading label="Checklist" right={`${done} / ${items.length}`} />
      <div className="h-1 shrink-0 overflow-hidden rounded-sm bg-gc-sunken">
        <div
          className="h-full rounded-sm bg-gc-pass-base"
          style={{ width: items.length ? `${(done / items.length) * 100}%` : 0 }}
        />
      </div>
      <ul className="flex flex-col gap-[9px]">
        {items.map((item, index) => (
          <li key={item.label}>
            <label className="flex items-center gap-[9px] text-[11px]">
              <input
                type="checkbox"
                checked={item.done}
                disabled={readOnly}
                onChange={() =>
                  onChange(
                    items.map((entry, i) =>
                      i === index ? { ...entry, done: !entry.done } : entry,
                    ),
                  )
                }
                className="size-3.5 accent-gc-pass-base"
              />
              <span className={item.done ? "text-gc-ink3 line-through" : "text-gc-text"}>
                {item.label}
              </span>
            </label>
          </li>
        ))}
      </ul>
      {!readOnly && (
        <AddForm
          label="New checklist item"
          placeholder="Add check"
          onAdd={(label) => {
            if (!items.some((entry) => entry.label === label)) {
              onChange([...items, { label, done: false }])
            }
          }}
        />
      )}
    </>
  )
}

type StringListProps = {
  label: string
  items: string[]
  readOnly: boolean
  placeholder: string
  onChange: (items: string[]) => void
}

/** An ordered list of short texts (objectives, prerequisites), each removable. */
export function StringListEditor({
  label,
  items,
  readOnly,
  placeholder,
  onChange,
}: StringListProps) {
  return (
    <>
      <PanelHeading label={label} right={`${items.length}`} />
      {items.length > 0 && (
        <ol className="flex flex-col gap-1">
          {items.map((item, index) => (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: entries may repeat; order is the identity
              key={index}
              className={cn(
                "flex items-start gap-2 rounded-md border border-gc-border bg-gc-sunken px-2.5 py-[7px] text-[11px] text-gc-text",
              )}
            >
              <span className="font-mono text-[9px] text-gc-ink3">{index + 1}.</span>
              <span className="min-w-0 flex-1">{item}</span>
              {!readOnly && (
                <button
                  type="button"
                  aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}
                  onClick={() => onChange(items.filter((_, i) => i !== index))}
                  className="text-gc-ink3 hover:text-gc-fail-ink"
                >
                  <XIcon className="size-3" />
                </button>
              )}
            </li>
          ))}
        </ol>
      )}
      {!readOnly && (
        <AddForm
          label={`New ${label.toLowerCase()}`}
          placeholder={placeholder}
          onAdd={(text) => onChange([...items, text])}
        />
      )}
    </>
  )
}

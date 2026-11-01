import { type FormEvent, useState } from "react"
import { FormDialog } from "@/components/design/artifact-themes"
import { ActionButton } from "@/components/shell/form-controls"
import type { TrailStep } from "@/lib/trail"

/** Chooses which steps go in the PDF, for this export only; every printable step starts ticked. */
export function ExportDialog({
  steps,
  onExport,
  onClose,
}: {
  steps: TrailStep[]
  onExport: (positions: number[]) => void
  onClose: () => void
}) {
  const printable = steps.flatMap((step, index) => (step.artifactVersionId ? [index + 1] : []))
  const [ticked, setTicked] = useState(() => new Set(printable))
  const toggle = (position: number, on: boolean) =>
    setTicked((current) => {
      const next = new Set(current)
      if (on) next.add(position)
      else next.delete(position)
      return next
    })
  const submit = (event: FormEvent) => {
    event.preventDefault()
    onExport(printable.filter((position) => ticked.has(position)))
  }
  return (
    <FormDialog
      title="Export PDF"
      description="Steps print in trail order. Your browser's print dialog saves the file."
      submitLabel="Export"
      disabled={ticked.size === 0}
      onClose={onClose}
      onSubmit={submit}
    >
      <div className="flex gap-2">
        <ActionButton onClick={() => setTicked(new Set(printable))}>Select all</ActionButton>
        <ActionButton onClick={() => setTicked(new Set())}>Select none</ActionButton>
      </div>
      <ol className="flex max-h-[50vh] flex-col gap-1 overflow-y-auto">
        {steps.map((step, index) => {
          const position = index + 1
          const pinned = Boolean(step.artifactVersionId)
          return (
            <li key={step.key}>
              <label className="flex items-center gap-2 text-ui text-gc-ink2">
                <input
                  type="checkbox"
                  checked={ticked.has(position)}
                  disabled={!pinned}
                  onChange={(event) => toggle(position, event.target.checked)}
                />
                <span className="min-w-0 flex-1 truncate">
                  {position}. {step.label || step.artifactTitle}
                </span>
                {!pinned && <span className="shrink-0 text-label text-gc-ink3">No version</span>}
              </label>
            </li>
          )
        })}
      </ol>
    </FormDialog>
  )
}

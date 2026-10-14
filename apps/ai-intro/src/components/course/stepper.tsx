import { CheckIcon } from "lucide-react"
import { Fragment } from "react"
import { cn } from "@/lib/utils"

/** Wizard-style progress: numbered circles joined by lines; done steps show a check. */
export function Stepper({
  steps,
  current,
  onSelect,
  label,
}: {
  steps: string[]
  current: number
  onSelect: (index: number) => void
  label: string
}) {
  return (
    <ol aria-label={label} className="flex items-start">
      {steps.map((title, i) => {
        const done = i < current
        const active = i === current
        return (
          <Fragment key={title}>
            {i > 0 && (
              <li
                aria-hidden
                className={cn("mt-4 h-0.5 min-w-3 flex-1", i <= current ? "bg-brand" : "bg-line")}
              />
            )}
            <li className="flex w-10 flex-col items-center gap-1.5 sm:w-24">
              <button
                type="button"
                aria-current={active ? "step" : undefined}
                aria-label={`${i + 1}. ${title}`}
                onClick={() => onSelect(i)}
                className={cn(
                  "flex size-8 cursor-pointer items-center justify-center rounded-full border-2 font-ui text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                  done && "border-brand bg-brand text-canvas",
                  active && "border-brand text-brand",
                  !done && !active && "border-line text-fg-muted hover:text-fg",
                )}
              >
                {done ? <CheckIcon className="size-4" aria-hidden /> : i + 1}
              </button>
              <span
                className={cn(
                  "label-ui hidden text-center sm:block",
                  active ? "text-brand" : "text-fg-muted",
                )}
              >
                {title}
              </span>
            </li>
          </Fragment>
        )
      })}
    </ol>
  )
}

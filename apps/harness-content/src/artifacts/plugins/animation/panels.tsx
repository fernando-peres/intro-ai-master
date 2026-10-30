import { CheckIcon } from "lucide-react"
import { useMemo } from "react"
import type { EditorProps } from "@/artifacts/plugin"
import { describeFields } from "@/artifacts/plugins/animation/form-fields"
import {
  type AnimationContent,
  getTemplate,
  switchTemplate,
  TEMPLATES,
} from "@/artifacts/plugins/animation/model"
import { SchemaForm } from "@/artifacts/plugins/animation/schema-form"
import { PanelHeading, Placeholder } from "@/components/workspace/inspector"
import { cn } from "@/lib/utils"

/** Edits `next` into the content only when the template schema accepts it. */
export function applyProps(content: AnimationContent, next: unknown): AnimationContent | null {
  const parsed = getTemplate(content.template).props.safeParse(next)
  return parsed.success ? ({ ...content, props: parsed.data } as AnimationContent) : null
}

export function AnimationFormatPanel({
  content,
  onChange,
  readOnly,
}: EditorProps<AnimationContent>) {
  const template = getTemplate(content.template)
  const fields = useMemo(() => describeFields(template.props), [template])
  return (
    <>
      <PanelHeading label={template.label} right={template.id} />
      <Placeholder>{template.description}</Placeholder>
      <SchemaForm
        fields={fields}
        value={content.props as Record<string, unknown>}
        readOnly={readOnly}
        onChange={(next) => {
          const updated = applyProps(content, next)
          if (updated) onChange(updated)
        }}
      />
    </>
  )
}

export function AnimationInsertPanel({
  content,
  onChange,
  readOnly,
}: EditorProps<AnimationContent>) {
  return (
    <>
      <PanelHeading label="Templates" right={`${TEMPLATES.length} registered`} />
      <Placeholder>
        Switching keeps the colour scheme, accent and timing; the text and data start from the new
        template's defaults.
      </Placeholder>
      <ul className="flex flex-col gap-1.5">
        {TEMPLATES.map((template) => {
          const active = template.id === content.template
          return (
            <li key={template.id}>
              <button
                type="button"
                aria-pressed={active}
                disabled={readOnly}
                onClick={() => onChange(switchTemplate(content, template.id))}
                className={cn(
                  "flex w-full flex-col gap-1 rounded-md border p-2.5 text-left disabled:opacity-60",
                  active
                    ? "border-gc-primary bg-gc-row-bg"
                    : "border-gc-border bg-gc-sunken hover:bg-gc-raised",
                )}
              >
                <span className="flex items-center justify-between text-[11.5px] font-semibold text-gc-text">
                  {template.label}
                  {active && <CheckIcon className="size-3 text-gc-primary" />}
                </span>
                <span className="text-[10.5px] text-gc-ink3">{template.description}</span>
                <span className="font-mono text-[8.5px] tracking-[0.5px] text-gc-ink3">
                  {template.id}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}

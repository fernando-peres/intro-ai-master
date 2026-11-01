import { toast } from "sonner"
import { useTemplates } from "@/api/queries"
import type { EditorProps } from "@/artifacts/plugin"
import { useSlideActions, useSlideEditor } from "@/artifacts/plugins/slide/editor-context"
import { type SlideContent, slideSchema } from "@/artifacts/plugins/slide/model"
import { applyTemplate } from "@/artifacts/plugins/slide/ops"
import { SlideScene } from "@/artifacts/plugins/slide/scene"
import { buildLayout, layoutsFor } from "@/artifacts/plugins/slide/theme-layouts"
import { WhenVisible } from "@/components/shell/when-visible"
import { PanelHeading } from "@/components/workspace/inspector"

const THUMB_WIDTH = 128
const THUMB_SCALE = THUMB_WIDTH / 1920

type Option = { key: string; label: string; content: SlideContent }

/** The current theme's saved templates and layouts; picking one replaces this slide (undoable). */
export function TemplatePicker({
  content,
  onChange,
}: Pick<EditorProps<SlideContent>, "content" | "onChange">) {
  const actions = useSlideActions(content, onChange)
  const { setSelected } = useSlideEditor()
  const saved = (useTemplates().data ?? []).filter((entry) => entry.themeId === content.theme)
  const options: Option[] = [
    ...saved.flatMap((entry) => {
      const parsed = slideSchema.safeParse(entry.content)
      return parsed.success ? [{ key: entry.id, label: entry.name, content: parsed.data }] : []
    }),
    ...layoutsFor(content.theme).map((layout) => ({
      key: layout.id,
      label: layout.label,
      content: buildLayout(layout.id, content.theme),
    })),
  ]
  const pick = (option: Option) => {
    actions.apply(applyTemplate(content, option.content))
    setSelected([])
    toast.success("Template applied. Undo to restore.")
  }
  return (
    <section className="flex flex-col gap-1.5">
      <PanelHeading label="Template slides" />
      <ul className="grid grid-cols-2 gap-1.5">
        {options.map((option) => (
          <li key={option.key}>
            <button
              type="button"
              aria-label={`Apply template ${option.label}`}
              onClick={() => pick(option)}
              className="flex w-full flex-col overflow-hidden rounded-md border border-gc-border bg-gc-sunken text-left hover:border-gc-primary"
            >
              <span aria-hidden className="pointer-events-none block aspect-video w-full">
                <WhenVisible>
                  <SlideScene content={option.content} scale={THUMB_SCALE} />
                </WhenVisible>
              </span>
              <span className="truncate border-t border-gc-border px-1.5 py-1 text-label text-gc-ink2">
                {option.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

import { Link, useNavigate } from "@tanstack/react-router"
import { type FormEvent, Suspense, useState } from "react"
import { toast } from "sonner"
import { useArtifactThemes, useCreateTemplate, useTemplates } from "@/api/queries"
import { getPlugin, validateContent } from "@/artifacts"
import { buildLayout, type LayoutId, layoutsFor } from "@/artifacts/plugins/slide/theme-layouts"
import { Chips, FormDialog, themeChips } from "@/components/design/artifact-themes"
import { Caption } from "@/components/labels"
import { Field, Select, TextInput } from "@/components/shell/form-controls"
import { WhenVisible } from "@/components/shell/when-visible"
import { friendlyError } from "@/lib/errors"

type NewTemplate = { layout: LayoutId; theme: string; name: string }

/** Starter layouts and saved templates for one theme (design qkxEA). */
export function Templates({
  themeId,
  onTheme,
  onNew,
}: {
  themeId: string
  onTheme: (themeId: string) => void
  onNew: (draft: NewTemplate) => void
}) {
  const themes = useArtifactThemes().data ?? []
  const saved = (useTemplates().data ?? []).filter((template) => template.themeId === themeId)
  const theme = themes.find((entry) => entry.id === themeId)
  const layouts = layoutsFor(themeId)
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto p-5">
      <div className="flex h-8 shrink-0 items-center justify-between">
        {/* biome-ignore lint/a11y/noLabelWithoutControl: the Select below renders the control */}
        <label className="flex items-center gap-2.5">
          <Caption className="tracking-[0.5px]">BASED ON THEME</Caption>
          {theme && <Chips colors={themeChips(theme)} size="sm" />}
          <Select value={themeId} onChange={(event) => onTheme(event.target.value)}>
            {themes.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </Select>
        </label>
        <Caption>{layouts.length + saved.length} TEMPLATES</Caption>
      </div>
      <ul className="grid grid-cols-4 gap-3">
        {saved.map((template) => (
          <li key={template.id}>
            <Link
              to="/design-templates/$templateId"
              params={{ templateId: template.id }}
              className="block"
            >
              <Card
                name={template.name}
                meta={`×${template.useCount}`}
                content={template.content}
              />
            </Link>
          </li>
        ))}
        {layouts.map((layout) => (
          <li key={layout.id}>
            <button
              type="button"
              aria-label={`New template from ${layout.label}`}
              className="block w-full text-left"
              onClick={() => onNew({ layout: layout.id, theme: themeId, name: layout.label })}
            >
              <Card name={layout.label} meta="STARTER" content={buildLayout(layout.id, themeId)} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Card({ name, meta, content }: { name: string; meta: string; content: unknown }) {
  return (
    <span className="flex flex-col overflow-hidden rounded-lg border border-gc-border bg-gc-raised hover:border-gc-primary">
      <Preview content={content} />
      <span className="flex items-center justify-between gap-2 border-t border-gc-border px-3 py-2.5">
        <span className="truncate text-ui font-semibold text-gc-text">{name}</span>
        <span className="shrink-0 font-mono text-label text-gc-ink3">{meta}</span>
      </span>
    </span>
  )
}

/** Konva stages are costly: each card mounts its renderer only once it scrolls into view. */
function Preview({ content }: { content: unknown }) {
  const plugin = getPlugin("slide")
  const valid = validateContent(plugin, content)
  return (
    <span aria-hidden className="pointer-events-none block aspect-video w-full bg-gc-sunken">
      <WhenVisible>
        {valid.ok && (
          <Suspense fallback={null}>
            <plugin.Renderer content={valid.content} showControls={false} />
          </Suspense>
        )}
      </WhenVisible>
    </span>
  )
}

/** Creates the template from a starter layout, then opens it in the slide editor. */
export function NewTemplateDialog({
  initial,
  onClose,
}: {
  initial: NewTemplate
  onClose: () => void
}) {
  const themes = useArtifactThemes().data ?? []
  const create = useCreateTemplate()
  const navigate = useNavigate()
  const [name, setName] = useState(initial.name)
  const [theme, setTheme] = useState(initial.theme)
  const [layout, setLayout] = useState(initial.layout)
  const layouts = layoutsFor(theme)
  const pickTheme = (next: string) => {
    setTheme(next)
    const options = layoutsFor(next)
    if (!options.some((option) => option.id === layout)) setLayout(options[0].id)
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const content = buildLayout(layout, theme) as unknown as Record<string, unknown>
      const template = await create.mutateAsync({ name: name.trim(), layout, content })
      onClose()
      navigate({
        to: "/design-templates/$templateId",
        params: { templateId: template.id },
      })
    } catch (error) {
      toast.error(friendlyError(error))
    }
  }
  return (
    <FormDialog
      title="New template"
      description="Pick a theme and a starting layout, then edit it in the slide editor."
      submitLabel="Create and edit"
      disabled={create.isPending || !name.trim()}
      onClose={onClose}
      onSubmit={submit}
    >
      <Field label="Name">
        <TextInput
          required
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>
      <Field label="Based on theme">
        <Select value={theme} onChange={(event) => pickTheme(event.target.value)}>
          {themes.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Layout">
        <Select value={layout} onChange={(event) => setLayout(event.target.value as LayoutId)}>
          {layouts.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>
    </FormDialog>
  )
}

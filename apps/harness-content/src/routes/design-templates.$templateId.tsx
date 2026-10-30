import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeftIcon } from "lucide-react"
import { Fragment, Suspense, useEffect, useState } from "react"
import { toast } from "sonner"
import {
  type ArtifactTemplate,
  useDeleteTemplate,
  useTemplate,
  useUpdateTemplate,
} from "@/api/queries"
import { validateContent } from "@/artifacts"
import { slidePlugin } from "@/artifacts/plugins/slide"
import { Caption } from "@/components/labels"
import { ActionButton, TextInput } from "@/components/shell/form-controls"

export const Route = createFileRoute("/design-templates/$templateId")({
  component: TemplatePage,
})

const plugin = slidePlugin

function TemplatePage() {
  const { templateId } = Route.useParams()
  const query = useTemplate(templateId)
  if (query.isError) {
    return (
      <p role="alert" className="p-6 text-[11.5px] text-gc-fail-ink">
        {query.error.message}
      </p>
    )
  }
  if (!query.data) return <Caption className="p-6">Loading…</Caption>
  return <TemplateEditor key={templateId} template={query.data} />
}

/** The slide editor over a template; changes are saved explicitly, not autosaved. */
function TemplateEditor({ template }: { template: ArtifactTemplate }) {
  const navigate = useNavigate()
  const update = useUpdateTemplate(template.id)
  const remove = useDeleteTemplate(template.id)
  const valid = validateContent(plugin, template.content)
  const [content, setContent] = useState(valid.ok ? valid.content : undefined)
  const [name, setName] = useState(template.name)
  const [dirty, setDirty] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const Provider = plugin.Provider ?? Fragment
  const back = { tab: "templates", theme: template.themeId } as const

  const save = () =>
    update.mutate(
      { name: name.trim(), content: content as unknown as Record<string, unknown> },
      {
        onSuccess: () => setDirty(false),
        onError: (error) => toast.error(error.message),
      },
    )

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  if (!content) {
    return (
      <p role="alert" className="p-6 text-[11.5px] text-gc-fail-ink">
        This template's content does not match the slide schema.
      </p>
    )
  }
  const props = {
    content,
    readOnly: false,
    artifactId: template.id,
    locale: "en",
    onChange: (next: typeof content) => {
      setContent(next)
      setDirty(true)
    },
  }
  return (
    <Provider>
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-gc-border px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link
              to="/artifacts-design"
              search={back}
              aria-label="Back to templates"
              className="flex size-7 items-center justify-center rounded-md border border-gc-border bg-gc-sunken text-gc-ink2"
            >
              <ArrowLeftIcon aria-hidden className="size-3" />
            </Link>
            <h1 className="sr-only">Edit template</h1>
            <TextInput
              aria-label="Template name"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setDirty(true)
              }}
            />
            <Caption>{dirty ? "UNSAVED CHANGES" : `USED ×${template.useCount}`}</Caption>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {confirming ? (
              <>
                <ActionButton onClick={() => setConfirming(false)}>Keep</ActionButton>
                <ActionButton
                  disabled={remove.isPending}
                  onClick={() =>
                    remove.mutate(undefined, {
                      onSuccess: () => navigate({ to: "/artifacts-design", search: back }),
                      onError: (error) => toast.error(error.message),
                    })
                  }
                >
                  Confirm delete
                </ActionButton>
              </>
            ) : (
              <ActionButton onClick={() => setConfirming(true)}>Delete</ActionButton>
            )}
            <ActionButton
              variant="primary"
              disabled={!dirty || !name.trim() || update.isPending}
              onClick={save}
            >
              Save template
            </ActionButton>
          </div>
        </header>
        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col bg-gc-sunken">
            <Suspense fallback={<Caption>Loading editor…</Caption>}>
              <plugin.Editor {...props} />
            </Suspense>
          </div>
          <aside
            aria-label="Format"
            className="flex w-[280px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-gc-border bg-gc-raised p-3"
          >
            <Suspense fallback={<Caption>Loading…</Caption>}>
              {plugin.FormatPanel && <plugin.FormatPanel {...props} />}
            </Suspense>
          </aside>
        </div>
      </div>
    </Provider>
  )
}

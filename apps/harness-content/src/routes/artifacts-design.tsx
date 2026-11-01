import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { PlusIcon } from "lucide-react"
import { useState } from "react"
import { useMe } from "@/api/queries"
import { ArtifactThemes, NewThemeDialog } from "@/components/design/artifact-themes"
import { NewTemplateDialog, Templates } from "@/components/design/templates"
import { Caption } from "@/components/labels"
import { AreaTabs } from "@/components/shell/area-tabs"
import { ActionButton } from "@/components/shell/form-controls"
import { usePageTitle } from "@/hooks/use-page-title"
import { type DesignTab, parseDesignSearch } from "@/lib/design-search"

export const Route = createFileRoute("/artifacts-design")({
  validateSearch: parseDesignSearch,
  component: ArtifactsDesign,
})

type NewTemplate = React.ComponentProps<typeof NewTemplateDialog>["initial"]

function ArtifactsDesign() {
  usePageTitle("Artifacts Design")
  const { tab, theme } = Route.useSearch()
  const navigate = useNavigate()
  const me = useMe().data
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newTheme, setNewTheme] = useState(false)
  const [newTemplate, setNewTemplate] = useState<NewTemplate | null>(null)
  const go = (next: { tab?: DesignTab; theme?: string }) =>
    navigate({ to: "/artifacts-design", search: { tab, theme, ...next }, replace: true })
  const themeId = theme ?? "dark"
  const canCreate = me !== undefined && me.role !== "viewer"

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-12 shrink-0 items-center gap-[9px] border-b border-gc-border px-5">
        <h1 className="text-sm font-bold text-gc-text">Artifacts Design</h1>
        <Caption className="tracking-[0.6px]">
          {tab === "themes"
            ? "THEMES AND TEMPLATES FOR ARTIFACTS"
            : "TEMPLATES BUILT ON AN ARTIFACT THEME"}
        </Caption>
      </header>
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-gc-border px-5">
        <AreaTabs
          label="Artifacts Design"
          tabs={[
            { id: "themes", label: "Artifact themes" },
            { id: "templates", label: "Templates" },
          ]}
          value={tab}
          onChange={(next) => go({ tab: next })}
        />
        {canCreate && (
          <ActionButton
            variant="primary"
            onClick={() =>
              tab === "themes"
                ? setNewTheme(true)
                : setNewTemplate({ layout: "cover", theme: themeId, name: "" })
            }
          >
            <PlusIcon aria-hidden />
            {tab === "themes" ? "New theme" : "New template"}
          </ActionButton>
        )}
      </div>
      <div
        id={`area-${tab}`}
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        className="flex min-h-0 flex-1 flex-col"
      >
        {tab === "themes" ? (
          <ArtifactThemes
            selectedId={theme}
            onSelect={(next) => {
              setEditingId(null)
              go({ theme: next })
            }}
            editingId={editingId}
            onEditing={setEditingId}
          />
        ) : (
          <Templates
            themeId={themeId}
            onTheme={(next) => go({ theme: next })}
            onNew={setNewTemplate}
          />
        )}
      </div>
      {newTheme && (
        <NewThemeDialog
          fromThemeId={theme}
          onClose={() => setNewTheme(false)}
          onCreated={(created) => {
            go({ theme: created })
            setEditingId(created)
          }}
        />
      )}
      {newTemplate && (
        <NewTemplateDialog initial={newTemplate} onClose={() => setNewTemplate(null)} />
      )}
    </div>
  )
}

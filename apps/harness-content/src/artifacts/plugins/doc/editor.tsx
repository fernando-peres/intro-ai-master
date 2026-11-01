import "@blocknote/shadcn/style.css"
import { filterSuggestionItems, insertOrUpdateBlockForSlashMenu } from "@blocknote/core/extensions"
import {
  type DefaultReactSuggestionItem,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react"
import { BlockNoteView } from "@blocknote/shadcn"
import { MessageSquareWarningIcon, SparklesIcon, WorkflowIcon } from "lucide-react"
import { useEffect, useState } from "react"
import type { ArtifactType } from "@/api/client"
import type { EditorProps, RendererProps } from "@/artifacts/plugin"
import {
  type DocEditor,
  type DocPartialBlock,
  docEditorSchema,
} from "@/artifacts/plugins/doc/blocks"
import type { DocContent } from "@/artifacts/plugins/doc/content"
import { useDocEditor } from "@/artifacts/plugins/doc/editor-context"
import { DocEmbedPlayback } from "@/artifacts/plugins/doc/embed-block"
import { insertBlock } from "@/artifacts/plugins/doc/insert"
import { EmbedPickerDialog } from "@/components/embed/embed-picker"
import { PresentationZoom } from "@/components/presentation/presentation-stage"
import { useStudioTheme } from "@/lib/studio-theme"

function useDocBlockNote(content: DocContent) {
  // Created once per mount; the workspace remounts the editor when the version changes.
  return useCreateBlockNote({
    schema: docEditorSchema,
    initialContent: content.blocks.length ? (content.blocks as DocPartialBlock[]) : undefined,
    domAttributes: { editor: { "aria-label": "Document content" } },
  })
}

function slashItems(
  editor: DocEditor,
  openPicker: (type: ArtifactType) => void,
): DefaultReactSuggestionItem[] {
  return [
    ...getDefaultReactSlashMenuItems(editor),
    {
      title: "Callout",
      subtext: "A warning or rule the reader must not miss",
      aliases: ["callout", "warning", "rule", "note"],
      group: "Blocks",
      icon: <MessageSquareWarningIcon size={18} />,
      onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "callout" }),
    },
    {
      title: "Diagram",
      subtext: "Embed a published diagram",
      aliases: ["diagram", "embed", "flow", "mermaid"],
      group: "Media & reuse",
      icon: <WorkflowIcon size={18} />,
      onItemClick: () => openPicker("diagram"),
    },
    {
      title: "Animation",
      subtext: "Embed a published animation",
      aliases: ["animation", "embed"],
      group: "Media & reuse",
      icon: <SparklesIcon size={18} />,
      onItemClick: () => openPicker("animation"),
    },
  ]
}

const pageClass =
  "w-full max-w-[640px] rounded-lg border border-gc-border bg-gc-raised py-6 [&_.bn-editor]:bg-transparent [&_.bn-editor]:px-6"

// The editable area stretches so a click below the last block focuses it. BlockNote's left
// padding stays: its drag and add handles sit there. `!` beats BlockNote's unlayered CSS.
const editorPageClass =
  "flex min-h-full w-full flex-col bg-gc-raised py-6 [&_.bn-container]:flex [&_.bn-container]:flex-1 [&_.bn-container]:flex-col [&_.bn-editor]:flex-1 [&_.bn-editor]:bg-transparent [&_.bn-editor]:pr-6!"

export function DocEditorView({
  content,
  onChange,
  readOnly,
  artifactId,
  locale,
}: EditorProps<DocContent>) {
  const editor = useDocBlockNote(content)
  const { setEditor, embedPicker, setEmbedPicker } = useDocEditor()
  const { theme } = useStudioTheme()

  useEffect(() => {
    setEditor(editor)
    return () => setEditor(null)
  }, [editor, setEditor])

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className={editorPageClass}>
        <BlockNoteView
          editor={editor}
          editable={!readOnly}
          slashMenu={false}
          theme={theme === "graphite-light" ? "light" : "dark"}
          onChange={() => onChange({ ...content, blocks: editor.document as DocContent["blocks"] })}
        >
          <SuggestionMenuController
            triggerCharacter="/"
            getItems={async (query) =>
              filterSuggestionItems(slashItems(editor, setEmbedPicker), query)
            }
          />
        </BlockNoteView>
      </div>
      {embedPicker && (
        <EmbedPickerDialog
          title={`Embed ${embedPicker}`}
          excludeId={artifactId}
          locale={locale}
          types={[embedPicker]}
          onClose={() => setEmbedPicker(null)}
          onPick={(props) => {
            setEmbedPicker(null)
            insertBlock(editor, { type: "raEmbed", props })
          }}
        />
      )}
    </div>
  )
}

/** Read-only view over the same schema, used by preview and the flow player. */
export function DocRenderer({
  content,
  showControls,
  presenting,
  still,
}: RendererProps<DocContent>) {
  const editor = useDocBlockNote(content)
  const { theme } = useStudioTheme()
  const [zoom, setZoom] = useState(1)
  if (still) {
    // For print: paper colours and full height, so long documents run onto further pages.
    return (
      <DocEmbedPlayback value="static">
        <div className="[&_.bn-container]:bg-transparent [&_.bn-editor]:bg-transparent">
          <BlockNoteView editor={editor} editable={false} theme="light" />
        </div>
      </DocEmbedPlayback>
    )
  }
  if (presenting) {
    return (
      <div className="h-full w-full overflow-y-auto">
        {showControls && <PresentationZoom zoom={zoom} onZoom={setZoom} />}
        <div
          data-testid="doc-presenting"
          className="px-[clamp(24px,6vw,96px)] py-16 [&_.bn-container]:bg-transparent [&_.bn-editor]:bg-transparent"
          style={{ zoom }}
        >
          <BlockNoteView
            editor={editor}
            editable={false}
            theme={theme === "graphite-light" ? "light" : "dark"}
          />
        </div>
      </div>
    )
  }
  return (
    <div className="flex h-full w-full justify-center overflow-y-auto">
      <div className={pageClass}>
        <BlockNoteView
          editor={editor}
          editable={false}
          theme={theme === "graphite-light" ? "light" : "dark"}
        />
      </div>
    </div>
  )
}

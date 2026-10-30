import "@blocknote/shadcn/style.css"
import { filterSuggestionItems, insertOrUpdateBlockForSlashMenu } from "@blocknote/core/extensions"
import {
  type DefaultReactSuggestionItem,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react"
import { BlockNoteView } from "@blocknote/shadcn"
import { MessageSquareWarningIcon } from "lucide-react"
import { useEffect } from "react"
import type { EditorProps, RendererProps } from "@/artifacts/plugin"
import {
  type DocEditor,
  type DocPartialBlock,
  docEditorSchema,
} from "@/artifacts/plugins/doc/blocks"
import type { DocContent } from "@/artifacts/plugins/doc/content"
import { useDocEditor } from "@/artifacts/plugins/doc/editor-context"
import { useStudioTheme } from "@/lib/studio-theme"

function useDocBlockNote(content: DocContent) {
  // Created once per mount; the workspace remounts the editor when the version changes.
  return useCreateBlockNote({
    schema: docEditorSchema,
    initialContent: content.blocks.length ? (content.blocks as DocPartialBlock[]) : undefined,
  })
}

function slashItems(editor: DocEditor): DefaultReactSuggestionItem[] {
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
  ]
}

const pageClass =
  "w-full max-w-[640px] rounded-lg border border-gc-border bg-gc-raised py-6 [&_.bn-editor]:bg-transparent [&_.bn-editor]:px-6"

export function DocEditorView({ content, onChange, readOnly }: EditorProps<DocContent>) {
  const editor = useDocBlockNote(content)
  const { setEditor } = useDocEditor()
  const { theme } = useStudioTheme()

  useEffect(() => {
    setEditor(editor)
    return () => setEditor(null)
  }, [editor, setEditor])

  return (
    <div className="flex h-full w-full justify-center overflow-y-auto">
      <div className={pageClass}>
        <BlockNoteView
          editor={editor}
          editable={!readOnly}
          slashMenu={false}
          theme={theme === "graphite-light" ? "light" : "dark"}
          onChange={() => onChange({ ...content, blocks: editor.document as DocContent["blocks"] })}
        >
          <SuggestionMenuController
            triggerCharacter="/"
            getItems={async (query) => filterSuggestionItems(slashItems(editor), query)}
          />
        </BlockNoteView>
      </div>
    </div>
  )
}

/** Read-only view over the same schema, used by preview and the flow player. */
export function DocRenderer({ content }: RendererProps<DocContent>) {
  const editor = useDocBlockNote(content)
  const { theme } = useStudioTheme()
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

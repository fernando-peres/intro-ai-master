import { BlockNoteEditor } from "@blocknote/core"
import { en, pt } from "@blocknote/core/locales"
import { BlockNoteView } from "@blocknote/shadcn"
import { ArrowDown, ArrowUp, RotateCcw } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState, useSyncExternalStore } from "react"
import { Button } from "@/components/ui/button"
import type { Language } from "@/i18n/language"
import { summaryContent } from "./content"
import { SummaryDraft } from "./draft"
import { summarySchema } from "./schema"
import "@blocknote/shadcn/style.css"
import "./summary.css"

const copies = {
  "en-US": {
    hint: "Click anywhere to edit. Type / to add a block.",
    scope: "Your personal copy · saved only in this browser · separate notes for each language",
    saving: "Saving…",
    saved: "Saved in this browser",
    error: "Couldn’t save",
    blocked:
      "Couldn’t open your saved summary. It has been preserved. Restore the original only if you want to replace it.",
    warning:
      "Edits are kept in memory, but may be lost when this tab closes. Browser storage is unavailable or full.",
    restore: "Restore original",
    confirm:
      "Replace your English summary and all its edits with the original? Your Portuguese copy will not change.",
    up: "Move block up",
    down: "Move block down",
    editor: "Editable generalization summary",
    retry: "Retry save",
  },
  "pt-BR": {
    hint: "Clique em qualquer lugar para editar. Digite / para adicionar um bloco.",
    scope: "Sua cópia pessoal · salva apenas neste navegador · anotações separadas por idioma",
    saving: "Salvando…",
    saved: "Salvo neste navegador",
    error: "Não foi possível salvar",
    blocked:
      "Não foi possível abrir seu resumo salvo. Ele foi preservado. Restaure o original somente se quiser substituí-lo.",
    warning:
      "As edições ficam na memória, mas podem ser perdidas ao fechar esta aba. O armazenamento do navegador está indisponível ou cheio.",
    restore: "Restaurar original",
    confirm:
      "Substituir seu resumo em português e todas as edições pelo original? Sua cópia em inglês não será alterada.",
    up: "Mover bloco para cima",
    down: "Mover bloco para baixo",
    editor: "Resumo editável de generalização",
    retry: "Tentar salvar novamente",
  },
}

// Failed writes survive route/language changes for the lifetime of this tab.
const drafts = new Map<Language, SummaryDraft>()
function openDraft(language: Language) {
  const previous = drafts.get(language)
  if (previous?.getSnapshot().status === "error") return previous
  return new SummaryDraft(language, summaryContent(language))
}

export function SummaryEditor({ language }: { language: Language }) {
  return <LanguageDocument key={language} language={language} />
}

function LanguageDocument({ language }: { language: Language }) {
  const copy = copies[language]
  const [draft] = useState(() => openDraft(language))
  const snapshot = useSyncExternalStore(draft.subscribe, draft.getSnapshot)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    drafts.set(language, draft)
    draft.flush()
    const onVisibility = () => {
      if (document.visibilityState === "hidden") draft.flush()
    }
    window.addEventListener("pagehide", draft.flush)
    window.addEventListener("beforeunload", draft.flush)
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      draft.flush()
      window.removeEventListener("pagehide", draft.flush)
      window.removeEventListener("beforeunload", draft.flush)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [draft, language])

  return (
    <section className="summary-document" aria-label={copy.editor}>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-3 border-b border-divider pb-5">
        <div className="space-y-2">
          <p className="text-sm text-fg-secondary">{copy.hint}</p>
          <p className="text-xs text-fg-muted">{copy.scope}</p>
          <p role="status" className="text-xs text-fg-secondary">
            {snapshot.status !== "blocked" ? copy[snapshot.status] : copy.error}
          </p>
        </div>
        <Button
          variant="outline"
          className="min-h-11"
          onClick={() => {
            if (!window.confirm(copy.confirm)) return
            draft.restore()
            setRevision((value) => value + 1)
          }}
        >
          <RotateCcw aria-hidden />
          {copy.restore}
        </Button>
      </div>
      {snapshot.status === "error" && (
        <div
          role="alert"
          className="mb-5 rounded border border-line bg-surface p-4 text-sm text-fg-secondary"
        >
          <p>{copy.warning}</p>
          <Button variant="outline" className="mt-3 min-h-11" onClick={draft.flush}>
            {copy.retry}
          </Button>
        </div>
      )}
      {snapshot.status === "blocked" ? (
        <p role="alert" className="rounded border border-line bg-surface p-5 text-fg-secondary">
          {copy.blocked}
        </p>
      ) : (
        <DocumentEditor key={revision} draft={draft} language={language} />
      )}
    </section>
  )
}

function DocumentEditor({ draft, language }: { draft: SummaryDraft; language: Language }) {
  const copy = copies[language]
  const { resolvedTheme } = useTheme()
  const [editor] = useState(() => {
    try {
      return BlockNoteEditor.create({
        schema: summarySchema,
        initialContent: draft.getSnapshot().blocks,
        dictionary: language === "pt-BR" ? pt : en,
        domAttributes: {
          editor: { "aria-label": copy.editor, role: "textbox", "aria-multiline": "true" },
        },
      })
    } catch {
      return null
    }
  })
  const [activeBlock, setActiveBlock] = useState<string>()
  useEffect(() => {
    if (!editor) draft.block()
  }, [editor, draft])
  if (!editor) return null

  const move = (direction: "up" | "down") => {
    if (!activeBlock) return
    if (direction === "up") editor.moveBlocksUp(activeBlock)
    else editor.moveBlocksDown(activeBlock)
    editor.setTextCursorPosition(activeBlock, "start")
    editor.focus()
  }

  return (
    <>
      <fieldset
        className="sticky top-0 z-10 mb-3 flex flex-wrap gap-2 border-b border-divider bg-canvas py-2"
        aria-label={copy.editor}
      >
        <Button
          variant="ghost"
          className="min-h-11"
          disabled={!activeBlock}
          onClick={() => move("up")}
        >
          <ArrowUp aria-hidden />
          {copy.up}
        </Button>
        <Button
          variant="ghost"
          className="min-h-11"
          disabled={!activeBlock}
          onClick={() => move("down")}
        >
          <ArrowDown aria-hidden />
          {copy.down}
        </Button>
      </fieldset>
      <BlockNoteView
        editor={editor}
        theme={resolvedTheme === "light" ? "light" : "dark"}
        onChange={() => draft.change(editor.document)}
        onSelectionChange={() => setActiveBlock(editor.getTextCursorPosition().block.id)}
      />
    </>
  )
}

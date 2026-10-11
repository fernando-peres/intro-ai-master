import { useEffect, useState } from "react"
import type { HighlighterCore } from "shiki/core"
import { createHighlighterCore } from "shiki/core"
import { createJavaScriptRegexEngine } from "shiki/engine/javascript"
import pythonLang from "shiki/langs/python.mjs"
import githubDark from "shiki/themes/github-dark.mjs"
import githubLight from "shiki/themes/github-light.mjs"

/** Shared by every `CodeBlock` on the page — Shiki's tokenizer only loads once. */
let highlighterPromise: Promise<HighlighterCore> | undefined
function getHighlighter() {
  highlighterPromise ??= createHighlighterCore({
    themes: [githubLight, githubDark],
    langs: [pythonLang],
    engine: createJavaScriptRegexEngine(),
  })
  return highlighterPromise
}

/** A short code snippet, syntax-highlighted for both light and dark themes (see index.css `.shiki`). */
export function CodeBlock({ code, lang = "python" }: { code: string; lang?: string }) {
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getHighlighter().then((highlighter) => {
      if (cancelled) return
      setHtml(
        highlighter.codeToHtml(code, {
          lang,
          themes: { light: "github-light", dark: "github-dark" },
          defaultColor: false,
        }),
      )
    })
    return () => {
      cancelled = true
    }
  }, [code, lang])

  if (!html) {
    return (
      <pre className="overflow-x-auto rounded-[3px] border border-divider bg-surface p-[18px] font-ui text-sm text-fg-secondary">
        <code>{code}</code>
      </pre>
    )
  }

  return (
    <div
      className="overflow-x-auto rounded-[3px] border border-divider bg-surface p-[18px] text-sm [&_pre]:!bg-transparent"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki's own tokenizer output, not user input.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

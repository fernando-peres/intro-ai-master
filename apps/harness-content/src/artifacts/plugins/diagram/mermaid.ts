import { useEffect, useState } from "react"
import type { SlideTheme } from "@/artifacts/plugins/slide/themes"

const PREVIEW_DELAY_MS = 150

let queue: Promise<unknown> = Promise.resolve()
let nextId = 0

function solidBackground(theme: SlideTheme): string {
  return theme.background.kind === "flat" ? theme.background.color : theme.background.to
}

/** Mermaid keeps global config and render state, so renders must run one at a time. */
export function renderMermaid(source: string, theme: SlideTheme): Promise<string> {
  const run = async () => {
    const { default: mermaid } = await import("mermaid")
    const background = solidBackground(theme)
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "base",
      themeVariables: {
        background,
        primaryColor: background,
        primaryBorderColor: theme.accent,
        primaryTextColor: theme.text,
        secondaryColor: background,
        tertiaryColor: background,
        lineColor: theme.muted,
        textColor: theme.text,
      },
    })
    await mermaid.parse(source)
    nextId += 1
    return (await mermaid.render(`mermaid-${nextId}`, source)).svg
  }
  const result = queue.then(run, run)
  queue = result.catch(() => {})
  return result
}

export type MermaidState = { svg: string; error: string | null }

/** The latest valid SVG for `source`; a parse error keeps the previous drawing on screen. */
export function useMermaid(source: string, theme: SlideTheme): MermaidState {
  const [state, setState] = useState<MermaidState>({ svg: "", error: null })
  useEffect(() => {
    let stale = false
    const timer = setTimeout(() => {
      renderMermaid(source, theme).then(
        (svg) => {
          if (!stale) setState({ svg, error: null })
        },
        (error: Error) => {
          if (!stale) setState((current) => ({ svg: current.svg, error: error.message }))
        },
      )
    }, PREVIEW_DELAY_MS)
    return () => {
      stale = true
      clearTimeout(timer)
    }
  }, [source, theme])
  return state
}

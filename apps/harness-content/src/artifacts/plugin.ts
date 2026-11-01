import type { ComponentType, ReactNode } from "react"
import type { z } from "zod"
import type { ArtifactType } from "@/api/client"

/** Props every editor-side component receives; `readOnly` covers published versions and viewers. */
export type EditorProps<C> = {
  content: C
  onChange: (next: C) => void
  readOnly: boolean
  /** The artifact and locale being edited, for panels that reference other artifacts. */
  artifactId: string
  locale: string
}

export type RendererProps<C> = {
  content: C
  /** False hides the renderer's own controls while presenting; shown when absent. */
  showControls?: boolean
  /** Full-screen stage: the renderer's background reaches every edge. */
  presenting?: boolean
  /** For print: the finished state, with no playback. */
  still?: boolean
}

export type ValidationResult<C> = { ok: true; content: C } | { ok: false; issues: string[] }

/**
 * One artifact type's editing contract (PRD §7.2). Editor and Renderer consume the same
 * schema-valid content; the renderer is what preview and the flow player show.
 */
export type ArtifactPlugin<C = unknown> = {
  type: ArtifactType
  /** Content schema version this plugin writes; older content goes through `migrate`. */
  schemaVersion: number
  schema: z.ZodType<C>
  createEmpty: () => C
  /** Upgrades content written at `fromVersion` to `schemaVersion`. */
  migrate: (fromVersion: number, content: unknown) => unknown
  extractAssets: (content: C) => string[]
  getSearchText: (content: C) => string
  /** May be `React.lazy`; the workspace and player render plugins inside Suspense. */
  Editor: ComponentType<EditorProps<C>>
  Renderer: ComponentType<RendererProps<C>>
  /** Optional inspector panels; the workspace shows a placeholder when absent. */
  FormatPanel?: ComponentType<EditorProps<C>>
  InsertPanel?: ComponentType<EditorProps<C>>
  /** Wraps the whole workspace, so Editor and inspector panels can share live editor state. */
  Provider?: ComponentType<{ children: ReactNode }>
  /** The content's own presentation theme id; absent when the type has no theme. */
  contentTheme?: (content: C) => string
  /** The content restyled with a trail theme id; the stored version is never changed. */
  withTheme?: (content: C, theme: string) => C
  /** Caption under the stage, e.g. "16:9". */
  stageLabel?: string
  /** The editor fills the stage edge to edge, with no padding or caption. */
  fillStage?: boolean
}

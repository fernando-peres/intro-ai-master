import { lazy } from "react"
import type { ArtifactPlugin } from "@/artifacts/plugin"
import { DiagramEditorProvider } from "@/artifacts/plugins/diagram/editor-context"
import {
  createEmptyDiagram,
  type DiagramContent,
  diagramSchema,
  diagramSearchText,
} from "@/artifacts/plugins/diagram/model"
import { hasSlideTheme } from "@/artifacts/plugins/slide/themes"

// React Flow is loaded only when a diagram is opened; Mermaid only when one uses it.
const viewModule = () => import("@/artifacts/plugins/diagram/view")
const panelsModule = () => import("@/artifacts/plugins/diagram/panels")

export const diagramPlugin: ArtifactPlugin<DiagramContent> = {
  type: "diagram",
  schemaVersion: 1,
  schema: diagramSchema,
  createEmpty: () => createEmptyDiagram(),
  migrate: (_from, content) => content,
  extractAssets: () => [],
  getSearchText: diagramSearchText,
  Editor: lazy(() => viewModule().then((m) => ({ default: m.DiagramEditorView }))),
  Renderer: lazy(() => viewModule().then((m) => ({ default: m.DiagramRenderer }))),
  FormatPanel: lazy(() => panelsModule().then((m) => ({ default: m.DiagramFormatPanel }))),
  InsertPanel: lazy(() => panelsModule().then((m) => ({ default: m.DiagramInsertPanel }))),
  Provider: DiagramEditorProvider,
  contentTheme: (content) => content.theme,
  withTheme: (content, theme) => (hasSlideTheme(theme) ? { ...content, theme } : content),
  fillStage: true,
}

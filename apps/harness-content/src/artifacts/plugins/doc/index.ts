import { lazy } from "react"
import type { ArtifactPlugin } from "@/artifacts/plugin"
import {
  createEmptyDoc,
  type DocContent,
  docAssets,
  docSchema,
  docSearchText,
} from "@/artifacts/plugins/doc/content"
import { DocEditorProvider } from "@/artifacts/plugins/doc/editor-context"

// BlockNote is large; load it only when a document is opened.
const editorModule = () => import("@/artifacts/plugins/doc/editor")
// Lazy as well: the panels reach `@/artifacts` through the embed components, which imports this file.
const panelsModule = () => import("@/artifacts/plugins/doc/panels")

export const docPlugin: ArtifactPlugin<DocContent> = {
  type: "doc",
  schemaVersion: 1,
  schema: docSchema,
  createEmpty: createEmptyDoc,
  migrate: (_from, content) => content,
  extractAssets: docAssets,
  getSearchText: docSearchText,
  Editor: lazy(() => editorModule().then((m) => ({ default: m.DocEditorView }))),
  Renderer: lazy(() => editorModule().then((m) => ({ default: m.DocRenderer }))),
  FormatPanel: lazy(() => panelsModule().then((m) => ({ default: m.DocFormatPanel }))),
  InsertPanel: lazy(() => panelsModule().then((m) => ({ default: m.DocInsertPanel }))),
  Provider: DocEditorProvider,
  stageLabel: "Document",
  fillStage: true,
}

import { lazy } from "react"
import type { ArtifactPlugin } from "@/artifacts/plugin"
import { SlideEditorProvider } from "@/artifacts/plugins/slide/editor-context"
import {
  createEmptySlide,
  SLIDE_THEMES,
  type SlideContent,
  type SlideThemeId,
  slideAssets,
  slideSchema,
  slideSearchText,
} from "@/artifacts/plugins/slide/model"

// Konva is loaded only when a slide is opened; the panels share that chunk.
const editorModule = () => import("@/artifacts/plugins/slide/editor")
const panelsModule = () => import("@/artifacts/plugins/slide/panels")

export const slidePlugin: ArtifactPlugin<SlideContent> = {
  type: "slide",
  schemaVersion: 1,
  schema: slideSchema,
  createEmpty: createEmptySlide,
  migrate: (_from, content) => content,
  extractAssets: slideAssets,
  getSearchText: slideSearchText,
  Editor: lazy(() => editorModule().then((m) => ({ default: m.SlideEditorView }))),
  Renderer: lazy(() => editorModule().then((m) => ({ default: m.SlideRenderer }))),
  FormatPanel: lazy(() => panelsModule().then((m) => ({ default: m.SlideFormatPanel }))),
  InsertPanel: lazy(() => panelsModule().then((m) => ({ default: m.SlideInsertPanel }))),
  Provider: SlideEditorProvider,
  contentTheme: (content) => content.theme,
  withTheme: (content, theme) =>
    theme in SLIDE_THEMES ? { ...content, theme: theme as SlideThemeId } : content,
  stageLabel: "16:9",
}

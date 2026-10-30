import { lazy } from "react"
import type { ArtifactPlugin } from "@/artifacts/plugin"
import {
  type AnimationContent,
  animationSchema,
  animationSearchText,
  createEmptyAnimation,
} from "@/artifacts/plugins/animation/model"
import { SLIDE_THEMES } from "@/artifacts/plugins/slide/model"

// Motion is loaded only when an animation is opened.
const playerModule = () => import("@/artifacts/plugins/animation/player")
const panelsModule = () => import("@/artifacts/plugins/animation/panels")

export const animationPlugin: ArtifactPlugin<AnimationContent> = {
  type: "animation",
  schemaVersion: 1,
  schema: animationSchema,
  createEmpty: () => createEmptyAnimation(),
  migrate: (_from, content) => content,
  extractAssets: () => [],
  getSearchText: animationSearchText,
  Editor: lazy(() => playerModule().then((m) => ({ default: m.AnimationEditorView }))),
  Renderer: lazy(() => playerModule().then((m) => ({ default: m.AnimationRenderer }))),
  FormatPanel: lazy(() => panelsModule().then((m) => ({ default: m.AnimationFormatPanel }))),
  InsertPanel: lazy(() => panelsModule().then((m) => ({ default: m.AnimationInsertPanel }))),
  contentTheme: (content) => content.props.scheme,
  withTheme: (content, theme) =>
    theme in SLIDE_THEMES
      ? ({ ...content, props: { ...content.props, scheme: theme } } as AnimationContent)
      : content,
  stageLabel: "16:9 · Motion",
}

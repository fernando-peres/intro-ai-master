import { NOVA_LAYOUTS, type NovaLayout, novaLayout } from "@/artifacts/plugins/slide/nova-layouts"
import {
  STARTER_LAYOUTS,
  type StarterLayout,
  starterLayout,
} from "@/artifacts/plugins/slide/starter-layouts"

export type LayoutId = StarterLayout | NovaLayout
type LayoutOption = { id: LayoutId; label: string }

export function layoutsFor(theme: string): readonly LayoutOption[] {
  return theme === "nova-ims-green" ? [...NOVA_LAYOUTS, ...STARTER_LAYOUTS] : STARTER_LAYOUTS
}

export function buildLayout(layout: LayoutId, theme: string) {
  return layout.startsWith("nova-")
    ? novaLayout(layout as NovaLayout, theme)
    : starterLayout(layout as StarterLayout, theme)
}

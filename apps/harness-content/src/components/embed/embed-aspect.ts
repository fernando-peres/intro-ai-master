import { type DiagramContent, flowAspect } from "@/artifacts/plugins/diagram/model"
import { getSlideTheme } from "@/artifacts/plugins/slide/themes"

const DEFAULT_ASPECT = 16 / 9

/** Width ÷ height of what an embed draws; animations always fill 16:9. */
export async function embedAspect(type: string, content: unknown): Promise<number> {
  if (type !== "diagram") return DEFAULT_ASPECT
  const diagram = content as DiagramContent
  if (diagram.engine === "flow") return flowAspect(diagram) ?? DEFAULT_ASPECT
  const { renderMermaid } = await import("@/artifacts/plugins/diagram/mermaid")
  const svg = await renderMermaid(diagram.source, getSlideTheme(diagram.theme))
  const box = /viewBox="[-\d.]+ [-\d.]+ ([\d.]+) ([\d.]+)"/.exec(svg)
  return box && Number(box[2]) > 0 ? Number(box[1]) / Number(box[2]) : DEFAULT_ASPECT
}

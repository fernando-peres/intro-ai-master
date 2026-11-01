import type { EmbeddedElement } from "@/artifacts/plugins/slide/model"
import { EmbeddedArtifact } from "@/components/embed/embedded-artifact"

export type EmbedBox = Pick<EmbeddedElement, "x" | "y" | "width" | "height" | "rotation">

type Props = {
  element: EmbeddedElement
  /** The element's box, or its live position while being dragged or resized. */
  box: EmbedBox
  scale: number
  hostTheme: string
  /** Editors and still views play nothing, whatever the element asks for. */
  still: boolean
}

/** HTML over the Stage at the element's scaled box; clicks pass through to Konva's hit box. */
export function EmbedOverlay({ element, box, scale, hostTheme, still }: Props) {
  return (
    <div
      data-testid="embed-overlay"
      className="pointer-events-none absolute z-1 overflow-hidden"
      style={{
        left: box.x * scale,
        top: box.y * scale,
        width: box.width * scale,
        height: box.height * scale,
        transform: `rotate(${box.rotation}deg)`,
        transformOrigin: "top left",
      }}
    >
      <EmbeddedArtifact
        embed={element.ref}
        hostTheme={hostTheme}
        playback={still ? "static" : element.playback}
      />
    </div>
  )
}

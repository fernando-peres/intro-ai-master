import type {
  SlideBackground,
  SlideContent,
  SlideElement,
  SlideThemeId,
} from "@/artifacts/plugins/slide/model"

/** Pure edits on slide content; each returns new content and never mutates its input. */

type Patch = Partial<Omit<SlideElement, "id" | "type">> & Record<string, unknown>

export function updateElement(content: SlideContent, id: string, patch: Patch): SlideContent {
  return {
    ...content,
    elements: content.elements.map((el) =>
      el.id === id ? ({ ...el, ...patch } as SlideElement) : el,
    ),
  }
}

export function updateStyle(
  content: SlideContent,
  ids: readonly string[],
  style: Record<string, unknown>,
): SlideContent {
  return {
    ...content,
    elements: content.elements.map((el) =>
      ids.includes(el.id) && "style" in el
        ? ({ ...el, style: dropUndefined({ ...el.style, ...style }) } as SlideElement)
        : el,
    ),
  }
}

export function moveBy(
  content: SlideContent,
  ids: readonly string[],
  dx: number,
  dy: number,
): SlideContent {
  return {
    ...content,
    elements: content.elements.map((el) =>
      ids.includes(el.id) && !el.locked ? { ...el, x: round(el.x + dx), y: round(el.y + dy) } : el,
    ),
  }
}

export type Transform = {
  id: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

/** Applies the geometry Konva reports after a drag or transformer gesture. */
export function applyTransforms(
  content: SlideContent,
  transforms: readonly Transform[],
): SlideContent {
  const byId = new Map(transforms.map((t) => [t.id, t]))
  return {
    ...content,
    elements: content.elements.map((el) => {
      const t = byId.get(el.id)
      if (!t || el.locked) return el
      return {
        ...el,
        x: round(t.x),
        y: round(t.y),
        width: Math.max(1, round(t.width)),
        height: Math.max(1, round(t.height)),
        rotation: round(((t.rotation % 360) + 360) % 360),
      }
    }),
  }
}

export function addElement(content: SlideContent, element: SlideElement): SlideContent {
  return { ...content, elements: [...content.elements, element] }
}

export function removeElements(content: SlideContent, ids: readonly string[]): SlideContent {
  return {
    ...content,
    elements: content.elements.filter((el) => !ids.includes(el.id) || el.locked),
  }
}

/** Copies of `ids`, offset so they are visible, appended on top; returns the new ids too. */
export function duplicateElements(
  content: SlideContent,
  ids: readonly string[],
): [SlideContent, string[]] {
  const copies = content.elements
    .filter((el) => ids.includes(el.id))
    .map((el) => ({ ...el, id: crypto.randomUUID(), x: el.x + 40, y: el.y + 40, locked: false }))
  return [{ ...content, elements: [...content.elements, ...copies] }, copies.map((el) => el.id)]
}

export function setTheme(content: SlideContent, theme: SlideThemeId): SlideContent {
  return { ...content, theme }
}

export function setBackground(
  content: SlideContent,
  background: SlideBackground | undefined,
): SlideContent {
  const { background: _previous, ...rest } = content
  return background ? { ...rest, background } : rest
}

/** Drops explicit style overrides (of `ids`, or every element) and, for all, the background. */
export function resetToTheme(content: SlideContent, ids?: readonly string[]): SlideContent {
  const cleared = {
    ...content,
    elements: content.elements.map((el) =>
      "style" in el && (!ids || ids.includes(el.id)) ? ({ ...el, style: {} } as SlideElement) : el,
    ),
  }
  return ids ? cleared : setBackground(cleared, undefined)
}

function round(value: number) {
  return Math.round(value * 100) / 100
}

function dropUndefined(record: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined))
}

import type { SlideBackground, SlideContent, SlideElement } from "@/artifacts/plugins/slide/model"

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

export function setTheme(content: SlideContent, theme: string): SlideContent {
  return { ...content, theme }
}

export function setBackground(
  content: SlideContent,
  background: SlideBackground | undefined,
): SlideContent {
  const { background: _previous, ...rest } = content
  return background ? { ...rest, background } : rest
}

/** The template's elements and background on this slide; the slide keeps its theme. */
export function applyTemplate(content: SlideContent, template: SlideContent): SlideContent {
  return setBackground({ ...content, elements: template.elements }, template.background)
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

/** `ids` plus every element sharing a group with one of them. */
export function expandToGroups(content: SlideContent, ids: readonly string[]): string[] {
  const groups = new Set(
    content.elements.filter((el) => ids.includes(el.id) && el.groupId).map((el) => el.groupId),
  )
  return content.elements
    .filter((el) => ids.includes(el.id) || (el.groupId && groups.has(el.groupId)))
    .map((el) => el.id)
}

/** Puts `ids` (two or more) in one new group, leaving any previous groups. */
export function groupElements(content: SlideContent, ids: readonly string[]): SlideContent {
  if (ids.length < 2) return content
  const groupId = crypto.randomUUID()
  return {
    ...content,
    elements: content.elements.map((el) => (ids.includes(el.id) ? { ...el, groupId } : el)),
  }
}

/** Dissolves every group that has a member in `ids`. */
export function ungroupElements(content: SlideContent, ids: readonly string[]): SlideContent {
  const groups = new Set(
    content.elements.filter((el) => ids.includes(el.id) && el.groupId).map((el) => el.groupId),
  )
  return {
    ...content,
    elements: content.elements.map((el) => {
      if (!el.groupId || !groups.has(el.groupId)) return el
      const { groupId: _dropped, ...rest } = el
      return rest as SlideElement
    }),
  }
}

export type Reorder = "front" | "back" | "forward" | "backward"

/** Changes paint order of `ids`, keeping their relative order (groups move as a block). */
export function reorder(
  content: SlideContent,
  ids: readonly string[],
  move: Reorder,
): SlideContent {
  const picked = content.elements.filter((el) => ids.includes(el.id))
  const rest = content.elements.filter((el) => !ids.includes(el.id))
  if (!picked.length || !rest.length) return content
  if (move === "front") return { ...content, elements: [...rest, ...picked] }
  if (move === "back") return { ...content, elements: [...picked, ...rest] }
  const positions = content.elements.flatMap((el, i) => (ids.includes(el.id) ? [i] : []))
  if (move === "forward") {
    // Insert after the first unselected element above the topmost selected one.
    const above = content.elements.findIndex(
      (el, i) => i > positions[positions.length - 1] && !ids.includes(el.id),
    )
    if (above === -1) return content
    const anchor = rest.indexOf(content.elements[above])
    return {
      ...content,
      elements: [...rest.slice(0, anchor + 1), ...picked, ...rest.slice(anchor + 1)],
    }
  }
  let below = -1
  for (let i = positions[0] - 1; i >= 0 && below === -1; i--) {
    if (!ids.includes(content.elements[i].id)) below = i
  }
  if (below === -1) return content
  const anchor = rest.indexOf(content.elements[below])
  return { ...content, elements: [...rest.slice(0, anchor), ...picked, ...rest.slice(anchor)] }
}

export type Align = "left" | "center" | "right" | "top" | "middle" | "bottom"

/**
 * Aligns unlocked `ids` on their shared bounding box, or to the canvas when the selection is
 * one element or one group. Uses unrotated boxes.
 */
export function alignElements(
  content: SlideContent,
  ids: readonly string[],
  align: Align,
  canvas: { width: number; height: number },
): SlideContent {
  const picked = content.elements.filter((el) => ids.includes(el.id))
  if (!picked.length) return content
  const groups = new Set(picked.map((el) => el.groupId ?? el.id))
  const bounds =
    groups.size === 1 ? { x: 0, y: 0, right: canvas.width, bottom: canvas.height } : boxOf(picked)
  const unit = groups.size === 1 && picked.length > 1 ? boxOf(picked) : null
  return {
    ...content,
    elements: content.elements.map((el) => {
      if (!ids.includes(el.id) || el.locked) return el
      // A lone group moves as one block so its layout is kept.
      const self = unit ?? { x: el.x, y: el.y, right: el.x + el.width, bottom: el.y + el.height }
      const width = self.right - self.x
      const height = self.bottom - self.y
      const dx = {
        left: bounds.x - self.x,
        center: (bounds.x + bounds.right) / 2 - width / 2 - self.x,
        right: bounds.right - width - self.x,
      }
      const dy = {
        top: bounds.y - self.y,
        middle: (bounds.y + bounds.bottom) / 2 - height / 2 - self.y,
        bottom: bounds.bottom - height - self.y,
      }
      const horizontal = align === "left" || align === "center" || align === "right"
      return horizontal
        ? { ...el, x: round(el.x + dx[align as keyof typeof dx]) }
        : { ...el, y: round(el.y + dy[align as keyof typeof dy]) }
    }),
  }
}

/** Spreads three or more unlocked `ids` so the gaps between them are equal. */
export function distributeElements(
  content: SlideContent,
  ids: readonly string[],
  axis: "horizontal" | "vertical",
): SlideContent {
  const picked = content.elements.filter((el) => ids.includes(el.id) && !el.locked)
  if (picked.length < 3) return content
  const key = axis === "horizontal" ? "x" : "y"
  const size = axis === "horizontal" ? "width" : "height"
  const sorted = [...picked].sort((a, b) => a[key] - b[key])
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const occupied = sorted.reduce((sum, el) => sum + el[size], 0)
  const gap = (last[key] + last[size] - first[key] - occupied) / (sorted.length - 1)
  const targets = new Map<string, number>()
  let cursor = first[key]
  for (const el of sorted) {
    targets.set(el.id, round(cursor))
    cursor += el[size] + gap
  }
  return {
    ...content,
    elements: content.elements.map((el) =>
      targets.has(el.id) ? { ...el, [key]: targets.get(el.id) } : el,
    ),
  }
}

function boxOf(elements: readonly SlideElement[]) {
  return {
    x: Math.min(...elements.map((el) => el.x)),
    y: Math.min(...elements.map((el) => el.y)),
    right: Math.max(...elements.map((el) => el.x + el.width)),
    bottom: Math.max(...elements.map((el) => el.y + el.height)),
  }
}

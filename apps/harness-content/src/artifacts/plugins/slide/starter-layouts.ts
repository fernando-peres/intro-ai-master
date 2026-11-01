import {
  CANVAS,
  type SlideContent,
  type SlideElement,
  type TextElement,
} from "@/artifacts/plugins/slide/model"

export const STARTER_LAYOUTS = [
  { id: "cover", label: "Cover" },
  { id: "agenda", label: "Agenda" },
  { id: "title-body", label: "Title + body" },
  { id: "two-column", label: "Two column" },
  { id: "diagram", label: "Diagram" },
  { id: "quote", label: "Quote" },
  { id: "data-table", label: "Data table" },
  { id: "closing", label: "Closing" },
] as const
export type StarterLayout = (typeof STARTER_LAYOUTS)[number]["id"]

export const LEFT = 140

const WIDTH = CANVAS.width - LEFT * 2

export type Box = { x: number; y: number; width: number; height: number }
type Variant = TextElement["variant"]

export function text(
  id: string,
  variant: Variant,
  value: string,
  box: Box,
  style: TextElement["style"] = {},
): SlideElement {
  const common = { rotation: 0, visible: true, locked: false, style }
  return { ...box, ...common, id, type: "text", variant, text: value }
}

export function rect(
  id: string,
  box: Box,
  style: Extract<SlideElement, { type: "rect" | "ellipse" }>["style"] = {},
): SlideElement {
  return { ...box, id, type: "rect", rotation: 0, visible: true, locked: false, style }
}

function arrow(id: string, box: Box): SlideElement {
  return { ...box, id, type: "arrow", rotation: 0, visible: true, locked: false, style: {} }
}

const heading = (value: string, y = 130) =>
  text("title", "title", value, { x: LEFT, y, width: WIDTH, height: 140 })

function tableCells(): SlideElement[] {
  const rows = [
    ["Measure", "Before", "After"],
    ["Accuracy", "—", "—"],
    ["Coverage", "—", "—"],
  ]
  const cellWidth = WIDTH / 3
  return rows.flatMap((row, r) =>
    row.flatMap((cell, c) => {
      const box = { x: LEFT + c * cellWidth, y: 340 + r * 170, width: cellWidth - 16, height: 154 }
      const inset = { x: box.x + 28, y: box.y + 48, width: box.width - 56, height: 70 }
      return [rect(`cell-${r}-${c}`, box), text(`label-${r}-${c}`, "body", cell, inset)]
    }),
  )
}

const LAYOUTS: Record<StarterLayout, () => SlideElement[]> = {
  cover: () => [
    text("eyebrow", "eyebrow", "Course name", { x: LEFT, y: 380, width: WIDTH, height: 50 }),
    heading("Presentation title", 450),
    text("body", "body", "Subtitle or presenter", { x: LEFT, y: 620, width: WIDTH, height: 80 }),
  ],
  agenda: () => [
    heading("Agenda"),
    text("items", "bullets", "First topic\nSecond topic\nThird topic\nFourth topic", {
      x: LEFT,
      y: 330,
      width: WIDTH,
      height: 500,
    }),
  ],
  "title-body": () => [
    heading("Slide title"),
    text("body", "body", "Write the main point of this slide here.", {
      x: LEFT,
      y: 330,
      width: WIDTH,
      height: 500,
    }),
  ],
  "two-column": () => {
    const column = (WIDTH - 80) / 2
    return [
      heading("Compare two ideas"),
      text("left", "body", "First column", { x: LEFT, y: 330, width: column, height: 560 }),
      text("right", "body", "Second column", {
        x: LEFT + column + 80,
        y: 330,
        width: column,
        height: 560,
      }),
    ]
  },
  diagram: () => {
    const node = { y: 460, width: 400, height: 220 }
    const gap = (WIDTH - node.width * 3) / 2
    return [
      heading("How it connects"),
      ...[0, 1, 2].flatMap((i) => {
        const x = LEFT + i * (node.width + gap)
        return [
          rect(`node-${i}`, { ...node, x }),
          text(`node-label-${i}`, "body", `Step ${i + 1}`, {
            x: x + 40,
            y: node.y + 70,
            width: node.width - 80,
            height: 80,
          }),
        ]
      }),
      ...[0, 1].map((i) =>
        arrow(`link-${i}`, {
          x: LEFT + node.width + i * (node.width + gap),
          y: node.y + node.height / 2,
          width: gap,
          height: 1,
        }),
      ),
    ]
  },
  quote: () => [
    text("quote", "title", "“A short, memorable quote goes here.”", {
      x: LEFT,
      y: 340,
      width: WIDTH,
      height: 280,
    }),
    text("source", "eyebrow", "Source name", { x: LEFT, y: 660, width: WIDTH, height: 50 }),
  ],
  "data-table": () => [heading("Results at a glance"), ...tableCells()],
  closing: () => [
    heading("Thank you", 420),
    text("body", "body", "Next step or contact", { x: LEFT, y: 590, width: WIDTH, height: 80 }),
  ],
}

export function starterLayout(layout: StarterLayout, theme: string): SlideContent {
  return { schemaVersion: 1, type: "slide", canvas: CANVAS, theme, elements: LAYOUTS[layout]() }
}

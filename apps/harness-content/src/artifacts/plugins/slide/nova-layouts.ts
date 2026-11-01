import {
  CANVAS,
  FONTS,
  type SlideContent,
  type SlideElement,
} from "@/artifacts/plugins/slide/model"
import { type Box, LEFT, rect, text } from "@/artifacts/plugins/slide/starter-layouts"
import { NOVA_BACKGROUNDS } from "@/artifacts/plugins/slide/themes"

export const NOVA_LAYOUTS = [
  { id: "nova-cover", label: "Nova cover" },
  { id: "nova-section", label: "Nova section" },
  { id: "nova-lesson", label: "Nova lesson" },
  { id: "nova-agenda", label: "Nova agenda" },
  { id: "nova-content", label: "Nova content" },
  { id: "nova-takeaways", label: "Nova takeaways" },
] as const
export type NovaLayout = (typeof NOVA_LAYOUTS)[number]["id"]

const INK = "#0D0A06"
const WHITE = "#FFFFFF"
const ACTIVATION = "#86EFB8"
const RIGHT_EDGE = CANVAS.width - LEFT
const WIDTH = RIGHT_EDGE - LEFT

/** Upper half of the PDF's pixel mark, in its 1333×750 page units; the lower half mirrors it. */
const MARK: Box[] = [
  { x: 0, y: 77, width: 37, height: 30 },
  { x: 37, y: 107, width: 120, height: 60 },
  { x: 157, y: 167, width: 60, height: 60 },
  { x: 0, y: 197, width: 97, height: 60 },
  { x: 217, y: 227, width: 60, height: 119 },
  { x: 97, y: 256, width: 60, height: 60 },
  { x: 157, y: 316, width: 60, height: 60 },
  { x: 276, y: 346, width: 30, height: 30 },
]
const MARK_CENTRE = 375

function pixelMark(scale: number, centreY: number): SlideElement[] {
  const cells = MARK.flatMap((box) => [box, { ...box, y: 2 * MARK_CENTRE - box.y - box.height }])
  return cells.map((cell, index) => ({
    ...rect(
      `mark-${index}`,
      {
        x: cell.x * scale,
        y: centreY + (cell.y - MARK_CENTRE) * scale,
        width: cell.width * scale,
        height: cell.height * scale,
      },
      { fill: WHITE, strokeWidth: 0, cornerRadius: 0 },
    ),
    groupId: "pixel-mark",
    name: "Pixel mark",
  }))
}

function logo(tone: "dark" | "light"): SlideElement {
  return {
    id: "logo",
    type: "image",
    src: `/nova-ims/logo-${tone}.png`,
    alt: "NOVA IMS Information Management School",
    fit: "contain",
    x: 60,
    y: 982,
    width: 298,
    height: 80,
    rotation: 0,
    visible: true,
    locked: false,
  }
}

function pageNumber(color: string): SlideElement {
  return text(
    "page",
    "body",
    "1",
    { x: RIGHT_EDGE, y: 1000, width: 100, height: 40 },
    { fontSize: 22, color, align: "right" },
  )
}

function heading(value: string, color: string, x = LEFT): SlideElement[] {
  return [
    text("eyebrow", "eyebrow", "Section", { x, y: 88, width: WIDTH, height: 40 }, { fontSize: 26 }),
    text("title", "title", value, { x, y: 126, width: WIDTH, height: 90 }, { fontSize: 64, color }),
  ]
}

const LAYOUTS: Record<NovaLayout, () => { background: string; elements: SlideElement[] }> = {
  "nova-cover": () => ({
    background: NOVA_BACKGROUNDS.cover,
    elements: [
      ...pixelMark(1.44, 540),
      rect(
        "pill",
        { x: 627, y: 262, width: 432, height: 62 },
        { fill: INK, strokeWidth: 0, cornerRadius: 31 },
      ),
      text(
        "date",
        "body",
        "Class 1 - 1 January 2026",
        { x: 627, y: 275, width: 432, height: 36 },
        { fontSize: 28, color: ACTIVATION, align: "center", lineHeight: 1.2 },
      ),
      text(
        "title",
        "title",
        "Presentation\ntitle",
        { x: 627, y: 355, width: 1150, height: 230 },
        { fontSize: 104, fontWeight: 700, color: INK },
      ),
      text(
        "subtitle",
        "body",
        "Course name",
        { x: 627, y: 620, width: 1150, height: 70 },
        { fontSize: 50, fontWeight: 300, color: INK, lineHeight: 1.2 },
      ),
      text(
        "programme",
        "body",
        "Programme name",
        { x: 627, y: 705, width: 1150, height: 45 },
        { fontSize: 33, fontWeight: 600, color: INK, lineHeight: 1.2 },
      ),
      text(
        "authors",
        "body",
        "Author · Author",
        { x: 627, y: 762, width: 1150, height: 45 },
        { fontSize: 33, fontWeight: 300, color: INK, lineHeight: 1.2 },
      ),
      logo("dark"),
    ],
  }),
  "nova-section": () => ({
    background: NOVA_BACKGROUNDS.cover,
    elements: [
      ...pixelMark(0.774, 572),
      text(
        "title",
        "title",
        "01. Section",
        { x: 313, y: 505, width: 1300, height: 110 },
        { fontSize: 84, fontWeight: 500, color: INK },
      ),
      logo("dark"),
      pageNumber(INK),
    ],
  }),
  "nova-lesson": () => {
    const pills = ["Overview", "Conceptual", "Technical", "Deep dive"]
    return {
      background: NOVA_BACKGROUNDS.lesson,
      elements: [
        ...heading("Lesson title", ACTIVATION, 188),
        text(
          "depth",
          "eyebrow",
          "Depth",
          { x: 188, y: 305, width: 640, height: 40 },
          { fontSize: 26 },
        ),
        text(
          "objective-label",
          "eyebrow",
          "Objective",
          { x: 1006, y: 305, width: 720, height: 40 },
          { fontSize: 26 },
        ),
        ...pills.flatMap((label, index) => {
          const box = { x: 188, y: 365 + index * 138, width: 640, height: 114 }
          return [
            rect(
              `pill-${index}`,
              box,
              index === 0
                ? { fill: ACTIVATION, stroke: WHITE, strokeWidth: 14, cornerRadius: 24 }
                : { fill: ACTIVATION, strokeWidth: 0, cornerRadius: 24 },
            ),
            text(
              `pill-label-${index}`,
              "body",
              label,
              { x: box.x, y: box.y + 26, width: box.width, height: 62 },
              {
                fontFamily: FONTS.cmuSerif,
                fontSize: 50,
                fontWeight: index === 0 ? 700 : 400,
                color: INK,
                align: "center",
                lineHeight: 1.2,
              },
            ),
          ]
        }),
        text(
          "objective",
          "body",
          "State what this lesson will achieve.",
          { x: 1006, y: 365, width: 720, height: 300 },
          { fontFamily: FONTS.cmuSerif, fontSize: 50, color: WHITE, lineHeight: 1.35 },
        ),
        pageNumber(WHITE),
      ],
    }
  },
  "nova-agenda": () => ({
    background: NOVA_BACKGROUNDS.slide,
    elements: [
      ...pixelMark(0.774, 572),
      text(
        "items",
        "body",
        "01. First topic\n\n02. Second topic\n\n03. Third topic",
        { x: 684, y: 225, width: 1000, height: 600 },
        { fontSize: 34, color: WHITE, lineHeight: 1.5 },
      ),
      logo("light"),
      pageNumber(WHITE),
    ],
  }),
  "nova-content": () => ({
    background: NOVA_BACKGROUNDS.slide,
    elements: [
      ...heading("Slide title", WHITE),
      text(
        "lead",
        "body",
        "One or two sentences that carry the point of the slide.",
        { x: LEFT, y: 215, width: 1250, height: 110 },
        { fontFamily: FONTS.cmuSerif, fontSize: 38, color: WHITE, lineHeight: 1.35 },
      ),
      pageNumber(WHITE),
    ],
  }),
  "nova-takeaways": () => ({
    background: NOVA_BACKGROUNDS.takeaways,
    elements: [
      ...heading("Key takeaways", ACTIVATION),
      text(
        "items",
        "bullets",
        "First takeaway\nSecond takeaway\nThird takeaway",
        { x: LEFT, y: 300, width: WIDTH, height: 500 },
        { color: WHITE },
      ),
      pageNumber(WHITE),
    ],
  }),
}

export function novaLayout(layout: NovaLayout, theme: string): SlideContent {
  const { background, elements } = LAYOUTS[layout]()
  return {
    schemaVersion: 1,
    type: "slide",
    canvas: CANVAS,
    theme,
    background: { kind: "flat", color: background },
    elements,
  }
}

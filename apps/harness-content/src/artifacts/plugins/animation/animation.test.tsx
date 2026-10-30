import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { useState } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, beforeAll, describe, expect, it } from "vitest"
import fixture from "@/artifacts/plugins/animation/fixtures/dod5-animation.json"
import { describeFields } from "@/artifacts/plugins/animation/form-fields"
import {
  type AnimationContent,
  animationSchema,
  createEmptyAnimation,
  getTemplate,
  switchTemplate,
  TEMPLATES,
} from "@/artifacts/plugins/animation/model"
import { AnimationFormatPanel, applyProps } from "@/artifacts/plugins/animation/panels"
import { AnimationPlayer, toMotionSequence } from "@/artifacts/plugins/animation/player"
import { sequenceDuration } from "@/artifacts/plugins/animation/templates/types"
import { SLIDE_THEMES } from "@/artifacts/plugins/slide/model"

const reload = (content: AnimationContent) =>
  animationSchema.parse(JSON.parse(JSON.stringify(content)))
const frame = (content: AnimationContent) => {
  const { Scene } = getTemplate(content.template)
  return renderToStaticMarkup(<Scene props={content.props} hidden={false} />)
}

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  })) as unknown as typeof window.matchMedia
})
afterEach(cleanup)

describe("templates", () => {
  it.each(TEMPLATES.map((t) => [t.id, t] as const))(
    "%s exposes every prop as a control",
    (_, t) => {
      const fields = describeFields(t.props)
      expect(fields.map((f) => f.key)).toEqual(Object.keys(t.props.shape))
      expect(new Set(fields.map((f) => f.kind))).toEqual(
        new Set(["text", "list", "enum", "color", "toggle", "range"]),
      )
    },
  )

  it("animates exactly the parts each scene names", () => {
    for (const t of TEMPLATES) {
      const content = createEmptyAnimation(t.id)
      const named = [...frame(content).matchAll(/data-anim="([^"]+)"/g)].map((m) => m[1]).sort()
      const animated = getTemplate(t.id)
        .sequence(content.props)
        .map((s) => s.target)
        .sort()
      expect(animated).toEqual(named)
      expect(toMotionSequence(getTemplate(t.id).sequence(content.props))).toHaveLength(named.length)
    }
  })

  it("opens legacy stub content and keeps shared props across a template switch", () => {
    const legacy = animationSchema.parse({ schemaVersion: 1, type: "animation" })
    expect(legacy.template).toBe("animation.reveal")
    const custom = applyProps(legacy, { ...legacy.props, scheme: "mint", accent: "#FF0066" })
    const switched = custom && switchTemplate(custom, "animation.stepsDiagram")
    expect(switched?.props).toMatchObject({ scheme: "mint", accent: "#FF0066" })
    expect(switched?.props).toHaveProperty("steps")
  })

  it("rejects values the schema does not allow", () => {
    const content = createEmptyAnimation()
    expect(applyProps(content, { ...content.props, accent: "red" })).toBeNull()
    expect(applyProps(content, { ...content.props, duration: 9 })).toBeNull()
    expect(applyProps(content, { ...content.props, points: [] })).toBeNull()
  })
})

function Harness({
  initial,
  seen,
}: {
  initial: AnimationContent
  seen: { current: AnimationContent }
}) {
  const [content, setContent] = useState(initial)
  seen.current = content
  return (
    <>
      <AnimationFormatPanel
        content={content}
        onChange={setContent}
        readOnly={false}
        artifactId="a"
        locale="en"
      />
      <AnimationPlayer content={content} />
    </>
  )
}

describe("definition of done 5: generated animation, author edits, preview honours them", () => {
  it("form edits land in the props, the saved content and the player's frame", async () => {
    const generated = animationSchema.parse(fixture)
    const seen = { current: generated }
    render(<Harness initial={generated} seen={seen} />)

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Eval run, end to end" } })
    fireEvent.change(screen.getByLabelText("Steps 2 Label"), { target: { value: "Re-run" } })
    fireEvent.click(screen.getByText("Add step"))
    fireEvent.change(screen.getByLabelText("Steps 4 Label"), { target: { value: "Ship" } })
    fireEvent.change(screen.getByLabelText("Colour scheme"), { target: { value: "mint" } })
    fireEvent.change(screen.getByLabelText("Accent"), { target: { value: "#ff6b35" } })
    fireEvent.change(screen.getByLabelText("Step duration"), { target: { value: "1.4" } })
    fireEvent.change(screen.getByLabelText("Transition"), { target: { value: "zoom" } })
    await act(async () => {})

    const saved = reload(seen.current)
    expect(saved).toEqual(seen.current)
    const props = saved.props as Record<string, unknown>
    expect(props).toMatchObject({
      title: "Eval run, end to end",
      scheme: "mint",
      accent: "#FF6B35",
      stepDuration: 1.4,
      transition: "zoom",
    })
    expect((props.steps as { label: string }[]).map((s) => s.label)).toEqual([
      "Collect",
      "Re-run",
      "Grade",
      "Ship",
    ])

    // What the player shows is built from exactly these props.
    const player = screen.getByTestId("animation-frame")
    expect(player.textContent).toContain("Eval run, end to end")
    expect(player.textContent).toContain("Re-run")
    expect(player.textContent).toContain("Ship")
    expect(player.innerHTML).toContain("rgb(255, 107, 53)")
    expect(frame(saved)).toContain(SLIDE_THEMES.mint.text)

    const segments = getTemplate(saved.template).sequence(saved.props)
    const nodes = segments.filter((s) => s.target.startsWith("node-"))
    expect(nodes).toHaveLength(4)
    expect(nodes.every((s) => s.duration === 1.4 && "scale" in s.keyframes)).toBe(true)
    expect(sequenceDuration(segments)).toBeGreaterThan(4 * 1.4)
  })
})

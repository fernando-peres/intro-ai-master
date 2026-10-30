import { describe, expect, it } from "vitest"
import type { Schemas } from "@/api/client"
import {
  addPill,
  addStep,
  addUnit,
  containerOf,
  containers,
  flattenSteps,
  fromRevision,
  moveStepTo,
  moveWithin,
  patchRationale,
  placementLabels,
  placementOf,
  removeGroup,
  toDraftIn,
} from "@/lib/outline"
import { newStep } from "@/lib/trail"

const step = (position: number): Schemas["StepOut"] => ({
  id: `fst_${position}`,
  position,
  artifactId: `art_${position}`,
  locale: "en",
  artifactVersionId: `ver_${position}`,
  artifactTitle: `Artifact ${position}`,
  artifactType: "slide",
  versionNumber: 1,
  versionState: "published",
})

const ref = (position: number) => ({ kind: "step" as const, step: position })

const revision = {
  steps: [step(1), step(2), step(3)],
  outline: {
    rationale: { objectives: ["Score a harness"] },
    nodes: [
      ref(1),
      {
        kind: "unit" as const,
        key: "u1",
        title: "Basics",
        children: [
          { kind: "pill" as const, key: "p1", title: "Scoring", children: [ref(2)] },
          ref(3),
        ],
      },
    ],
  },
}

const ids = (outline: ReturnType<typeof fromRevision>) =>
  flattenSteps(outline).map((entry) => entry.artifactId)

describe("trail outline", () => {
  it("round-trips the server outline with steps in play order", () => {
    const outline = fromRevision(revision)
    expect(ids(outline)).toEqual(["art_1", "art_2", "art_3"])
    expect(outline.rationale.objectives).toEqual(["Score a harness"])
    const draft = toDraftIn(outline)
    expect(draft.steps.map((entry) => entry.artifactId)).toEqual(["art_1", "art_2", "art_3"])
    expect(draft.outline?.nodes).toEqual([
      ref(1),
      {
        kind: "unit",
        key: "u1",
        title: "Basics",
        rationale: expect.any(Object),
        children: [
          {
            kind: "pill",
            key: "p1",
            title: "Scoring",
            rationale: expect.any(Object),
            children: [ref(2)],
          },
          ref(3),
        ],
      },
    ])
  })

  it("keeps steps an old revision's outline does not mention", () => {
    const outline = fromRevision({ steps: [step(1), step(2)], outline: {} })
    expect(ids(outline)).toEqual(["art_1", "art_2"])
    expect(outline.nodes.every((node) => node.kind === "step")).toBe(true)
  })

  it("numbers steps by reading order after a move", () => {
    const outline = fromRevision(revision)
    const first = flattenSteps(outline)[0]
    const moved = moveStepTo(outline, first.key, "p1")
    expect(ids(moved)).toEqual(["art_2", "art_1", "art_3"])
    expect(containerOf(moved, first.key)).toBe("p1")
    expect(placementOf(moved, first.key).unit?.title).toBe("Basics")
    expect(toDraftIn(moved).outline?.nodes?.[0]).toMatchObject({ kind: "unit" })
  })

  it("reorders inside one container", () => {
    const outline = fromRevision(revision)
    const third = flattenSteps(outline)[2]
    expect(ids(moveWithin(outline, "u1", third.key, "p1"))).toEqual(["art_1", "art_3", "art_2"])
  })

  it("adds units, pills and steps with fresh keys", () => {
    const [withUnit, unitKey] = addUnit(fromRevision(revision), "Practice")
    expect(unitKey).toBe("u2")
    const [withPill, pillKey] = addPill(withUnit, unitKey, "Drill")
    expect(pillKey).toBe("p2")
    const added = newStep({ ...step(4), artifactId: "art_4" })
    const outline = addStep(withPill, added, pillKey)
    expect(containerOf(outline, added.key)).toBe("p2")
    expect(containers(outline).map((entry) => entry.label)).toEqual([
      "Trail root",
      "Basics",
      "Basics › Scoring",
      "Practice",
      "Practice › Drill",
    ])
  })

  it("never drops steps when a unit or pill is removed", () => {
    const outline = fromRevision(revision)
    const withoutPill = removeGroup(outline, "p1")
    expect(ids(withoutPill)).toEqual(["art_1", "art_2", "art_3"])
    const withoutUnit = removeGroup(outline, "u1")
    expect(ids(withoutUnit)).toEqual(["art_1", "art_2", "art_3"])
    expect(withoutUnit.nodes.every((node) => node.kind === "step")).toBe(true)
  })

  it("stores the trail's own rationale under the null key", () => {
    const outline = patchRationale(fromRevision(revision), null, {
      ...fromRevision(revision).rationale,
      summary: "Why",
    })
    expect(toDraftIn(outline).outline?.rationale?.summary).toBe("Why")
  })

  it("labels played steps with their unit and pill", () => {
    const labels = placementLabels(revision.outline)
    expect([labels.get(1), labels.get(2), labels.get(3)]).toEqual([
      undefined,
      "Basics › Scoring",
      "Basics",
    ])
  })
})

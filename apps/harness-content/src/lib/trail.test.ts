import { describe, expect, it } from "vitest"
import {
  formatClock,
  fromServer,
  moveItem,
  newStep,
  resolveTheme,
  selectedSteps,
  stepSeconds,
  toStepIn,
  totalSeconds,
  USE_ARTIFACT_THEME,
} from "@/lib/trail"

const base = {
  artifactId: "art_1",
  locale: "en",
  artifactVersionId: "ver_1",
  artifactTitle: "Harness scoring",
  artifactType: "slide" as const,
  versionNumber: 1,
  versionState: "published" as const,
}

describe("trail steps", () => {
  it("time timed steps by their advance and manual steps by the artifact's plan", () => {
    expect(stepSeconds({ advanceSeconds: 42, durationSeconds: 90 })).toBe(42)
    expect(stepSeconds({ advanceSeconds: null, durationSeconds: 90 })).toBe(90)
    expect(totalSeconds([{ advanceSeconds: 30 }, { durationSeconds: 45 }, {}])).toBe(75)
    expect([formatClock(42), formatClock(125), formatClock(3725)]).toEqual([
      "0:42",
      "2:05",
      "62:05",
    ])
  })

  it("reorder without losing anything, and ignore out-of-range moves", () => {
    expect(moveItem(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"])
    expect(moveItem(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"])
    const same = ["a"]
    expect(moveItem(same, 0, 3)).toBe(same)
  })

  it("send only the step fields the API stores", () => {
    const [step] = fromServer([{ ...base, id: "fst_1", position: 1, advanceSeconds: 10 }])
    expect(step.key).toMatch(/^s\d+$/)
    expect(toStepIn(step)).toEqual({
      artifactId: "art_1",
      locale: "en",
      artifactVersionId: "ver_1",
      label: null,
      presenterNote: null,
      advanceSeconds: 10,
      themeOverride: null,
    })
    expect(newStep(base).key).not.toBe(step.key)
  })
})

describe("theme resolution", () => {
  it("lets the trail theme win unless the step keeps or names its own", () => {
    expect(resolveTheme(null, "violet", "dark")).toEqual({ theme: "violet", source: "trail" })
    expect(resolveTheme(USE_ARTIFACT_THEME, "violet", "dark")).toEqual({
      theme: "dark",
      source: "artifact",
    })
    expect(resolveTheme("mint", "violet", "dark")).toEqual({ theme: "mint", source: "step" })
    expect(resolveTheme(null, null, "cobalt")).toEqual({ theme: "cobalt", source: "artifact" })
  })
})

describe("selectedSteps", () => {
  it("keeps trail order and leaves out unselected steps", () => {
    const picked = selectedSteps(["a", "b", "c", "d"], "4,1,3")
    expect(picked).toEqual([
      { step: "a", position: 1 },
      { step: "c", position: 3 },
      { step: "d", position: 4 },
    ])
  })
})

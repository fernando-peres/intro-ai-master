import { describe, expect, it } from "vitest"
import { buildLibraryTree, locationTrail } from "@/lib/library-tree"
import { artifact, location } from "@/test/fixtures"

const LOCATIONS = [
  location({ id: "box", title: "Intro to AI" }),
  location({ id: "unit", kind: "unit", parentId: "box", title: "Foundations" }),
  location({ id: "sec", kind: "section", parentId: "unit", title: "What is a model" }),
  location({ id: "box2", title: "Prompting" }),
]

describe("buildLibraryTree", () => {
  it("nests locations and attaches artifacts with depths", () => {
    const tree = buildLibraryTree(LOCATIONS, [
      artifact({ id: "a", locationId: "sec" }),
      artifact({ id: "b", locationId: "box" }),
    ])
    expect(tree.map((node) => node.location.id)).toEqual(["box", "box2"])
    const [box] = tree
    expect(box.artifacts.map((a) => a.id)).toEqual(["b"])
    const section = box.children[0].children[0]
    expect(section.location.id).toBe("sec")
    expect(section.depth).toBe(2)
    expect(section.artifacts.map((a) => a.id)).toEqual(["a"])
  })

  it("drops children whose parent is missing (archived) instead of promoting them", () => {
    const tree = buildLibraryTree([location({ id: "orphan", kind: "unit", parentId: "gone" })], [])
    expect(tree).toEqual([])
  })
})

describe("locationTrail", () => {
  it("walks to the box", () => {
    expect(locationTrail(LOCATIONS, "sec")).toEqual([
      "Intro to AI",
      "Foundations",
      "What is a model",
    ])
    expect(locationTrail(LOCATIONS, undefined)).toEqual([])
  })
})

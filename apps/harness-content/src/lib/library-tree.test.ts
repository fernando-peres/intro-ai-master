import { describe, expect, it } from "vitest"
import {
  ancestorsOf,
  buildLibraryTree,
  filterTree,
  findNode,
  locationAncestors,
  locationTrail,
} from "@/lib/library-tree"
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

describe("totals", () => {
  const counts = { box: 1, unit: 2, sec: 300 }

  it("sums server counts down the subtree, whatever was loaded", () => {
    const [box, box2] = buildLibraryTree(LOCATIONS, [], counts)
    expect(box.total).toBe(303)
    expect(box.children[0].total).toBe(302)
    expect(box2.total).toBe(0)
  })

  it("falls back to the loaded artifacts until counts arrive", () => {
    const [box] = buildLibraryTree(LOCATIONS, [artifact({ id: "a", locationId: "sec" })])
    expect(box.total).toBe(1)
  })

  it("keeps a location's total when a filter prunes its content", () => {
    const tree = buildLibraryTree(
      LOCATIONS,
      [artifact({ id: "a", title: "Neuron", locationId: "sec" })],
      counts,
    )
    expect(filterTree(tree, "neuron")[0].total).toBe(303)
  })
})

describe("lookups", () => {
  it("finds a nested node", () => {
    const tree = buildLibraryTree(LOCATIONS, [])
    expect(findNode(tree, "sec")?.location.id).toBe("sec")
    expect(findNode(tree, "missing")).toBeUndefined()
  })

  it("lists ancestors from the box down", () => {
    expect(locationAncestors(LOCATIONS, "sec")).toEqual(["box", "unit"])
    expect(locationAncestors(LOCATIONS, "box")).toEqual([])
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

describe("tree navigation", () => {
  const tree = buildLibraryTree(LOCATIONS, [
    artifact({ id: "ra_deep", title: "Neuron", locationId: "sec" }),
  ])

  it("filters to matches and the ancestors that reach them", () => {
    const [box] = filterTree(tree, "neuron")
    expect(box.location.id).toBe("box")
    expect(box.children[0].children[0].artifacts[0].id).toBe("ra_deep")
    expect(filterTree(tree, "nothing here")).toEqual([])
    expect(filterTree(tree, "  ")).toBe(tree)
  })

  it("finds the path to an artifact", () => {
    expect(ancestorsOf(tree, "ra_deep")).toEqual(["box", "unit", "sec"])
    expect(ancestorsOf(tree, "missing")).toEqual([])
  })
})

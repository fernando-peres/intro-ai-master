import { classifyTree, entropy, id3, informationGain } from "./decision-tree"

const rows = [
  { sky: "sun", wind: "low", play: "yes" },
  { sky: "sun", wind: "high", play: "yes" },
  { sky: "rain", wind: "low", play: "no" },
  { sky: "rain", wind: "high", play: "no" },
]

test("entropy is 1 bit for an even split and 0 for a pure set", () => {
  expect(entropy(["a", "b", "a", "b"])).toBeCloseTo(1)
  expect(entropy(["a", "a"])).toBe(0)
})

test("the attribute that fully explains the label has the full gain", () => {
  expect(informationGain(rows, "sky", "play")).toBeCloseTo(1)
  expect(informationGain(rows, "wind", "play")).toBeCloseTo(0)
})

test("id3 splits on the most informative attribute and classifies its training rows", () => {
  const tree = id3(rows, ["wind", "sky"], "play")
  expect(tree.kind === "split" && tree.attribute).toBe("sky")
  for (const r of rows) expect(classifyTree(tree, r)).toBe(r.play)
})

test("an unseen attribute value falls back to the node's majority label", () => {
  const tree = id3([...rows, { sky: "sun", wind: "low", play: "yes" }], ["sky"], "play")
  expect(classifyTree(tree, { sky: "snow", wind: "low", play: "?" })).toBe("yes")
})

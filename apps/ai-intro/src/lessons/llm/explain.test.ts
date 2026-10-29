import { expect, test } from "vitest"
import type { Translate } from "@/i18n/translate"
import {
  CLOSE,
  explainAnalogy,
  explainBank,
  explainPair,
  explainPca,
  explainSearch,
  RELATED,
} from "./explain"

const t: Translate = (source, values = []) =>
  source.replace(/\{(\d+)\}/g, (_, i) => String(values[Number(i)]))

const analogy = {
  positive: ["king", "woman"],
  negative: ["man"],
  expected: "queen",
  topK: 5,
  top: { word: "queen", score: 0.7834 },
}

test("an analogy that finds the expected word says its rank and that it is approximate", () => {
  const text = explainAnalogy(t, { ...analogy, rank: 1 })
  expect(text).toContain("king − man + woman")
  expect(text).toContain("“queen” is ranked 1 of 5")
  expect(text).toContain("0.78")
  expect(text).toContain("approximate, not an identity")
})

test("an analogy that misses the expected word names the best neighbour instead", () => {
  const text = explainAnalogy(t, { ...analogy, rank: null, top: { word: "monarch", score: 0.6 } })
  expect(text).toContain("“queen” is not in the top 5")
  expect(text).toContain("“monarch”")
})

test("the PCA caption states the dimension drop, the explained variance and the distortion", () => {
  const text = explainPca(t, { inputDims: 300, ratios: [0.12, 0.08], frozen: false })
  expect(text).toContain("300 dimensions → 2")
  expect(text).toContain("PC1 + PC2 explain 20%")
  expect(text).toContain("distances are distorted")
  expect(text).not.toContain("frozen")
})

test("a frozen projection says new points reuse the earlier axes and whose variance it shows", () => {
  const text = explainPca(t, { inputDims: 384, ratios: [0.3, 0.1], frozen: true })
  expect(text).toContain("frozen")
  expect(text).toContain("earlier axes; the variance figure is from the run that set them")
})

test("negation, numbers and word order warn about high similarity only when the cosine is high", () => {
  for (const kind of ["negation", "numbers", "word-order", "opposites"] as const) {
    expect(explainPair(t, kind, 0.93)).toContain("high similarity ≠ same meaning")
    const low = explainPair(t, kind, 0.3)
    expect(low).not.toContain("high similarity")
    expect(low).toContain("kept these two apart")
  }
})

test("a paraphrase claims close vectors only when measured close", () => {
  expect(explainPair(t, "paraphrase", 0.81)).toContain("Different words, close vectors")
  const low = explainPair(t, "business-intent", 0.2)
  expect(low).not.toContain("close vectors")
  expect(low).toContain("did not match these two")
  expect(low).toContain("0.20")
})

test("the measured MiniLM cosines of every preset read correctly", () => {
  const measured = {
    paraphrase: 0.612,
    "business-intent": 0.547,
    opposites: 0.628,
    negation: 0.844,
    numbers: 0.853,
    "word-order": 0.978,
    synonyms: 0.887,
    topic: 0.321,
    "different-topics": 0.1,
  } as const
  const note = (kind: keyof typeof measured) => explainPair(t, kind, measured[kind])
  expect(note("paraphrase")).toContain("close vectors")
  expect(note("business-intent")).toContain("close vectors")
  expect(note("synonyms")).toContain("close vectors")
  for (const kind of ["opposites", "negation", "numbers", "word-order"] as const)
    expect(note(kind)).toContain("high similarity ≠ same meaning")
  expect(note("topic")).toContain("Related, not close")
  expect(note("different-topics")).toContain("far apart")
})

test("the bands switch at CLOSE and RELATED", () => {
  expect(explainPair(t, "paraphrase", CLOSE)).toContain("close vectors")
  expect(explainPair(t, "paraphrase", CLOSE - 0.01)).toContain("Related, not close")
  expect(explainPair(t, "paraphrase", RELATED - 0.01)).toContain("did not match")
  expect(explainPair(t, "topic", RELATED - 0.01)).toBe("Cosine 0.29.")
  expect(explainPair(t, "different-topics", CLOSE - 0.01)).toContain("Related, not close")
})

test("different topics and custom pairs print the measured value", () => {
  expect(explainPair(t, "different-topics", 0.05)).toContain("far apart")
  expect(explainPair(t, "different-topics", 0.9)).toContain("Unexpectedly close")
  expect(explainPair(t, "custom", 0.5)).toBe("Cosine 0.50.")
})

test("an analogy with no positive words does not print undefined", () => {
  const text = explainAnalogy(t, { ...analogy, positive: [], rank: 1 })
  expect(text).not.toContain("undefined")
})

test("the bank note contrasts one static vector with two different contextual ones", () => {
  const text = explainBank(t, { contextual: 0.62, river: 0.45, money: 0.4 })
  expect(text).toContain("0.62")
  expect(text).toContain("below 1: the context changed the vector")
  expect(text).toContain("one vector for every sense")
  expect(text).toContain("different spaces")
})

test("a search hit with no shared tokens is called out as found with different words", () => {
  const text = explainSearch(t, { semanticIds: ["a", "b"], keywordIds: ["c"], topShared: [] })
  expect(text).toContain("Found with different words: shared tokens Ø")
  expect(text).toContain("keyword search did not return it")
})

test("a search hit that keyword search also finds lists the shared tokens", () => {
  const text = explainSearch(t, {
    semanticIds: ["a"],
    keywordIds: ["a"],
    topShared: ["remote", "work"],
  })
  expect(text).toContain("remote, work")
  expect(text).not.toContain("shared tokens Ø")
})

import { expect, test } from "vitest"
import { translator } from "./translate"

test("preserves English, surrounding spaces and interpolation", () => {
  expect(translator("en-US")(" After {0} epochs ", [7])).toBe(" After 7 epochs ")
  expect(translator("pt-BR")(" Temperature ")).toBe(" Temperatura ")
  expect(translator("pt-BR")("Fewer neurons in layer {0}", [2])).toBe("Menos neurônios na camada 2")
})

test("keeps formulas and unknown terms intact", () => {
  const t = translator("pt-BR")
  expect(t("L = −[y·log ŷ + (1 − y)·log(1 − ŷ)]")).toBe("L = −[y·log ŷ + (1 − y)·log(1 − ŷ)]")
  expect(t("Iris")).toBe("Iris")
})

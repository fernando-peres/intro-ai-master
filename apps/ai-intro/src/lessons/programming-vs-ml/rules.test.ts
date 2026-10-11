import { machineReadings } from "./dataset"
import { classifyByRules, rulesScore } from "./rules"

test("the shared dataset has 30 machines, 15 per class", () => {
  expect(machineReadings).toHaveLength(30)
  expect(machineReadings.filter((r) => r.label === "normal")).toHaveLength(15)
})

test("the fixed rules get 20 of 30 right — the curved arch defeats axis-aligned thresholds", () => {
  expect(rulesScore).toEqual({ correct: 20, total: 30, misses: 10, accuracy: 67 })
})

test("a hot, low-vibration normal machine is misread as at risk", () => {
  const hotButFine = machineReadings.find((r) => r.temperature === 88 && r.vibration === 2.3)
  if (!hotButFine) throw new Error("fixture missing the 88°C / 2.3 mm/s reading")
  expect(hotButFine.label).toBe("normal")
  expect(classifyByRules(hotButFine)).toBe("at-risk")
})

test("flags high temperature, high vibration, and the moderate combination", () => {
  expect(classifyByRules({ temperature: 90, vibration: 1.5, label: "at-risk" })).toBe("at-risk")
  expect(classifyByRules({ temperature: 50, vibration: 7.0, label: "at-risk" })).toBe("at-risk")
  expect(classifyByRules({ temperature: 80, vibration: 4.5, label: "at-risk" })).toBe("at-risk")
  expect(classifyByRules({ temperature: 45, vibration: 2.0, label: "normal" })).toBe("normal")
})

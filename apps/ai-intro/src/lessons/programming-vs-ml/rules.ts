import { type MachineClass, type MachineReading, machineReadings } from "./dataset"

/** The fixed, hand-written rules — keep in sync with `rulesPythonSource` below. */
export function classifyByRules(reading: MachineReading): MachineClass {
  if (reading.temperature > 85) return "at-risk"
  if (reading.vibration > 6) return "at-risk"
  if (reading.temperature > 75 && reading.vibration > 4) return "at-risk"
  return "normal"
}

/** How the fixed rules score on the chapter's shared dataset. */
export const rulesScore = (() => {
  const correct = machineReadings.filter((r) => classifyByRules(r) === r.label).length
  const total = machineReadings.length
  return { correct, total, misses: total - correct, accuracy: Math.round((correct / total) * 100) }
})()

export const rulesPythonSource = `def predict_failure(temperature, vibration):
    if temperature > 85:
        return "B - At Risk"
    if vibration > 6:
        return "B - At Risk"
    if temperature > 75 and vibration > 4:
        return "B - At Risk"
    return "A - Normal"`

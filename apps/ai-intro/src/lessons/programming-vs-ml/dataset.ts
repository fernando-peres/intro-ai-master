/** Shared by this chapter's lessons (Problem, Programming, Machine Learning, Content). */
export type MachineClass = "normal" | "at-risk"

export type MachineReading = { temperature: number; vibration: number; label: MachineClass }

export const classMeta: Record<MachineClass, { code: "A" | "B"; name: string }> = {
  normal: { code: "A", name: "Normal" },
  "at-risk": { code: "B", name: "At Risk" },
}

/** The risk column's value: 1 = at risk, 0 = normal — matches the network's target encoding. */
export const riskValue = (label: MachineClass) => (label === "at-risk" ? 1 : 0)

/** Chart legend / series label, e.g. "0 — Normal" or "1 — At Risk". */
export const riskLabel = (label: MachineClass) => `${riskValue(label)} — ${classMeta[label].name}`

/**
 * Illustrative synthetic data for the lesson — not real industrial safety thresholds. The two
 * classes interlock like "two moons", so no straight line or axis-aligned threshold separates
 * them; risk depends on how temperature and vibration combine.
 */
export const machineReadings: MachineReading[] = [
  { temperature: 64, vibration: 5.3, label: "normal" },
  { temperature: 65, vibration: 4.4, label: "normal" },
  { temperature: 68, vibration: 3.9, label: "normal" },
  { temperature: 69, vibration: 2.4, label: "normal" },
  { temperature: 71, vibration: 2.3, label: "normal" },
  { temperature: 75, vibration: 1.4, label: "normal" },
  { temperature: 76, vibration: 1.5, label: "normal" },
  { temperature: 81, vibration: 1.7, label: "normal" },
  { temperature: 83, vibration: 1.2, label: "normal" },
  { temperature: 86, vibration: 1.9, label: "normal" },
  { temperature: 88, vibration: 2.3, label: "normal" },
  { temperature: 91, vibration: 3.1, label: "normal" },
  { temperature: 93, vibration: 3.7, label: "normal" },
  { temperature: 93, vibration: 4.1, label: "normal" },
  { temperature: 94, vibration: 5.2, label: "normal" },
  { temperature: 50, vibration: 4.5, label: "at-risk" },
  { temperature: 51, vibration: 5.1, label: "at-risk" },
  { temperature: 52, vibration: 5.4, label: "at-risk" },
  { temperature: 54, vibration: 6.3, label: "at-risk" },
  { temperature: 54, vibration: 6.5, label: "at-risk" },
  { temperature: 58, vibration: 7.3, label: "at-risk" },
  { temperature: 59, vibration: 7.3, label: "at-risk" },
  { temperature: 66, vibration: 7.5, label: "at-risk" },
  { temperature: 67, vibration: 7.6, label: "at-risk" },
  { temperature: 70, vibration: 6.6, label: "at-risk" },
  { temperature: 75, vibration: 5.8, label: "at-risk" },
  { temperature: 76, vibration: 6.2, label: "at-risk" },
  { temperature: 77, vibration: 5.2, label: "at-risk" },
  { temperature: 77, vibration: 5.3, label: "at-risk" },
  { temperature: 81, vibration: 4.3, label: "at-risk" },
]

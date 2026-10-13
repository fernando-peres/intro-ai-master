import { expect, test } from "vitest"
import { candidate, lazy, metricRows, observations } from "./classification-fairness-data"

test("the candidate catches 14 frauds and correctly clears 940 legitimate payments", () => {
  expect(observations).toHaveLength(1000)
  expect([candidate.tp, candidate.fn, candidate.tn, candidate.fp]).toEqual([14, 6, 940, 40])
  expect(candidate.accuracy).toBeCloseTo(0.954)
  expect(candidate.precision).toBeCloseTo(14 / 54)
  expect(candidate.balancedAccuracy).toBeCloseTo(0.8295918367)
  expect(candidate.mcc).toBeCloseTo(0.408312)
})

test("the lazy baseline has high accuracy but no fraud detection or ranking ability", () => {
  expect([lazy.tp, lazy.fn, lazy.tn, lazy.fp]).toEqual([0, 20, 980, 0])
  expect(lazy.accuracy).toBe(0.98)
  expect(lazy.precision).toBeNull()
  expect(lazy.ap).toBeCloseTo(0.02)
  expect(lazy.auc).toBe(0.5)
  expect(lazy.brier).toBeCloseTo(0.0196)
  expect(lazy.ece).toBeCloseTo(0)
})

test("ranking and probability metrics use the same four score bands", () => {
  expect(candidate.ap).toBeCloseTo(0.8)
  expect(candidate.auc).toBeCloseTo(0.987755102)
  expect(candidate.logLoss).toBeCloseTo(0.148471151)
  expect(candidate.brier).toBeCloseTo(0.0282)
  expect(candidate.ece).toBeCloseTo(0.1256)
  expect(candidate.f2).toBeCloseTo(0.52238806)
  expect(candidate.calibration.map((b) => b.count).sort((a, b) => a - b)).toEqual([6, 14, 40, 940])
})

test("comparison includes every taught numeric metric and preserves undefined precision", () => {
  expect(metricRows.map((m) => m.key)).toEqual([
    "recall",
    "specificity",
    "fpr",
    "precision",
    "accuracy",
    "balancedAccuracy",
    "f1",
    "f2",
    "mcc",
    "auc",
    "ap",
    "logLoss",
    "brier",
    "ece",
  ])
  expect(metricRows.find((m) => m.key === "precision")?.lazy).toBeNull()
})

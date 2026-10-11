import { expect, test } from "vitest"
import { findLesson } from "@/curriculum"
import { localizedEntry } from "./curriculum"

test("translates lesson titles while preserving navigation identities", () => {
  const entry = findLesson("machine-learning", "classification-metrics")
  if (!entry) throw new Error("Missing lesson")
  const localized = localizedEntry(entry, "pt-BR")
  expect(localized.lesson.title).toBe("Classificação")
  expect(localized.lesson.group).toBe("Métricas")
  expect(localized.chapter.title).toBe("Aprendizado de máquina")
  expect(localized.chapter.slug).toBe(entry.chapter.slug)
  expect(localized.lesson.slug).toBe(entry.lesson.slug)
  expect(localized.index).toBe(entry.index)
  expect(entry.lesson.title).toBe("Classification")
})

test("keeps unsupported chapters and English titles unchanged", () => {
  for (const language of ["en-US", "pt-BR"] as const) {
    const entry = findLesson("agents", "memory")
    if (!entry) throw new Error("Missing lesson")
    expect(localizedEntry(entry, language)).toEqual(entry)
  }
})

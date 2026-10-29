import { cleanup, screen } from "@testing-library/react"
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { PostTrainingLesson } from "./post-training"
import { PretrainingLesson } from "./pretraining"
import { fakeServer, HEALTH, renderLesson } from "./test-utils"
import { TransformerArchitectureLesson } from "./transformer-architecture"

beforeEach(() => {
  localStorage.setItem("ai-intro-language", "pt-BR")
  fakeServer({ "/health": () => HEALTH })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  localStorage.clear()
})

const heading = () => screen.getByRole("heading", { level: 1 }).textContent

test("the Architecture lesson opens in Portuguese", async () => {
  await renderLesson(TransformerArchitectureLesson)
  expect(heading()).toBe("Transformers a arquitetura")
  expect(screen.getByRole("tab", { name: "Teoria" })).toBeTruthy()
  expect(screen.getByText("Uma arquitetura, não um modelo")).toBeTruthy()
})

test("the Pretraining lesson opens in Portuguese", async () => {
  await renderLesson(PretrainingLesson)
  expect(heading()).toBe("Pré-treino um GPT aprende a prever")
  expect(screen.getByRole("button", { name: "Treinar" })).toBeTruthy()
})

test("the Post-training lesson opens in Portuguese", async () => {
  await renderLesson(PostTrainingLesson)
  expect(heading()).toBe("Pós-treino do GPT ao assistente")
  expect(screen.getByRole("region", { name: /Ajuste fino supervisionado/ })).toBeTruthy()
})

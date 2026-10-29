import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, test } from "vitest"
import { chapters } from "@/curriculum"
import { localizedChapter } from "./curriculum"
import { ptBR } from "./pt-br"

const LESSONS = join(dirname(fileURLToPath(import.meta.url)), "..", "lessons", "generative-ai")
const FILES = [
  "transformer-architecture.tsx",
  "transformer-theory.tsx",
  "transformer-variants-diagram.tsx",
  "attention-heatmap.tsx",
  "attention-calculator.tsx",
  "pretraining.tsx",
  "pretraining-panels.tsx",
  "post-training.tsx",
  "post-training-panels.tsx",
  "toy-lineage.tsx",
]
/** Strings the server sends and the lessons pass through `t()`. */
const SERVER_STRINGS = [
  "correct and concise",
  "correct but longer than asked",
  "confident but wrong",
  "irrelevant",
  "General text",
  "Narrative",
  "Code",
  "Structured text",
  "Multilingual",
  "Noisy text",
  "Everything",
  "Factual associations",
  "Continuation and style",
  "Syntax and code completion",
  "Patterns and formatting",
  "Language representations",
  "Duplicates, typos and inconsistent formatting",
  "All clean corpora together",
]

/** Every string literal passed straight to `t()`, normalised the way the translator looks it up. */
function literals(file: string): string[] {
  const source = readFileSync(join(LESSONS, file), "utf8")
  const found: string[] = []
  for (const match of source.matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/gs)) {
    found.push(match[1].replace(/\\"/g, '"').replace(/\s+/g, " ").trim())
  }
  return found
}

test("every string the Transformers lessons pass to t() has a pt-BR translation", () => {
  const missing = FILES.flatMap((file) =>
    literals(file)
      .filter((key) => !(key in ptBR))
      .map((key) => `${file}: ${key}`),
  )
  expect(missing).toEqual([])
})

test("the strings the server sends to those lessons are translated too", () => {
  expect(SERVER_STRINGS.filter((key) => !(key in ptBR))).toEqual([])
})

test("the Generative AI chapter has Portuguese titles, group included", () => {
  const chapter = chapters.find((c) => c.slug === "generative-ai")
  if (!chapter) throw new Error("chapter missing")
  const pt = localizedChapter(chapter, "pt-BR")
  expect(pt.title).toBe("IA generativa")
  expect(pt.lessons.map((lesson) => lesson.title)).toEqual([
    "Modelos de fundação",
    "Próximo token",
    "Adaptação",
    "Laboratório do assistente",
    "GPT → ChatGPT",
    "Pré-treino",
    "RLHF",
    "DPO",
    "Arquitetura",
    "Pré-treino",
    "Pós-treino",
  ])
  expect(pt.lessons[5].group).toBe("Intuição de treino")
  expect(pt.lessons[8].group).toBe("Transformers")
})

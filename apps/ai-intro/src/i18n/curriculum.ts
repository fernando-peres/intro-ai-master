import type { Chapter, LessonEntry } from "@/curriculum"
import type { Language } from "./language"

const titles: Record<
  string,
  {
    title: string
    lessons: Record<string, string>
    groups?: Record<string, string>
  }
> = {
  "programming-vs-ml": {
    title: "Programação vs ML",
    lessons: {
      problem: "Problema",
      programming: "Programação",
      "machine-learning": "Aprendizado de máquina",
      content: "Conteúdo",
    },
  },
  "machine-learning": {
    title: "Aprendizado de máquina",
    lessons: {
      components: "Componentes de ML",
      "bias-and-variance": "Viés e variância",
      fairness: "Viés e equidade",
      "data-splits": "Divisão dos dados",
      generalization: "Generalização",
      summary: "Resumo",
      "classification-metrics": "Classificação",
      "clustering-metrics": "Agrupamento",
      "regression-metrics": "Regressão",
      "reinforcement-learning-metrics": "Aprendizado por reforço",
      "ranking-metrics": "Ordenação e recomendação",
    },
    groups: { Metrics: "Métricas", Generalization: "Generalização" },
  },
  "neural-networks": {
    title: "Redes neurais",
    lessons: { perceptron: "Perceptron" },
  },
}

export function localizedChapter(chapter: Chapter, language: Language): Chapter {
  const copy = language === "pt-BR" ? titles[chapter.slug] : undefined
  return copy
    ? {
        ...chapter,
        title: copy.title,
        lessons: chapter.lessons.map((lesson) => ({
          ...lesson,
          title: copy.lessons[lesson.slug] ?? lesson.title,
          ...(lesson.group && { group: copy.groups?.[lesson.group] ?? lesson.group }),
        })),
      }
    : chapter
}

export function localizedEntry(entry: LessonEntry, language: Language): LessonEntry {
  const chapter = localizedChapter(entry.chapter, language)
  return {
    ...entry,
    chapter,
    lesson: chapter.lessons.find((lesson) => lesson.slug === entry.lesson.slug) ?? entry.lesson,
  }
}

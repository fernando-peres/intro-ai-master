/** `content` explains a topic; `simulation` lets students build intuition by experimenting. */
export type LessonKind = "content" | "simulation"

/** `group` nests a lesson one level under its chapter, e.g. "Metrics"; consecutive lessons share it. */
export type Lesson = { slug: string; title: string; kind?: LessonKind; group?: string }

export type Chapter = {
  slug: string
  number: string
  title: string
  lessons: Lesson[]
}

/** A lesson with its chapter and its 0-based position across the whole course. */
export type LessonEntry = { chapter: Chapter; lesson: Lesson; index: number }

export const chapters: Chapter[] = [
  {
    slug: "programming-vs-ml",
    number: "01",
    title: "Programming vs ML",
    lessons: [
      { slug: "problem", title: "Problem" },
      { slug: "programming", title: "Programming" },
      { slug: "machine-learning", title: "Machine Learning" },
      { slug: "content", title: "Content", kind: "content" },
    ],
  },
  {
    slug: "machine-learning",
    number: "02",
    title: "Machine Learning",
    lessons: [
      { slug: "components", title: "ML Components", kind: "content" },
      {
        slug: "bias-and-variance",
        title: "Bias & Variance",
        kind: "content",
        group: "Generalization",
      },
      { slug: "fairness", title: "Bias & Fairness", kind: "content", group: "Generalization" },
      { slug: "data-splits", title: "Data Splits", kind: "content", group: "Generalization" },
      { slug: "generalization", title: "Generalization", kind: "content", group: "Generalization" },
      { slug: "summary", title: "Summary", kind: "content", group: "Generalization" },
      {
        slug: "classification-metrics",
        title: "Classification",
        kind: "content",
        group: "Metrics",
      },
      {
        slug: "classification-fairness",
        title: "Classification (Fairness)",
        kind: "content",
        group: "Metrics",
      },
      { slug: "clustering-metrics", title: "Clustering", kind: "content", group: "Metrics" },
      { slug: "regression-metrics", title: "Regression", kind: "content", group: "Metrics" },
      {
        slug: "reinforcement-learning-metrics",
        title: "Reinforcement Learning",
        kind: "content",
        group: "Metrics",
      },
      {
        slug: "ranking-metrics",
        title: "Ranking & Recommendation",
        kind: "content",
        group: "Metrics",
      },
    ],
  },
  {
    slug: "neural-networks",
    number: "03",
    title: "Neural Networks",
    lessons: [
      { slug: "perceptron", title: "Perceptron" },
      {
        slug: "back-propagation",
        title: "Overview",
        kind: "content",
        group: "Back-propagation",
      },
      { slug: "training-lab", title: "Training Lab", group: "Back-propagation" },
      {
        slug: "forward-and-backward",
        title: "Step by Step",
        kind: "content",
        group: "Back-propagation",
      },
      {
        slug: "under-the-hood",
        title: "Key Concepts",
        kind: "content",
        group: "Back-propagation",
      },
      { slug: "activation-functions", title: "Activation Functions", kind: "content" },
      { slug: "loss-and-optimization", title: "Loss & Optimization" },
    ],
  },
  {
    slug: "generative-ai",
    number: "04",
    title: "Generative AI",
    lessons: [
      { slug: "foundation-models", title: "Foundation Models", kind: "content" },
      { slug: "next-token-lab", title: "Next Token" },
      { slug: "adaptation-lab", title: "Adaptation" },
      { slug: "assistant-lab", title: "Assistant Lab" },
      { slug: "gpt-to-chatgpt", title: "GPT → ChatGPT" },
    ],
  },
  {
    slug: "llm",
    number: "05",
    title: "LLM",
    lessons: [
      { slug: "tokens-and-embeddings", title: "Tokens & Embeddings" },
      { slug: "transformers", title: "Transformers" },
      { slug: "prompting", title: "Prompting" },
      { slug: "fine-tuning", title: "Fine-tuning" },
    ],
  },
  {
    slug: "agents",
    number: "06",
    title: "Agents",
    lessons: [
      { slug: "tools-and-function-calling", title: "Tools & Function Calling" },
      { slug: "memory", title: "Memory" },
      { slug: "planning-loops", title: "Planning Loops" },
      { slug: "multi-agent-systems", title: "Multi-agent Systems" },
    ],
  },
]

export const lessonEntries: LessonEntry[] = chapters
  .flatMap((chapter) => chapter.lessons.map((lesson) => ({ chapter, lesson })))
  .map((entry, index) => ({ ...entry, index }))

export const lessonKind = (entry: LessonEntry): LessonKind => entry.lesson.kind ?? "simulation"

export function findLesson(chapterSlug: string, lessonSlug: string): LessonEntry | undefined {
  return lessonEntries.find(
    ({ chapter, lesson }) => chapter.slug === chapterSlug && lesson.slug === lessonSlug,
  )
}

export function neighbours(entry: LessonEntry) {
  return { prev: lessonEntries[entry.index - 1], next: lessonEntries[entry.index + 1] }
}

export const pad2 = (n: number) => String(n).padStart(2, "0")

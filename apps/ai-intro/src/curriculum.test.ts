import { findLesson, lessonEntries, lessonKind, neighbours } from "./curriculum"

test("course has 27 lessons, Content closing chapter 01", () => {
  expect(lessonEntries).toHaveLength(27)
  expect(findLesson("programming-vs-ml", "content")?.index).toBe(3)
})

test("neighbours cross chapter boundaries and stop at the ends", () => {
  const content = findLesson("programming-vs-ml", "content")
  if (!content) throw new Error("content lesson missing")
  expect(neighbours(content).prev?.lesson.title).toBe("Machine Learning")
  expect(neighbours(content).next?.lesson.title).toBe("ML Components")
  expect(neighbours(lessonEntries[0]).prev).toBeUndefined()
  expect(neighbours(lessonEntries.at(-1)!).next).toBeUndefined()
})

test("Content and the whole Machine Learning chapter are content lessons", () => {
  const content = lessonEntries.filter((entry) => lessonKind(entry) === "content")
  expect(content.map((entry) => `${entry.chapter.slug}/${entry.lesson.slug}`)).toEqual([
    "programming-vs-ml/content",
    "machine-learning/components",
    "machine-learning/bias-and-variance",
    "machine-learning/fairness",
    "machine-learning/data-splits",
    "machine-learning/generalization",
    "machine-learning/summary",
    "machine-learning/classification-metrics",
    "machine-learning/clustering-metrics",
    "machine-learning/regression-metrics",
    "machine-learning/reinforcement-learning-metrics",
    "machine-learning/ranking-metrics",
  ])
})

test("the five metrics lessons form one Metrics group inside Machine Learning", () => {
  const grouped = lessonEntries.filter((entry) => entry.lesson.group === "Metrics")
  expect(grouped.map((entry) => entry.lesson.slug)).toEqual([
    "classification-metrics",
    "clustering-metrics",
    "regression-metrics",
    "reinforcement-learning-metrics",
    "ranking-metrics",
  ])
  expect(new Set(grouped.map((entry) => entry.chapter.slug))).toEqual(new Set(["machine-learning"]))
})

test("Summary closes Generalization after the four source lessons", () => {
  const grouped = lessonEntries.filter((entry) => entry.lesson.group === "Generalization")
  expect(grouped.map((entry) => entry.lesson.slug)).toEqual([
    "bias-and-variance",
    "fairness",
    "data-splits",
    "generalization",
    "summary",
  ])
})

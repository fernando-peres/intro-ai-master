import { createFileRoute, notFound } from "@tanstack/react-router"

import { LessonBreadcrumb, LessonPlaceholder } from "@/components/course/lesson-layout"
import { findLesson } from "@/curriculum"
import { useLanguage } from "@/i18n/language"
import { lessonPages } from "@/lessons"

export const Route = createFileRoute("/learn/$chapter/$lesson")({
  loader: ({ params }) => {
    const entry = findLesson(params.chapter, params.lesson)
    if (!entry) throw notFound()
    return entry
  },
  component: LessonPage,
})

function LessonPage() {
  const entry = Route.useLoaderData()
  const Page = lessonPages[`${entry.chapter.slug}/${entry.lesson.slug}`] ?? LessonPlaceholder
  const { language } = useLanguage()

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <LessonBreadcrumb entry={entry} />
      <div
        lang={lessonPages[`${entry.chapter.slug}/${entry.lesson.slug}`] ? language : "en-US"}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <Page entry={entry} />
      </div>
    </div>
  )
}

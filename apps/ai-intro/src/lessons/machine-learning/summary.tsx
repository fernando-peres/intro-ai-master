import { lazy, Suspense } from "react"
import { LessonArticle, LessonFooter } from "@/components/course/lesson-layout"
import type { LessonEntry } from "@/curriculum"
import { useLanguage } from "@/i18n/language"

const SummaryEditor = lazy(() =>
  import("./summary/editor").then((module) => ({ default: module.SummaryEditor })),
)

export function SummaryLesson({ entry }: { entry: LessonEntry }) {
  const { language } = useLanguage()
  const pt = language === "pt-BR"
  return (
    <LessonArticle entry={entry}>
      <div className="mx-auto w-full max-w-[800px]">
        <header className="mb-8 space-y-4">
          <h1 className="font-display text-5xl font-bold tracking-tight md:text-6xl">
            {pt ? "Resumo" : "Summary"}
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-fg-secondary">
            {pt
              ? "Os conceitos de generalização, reunidos em uma referência que você pode adaptar. Releia, reescreva com suas palavras e faça conexões."
              : "The concepts of generalization, together in a reference you can make your own. Revisit the ideas, rewrite them in your words, and connect the dots."}
          </p>
        </header>
        <Suspense
          fallback={
            <div
              role="status"
              className="min-h-[480px] space-y-5 rounded border border-divider p-8"
            >
              <p className="text-sm text-fg-muted">
                {pt ? "Abrindo seu resumo…" : "Opening your summary…"}
              </p>
              {["w-1/3", "w-full", "w-5/6", "w-11/12", "w-2/3"].map((width) => (
                <div key={width} className={`h-4 rounded bg-elevated ${width}`} />
              ))}
            </div>
          }
        >
          <SummaryEditor language={language} />
        </Suspense>
      </div>
      <LessonFooter entry={entry} />
    </LessonArticle>
  )
}

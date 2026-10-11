import { Link } from "@tanstack/react-router"
import { ChevronDownIcon } from "lucide-react"
import { useState } from "react"

import { type Chapter, chapters, lessonEntries } from "@/curriculum"
import { localizedChapter } from "@/i18n/curriculum"
import { useLanguage } from "@/i18n/language"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const { language } = useLanguage()
  return (
    <aside className="hidden w-[306px] shrink-0 flex-col overflow-y-auto border-r border-divider bg-surface md:flex">
      <div className="flex h-[57px] shrink-0 items-center justify-between border-b border-divider px-7">
        <span className="label-ui tracking-[0.2em] text-fg-muted">
          {language === "pt-BR" ? "Tópicos" : "Topics"}
        </span>
        <span className="label-ui tracking-[0.2em] text-brand">{lessonEntries.length}</span>
      </div>
      <nav
        aria-label={language === "pt-BR" ? "Tópicos" : "Topics"}
        className="flex flex-col gap-1 pt-5 pb-7"
      >
        {chapters.map((chapter) => (
          <ChapterGroup key={chapter.slug} chapter={localizedChapter(chapter, language)} />
        ))}
      </nav>
    </aside>
  )
}

function ChapterGroup({ chapter }: { chapter: Chapter }) {
  const [open, setOpen] = useState(true)
  const listId = `chapter-${chapter.slug}`

  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className="flex cursor-pointer items-center gap-3 px-7 py-2.5 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
      >
        <span className="font-ui text-[10px] tracking-[0.15em] text-brand">{chapter.number}</span>
        <span className="flex-1 font-display text-[21px] tracking-[-0.3px] text-fg">
          {chapter.title}
        </span>
        <ChevronDownIcon
          aria-hidden
          className={cn("size-3.5 text-fg-muted transition-transform", !open && "-rotate-90")}
        />
      </button>
      {open && (
        <ul id={listId} className="flex flex-col pt-0.5 pb-2.5">
          {chapter.lessons.map((lesson, i) => (
            <li key={lesson.slug}>
              {lesson.group && lesson.group !== chapter.lessons[i - 1]?.group && (
                <p className="label-ui pt-3 pr-7 pb-1 pl-[28px] text-fg-muted">{lesson.group}</p>
              )}
              <Link
                to="/learn/$chapter/$lesson"
                params={{ chapter: chapter.slug, lesson: lesson.slug }}
                className="group flex items-center py-[7px] pr-7 transition-colors hover:bg-elevated/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand data-[status=active]:bg-elevated"
              >
                <span aria-hidden className="h-4 w-0.5 group-data-[status=active]:bg-brand" />
                <span
                  className={cn(
                    "flex-1 font-display text-[17px] text-fg-secondary transition-colors group-hover:text-fg group-data-[status=active]:text-brand group-data-[status=active]:italic",
                    lesson.group ? "pl-[42px]" : "pl-[26px]",
                  )}
                >
                  {lesson.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

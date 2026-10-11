import { Link } from "@tanstack/react-router"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import type { ReactNode } from "react"

import { type LessonEntry, lessonEntries, lessonKind, neighbours, pad2 } from "@/curriculum"
import { localizedEntry } from "@/i18n/curriculum"
import { useLanguage } from "@/i18n/language"
import { cn } from "@/lib/utils"

import { FocusToggle, iconChip, useFocusMode } from "./focus-mode"

export function LessonBreadcrumb({ entry }: { entry: LessonEntry }) {
  const { language, setLanguage } = useLanguage()
  const { focused } = useFocusMode()
  const display = localizedEntry(entry, language)
  return (
    <div className="flex min-h-[57px] shrink-0 flex-wrap items-center justify-between gap-3 border-b border-divider px-6 py-3 md:px-14">
      <nav
        aria-label={language === "pt-BR" ? "Localização no curso" : "Breadcrumb"}
        className="label-ui flex min-w-0 flex-wrap items-center gap-2.5"
      >
        <span className="text-fg-muted">{display.chapter.title}</span>
        <span aria-hidden className="text-line">
          /
        </span>
        {display.lesson.group && (
          <>
            <span className="text-fg-muted">{display.lesson.group}</span>
            <span aria-hidden className="text-line">
              /
            </span>
          </>
        )}
        <span aria-current="page" className="text-brand">
          {display.lesson.title}
        </span>
      </nav>
      <div className="flex shrink-0 items-center gap-4">
        {lessonKind(entry) === "content" && (
          <span className="label-ui hidden text-fg-muted lg:block">
            {language === "pt-BR" ? "Aula" : "Lesson"} {pad2(entry.index + 1)} /{" "}
            {pad2(lessonEntries.length)}
          </span>
        )}
        {focused && <FocusPager entry={entry} />}
        <fieldset
          aria-label={language === "pt-BR" ? "Idioma" : "Language"}
          className="flex overflow-hidden rounded-sm border border-line"
        >
          {(["en-US", "pt-BR"] as const).map((option) => (
            <button
              type="button"
              key={option}
              lang={option}
              aria-pressed={language === option}
              onClick={() => setLanguage(option)}
              className="label-ui cursor-pointer px-2.5 py-1.5 text-fg-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand aria-pressed:bg-elevated aria-pressed:text-brand"
            >
              {option.toUpperCase()}
            </button>
          ))}
        </fieldset>
        <FocusToggle />
      </div>
    </div>
  )
}

/** Previous/next icon links shown in focus mode, where the sidebar is hidden. Whole-course order. */
function FocusPager({ entry }: { entry: LessonEntry }) {
  const { language } = useLanguage()
  const { prev, next } = neighbours(entry)
  const pt = language === "pt-BR"
  const links = [
    { target: prev, Icon: ChevronLeftIcon, label: pt ? "Anterior" : "Previous" },
    { target: next, Icon: ChevronRightIcon, label: pt ? "Próxima" : "Next" },
  ]

  return (
    <nav aria-label={pt ? "Navegação entre aulas" : "Lesson navigation"} className="flex gap-1.5">
      {links.map(({ target, Icon, label }) =>
        target ? (
          <Link
            key={label}
            to="/learn/$chapter/$lesson"
            params={{ chapter: target.chapter.slug, lesson: target.lesson.slug }}
            aria-label={`${label}: ${localizedEntry(target, language).lesson.title}`}
            title={`${label}: ${localizedEntry(target, language).lesson.title}`}
            className={iconChip}
          >
            <Icon className="size-3.5" aria-hidden />
          </Link>
        ) : (
          <span
            key={label}
            aria-hidden
            className={cn(
              iconChip,
              "cursor-default opacity-40 hover:border-line hover:text-fg-secondary",
            )}
          >
            <Icon className="size-3.5" />
          </span>
        ),
      )}
    </nav>
  )
}

/** Bare article column — what simulation lessons render into. */
export function ArticleFrame({ children }: { children: ReactNode }) {
  return (
    <article className="flex min-h-full flex-col gap-[26px] px-6 py-11 md:px-14">
      {children}
    </article>
  )
}

/** Main column of a content lesson. `entry` stays in the signature so every lesson calls it alike. */
export function LessonArticle({ children }: { entry: LessonEntry; children: ReactNode }) {
  return <ArticleFrame>{children}</ArticleFrame>
}

export function LessonHero({ line1, line2 }: { line1: string; line2?: string }) {
  return (
    <h1 className="break-words font-display text-6xl font-bold leading-[0.98] tracking-[-1.6px] text-fg md:text-[78px] md:tracking-[-2.4px]">
      <span className="block">{line1}</span>
      {line2 && <span className="block text-brand italic">{line2}</span>}
    </h1>
  )
}

export function LessonLead({ children }: { children: ReactNode }) {
  return <p className="font-display text-[21px] leading-[1.45] text-fg-secondary">{children}</p>
}

/** A numbered section heading, e.g. "1. The problem" — the brand-colored number sets it apart. */
export function SectionTitle({ number, children }: { number: string; children: ReactNode }) {
  return (
    <h2 className="font-display text-4xl font-bold text-fg">
      <span className="text-brand">{number}. </span>
      {children}
    </h2>
  )
}

/** Previous/next navigation. Only content lessons render it. */
export function LessonFooter({ entry }: { entry: LessonEntry }) {
  const { language } = useLanguage()
  const { prev, next } = neighbours(entry)

  return (
    <nav
      aria-label={language === "pt-BR" ? "Navegação entre aulas" : "Lesson navigation"}
      className="label-ui mt-auto flex items-center justify-between border-t border-divider px-0.5 pt-4 pb-1.5"
    >
      {prev ? (
        <Link
          to="/learn/$chapter/$lesson"
          params={{ chapter: prev.chapter.slug, lesson: prev.lesson.slug }}
          className="text-fg-muted transition-colors hover:text-fg"
        >
          ← {localizedEntry(prev, language).lesson.title}
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link
          to="/learn/$chapter/$lesson"
          params={{ chapter: next.chapter.slug, lesson: next.lesson.slug }}
          className="text-brand transition-colors hover:text-brand-soft"
        >
          {localizedEntry(next, language).lesson.title} →
        </Link>
      )}
    </nav>
  )
}

/** Shown for lessons without a page yet; simulations get no counter or footer. */
export function LessonPlaceholder({ entry }: { entry: LessonEntry }) {
  const isContent = lessonKind(entry) === "content"
  const body = (
    <>
      <LessonHero line1={entry.lesson.title} />
      <LessonLead>
        {isContent
          ? "This lesson is being written. Check back soon."
          : "This simulation is being built. Check back soon."}
      </LessonLead>
    </>
  )
  return isContent ? (
    <LessonArticle entry={entry}>{body}</LessonArticle>
  ) : (
    <ArticleFrame>{body}</ArticleFrame>
  )
}

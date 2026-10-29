import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { ArticleFrame, LessonHero, LessonLead } from "@/components/course/lesson-layout"
import { useTranslation } from "@/i18n/use-translation"
import { cn } from "@/lib/utils"
import { ServerNotice } from "../generative-ai/stages"
import { embeddingModels } from "./api"
import { ApplicationsLab } from "./embeddings-applications"
import { IntuitionLab } from "./embeddings-intuition"
import { TextLab } from "./embeddings-text"
import { EmbeddingsTheory } from "./embeddings-theory"

type Tab = "theory" | "intuition" | "text" | "applications"

/** One line naming the embedding models and whether each is already in memory. */
function ModelsStatus() {
  const { t } = useTranslation()
  const models = useQuery({
    queryKey: ["embeddings-models"],
    queryFn: embeddingModels,
    retry: false,
    refetchInterval: (query) => (query.state.status === "error" ? 5000 : false),
  })
  if (!models.data) return null
  return (
    <p role="status" className="label-ui flex flex-wrap gap-x-5 gap-y-1 text-fg-muted">
      {models.data.models.map((model) => (
        <span key={model.id}>
          <span className="text-chart-warm">{model.name}</span>{" "}
          {model.loaded ? t("loaded") : t("loads on first use")}
        </span>
      ))}
    </p>
  )
}

export function EmbeddingsLesson() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>("theory")
  const tabs: { key: Tab; label: string }[] = [
    { key: "theory", label: t("Theory") },
    { key: "intuition", label: t("Intuition") },
    { key: "text", label: t("Text") },
    { key: "applications", label: t("Applications") },
  ]
  return (
    <ArticleFrame>
      <LessonHero line1={t("Embeddings")} line2={t("meaning as geometry")} />
      <LessonLead>
        {t(
          "A model can only compare things it can measure. An embedding turns a word, a sentence or an image into a list of numbers, so that similar meanings end up close together. Read the idea in Theory, then try it on real vectors.",
        )}
      </LessonLead>
      <div
        role="tablist"
        aria-label={t("Sections")}
        className="flex flex-wrap gap-2 border-b border-divider pb-3"
      >
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "label-ui rounded-[2px] border px-3 py-1.5 transition-colors",
              tab === key ? "border-brand text-brand" : "border-line text-fg-muted hover:text-fg",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div hidden={tab === "theory"} className="flex flex-col gap-3">
        <ServerNotice quiet />
        <ModelsStatus />
      </div>
      <div role="tabpanel" hidden={tab !== "theory"} className="flex flex-col gap-[26px]">
        <EmbeddingsTheory onOpenLab={() => setTab("intuition")} />
      </div>
      <div role="tabpanel" hidden={tab !== "intuition"} className="flex flex-col gap-[26px]">
        <IntuitionLab />
      </div>
      <div role="tabpanel" hidden={tab !== "text"} className="flex flex-col gap-[26px]">
        <TextLab />
      </div>
      <div role="tabpanel" hidden={tab !== "applications"} className="flex flex-col gap-[26px]">
        <ApplicationsLab />
      </div>
    </ArticleFrame>
  )
}

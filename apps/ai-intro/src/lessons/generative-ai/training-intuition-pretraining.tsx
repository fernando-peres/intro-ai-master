import { useState } from "react"
import {
  LessonArticle,
  LessonFooter,
  LessonHero,
  LessonLead,
} from "@/components/course/lesson-layout"
import type { LessonEntry } from "@/curriculum"
import { useTranslation } from "@/i18n/use-translation"
import { cn } from "@/lib/utils"
import { OptionList, StatRow, Takeaway } from "../machine-learning/metric-section"
import { ModeBadge } from "./stages"
import {
  BigTable,
  IntuitionSection,
  LabLink,
  Prose,
  Sample,
  TechniqueSummary,
} from "./training-intuition"
import {
  GPT3_BASE_COMPLETION,
  GPT3_MIX,
  GPT3_SCALE,
  MOON_PROMPT,
  NEXT_TOKEN_SENTENCE,
  RAW_TEXT_SNIPPETS,
} from "./training-intuition-data"

export function TrainingIntuitionPretrainingLesson({ entry }: { entry: LessonEntry }) {
  const { t } = useTranslation()
  return (
    <LessonArticle entry={entry}>
      <LessonHero line1={t("Pretraining")} line2={t("learning from raw text")} />
      <LessonLead>
        {t(
          "GPT-3 read about 300 billion tokens of text that nobody labelled. There was no answer key. The text itself was the answer key: at every position, the next word.",
        )}
      </LessonLead>

      <IntuitionSection number="1" title={t("The data: text as it was found")} mode="historical">
        <Prose>
          <p>
            {t(
              "Pretraining data is ordinary text, copied from the web, books and encyclopedias. Encyclopedia articles, forum posts, source code and news sit side by side. Nothing marks what is true, useful or well written.",
            )}
          </p>
        </Prose>
        <div className="grid gap-4 md:grid-cols-2">
          {RAW_TEXT_SNIPPETS.map((snippet) => (
            <Sample
              key={snippet.genre}
              label={t(snippet.genre)}
              text={snippet.text}
              code={snippet.code}
              aside={<span className="label-ui text-fg-muted">{t(snippet.source)}</span>}
            />
          ))}
        </div>
        <BigTable
          head={[t("Source"), t("Tokens"), t("Share of training")]}
          rows={GPT3_MIX.map((row) => ({
            key: row.source,
            cells: [t(row.source), row.tokens, `${row.weight}%`],
          }))}
        />
        <StatRow stats={GPT3_SCALE} />
        <Prose>
          <p className="text-[17px] text-fg-muted">
            {t(
              "Figures from the GPT-3 paper (2020). The filtered web crawl is by far the largest source, but books and Wikipedia are read more often per token because they are cleaner.",
            )}
          </p>
        </Prose>
      </IntuitionSection>

      <IntuitionSection number="2" title={t("Where the label comes from")} mode="conceptual">
        <Prose>
          <p>
            {t(
              "Supervised learning needs a label for every example, written by a person. Self-supervised learning makes the labels out of the data. Take any sentence, hide its ending, and the hidden word is the label. Click a word to see the training example it produces:",
            )}
          </p>
        </Prose>
        <NextTokenSlicer />
        <Takeaway className="text-[24px]">
          {t(
            "One sentence, six training examples, zero labellers. Multiply by 300 billion tokens and that is pretraining.",
          )}
        </Takeaway>
      </IntuitionSection>

      <IntuitionSection number="3" title={t("What the model generates")} mode="historical">
        <Prose>
          <p>
            {t(
              "After pretraining the model is very good at one thing: continuing text the way the web would. Ask it something and it does not answer. It continues. This is GPT-3's own output, from the InstructGPT paper:",
            )}
          </p>
        </Prose>
        <Sample
          label={t("GPT-3, after pretraining")}
          prompt={MOON_PROMPT}
          text={GPT3_BASE_COMPLETION}
        />
        <Prose>
          <p>
            {t(
              "On the web, a line like that prompt usually sits in a list of homework questions, so the most likely continuation is more homework questions. The model learned that perfectly. It did not learn that you wanted an explanation.",
            )}
          </p>
        </Prose>
        <Takeaway className="text-[24px]">
          {t("Pretraining teaches the model what text looks like, not what you want from it.")}
        </Takeaway>
      </IntuitionSection>

      <IntuitionSection number="4" title={t("What this kind of data can and cannot teach")}>
        <Prose>
          <p>{t("Predicting the next token, at this scale, teaches:")}</p>
          <OptionList
            ordered={false}
            items={[
              t("grammar and style, in every language and register in the data;"),
              t("facts, because the text states them (Paris follows “The capital of France is”);"),
              t(
                "skills that appear in text: arithmetic, translation, code, summaries, because people wrote them down.",
              ),
            ]}
          />
          <p>{t("It does not teach:")}</p>
          <OptionList
            ordered={false}
            items={[
              t("to follow an instruction rather than continue it;"),
              t("to prefer a true answer to a plausible one;"),
              t("to stop, to be brief, or to decline."),
            ]}
          />
          <p>
            {t(
              "Those need a different kind of data, which is the next page. Watch a tiny GPT learn from raw text, live, in",
            )}{" "}
            <LabLink lesson="pretraining">{t("Transformers › Pretraining")}</LabLink>.
          </p>
        </Prose>
      </IntuitionSection>

      <TechniqueSummary active="pretraining" />
      <LessonFooter entry={entry} />
    </LessonArticle>
  )
}

/** The sentence as word buttons; the chosen word is the target and everything before it the context. */
function NextTokenSlicer() {
  const { t } = useTranslation()
  const [target, setTarget] = useState(5)
  const context = NEXT_TOKEN_SENTENCE.slice(0, target)
  const examples = NEXT_TOKEN_SENTENCE.slice(1)
  return (
    <div className="flex flex-col gap-5 rounded-[3px] border border-divider bg-surface px-5 py-5">
      <fieldset
        className="flex flex-wrap items-center gap-2 border-0 p-0"
        aria-label={t("Sentence")}
      >
        {NEXT_TOKEN_SENTENCE.map((token, index) => (
          <button
            key={token}
            type="button"
            disabled={index === 0}
            aria-pressed={index === target}
            onClick={() => setTarget(index)}
            className={cn(
              "rounded-[2px] border px-3 py-1.5 font-display text-[26px] leading-none transition-colors",
              index === target
                ? "border-brand bg-brand text-canvas"
                : index < target
                  ? "border-chart-warm/60 text-fg"
                  : "border-line text-fg-muted",
              index === 0 && "cursor-default",
            )}
          >
            {token}
          </button>
        ))}
      </fieldset>
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-display text-[26px] leading-tight">
        <span className="text-chart-warm">{context.join(" ")}</span>
        <span className="text-fg-muted">→</span>
        <span className="text-brand" data-testid="slicer-target">
          {NEXT_TOKEN_SENTENCE[target]}
        </span>
      </p>
      <ol
        className="flex flex-col gap-1.5 border-t border-divider pt-4"
        aria-label={t("Training examples")}
      >
        {examples.map((token, i) => {
          const index = i + 1
          return (
            <li
              key={token}
              aria-current={index === target ? "true" : undefined}
              className={cn(
                "flex flex-wrap items-baseline gap-x-3 font-display text-[19px]",
                index === target ? "text-fg" : "text-fg-muted",
              )}
            >
              <span className="font-ui text-[11px] tracking-[0.16em]">{index}</span>
              <span>{NEXT_TOKEN_SENTENCE.slice(0, index).join(" ")}</span>
              <span>→</span>
              <span className={index === target ? "text-brand" : undefined}>{token}</span>
            </li>
          )
        })}
      </ol>
      <p className="label-ui text-fg-muted">
        <ModeBadge mode="conceptual" />{" "}
        {t("In the real model every position is predicted at once; here you pick one.")}
      </p>
    </div>
  )
}

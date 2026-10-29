import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"
import {
  LessonArticle,
  LessonFooter,
  LessonHero,
  LessonLead,
  SectionTitle,
} from "@/components/course/lesson-layout"
import { CompareBars } from "@/components/workbench"
import type { LessonEntry } from "@/curriculum"
import { useTranslation } from "@/i18n/use-translation"
import { OptionList, Takeaway } from "../machine-learning/metric-section"
import { PipelineDiagram } from "./pipeline-diagram"

/** GPT-2's top candidates after "The capital of France is", measured with the Next Token lab. */
const CAPITAL_CANDIDATES = [
  { token: "the", percent: 8.5 },
  { token: "now", percent: 4.8 },
  { token: "a", percent: 4.6 },
  { token: "France", percent: 3.2 },
  { token: "Paris", percent: 3.2 },
]

/** One review, classified by GPT-2 without and with three labelled examples (Adaptation lesson). */
const ADAPTATION_RUNS = [
  { method: "Zero-shot", label: "Positive", percent: 79 },
  { method: "Few-shot (3 examples)", label: "Mixed", percent: 59 },
]

const COMPARISON: { aspect: string; foundation: string; adapted: string }[] = [
  {
    aspect: "Trained to",
    foundation: "Predict the next token of any text",
    adapted: "Follow instructions and hold a conversation",
  },
  {
    aspect: "Training data",
    foundation: "Huge, broad, unlabelled text",
    adapted: "Smaller sets of demonstrations and human preferences",
  },
  {
    aspect: "Expects as input",
    foundation: "The beginning of a document",
    adapted: "A request, with the conversation so far",
  },
  {
    aspect: "Typical output",
    foundation: "A plausible continuation, whether or not it helps",
    adapted: "An answer aimed at the request",
  },
  {
    aspect: "Example",
    foundation: "GPT-2, GPT-3 (base)",
    adapted: "ChatGPT (GPT-3.5 after post-training)",
  },
]

function LabLink({ lesson, children }: { lesson: string; children: ReactNode }) {
  return (
    <Link
      to="/learn/$chapter/$lesson"
      params={{ chapter: "generative-ai", lesson }}
      className="text-brand underline-offset-4 hover:underline"
    >
      {children}
    </Link>
  )
}

export function FoundationModelsLesson({ entry }: { entry: LessonEntry }) {
  const { t } = useTranslation()
  return (
    <LessonArticle entry={entry}>
      <LessonHero line1={t("From foundation model")} line2={t("to AI assistant")} />
      <LessonLead>
        {t(
          "ChatGPT did not start as a chatbot. It started as a model that could only continue text. The same technology became an assistant in three stages:",
        )}
      </LessonLead>
      <OptionList
        items={[
          t(
            "Pretraining: the model learns to predict the next token and picks up general language skills.",
          ),
          t(
            "Adaptation: prompting, fine-tuning and human feedback shape that skill for specific tasks.",
          ),
          t(
            "Assistant: a post-trained model follows instructions, keeps the conversation in mind and handles many tasks.",
          ),
        ]}
      />

      <section className="flex flex-col gap-4">
        <SectionTitle number="1">{t("What a foundation model is")}</SectionTitle>
        <PipelineDiagram />
        <p className="text-center font-display text-[19px] leading-snug text-fg-secondary">
          {t("A foundation model")} <span className="text-fg-muted">…</span> {t("is")}{" "}
          <span className="text-chart-warm">{t("trained on a huge amount of data")}</span>{" "}
          {t("and can be")} <span className="text-chart-amber">{t("adapted")}</span>{" "}
          {t("to many downstream tasks")}{" "}
          <span className="underline underline-offset-4">
            {t("rather than built for only one narrow purpose")}
          </span>
          .
        </p>
        <p className="text-sm text-fg-muted">
          {t(
            "The term comes from Stanford's 2021 report On the Opportunities and Risks of Foundation Models. The model is the foundation that many products are built on, not a finished product itself.",
          )}
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle number="2">{t("Pretraining: predict the next token")}</SectionTitle>
        <PipelineDiagram labels />
        <p className="text-fg-secondary">
          {t(
            "During pretraining the model reads billions of sentences and, at every position, guesses the next token. That one objective teaches grammar, facts and style, but not helpfulness. Here is what GPT-2, a pure foundation model, expects after",
          )}{" "}
          <span className="font-display text-fg">“The capital of France is”</span>:
        </p>
        <div className="max-w-md">
          <CompareBars
            rows={CAPITAL_CANDIDATES.map((c) => ({
              label: `“${c.token}”`,
              count: "",
              percent: c.percent,
              tone: c.token === "Paris" ? "brand" : "muted",
            }))}
          />
        </div>
        <Takeaway>
          {t(
            "“Paris” is only the fifth guess. A foundation model is not trying to answer you; it continues the text the way documents usually do.",
          )}
        </Takeaway>
        <p className="text-sm text-fg-muted">
          {t("Try it in the")} <LabLink lesson="next-token-lab">{t("Next Token")}</LabLink>
          {t(", and see the network that computes these probabilities in")}{" "}
          <LabLink lesson="transformer-architecture">{t("Transformers › Architecture")}</LabLink>.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle number="3">{t("Adaptation: shape how the skill is used")}</SectionTitle>
        <p className="text-fg-secondary">
          {t("There are three common ways to adapt a foundation model:")}
        </p>
        <OptionList
          items={[
            t(
              "Prompting: give an instruction (zero-shot) or a few labelled examples (few-shot) in the input. The model itself does not change.",
            ),
            t(
              "Supervised fine-tuning (SFT): keep training on input → output pairs, such as instructions with good answers. The weights change.",
            ),
            t(
              "Human feedback (RLHF): people rank the model's answers, and it is trained toward the ones they prefer. The weights change.",
            ),
          ]}
        />
        <Takeaway>{t("Prompting changes the context. Fine-tuning changes the weights.")}</Takeaway>
        <p className="text-fg-secondary">
          {t(
            "Prompting alone already makes a difference. GPT-2 classified “The product is excellent, but shipping was slow.” twice:",
          )}
        </p>
        <div className="max-w-md">
          <CompareBars
            rows={ADAPTATION_RUNS.map((run) => ({
              label: `${t(run.method)} → ${t(run.label)}`,
              count: "",
              percent: run.percent,
              tone: run.label === "Mixed" ? "brand" : "muted",
            }))}
          />
        </div>
        <p className="text-sm text-fg-muted">
          {t("Change the examples yourself in the")}{" "}
          <LabLink lesson="adaptation-lab">{t("Adaptation")}</LabLink>.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle number="4">{t("From GPT to ChatGPT")}</SectionTitle>
        <PipelineDiagram labels tasks />
        <p className="text-fg-secondary">
          {t(
            "ChatGPT (2022) took a GPT-3.5 foundation model and post-trained it: first fine-tuned on written demonstrations of good answers, then on human rankings of its own answers. The result is a single model that:",
          )}
        </p>
        <OptionList
          ordered={false}
          items={[
            t("follows instructions instead of continuing them;"),
            t("uses the conversation history to answer follow-up questions;"),
            t("summarizes, translates, answers and writes with the same weights."),
          ]}
        />
        <p className="text-sm text-fg-muted">
          {t("Chat with one in the")} <LabLink lesson="assistant-lab">{t("Assistant Lab")}</LabLink>
          {t(", then compare all three stages side by side in")}{" "}
          <LabLink lesson="gpt-to-chatgpt">{t("GPT → ChatGPT")}</LabLink>.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle number="5">{t("Foundation vs adapted model")}</SectionTitle>
        <div className="overflow-x-auto rounded-[3px] border border-divider">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead className="bg-surface">
              <tr>
                <th className="label-ui px-4 py-3 font-normal text-fg-muted" />
                <th className="label-ui px-4 py-3 font-normal text-chart-warm">
                  {t("Foundation model")}
                </th>
                <th className="label-ui px-4 py-3 font-normal text-chart-amber">
                  {t("Adapted assistant")}
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.aspect} className="border-t border-divider">
                  <th
                    scope="row"
                    className="label-ui px-4 py-3 align-top font-normal text-fg-muted"
                  >
                    {t(row.aspect)}
                  </th>
                  <td className="px-4 py-3 align-top text-fg-secondary">{t(row.foundation)}</td>
                  <td className="px-4 py-3 align-top text-fg-secondary">{t(row.adapted)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-fg-muted">
          {t(
            "Why the labs use GPT-2: models offered through chat APIs are already post-trained, so no prompt can turn them back into a raw foundation model. GPT-2 is a genuine one, and small enough to run on a laptop.",
          )}
        </p>
        <Takeaway>
          {t(
            "Pretraining develops general capabilities. Adaptation shapes how those capabilities are used. A conversational assistant is one application of a post-trained foundation model.",
          )}
        </Takeaway>
      </section>

      <LessonFooter entry={entry} />
    </LessonArticle>
  )
}

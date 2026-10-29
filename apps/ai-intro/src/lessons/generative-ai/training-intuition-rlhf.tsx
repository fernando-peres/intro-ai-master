import {
  LessonArticle,
  LessonFooter,
  LessonHero,
  LessonLead,
} from "@/components/course/lesson-layout"
import { CompareBars } from "@/components/workbench"
import type { LessonEntry } from "@/curriculum"
import { useTranslation } from "@/i18n/use-translation"
import { OptionList, StatRow, Takeaway } from "../machine-learning/metric-section"
import {
  BigTable,
  IntuitionSection,
  LabLink,
  Prose,
  Sample,
  StepLabel,
  TechniqueSummary,
} from "./training-intuition"
import {
  DEMONSTRATIONS,
  GPT3_BASE_COMPLETION,
  INSTRUCT_COMPLETION,
  INSTRUCTGPT_COUNTS,
  MOON_PROMPT,
  RANKING,
} from "./training-intuition-data"

const ORDINALS = ["1st", "2nd", "3rd", "4th"]

export function TrainingIntuitionRlhfLesson({ entry }: { entry: LessonEntry }) {
  const { t } = useTranslation()
  const ranked = RANKING.order.map((id) => {
    const answer = RANKING.answers.find((a) => a.id === id)
    if (!answer) throw new Error(`unknown answer ${id}`)
    return answer
  })
  return (
    <LessonArticle entry={entry}>
      <LessonHero line1={t("RLHF")} line2={t("learning from people")} />
      <LessonLead>
        {t(
          "GPT-3 could write almost anything, but it did not do what you asked. In 2022 OpenAI published the recipe that fixed this, InstructGPT, and ChatGPT followed it. Each of its three steps needs a different kind of data, and none of it is raw text.",
        )}
      </LessonLead>

      <IntuitionSection
        number="1"
        title={t("Demonstrations: show the model an answer")}
        mode="conceptual"
      >
        <StepLabel number="1">{t("Supervised fine-tuning")}</StepLabel>
        <Prose>
          <p>
            {t(
              "The first data set is small and expensive: a prompt, and the answer a trained labeler wrote for it. Not what the web says next, but what a helpful person would reply.",
            )}
          </p>
        </Prose>
        <div className="grid gap-4 lg:grid-cols-3">
          {DEMONSTRATIONS.map((demo, i) => (
            <Sample
              key={demo.prompt}
              label={`${t("Demonstration")} ${i + 1}`}
              prompt={demo.prompt}
              text={demo.answer}
            />
          ))}
        </div>
        <Prose>
          <p>
            {t(
              "Training is the same next-token prediction as pretraining, but only on the answer tokens: the model is told to imitate the labeler. A few thousand of these teach it the format of an answer. They do not teach it new facts; the facts were already in pretraining.",
            )}
          </p>
        </Prose>
      </IntuitionSection>

      <IntuitionSection
        number="2"
        title={t("Comparisons: rank the model's own answers")}
        mode="conceptual"
      >
        <StepLabel number="2">{t("Reward model")}</StepLabel>
        <Prose>
          <p>
            {t(
              "Writing a good answer is slow. Judging answers is fast. So the second data set asks the model for several answers to one prompt and asks a labeler only to rank them:",
            )}
          </p>
        </Prose>
        <Sample label={t("Prompt")} text={RANKING.prompt} />
        <ol className="grid gap-3 md:grid-cols-2" aria-label={t("Ranked answers")}>
          {ranked.map((answer, i) => (
            <li key={answer.id} className="list-none">
              <Sample
                label={`${t(ORDINALS[i])} · ${t(answer.note)}`}
                text={answer.text}
                tone={i === 0 ? "chosen" : undefined}
                className="h-full"
              />
            </li>
          ))}
        </ol>
        <Prose>
          <p>
            {t(
              "A ranking is a bundle of comparisons: 1st beats 2nd, 1st beats 3rd, and so on. On those pairs a second network is trained, the reward model. It reads a prompt and an answer and returns one number: how much a labeler would like it.",
            )}
          </p>
        </Prose>
        <div className="max-w-xl">
          <CompareBars
            rows={ranked.map((answer) => ({
              label: `“${answer.text}”`,
              count: t(answer.note),
              percent: Math.round(answer.score * 100),
              value: answer.score.toFixed(2),
              tone: answer.id === RANKING.order[0] ? "brand" : "muted",
            }))}
          />
        </div>
        <Takeaway className="text-[24px]">
          {t(
            "The reward model learns what people preferred, not what is true. Rank a wrong answer first often enough and it will score wrong answers highly.",
          )}
        </Takeaway>
      </IntuitionSection>

      <IntuitionSection
        number="3"
        title={t("Reinforcement learning: practise against the score")}
        mode="conceptual"
      >
        <StepLabel number="3">{t("Policy optimisation (PPO)")}</StepLabel>
        <Prose>
          <p>
            {t(
              "The third data set is the strangest: prompts alone, with no answer at all. The model writes an answer, the reward model scores it, and the model is nudged toward whatever scored well. Nobody looks at the individual answers any more; the score has replaced the person.",
            )}
          </p>
          <OptionList
            items={[
              t("Take a prompt from the set, e.g. “What is the capital of Australia?”"),
              t("The model samples an answer: “Sydney.”"),
              t(
                "The reward model scores it: 0.18. A nearby answer, “Canberra.”, would score 0.92.",
              ),
              t(
                "Update the weights a little toward answers like the second and away from answers like the first.",
              ),
            ]}
          />
          <p>
            {t(
              "One leash keeps this honest: a penalty for drifting too far from the model that entered this step. Without it, the model finds answers the reward model loves and nobody else does.",
            )}
          </p>
        </Prose>
        <StatRow stats={INSTRUCTGPT_COUNTS} />
        <Prose>
          <p className="text-[17px] text-fg-muted">
            {t(
              "Figures from the InstructGPT paper (2022): about 40 contractors wrote and ranked the answers. Compare with the 300 billion tokens of pretraining: this is a rounding error in size, and it changed the model's behaviour completely.",
            )}
          </p>
        </Prose>
      </IntuitionSection>

      <IntuitionSection number="4" title={t("Same prompt, before and after")} mode="historical">
        <div className="grid gap-4 lg:grid-cols-2">
          <Sample
            label={t("GPT-3, after pretraining")}
            prompt={MOON_PROMPT}
            text={GPT3_BASE_COMPLETION}
          />
          <Sample
            label={t("InstructGPT, after the three steps")}
            prompt={MOON_PROMPT}
            text={INSTRUCT_COMPLETION}
            tone="chosen"
          />
        </div>
        <Prose>
          <p>
            {t(
              "Both outputs come from the InstructGPT paper. The second model is not larger and knows nothing new. It was shown what an answer looks like, which answers people prefer, and then practised.",
            )}
          </p>
        </Prose>
      </IntuitionSection>

      <IntuitionSection number="5" title={t("Three steps, three kinds of data")}>
        <BigTable
          head={[t("Step"), t("Data"), t("Who makes it"), t("Signal"), t("What changes")]}
          rows={[
            {
              key: "sft",
              cells: [
                t("Demonstrations"),
                t("Prompt + a written answer"),
                t("Labelers write"),
                t("Imitate the answer, token by token"),
                t("The model answers in the right format"),
              ],
            },
            {
              key: "rm",
              cells: [
                t("Comparisons"),
                t("Prompt + several model answers, ranked"),
                t("The model writes, labelers rank"),
                t("Prefer the higher-ranked answer"),
                t("A reward model that scores any answer"),
              ],
            },
            {
              key: "rl",
              cells: [
                t("Reinforcement learning"),
                t("Prompts alone"),
                t("The model writes, the reward model scores"),
                t("Raise the score, stay close to the start"),
                t("The model's behaviour, toward what scored well"),
              ],
            },
          ]}
        />
        <Prose>
          <p>
            {t(
              "Run all three on a tiny GPT, rank its answers yourself and watch the reward model learn your bias, in",
            )}{" "}
            <LabLink lesson="post-training">{t("Transformers › Post-training")}</LabLink>.
          </p>
        </Prose>
      </IntuitionSection>

      <TechniqueSummary active="rlhf" />
      <LessonFooter entry={entry} />
    </LessonArticle>
  )
}

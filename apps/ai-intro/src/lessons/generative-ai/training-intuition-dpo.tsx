import {
  LessonArticle,
  LessonFooter,
  LessonHero,
  LessonLead,
} from "@/components/course/lesson-layout"
import type { LessonEntry } from "@/curriculum"
import { useTranslation } from "@/i18n/use-translation"
import { cn } from "@/lib/utils"
import { OptionList, Takeaway } from "../machine-learning/metric-section"
import { ModeBadge } from "./stages"
import {
  BigTable,
  IntuitionSection,
  LabLink,
  Prose,
  Sample,
  TechniqueSummary,
} from "./training-intuition"
import { DPO_SHIFT, pairsFromRanking, RANKING, TOY_FRANCE_PROMPT } from "./training-intuition-data"

export function TrainingIntuitionDpoLesson({ entry }: { entry: LessonEntry }) {
  const { t } = useTranslation()
  const byId = (id: string) => {
    const answer = RANKING.answers.find((a) => a.id === id)
    if (!answer) throw new Error(`unknown answer ${id}`)
    return answer
  }
  const pairs = pairsFromRanking(RANKING.order)
  const [best] = RANKING.order
  return (
    <LessonArticle entry={entry}>
      <LessonHero line1={t("DPO")} line2={t("preferences without a reward model")} />
      <LessonLead>
        {t(
          "RLHF needs a second network, a sampling loop and a careful RL algorithm to turn rankings into behaviour. Direct Preference Optimization (2023) asks: why not train on the rankings directly? Same data, no reward model, no sampling.",
        )}
      </LessonLead>

      <IntuitionSection number="1" title={t("The same data, as pairs")} mode="conceptual">
        <Prose>
          <p>
            {t(
              "DPO consumes exactly what the reward model consumed: a prompt and two answers, one chosen, one rejected. Nothing new has to be collected.",
            )}
          </p>
        </Prose>
        <Sample label={t("Prompt")} text={RANKING.prompt} />
        <fieldset className="grid gap-4 border-0 p-0 md:grid-cols-2" aria-label={t("One pair")}>
          <Sample label={t("Chosen")} text={byId(best).text} tone="chosen" />
          <Sample label={t("Rejected")} text={byId(RANKING.order[2]).text} tone="rejected" />
        </fieldset>
        <Prose>
          <p>{t("A labeler's ranking of four answers gives six such pairs:")}</p>
        </Prose>
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-label={t("Six pairs")}>
          {pairs.map((pair) => (
            <li
              key={`${pair.chosen}${pair.rejected}`}
              className="flex flex-col gap-1 rounded-[2px] border border-divider bg-surface px-4 py-3 font-display text-[19px] leading-snug"
            >
              <span className="text-chart-warm">✓ {byId(pair.chosen).text}</span>
              <span className="text-fg-muted">✗ {byId(pair.rejected).text}</span>
            </li>
          ))}
        </ol>
      </IntuitionSection>

      <IntuitionSection
        number="2"
        title={t("The update: chosen up, rejected down")}
        mode="conceptual"
      >
        <Prose>
          <p>
            {t(
              "For each pair, DPO raises the probability of the chosen answer and lowers the probability of the rejected one, measured against a frozen copy of the model from before training. The further the chosen answer already is ahead, the smaller the step.",
            )}
          </p>
        </Prose>
        <ProbabilityShift />
        <Prose>
          <p className="font-ui text-[15px] text-fg-muted">
            L = −log σ(β · [(log π − log π₀)(chosen) − (log π − log π₀)(rejected)])
          </p>
          <p>
            {t(
              "That is the whole algorithm. The term inside the brackets is an implicit reward, so the policy is acting as its own reward model. There is nothing to sample and nothing extra to train.",
            )}
          </p>
        </Prose>
        <Takeaway className="text-[24px]">
          {t("With DPO the model is its own reward model: the pairs move the weights directly.")}
        </Takeaway>
      </IntuitionSection>

      <IntuitionSection number="3" title={t("RLHF or DPO")}>
        <BigTable
          head={["", t("RLHF (reward model + PPO)"), t("DPO")]}
          rows={[
            {
              key: "data",
              cells: [
                t("Data"),
                t("Ranked answers, then prompts alone"),
                t("The same ranked answers, as pairs"),
              ],
            },
            {
              key: "models",
              cells: [
                t("Extra networks"),
                t("A reward model (and a value network)"),
                t("None; only a frozen copy of the start"),
              ],
            },
            {
              key: "sampling",
              cells: [
                t("Generates during training"),
                t("Yes: every step samples new answers"),
                t("No: it only reads the pairs"),
              ],
            },
            {
              key: "cost",
              cells: [
                t("Cost and stability"),
                t("High; RL hyperparameters are delicate"),
                t("Low; a plain supervised loss"),
              ],
            },
            {
              key: "loses",
              cells: [
                t("What it gives up"),
                t("Simplicity"),
                t(
                  "Exploration: it never sees answers outside the pairs, and both probabilities can fall together",
                ),
              ],
            },
          ]}
        />
        <Prose>
          <p>
            {t(
              "Many open recipes after 2023 replaced PPO with DPO for this reason; many frontier labs kept a reward model because sampling lets the model find answers nobody wrote down. Both start from the same human rankings.",
            )}
          </p>
        </Prose>
      </IntuitionSection>

      <IntuitionSection number="4" title={t("Toy scale")} mode="conceptual">
        <Prose>
          <p>
            {t(
              "The Post-training lab runs DPO for real on a tiny GPT, on prompts like this one. Rank the four answers, press Run 50 DPO steps, and watch the chosen answer's probability rise:",
            )}
          </p>
        </Prose>
        <Sample label={t("Toy prompt")} text={TOY_FRANCE_PROMPT.prompt} />
        <div className="grid gap-3 md:grid-cols-2">
          {TOY_FRANCE_PROMPT.candidates.map((candidate, i) => (
            <Sample
              key={candidate.id}
              label={`${candidate.id} · ${t(candidate.note)}`}
              text={candidate.text.trim()}
              tone={i === 0 ? "chosen" : i === 1 ? undefined : "rejected"}
            />
          ))}
        </div>
        <Prose>
          <p>
            {t("Try it in the panel “3b · Direct Preference Optimization” of")}{" "}
            <LabLink lesson="post-training">{t("Transformers › Post-training")}</LabLink>
            {t(
              ", after running SFT; the branch is exclusive with PPO on the same run, so compare them on two runs.",
            )}
          </p>
        </Prose>
      </IntuitionSection>

      <IntuitionSection number="5" title={t("One idea across the three pages")}>
        <Prose>
          <OptionList
            items={[
              t(
                "Raw text, no labels → predict the next token. The model learns what text looks like.",
              ),
              t("Written answers → imitate them. The model learns the shape of an answer."),
              t(
                "Ranked answers → a reward model and RL, or DPO on the pairs. The model learns which answers people prefer.",
              ),
            ]}
          />
        </Prose>
        <Takeaway className="text-[24px]">
          {t(
            "Each task needs its own kind of data, and each kind of data needs its own training technique. Change the data and you change what the model becomes.",
          )}
        </Takeaway>
      </IntuitionSection>

      <TechniqueSummary active="dpo" />
      <LessonFooter entry={entry} />
    </LessonArticle>
  )
}

/** Illustrative probabilities of the chosen and the rejected answer before and after DPO. */
function ProbabilityShift() {
  const { t } = useTranslation()
  return (
    <div
      className="flex flex-col gap-5 rounded-[3px] border border-divider bg-surface px-5 py-5"
      role="img"
      aria-label={t("Chosen answer rises from 31% to 58%; rejected answer falls from 24% to 6%.")}
    >
      {DPO_SHIFT.map((row) => (
        <div key={row.label} className="flex flex-col gap-2">
          <p className="flex items-baseline justify-between gap-3 font-display text-[22px] leading-none">
            <span className={row.label === "chosen" ? "text-chart-warm" : "text-fg-muted"}>
              {t(row.label)} · “{row.answer}”
            </span>
            <span className="text-fg">
              {row.before}% → {row.after}%
            </span>
          </p>
          {[row.before, row.after].map((value, i) => (
            <div key={i === 0 ? "before" : "after"} className="flex items-center gap-3">
              <span className="label-ui w-12 shrink-0 text-fg-muted">
                {i === 0 ? t("before") : t("after")}
              </span>
              <div className="h-2.5 flex-1 rounded-[3px] bg-elevated">
                <div
                  className={cn(
                    "h-full rounded-[3px]",
                    i === 0
                      ? "bg-fg-muted/50"
                      : row.label === "chosen"
                        ? "bg-chart-warm"
                        : "bg-fg-muted",
                  )}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ))}
      <p className="label-ui text-fg-muted">
        <ModeBadge mode="conceptual" />{" "}
        {t("Illustrative numbers; the lab shows the toy model's real ones.")}
      </p>
    </div>
  )
}

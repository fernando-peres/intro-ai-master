import { ArrowRightIcon } from "lucide-react"
import { SectionTitle } from "@/components/course/lesson-layout"
import { toolbarButtonClass } from "@/components/workbench"
import { useTranslation } from "@/i18n/use-translation"
import { cn } from "@/lib/utils"
import { OptionList, Takeaway } from "../machine-learning/metric-section"
import { PipelineDiagram } from "./pipeline-diagram"

type Technique = { name: string; meaning: string; example: string }

/** Grouped by the question students need first: does the model itself change? */
const TECHNIQUES: { group: string; tone: string; rows: Technique[] }[] = [
  {
    group: "Changes the weights",
    tone: "text-chart-warm",
    rows: [
      {
        name: "Continued pretraining",
        meaning:
          "Keep running next-token training, but on unlabelled text from one domain, so the model absorbs its vocabulary and facts.",
        example:
          "Thousands of legal contracts, so the model writes and reads legal language better.",
      },
      {
        name: "Supervised fine-tuning (SFT)",
        meaning:
          "Train on demonstrations: an input paired with the output you want. The model learns to produce that kind of output.",
        example: "“The delivery was terrible.” → Negative, repeated over many labelled reviews.",
      },
      {
        name: "Preference optimization (RLHF, DPO)",
        meaning:
          "People compare two answers to the same input and pick the better one. Training makes the chosen answer more likely and the rejected one less likely.",
        example: "For a mixed review, “Mixed” is chosen and “Positive” rejected.",
      },
    ],
  },
  {
    group: "Partially changes the weights",
    tone: "text-chart-amber",
    rows: [
      {
        name: "Parameter-efficient fine-tuning (PEFT, LoRA)",
        meaning:
          "Freeze the original weights and train a small set of extra ones. The base model is shared; only the small adapter is new.",
        example: "A sentiment adapter of a few megabytes added to a multi-gigabyte model.",
      },
    ],
  },
  {
    group: "Does not change the weights",
    tone: "text-fg-secondary",
    rows: [
      {
        name: "Prompt engineering and few-shot learning",
        meaning:
          "Put instructions and a few labelled examples in the prompt. The model follows the pattern only while it is in the context.",
        example: "Three labelled reviews written above the new review, as in the lab.",
      },
      {
        name: "Retrieval-augmented generation (RAG)",
        meaning:
          "At question time, search a document store and paste the relevant passages into the prompt, so the model answers from them.",
        example: "A support bot that looks up the company’s return policy before answering.",
      },
    ],
  },
]

/** The Theory tab of the Adaptation lesson; `onOpenLab` switches to the Lab tab. */
export function AdaptationTheory({ onOpenLab }: { onOpenLab: () => void }) {
  const { t } = useTranslation()
  return (
    <>
      <section className="flex flex-col gap-4">
        <SectionTitle number="1">{t("What adaptation is")}</SectionTitle>
        <p className="text-fg-secondary">
          {t(
            "Adaptation adjusts a pretrained model so its general skill serves a specific task, domain or behaviour, without training a new model from scratch. Pretraining is expensive and done once; adaptation is cheaper and done many times, for many purposes.",
          )}
        </p>
        <p className="text-fg-secondary">
          {t(
            "Example: shown “Review: The delivery was terrible. Sentiment:”, GPT-2 may continue with any word, such as “The” or “I”. Adapted to the task, the same model answers with a label: Negative.",
          )}
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle number="2">{t("From foundation model to adapted model")}</SectionTitle>
        <PipelineDiagram labels />
        <p className="text-fg-secondary">
          {t(
            "A foundation model leaves pretraining able to continue text, not to help. The adaptation that turns it into a useful model is called post-training. It learns from two kinds of observations of the behaviour we want:",
          )}
        </p>
        <OptionList
          items={[
            t(
              "Demonstration data: an input with the desired output, written or checked by people. It is used for supervised fine-tuning (SFT).",
            ),
            t(
              "Preference data: two outputs for the same input, one marked chosen and the other rejected. It is used for RLHF (through a reward model) or DPO (directly).",
            ),
          ]}
        />
        <p className="text-fg-secondary">
          {t(
            "ChatGPT followed this path: a GPT-3.5 foundation model, fine-tuned on written demonstrations, then trained on human rankings of its own answers.",
          )}
        </p>
        <Takeaway>
          {t(
            "Pretraining develops capabilities. Post-training turns observations of the desired behaviour into weight changes.",
          )}
        </Takeaway>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle number="3">{t("Types of adaptation")}</SectionTitle>
        <p className="text-fg-secondary">
          {t(
            "The methods split into those that change the model's weights, and so create a new model, and those that only change what the model reads.",
          )}
        </p>
        <div className="overflow-x-auto rounded-[3px] border border-divider">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead className="bg-surface">
              <tr>
                <th className="label-ui px-4 py-3 font-normal text-fg-muted">{t("Technique")}</th>
                <th className="label-ui px-4 py-3 font-normal text-fg-muted">
                  {t("What it means")}
                </th>
                <th className="label-ui px-4 py-3 font-normal text-fg-muted">{t("Example")}</th>
              </tr>
            </thead>
            {TECHNIQUES.map((g) => (
              <tbody key={g.group}>
                <tr className="border-t border-divider bg-surface">
                  <th
                    colSpan={3}
                    scope="colgroup"
                    className={cn("label-ui px-4 py-2 font-normal", g.tone)}
                  >
                    {t(g.group)}
                  </th>
                </tr>
                {g.rows.map((row) => (
                  <tr key={row.name} className="border-t border-divider">
                    <th
                      scope="row"
                      className="px-4 py-3 align-top font-display text-[16px] font-normal text-fg"
                    >
                      {t(row.name)}
                    </th>
                    <td className="px-4 py-3 align-top text-fg-secondary">{t(row.meaning)}</td>
                    <td className="px-4 py-3 align-top text-fg-muted">{t(row.example)}</td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
        <Takeaway>{t("Prompting changes the context. Fine-tuning changes the weights.")}</Takeaway>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle number="4">{t("What the lab shows")}</SectionTitle>
        <p className="text-fg-secondary">
          {t(
            "In the lab you adapt GPT-2 live with the methods that leave the weights alone: zero-shot and few-shot prompting. Then you review each prediction. Every review becomes an observation, and together they form the dataset a post-training job would use to change the weights.",
          )}
        </p>
        <button
          type="button"
          onClick={onOpenLab}
          className={cn(toolbarButtonClass(true), "self-start")}
        >
          {t("Open the lab")}
          <ArrowRightIcon className="size-3" aria-hidden />
        </button>
      </section>
    </>
  )
}

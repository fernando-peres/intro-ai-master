import { Expandable } from "@/components/charts/expandable"
import {
  LessonArticle,
  LessonFooter,
  LessonHero,
  LessonLead,
} from "@/components/course/lesson-layout"
import { FunFact } from "@/components/fun-fact"
import type { LessonEntry } from "@/curriculum"
import { useTranslation } from "@/i18n/use-translation"
import { OptionList, Takeaway } from "@/lessons/machine-learning/metric-section"
import { BackPropagationConcepts } from "./back-propagation-concepts"
import { boldSegments } from "./back-propagation-diagram"
import { BackPropagationIntroDiagram } from "./back-propagation-intro-diagram"
import {
  BACKPROP_DATASETS,
  DEFAULT_ACTIVATION,
  DEFAULT_HIDDEN_LAYERS,
  DEFAULT_LEARNING_RATE,
  LEARNING_RATE_PRESETS,
} from "./back-propagation-training"

/** Back-propagation, page 1: what it is, why it was needed, and its two passes. */
export function BackPropagationOverviewLesson({ entry }: { entry: LessonEntry }) {
  const { t } = useTranslation()
  return (
    <LessonArticle entry={entry}>
      <LessonHero line1={t("Backpropagation")} line2={t("(1986)")} />
      <FunFact>
        <strong className="font-bold">{t("Backpropagation wasn't invented in 1986")}</strong>
        <span className="mt-2 block text-base leading-snug font-normal">
          {boldSegments(
            t(
              "Although earlier research had explored the underlying ideas, **David Rumelhart, Geoffrey Hinton, and Ronald Williams popularized backpropagation in 1986**, demonstrating how it could effectively train multi-layer neural networks.",
            ),
          )}
        </span>
        <span className="mt-2 block text-base leading-snug font-normal">
          {t(
            "Their landmark paper, published in Nature on October 9, 1986, highlighted an important breakthrough: hidden layers could automatically discover meaningful features in data rather than relying on humans to define them.",
          )}
        </span>
        <span className="mt-2 block text-base leading-snug font-normal">
          <strong className="font-bold">{t("Original paper:")}</strong>{" "}
          <a
            href="https://doi.org/10.1038/323533a0"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            {t("Learning representations by back-propagating errors — Nature (1986)")}
          </a>
        </span>
      </FunFact>
      <div className="flex flex-col gap-4">
        <LessonLead>
          <span className="label-ui mr-2 text-brand">{t("What")}</span>
          <strong className="font-bold text-fg">
            {t(
              "Backpropagation is an algorithm that enables neural networks to learn from their mistakes, even across multiple layers.",
            )}
          </strong>
        </LessonLead>
        <LessonLead>
          <span className="label-ui mr-2 text-brand">{t("Why")}</span>
          <strong className="font-bold text-fg">
            {t(
              "Early neural networks could learn simple patterns, but struggled with more complex problems.",
            )}
          </strong>
        </LessonLead>
        <OptionList
          items={[
            boldSegments(
              t(
                "**Limited capabilities:** Simple Perceptrons could only learn linear relationships, making them unable to solve problems such as XOR.",
              ),
            ),
            boldSegments(
              t(
                "**The challenge:** Adding hidden layers made it possible to represent more complex patterns, but efficiently training those layers was difficult.",
              ),
            ),
            boldSegments(
              t(
                "**The breakthrough:** Backpropagation provided an efficient way to determine how each connection contributed to an error, enabling multi-layer networks to learn from examples.",
              ),
            ),
          ]}
        />
        <Expandable title={t("Forward and backward")}>
          <BackPropagationIntroDiagram />
        </Expandable>
        <Takeaway>
          {boldSegments(
            t(
              "**The key innovation:** Neural networks could now automatically learn complex patterns and discover useful features from data, without humans having to explicitly define every rule.",
            ),
          )}
        </Takeaway>
      </div>

      <section aria-label={t("Key concepts")} className="flex flex-col gap-3">
        <h2 className="font-display text-3xl font-bold text-fg">{t("Key concepts")}</h2>
        <BackPropagationConcepts
          hiddenLayers={DEFAULT_HIDDEN_LAYERS}
          activation={DEFAULT_ACTIVATION}
          learningRate={DEFAULT_LEARNING_RATE}
          learningRatePresets={LEARNING_RATE_PRESETS}
          epoch={0}
          pointCount={BACKPROP_DATASETS.xor.points.length}
          history={[]}
        />
      </section>

      <LessonFooter entry={entry} />
    </LessonArticle>
  )
}

import { GaugeIcon, NetworkIcon, TargetIcon } from "lucide-react"
import { DecisionChart } from "@/components/charts/decision-chart"
import {
  LessonArticle,
  LessonFooter,
  LessonHero,
  LessonLead,
  SectionTitle,
} from "@/components/course/lesson-layout"
import type { LessonEntry } from "@/curriculum"
import { useTranslation } from "@/i18n/use-translation"
import { createNetwork, predict } from "@/lib/neural-net"
import { classMeta, machineReadings } from "../programming-vs-ml/dataset"
import {
  DEFAULT_ACTIVATION,
  DEFAULT_HIDDEN_LAYERS,
  DEFAULT_LEARNING_RATE,
  SEED,
  TEMP_DOMAIN,
  toInput,
  trainWithLossHistory,
  VIB_DOMAIN,
} from "../programming-vs-ml/ml-training"
import { NetworkDiagram } from "../programming-vs-ml/network-diagram"
import { rulesScore } from "../programming-vs-ml/rules"
import { AlgorithmExamples } from "./algorithm-examples"

const TOTAL = machineReadings.length
const nnArchitecture = [2, ...DEFAULT_HIDDEN_LAYERS, 1]

/** The architecture, before a single training step — illustrates Representation alone. */
const representationNet = createNetwork(nnArchitecture, SEED, DEFAULT_ACTIVATION)

/** The same architecture after a fixed run of training — illustrates what Optimization found. */
const { net: trainedNet } = trainWithLossHistory(nnArchitecture, DEFAULT_ACTIVATION, 300, 10)
const trainedCorrect = machineReadings.filter(
  (r) => (predict(trainedNet, toInput(r))[0] >= 0.5 ? 1 : 0) === (r.label === "at-risk" ? 1 : 0),
).length
const trainedAccuracy = Math.round((trainedCorrect / TOTAL) * 100)

const summaryCards = [
  {
    icon: NetworkIcon,
    number: "1",
    title: "Representation",
    caption: "The shape a solution can take — a tree, a line, a network, a set of centroids.",
  },
  {
    icon: GaugeIcon,
    number: "2",
    title: "Optimization",
    caption: "How it searches for good parameter values within that shape.",
  },
  {
    icon: TargetIcon,
    number: "3",
    title: "Evaluation",
    caption: "How we judge what it found — a different measure for every kind of task.",
  },
]

const taskTypes = [
  {
    title: "Classification",
    body: "Predict one of a fixed set of categories. Our dataset: Normal or At Risk.",
  },
  {
    title: "Regression",
    body: "Predict a continuous number, e.g. a house's sale price.",
  },
  {
    title: "Clustering",
    body: "Group similar observations with no labels at all, e.g. flowers by petal size — discover the categories, don't predict them.",
  },
]

const toInputXY = (x: number, y: number) => toInput({ temperature: x, vibration: y })
const points = machineReadings.map((r) => ({ x: r.temperature, y: r.vibration, series: r.label }))
const series = [
  {
    key: "normal",
    label: `${classMeta.normal.code} — ${classMeta.normal.name}`,
    color: "var(--color-chart-cool)",
  },
  {
    key: "at-risk",
    label: `${classMeta["at-risk"].code} — ${classMeta["at-risk"].name}`,
    color: "var(--color-brand)",
  },
]

export function ComponentsLesson({ entry }: { entry: LessonEntry }) {
  const { t } = useTranslation()
  return (
    <LessonArticle entry={entry}>
      <LessonHero line1={t("ML is composed")} line2={t("of 3 components")} />
      <LessonLead>
        {t(
          "\"A computer program is said to learn from experience E with respect to some class of tasks T and performance measure P, if its performance at tasks in T, as measured by P, improves with experience E.\" Tom Mitchell wrote that definition in 1997, and it still holds: a machine learning algorithm isn't one thing, it's a composite of three independent pieces. ",
        )}
      </LessonLead>

      <section
        aria-label={t("Source")}
        className="flex items-start gap-6 rounded-[3px] border border-divider bg-surface p-[18px]"
      >
        <img
          src="/references/mitchell-1997-machine-learning.jpg"
          alt={t("Cover of Tom M. Mitchell's 1997 textbook, Machine Learning")}
          className="h-[132px] w-auto rounded-[2px] border border-divider"
        />
        <div className="flex flex-col gap-2">
          <p className="text-sm text-fg-secondary">
            Mitchell, T. M. (1997). <span className="italic text-fg">Machine Learning</span>.
            McGraw-Hill Science/Engineering/Math. ISBN 0070428077.
          </p>
          <p className="text-sm text-fg-secondary">
            {t(
              "This chapter uses a three-part reading of that definition — Representation, Optimization, Evaluation — popularized by Miller (2017). Sections 1–3 take the network from the Machine Learning page apart; section 4 does the same for three classic algorithms. ",
            )}
          </p>
        </div>
      </section>

      <section aria-label={t("Summary")} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {summaryCards.map(({ icon: Icon, number, title, caption }) => (
          <div
            key={title}
            className="flex flex-col items-center gap-2 rounded-[3px] border border-divider bg-surface p-[18px] text-center"
          >
            <Icon className="size-8 text-brand" aria-hidden />
            <p className="label-ui text-fg-muted">
              <span className="text-brand">{number}.</span> {t(title)}
            </p>
            <p className="text-sm text-fg-secondary">{t(caption)}</p>
          </div>
        ))}
      </section>

      <section aria-label={t("What's being learned?")} className="flex flex-col gap-3">
        <h2 className="label-ui text-fg-muted">{t("What's being learned?")}</h2>
        <p className="text-fg-secondary">
          {t("The three components look different depending on the task. The most common ones: ")}
        </p>
        <ul className="flex flex-col gap-2">
          {taskTypes.map((task) => (
            <li key={task.title} className="flex gap-3 text-sm">
              <span aria-hidden className="text-brand">
                —
              </span>
              <span className="text-fg-secondary">
                <span className="text-fg">{t(task.title)}.</span> {t(task.body)}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-fg-secondary">
          {t(
            '(And others — ranking, generation, reinforcement learning. Representation, Optimization and Evaluation look different for each, but every technique still has exactly these three parts.) Our machines are a classification task — the three sections below walk through the network\'s own Representation, Optimization and Evaluation, then "Other examples" works the same split for a decision tree, linear regression and clustering, each on its classic dataset. ',
          )}
        </p>
      </section>

      <section aria-label={t("Representation")} className="flex flex-col gap-3">
        <SectionTitle number="1">{t("Representation")}</SectionTitle>
        <p className="text-fg-secondary">
          {t(
            'Representation is the shape a solution is allowed to take — the template the search process fills in. A neural network\'s representation is a graph of interconnected nodes organized in layers, each connection carrying its own weight. On the Machine Learning page, every control in "Hidden layers" and "Activation" is a Representation choice: how many layers, how many neurons each, and which activation function. None of that depends on training. The network below has never seen a single example — these are its starting, randomly seeded weights and biases, drawn only to the shape ',
          )}
          {nnArchitecture.join(" → ")}.
        </p>
        <NetworkDiagram
          network={representationNet}
          toInput={toInputXY}
          domain={{
            xMin: TEMP_DOMAIN[0],
            xMax: TEMP_DOMAIN[1],
            yMin: VIB_DOMAIN[0],
            yMax: VIB_DOMAIN[1],
          }}
          inputLabels={[t("Temp"), t("Vib")]}
          outputLabel={t("At Risk?")}
          showWeights
        />
        <p className="text-sm text-fg-secondary">
          {nnArchitecture.join(" → ")}, {DEFAULT_ACTIVATION}{" "}
          {t(
            ' hidden / sigmoid output — chosen before training starts. A tree of questions, a straight line or a handful of centre points would each be a different representation, able to express a different family of answers ("Other examples" below draws each one). ',
          )}
        </p>
      </section>

      <section aria-label={t("Optimization")} className="flex flex-col gap-3">
        <SectionTitle number="2">{t("Optimization")}</SectionTitle>
        <p className="text-fg-secondary">
          {t(
            "Optimization doesn't choose the shape — it searches the space that Representation already defined, guided by one function to minimize or maximize. A neural network uses gradient-based search: backpropagation. For this network the function being minimized is binary cross-entropy — compute how far the output was from the true label, then push that error backwards through the layers with the chain rule to get each weight's share of the blame. ",
          )}
        </p>
        <div className="flex flex-col gap-1.5 rounded-[3px] border border-divider bg-surface p-[18px] font-ui text-sm text-fg">
          <p>L = −[y·log ŷ + (1 − y)·log(1 − ŷ)]</p>
          <p>
            w ← w − η·∂L/∂w{" "}
            <span className="text-xs text-fg-muted">η = {DEFAULT_LEARNING_RATE}</span>
          </p>
        </div>
        <p className="text-sm text-fg-secondary">
          {t(
            "Every weight moves a little in the direction that lowers L. Pressing Step on the Machine Learning page runs this update once; Train repeats it. The learning rate, the batch size, and how many epochs to run are all details of how the search takes its steps — they don't change what the network can represent, only how well it finds a good setting within it. ",
          )}
        </p>
      </section>

      <section aria-label={t("Evaluation")} className="flex flex-col gap-3">
        <SectionTitle number="3">{t("Evaluation — the measure")}</SectionTitle>
        <p className="text-fg-secondary">
          {t(
            "A candidate solution is only as good as the function used to judge it, and that function depends on the task being learned. Our dataset is a classification task, so the measure here is accuracy: the share of machines correctly classified. After 300 epochs of the exact optimization process above, this network reaches ",
          )}
          {trainedAccuracy}% ({trainedCorrect}/{TOTAL}
          {t(") — the hand-written rules from the Programming page get")} {rulesScore.accuracy}% (
          {rulesScore.correct}/{rulesScore.total}
          {t("). Same measure, two different programs. ")}
        </p>
        <DecisionChart
          points={points}
          series={series}
          xLabel={t("Temperature (°C)")}
          yLabel={t("Vibration (mm/s)")}
          valueAt={(x, y) => predict(trainedNet, toInputXY(x, y))[0]}
          showBoundaryLine
        />
        <p className="text-sm text-fg-secondary">
          {t(
            'Accuracy only applies because this is classification — a regression task would use mean squared error instead, and clustering has no true label to compare against at all. "Other examples" below computes each of those measures for real. ',
          )}
        </p>
      </section>

      <section aria-label={t("Other examples")} className="flex flex-col gap-3">
        <SectionTitle number="4">{t("Other examples")}</SectionTitle>
        <p className="text-fg-secondary">
          {t(
            "The same Representation / Optimization / Evaluation split, worked for three classic algorithms, each on the dataset it is usually taught with, plus the network above, summarized for comparison. One per task type: classification, regression, clustering. ",
          )}
        </p>
        <AlgorithmExamples />
      </section>

      <section aria-label={t("Why this split matters")} className="flex flex-col gap-2">
        <SectionTitle number="5">{t("Why this split matters")}</SectionTitle>
        <p className="text-fg-secondary">
          {t(
            'The rest of this chapter zooms in on Evaluation: what goes wrong when a model is too simple or too flexible (bias and variance), whom it treats unfairly (bias and fairness), and one lesson per family of metrics. The chapter after studies one Representation — the neural network — in depth, and its own lessons fall along the same seam: "Back-propagation" is Optimization, "Loss & Optimization" is Evaluation and Optimization named almost literally. Every technique later in this course, through transformers and agents, is still a choice of these same three ingredients. ',
          )}
        </p>
      </section>

      <LessonFooter entry={entry} />
    </LessonArticle>
  )
}

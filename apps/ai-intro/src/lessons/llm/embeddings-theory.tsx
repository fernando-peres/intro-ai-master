import { Link } from "@tanstack/react-router"
import { ArrowRightIcon } from "lucide-react"
import type { ReactNode } from "react"
import { SectionTitle } from "@/components/course/lesson-layout"
import { toolbarButtonClass } from "@/components/workbench"
import { useTranslation } from "@/i18n/use-translation"
import { cn } from "@/lib/utils"
import { ModeBadge } from "../generative-ai/stages"
import { OptionList, Takeaway } from "../machine-learning/metric-section"

const MODALITIES: [string, string, string][] = [
  ["Word", "GloVe, word2vec", "300"],
  ["Token", "GPT-2 input embeddings (a learned lookup table)", "768"],
  ["Sentence", "MiniLM, Sentence-BERT", "384–768"],
  ["Image", "ResNet, Vision Transformer", "768–2048"],
  ["Audio", "wav2vec 2.0, Whisper encoder", "768–1024"],
  ["Multimodal", "CLIP: text and images in one space", "512–768"],
]

const METRICS: [string, string, string][] = [
  ["Dot product", "a·b = Σ aᵢ bᵢ", "Grows with agreement and with vector length"],
  [
    "Cosine",
    "cos(a, b) = a·b / (‖a‖ ‖b‖)",
    "The angle only: 1 same direction, 0 at right angles (nothing in common along any axis), −1 opposite",
  ],
  ["Euclidean", "‖a − b‖ = √ Σ (aᵢ − bᵢ)²", "Straight-line distance; 0 means identical"],
  ["Manhattan", "Σ |aᵢ − bᵢ|", "Distance walked along the axes"],
]

const USES: [string, string][] = [
  ["Search", "Find documents by meaning, even when no word is shared with the query."],
  ["RAG", "Retrieve the passages closest to a question and hand them to an LLM as context."],
  ["Recommendation", "Suggest items whose vectors are near the ones a user liked."],
  ["Clustering", "Group similar items without labels by looking for dense regions."],
]

const PIPELINE = ["Input", "Model", "Vector", "Similarity", "PCA"]

function LabLink({
  chapter,
  lesson,
  children,
}: {
  chapter: string
  lesson: string
  children: ReactNode
}) {
  return (
    <Link
      to="/learn/$chapter/$lesson"
      params={{ chapter, lesson }}
      className="text-brand underline-offset-4 hover:underline"
    >
      {children}
    </Link>
  )
}

function Table({ head, rows }: { head: ReactNode[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-[3px] border border-divider">
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        <thead className="bg-surface">
          <tr>
            {head.map((cell, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed header cells
              <th key={i} className="label-ui px-4 py-3 font-normal text-fg-muted">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: authored rows in fixed order
            <tr key={r} className="border-t border-divider">
              {row.map((cell, c) =>
                c === 0 ? (
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed columns
                  <th key={c} scope="row" className="px-4 py-3 align-top font-normal text-fg">
                    {cell}
                  </th>
                ) : (
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed columns
                  <td key={c} className="px-4 py-3 align-top text-fg-secondary">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Formula({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-[2px] border border-line bg-surface px-3 py-2 font-ui text-[13px] text-fg">
      {children}
    </p>
  )
}

/** Input → model → vector → similarity → PCA, left to right; the vector box is the one that matters. */
function PipelineDiagram() {
  const { t } = useTranslation()
  const box = 128
  const gap = 36
  const width = PIPELINE.length * box + (PIPELINE.length - 1) * gap
  return (
    <div className="overflow-x-auto">
      <svg
        role="img"
        aria-label={t("Pipeline: {0}", [PIPELINE.map((step) => t(step)).join(" → ")])}
        viewBox={`0 0 ${width} 64`}
        className="h-auto w-full min-w-[560px]"
      >
        {PIPELINE.map((step, i) => {
          const x = i * (box + gap)
          const key = i === 2
          return (
            <g key={step}>
              <rect
                x={x + 1}
                y={8}
                width={box - 2}
                height={48}
                rx={3}
                className="fill-surface"
                stroke={key ? "var(--color-chart-warm)" : "var(--color-line)"}
                strokeWidth={key ? 2 : 1}
              />
              <text
                x={x + box / 2}
                y={37}
                textAnchor="middle"
                className="fill-fg font-ui text-[14px]"
              >
                {t(step)}
              </text>
              {i < PIPELINE.length - 1 && (
                <path
                  d={`M${x + box + 6},32 H${x + box + gap - 8} m-5,-4 l5,4 l-5,4`}
                  fill="none"
                  className="stroke-fg-muted"
                  strokeWidth={1.5}
                />
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/** A flat parallelogram: man → woman and king → queen are the same arrow, drawn by hand. */
function ParallelogramDiagram() {
  const { t } = useTranslation()
  const points = [
    { word: "man", x: 70, y: 130 },
    { word: "woman", x: 190, y: 150 },
    { word: "king", x: 130, y: 40 },
    { word: "queen", x: 250, y: 60 },
  ]
  const arrow = (from: number, to: number) => (
    <line
      x1={points[from].x}
      y1={points[from].y}
      x2={points[to].x}
      y2={points[to].y}
      className="stroke-fg-secondary"
      strokeWidth={1.5}
      strokeDasharray="5 4"
    />
  )
  return (
    <svg
      role="img"
      aria-label={t(
        "Idealized 2D map: man to woman and king to queen are parallel arrows of the same length",
      )}
      viewBox="0 0 320 190"
      className="h-auto w-full max-w-[420px]"
    >
      {arrow(0, 1)}
      {arrow(2, 3)}
      {points.map((p) => (
        <g key={p.word}>
          <circle cx={p.x} cy={p.y} r={6} fill="var(--color-chart-warm)" />
          <text x={p.x + 10} y={p.y + 4} className="fill-fg font-display text-[14px]">
            {t(p.word)}
          </text>
        </g>
      ))}
    </svg>
  )
}

/** The Theory tab: what an embedding is, its kinds, similarity metrics, the 2D shadow and uses. */
export function EmbeddingsTheory({ onOpenLab }: { onOpenLab: () => void }) {
  const { t } = useTranslation()
  return (
    <>
      <section className="flex flex-col gap-4">
        <SectionTitle number="1">{t("What an embedding is")}</SectionTitle>
        <p className="text-fg-secondary">
          {t(
            "An embedding is a list of numbers that stands for a thing: a word, a sentence, an image. A model learns the numbers so that things used in similar ways get similar lists. Closeness between two lists then stands in for closeness in meaning.",
          )}
        </p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="label-ui text-fg-muted">{t("From input to a picture")}</span>
            <ModeBadge mode="conceptual" />
          </div>
          <PipelineDiagram />
        </div>
        <Takeaway>
          {t("The vector is how the computer represents meaning. Everything after it is geometry.")}
        </Takeaway>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle number="2">{t("Modalities")}</SectionTitle>
        <p className="text-fg-secondary">
          {t(
            "Any input a model can read can be embedded. Typical sizes below; they are fixed by each model.",
          )}
        </p>
        <Table
          head={[t("Modality"), t("Model examples"), t("Dimensions")]}
          rows={MODALITIES.map(([kind, models, dims]) => [t(kind), t(models), dims])}
        />
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle number="3">{t("Static vs contextual")}</SectionTitle>
        <OptionList
          items={[
            <span key="static">
              <strong className="text-fg">{t("Static")}</strong>{" "}
              {t(
                "(GloVe): one vector per word, learned once from word co-occurrence. “bank” has a single vector for the river and the money.",
              )}
            </span>,
            <span key="contextual">
              <strong className="text-fg">{t("Contextual")}</strong>{" "}
              {t(
                "(MiniLM): the vector of every token is computed from the whole sentence, so “bank” changes with its context. A sentence vector pools its token vectors into one.",
              )}
            </span>,
          ]}
        />
        <p className="text-sm text-fg-muted">
          {t("Watch attention separate the two senses of “bank” in")}{" "}
          <LabLink chapter="generative-ai" lesson="transformer-architecture">
            {t("Architecture")}
          </LabLink>
          .
        </p>
        <Takeaway>
          {t("Vectors from different models live in different spaces and can never be compared.")}
        </Takeaway>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle number="4">{t("Similarity metrics")}</SectionTitle>
        <Table
          head={[t("Metric"), t("Formula"), t("Reads as")]}
          rows={METRICS.map(([name, formula, reads]) => [t(name), formula, t(reads)])}
        />
        <Formula>{t("For unit vectors (‖a‖ = ‖b‖ = 1): a·b = cos(a, b)")}</Formula>
        <p className="text-sm text-fg-muted">
          {t(
            "Normalizing first makes the dot product equal to the cosine, and ranks neighbors the same way as Euclidean distance.",
          )}
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle number="5">{t("2D is a shadow")}</SectionTitle>
        <p className="text-fg-secondary">
          {t(
            "Real vectors have hundreds of dimensions, so a plot has to squash them into two with PCA, which keeps the directions of greatest spread. The classic picture is a parallelogram: the step from man to woman repeats from king to queen.",
          )}
        </p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="label-ui text-fg-muted">
              {t("An idealized map, not measured data")}
            </span>
            <ModeBadge mode="conceptual" />
          </div>
          <ParallelogramDiagram />
        </div>
        <Takeaway>
          {t(
            "A 2D map keeps only a shadow of the geometry: distances are distorted and the axes mean nothing by themselves.",
          )}
        </Takeaway>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle number="6">{t("Where embeddings are used")}</SectionTitle>
        <OptionList
          ordered={false}
          items={USES.map(([name, text]) => (
            <span key={name}>
              <strong className="text-fg">{t(name)}</strong>: {t(text)}
            </span>
          ))}
        />
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

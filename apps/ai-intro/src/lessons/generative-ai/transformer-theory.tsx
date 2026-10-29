import { Link } from "@tanstack/react-router"
import { ArrowRightIcon } from "lucide-react"
import type { ReactNode } from "react"
import { SectionTitle } from "@/components/course/lesson-layout"
import { toolbarButtonClass } from "@/components/workbench"
import { useTranslation } from "@/i18n/use-translation"
import { cn } from "@/lib/utils"
import { OptionList, Takeaway } from "../machine-learning/metric-section"
import { ModeBadge } from "./stages"
import { TransformerVariantsDiagram } from "./transformer-variants-diagram"

const HISTORY: { name: string; year: string; contribution: string }[] = [
  {
    name: "Transformer",
    year: "2017",
    contribution: "Attention-based architecture with an encoder and a decoder",
  },
  {
    name: "GPT-2",
    year: "2019",
    contribution: "Large decoder-only model trained to predict the next token",
  },
  {
    name: "GPT-3",
    year: "2020",
    contribution: "Scaling, and strong few-shot learning from examples in the prompt",
  },
  {
    name: "InstructGPT",
    year: "2022",
    contribution: "Instruction following through SFT, a reward model and RLHF",
  },
  {
    name: "GPT-3.5 / ChatGPT",
    year: "2022",
    contribution: "Conversational, instruction-following assistant",
  },
]

const VARIANTS: { name: string; attention: string; example: string; uses: string }[] = [
  {
    name: "Encoder-only",
    attention: "Bidirectional self-attention: every token sees the whole input",
    example: "BERT",
    uses: "Classification, extraction, representations",
  },
  {
    name: "Decoder-only",
    attention: "Causal self-attention: a token sees only what came before it",
    example: "GPT-2, GPT-3",
    uses: "Text generation and completion; assistants after post-training",
  },
  {
    name: "Encoder–decoder",
    attention:
      "Encoder self-attention, decoder causal attention, plus cross-attention to the encoder",
    example: "T5, BART",
    uses: "Translation, summarization, text-to-text tasks",
  },
]

const TRAINING_VS_INFERENCE: [string, string][] = [
  ["Known target tokens", "Future tokens unknown"],
  ["Forward pass and backward pass", "Forward pass only"],
  ["Loss and optimizer", "Decoding strategy (greedy, sampling, temperature)"],
  ["Parameters change", "Parameters stay fixed"],
  ["Every position predicted in parallel", "One token at a time, appended to the context"],
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

function Table({ head, rows }: { head: ReactNode[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-[3px] border border-divider">
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        <thead className="bg-surface">
          <tr>
            {head.map((cell, i) => (
              <th
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed header cells
                key={i}
                className="label-ui px-4 py-3 font-normal text-fg-muted"
              >
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
    <p className="flex flex-wrap gap-x-8 gap-y-1 rounded-[2px] border border-line bg-surface px-3 py-2 font-ui text-[13px] text-fg">
      {children}
    </p>
  )
}

/** The Theory tab: what a Transformer is, its three variants, what happens inside a block, and where the labs fit. */
export function TransformerTheory({ onOpenLab }: { onOpenLab: () => void }) {
  const { t } = useTranslation()
  return (
    <>
      <section className="flex flex-col gap-4">
        <SectionTitle number="1">{t("An architecture, not a model")}</SectionTitle>
        <p className="text-fg-secondary">
          {t(
            "The Transformer (Vaswani et al., 2017) is a way of wiring a neural network so that every token can look at other tokens through attention. GPT is one family of models built on its decoder half; ChatGPT is one of those models after post-training. The architecture, the trained weights and the training recipe are three different things.",
          )}
        </p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="label-ui text-fg-muted">
              {t("GPT-3 → InstructGPT → GPT-3.5-era ChatGPT: conceptual evolution")}
            </span>
            <ModeBadge mode="historical" />
          </div>
          <Table
            head={[t("Milestone"), t("Year"), t("Main contribution")]}
            rows={HISTORY.map((h) => [h.name, h.year, t(h.contribution)])}
          />
          <p className="text-sm text-fg-muted">
            {t(
              "OpenAI described ChatGPT's training as supervised fine-tuning on dialogue, then a reward model and PPO-based RLHF. The full training history of the GPT-3.5 family is not public, so this course teaches the published method, not an exact reproduction.",
            )}
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle number="2">{t("Three variants")}</SectionTitle>
        <TransformerVariantsDiagram />
        <Table
          head={[t("Architecture"), t("Attention"), t("Example"), t("Typical uses")]}
          rows={VARIANTS.map((v) => [t(v.name), t(v.attention), v.example, t(v.uses)])}
        />
        <Takeaway>
          {t(
            "An encoder can use words on both sides of a token. A causal decoder cannot see the future, which is exactly what lets it be trained to predict the next token. The Lab runs both: GPT-2 as the decoder, a small BERT as the encoder.",
          )}
        </Takeaway>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle number="3">{t("Inside a block")}</SectionTitle>
        <p className="text-fg-secondary">
          {t(
            "Each token enters as a vector (its embedding plus position). A block does two things to every token, then the next block repeats them. GPT-2 small has 12 blocks with 12 attention heads each.",
          )}
        </p>
        <OptionList
          items={[
            <span key="attention">
              <strong className="text-fg">{t("Attention")}</strong>{" "}
              {t(
                "mixes information between tokens. Each token makes a query Q, a key K and a value V from its vector; the query is compared with every key, and the resulting weights decide how much of each value flows in.",
              )}
            </span>,
            <span key="ffn">
              <strong className="text-fg">{t("Feed-forward")}</strong>{" "}
              {t(
                "transforms each token on its own with a small two-layer network, the same one for every position.",
              )}
            </span>,
          ]}
        />
        <Formula>
          <span>Q = X·W_Q</span>
          <span>K = X·W_K</span>
          <span>V = X·W_V</span>
        </Formula>
        <Formula>
          <span>Attention(Q, K, V) = softmax(Q·Kᵀ / √d_k + M) · V</span>
        </Formula>
        <p className="text-sm text-fg-muted">
          {t(
            "M is the mask: 0 where a token may look, −∞ where it may not. In a decoder it hides every later position, so the weights above the diagonal are exactly zero. The last block's output goes through one more matrix to become a score per vocabulary word; softmax turns those into the next-token probabilities you saw in",
          )}{" "}
          <LabLink lesson="next-token-lab">{t("Next Token")}</LabLink>.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle number="4">{t("Where the labs fit")}</SectionTitle>
        <p className="text-fg-secondary">
          {t(
            "The same decoder runs in two modes. Training changes the weights; inference uses them without changing them.",
          )}
        </p>
        <Table
          head={[t("Training"), t("Inference")]}
          rows={TRAINING_VS_INFERENCE.map(([train, infer]) => [t(train), t(infer)])}
        />
        <OptionList
          ordered={false}
          items={[
            <span key="arch">
              <strong className="text-fg">{t("Architecture")}</strong>:{" "}
              {t("this lesson's Lab inspects GPT-2's attention, layer by layer and head by head.")}
            </span>,
            <span key="inference">
              <strong className="text-fg">{t("Inference")}</strong>:{" "}
              <LabLink lesson="next-token-lab">{t("Next Token")}</LabLink>{" "}
              {t("generates one token at a time from the probabilities the last block produces.")}
            </span>,
            <span key="post">
              <strong className="text-fg">{t("Post-training")}</strong>:{" "}
              <LabLink lesson="adaptation-lab">{t("Adaptation")}</LabLink>{" "}
              {t("collects the demonstrations and preferences that SFT and RLHF train on, and")}{" "}
              <LabLink lesson="gpt-to-chatgpt">{t("GPT → ChatGPT")}</LabLink>{" "}
              {t("shows the before and after on one input.")}
            </span>,
          ]}
        />
        <Takeaway>
          {t(
            "The Transformer is the architecture. GPT is one model family built on its decoder. Pretraining, post-training and inference are things you do with it.",
          )}
        </Takeaway>
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

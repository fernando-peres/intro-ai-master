/**
 * Authored samples for the Training Intuition pages. The figures come from the GPT-3 (2020)
 * and InstructGPT (2022) papers; prompts, answers and rankings are illustrative unless noted.
 */

export type Snippet = { genre: string; source: string; text: string; code?: boolean }

/** Four genres of the web text a foundation model reads. Nobody wrote a label for any of them. */
export const RAW_TEXT_SNIPPETS: Snippet[] = [
  {
    genre: "Encyclopedia",
    source: "an online encyclopedia",
    text: "Paris is the capital and most populous city of France. It lies on the Seine, in the north of the country.",
  },
  {
    genre: "Forum post",
    source: "a cooking forum",
    text: "Tried the recipe last night. Swapped the butter for olive oil and it still came out great, though I'd cut the salt in half next time.",
  },
  {
    genre: "Code",
    source: "an open-source repository",
    code: true,
    text: "def square(x):\n    return x * x\n\nprint(square(4))  # 16",
  },
  {
    genre: "News",
    source: "a news wire",
    text: "The central bank held interest rates steady on Thursday, citing slower inflation and a cooling labour market.",
  },
]

/** GPT-3's training mix (Brown et al. 2020, Table 2.2): weight is the share of training batches. */
export const GPT3_MIX: { source: string; tokens: string; weight: number }[] = [
  { source: "Common Crawl (filtered web pages)", tokens: "410 B", weight: 60 },
  { source: "WebText2 (pages linked from Reddit)", tokens: "19 B", weight: 22 },
  { source: "Books1", tokens: "12 B", weight: 8 },
  { source: "Books2", tokens: "55 B", weight: 8 },
  { source: "Wikipedia", tokens: "3 B", weight: 3 },
]

export const GPT3_SCALE: { label: string; value: string }[] = [
  { label: "parameters", value: "175 B" },
  { label: "tokens seen in training", value: "300 B" },
  { label: "human-written labels", value: "0" },
]

/** The sentence the slicer cuts into training examples; one token per entry. */
export const NEXT_TOKEN_SENTENCE = ["The", "capital", "of", "France", "is", "Paris", "."]

/** InstructGPT paper, Figure 1: the prompt, GPT-3's continuation and InstructGPT's answer. */
export const MOON_PROMPT = "Explain the moon landing to a 6 year old in a few sentences."
export const GPT3_BASE_COMPLETION =
  "Explain the theory of gravity to a 6 year old. Explain the theory of relativity to a 6 year old in a few sentences. Explain the big bang theory to a 6 year old. Explain evolution to a 6 year old."
export const INSTRUCT_COMPLETION =
  "People went to the moon, and they took pictures of what they saw, and sent them back to the earth so we could all see them."

export type Demonstration = { prompt: string; answer: string }

/** Prompt plus the answer a labeler wrote for it: the data of supervised fine-tuning. */
export const DEMONSTRATIONS: Demonstration[] = [
  {
    prompt: MOON_PROMPT,
    answer:
      "Some people flew to the moon in a big rocket. They walked on it, took pictures and brought moon rocks back to Earth so everyone could learn what it is like there.",
  },
  {
    prompt: "Write a short thank-you note to a colleague who covered my shift.",
    answer:
      "Hi Sam, thank you for covering my shift on Friday. It made a hard week much easier, and I owe you one. — Ana",
  },
  {
    prompt:
      "Summarize in one sentence: The meeting moved to Tuesday because two team members are travelling on Monday; the agenda is unchanged.",
    answer:
      "The meeting is now on Tuesday, with the same agenda, because two people are away on Monday.",
  },
]

export type RankedAnswer = { id: string; text: string; note: string; score: number }

/** One prompt, four model answers, a labeler's order best → worst, and an illustrative reward-model score. */
export const RANKING: { prompt: string; answers: RankedAnswer[]; order: string[] } = {
  prompt: "What is the capital of Australia?",
  answers: [
    { id: "a", text: "Canberra.", note: "correct and concise", score: 0.92 },
    {
      id: "b",
      text: "The capital of Australia is Canberra, not Sydney, which is its largest city.",
      note: "correct but longer than asked",
      score: 0.74,
    },
    { id: "c", text: "Sydney.", note: "confident but wrong", score: 0.18 },
    {
      id: "d",
      text: "Australia is a country in the Southern Hemisphere.",
      note: "irrelevant",
      score: 0.05,
    },
  ],
  order: ["a", "b", "c", "d"],
}

/** InstructGPT (Ouyang et al. 2022, §3): about 40 labelers; prompts per training stage. */
export const INSTRUCTGPT_COUNTS: { label: string; value: string }[] = [
  { label: "labelers", value: "~40" },
  { label: "prompts with a written answer (SFT)", value: "13 k" },
  { label: "prompts with ranked answers (reward model)", value: "33 k" },
  { label: "prompts alone (RL)", value: "31 k" },
]

export type Pair = { chosen: string; rejected: string }

/** Every ordered pair of a best → worst ranking: four answers give six pairs. */
export function pairsFromRanking(order: readonly string[]): Pair[] {
  const pairs: Pair[] = []
  for (let i = 0; i < order.length; i++) {
    for (let j = i + 1; j < order.length; j++) {
      pairs.push({ chosen: order[i], rejected: order[j] })
    }
  }
  return pairs
}

/** Illustrative probabilities before and after DPO for the chosen and the rejected answer. */
export const DPO_SHIFT: { label: string; answer: string; before: number; after: number }[] = [
  { label: "chosen", answer: "Canberra.", before: 31, after: 58 },
  { label: "rejected", answer: "Sydney.", before: 24, after: 6 },
]

/** Mirror of the Post-training lab's France preference prompt (`genai.toy_corpus.PREFERENCE_PROMPTS`). */
export const TOY_FRANCE_PROMPT = {
  prompt: "Question: What is the capital of France? Answer:",
  candidates: [
    { id: "a", text: " Paris.", note: "correct and concise" },
    { id: "b", text: " The capital of France is Paris.", note: "correct but longer than asked" },
    { id: "c", text: " Madrid.", note: "confident but wrong" },
    { id: "d", text: " The dragon ate every apple and smiled.", note: "irrelevant" },
  ],
}

export type TechniqueId = "pretraining" | "rlhf" | "dpo"

export type Technique = {
  id: TechniqueId
  slug: string
  title: string
  data: string
  signal: string
  changes: string
  lacks: string
  /** Misc-bucket colours (docs/branding.md): a method comparison, not data classes. */
  text: string
  top: string
}

export const TECHNIQUES: Technique[] = [
  {
    id: "pretraining",
    slug: "intuition-pretraining",
    title: "Pretraining",
    data: "Raw text: hundreds of billions of tokens, no labels",
    signal: "The text itself: the next token is the answer",
    changes: "Everything at once: language, facts, styles, skills",
    lacks: "Doing what you ask",
    text: "text-chart-warm",
    top: "border-t-chart-warm",
  },
  {
    id: "rlhf",
    slug: "intuition-rlhf",
    title: "RLHF",
    data: "Written answers, ranked answers, then prompts alone",
    signal: "People first, then a reward model trained on their rankings",
    changes: "Behaviour: it answers, the way people preferred",
    lacks: "New knowledge; a reward model is not the truth",
    text: "text-chart-amber",
    top: "border-t-chart-amber",
  },
  {
    id: "dpo",
    slug: "intuition-dpo",
    title: "DPO",
    data: "The same ranked answers, as chosen / rejected pairs",
    signal: "The pairs directly: chosen up, rejected down",
    changes: "Behaviour, with no reward model and no sampling",
    lacks: "Exploration beyond the written pairs",
    text: "text-fg-secondary",
    top: "border-t-fg-secondary",
  },
]

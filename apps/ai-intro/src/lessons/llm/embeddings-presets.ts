/** Authored starting points for the Embeddings lab; the server only ever sees the words and texts. */

export type AnalogyPreset = {
  id: string
  label: string
  /** `positive − negative` is searched; `expected` is the word the analogy hopes for. */
  positive: [string, string]
  negative: [string]
  expected: string
}

export const ANALOGY_PRESETS: AnalogyPreset[] = [
  {
    id: "king",
    label: "king − man + woman",
    positive: ["king", "woman"],
    negative: ["man"],
    expected: "queen",
  },
  {
    id: "paris",
    label: "paris − france + italy",
    positive: ["paris", "italy"],
    negative: ["france"],
    expected: "rome",
  },
  {
    id: "walking",
    label: "walking − walked + swam",
    positive: ["walking", "swam"],
    negative: ["walked"],
    expected: "swimming",
  },
]

export type WordSet = {
  id: string
  label: string
  words: string[]
  /** Cluster of each word, only for sets where membership is a real class (animals vs vehicles). */
  clusters?: Record<string, "class-1" | "class-2">
}

export const WORD_SETS: WordSet[] = [
  {
    id: "royalty",
    label: "Royalty",
    words: ["king", "queen", "man", "woman", "prince", "princess"],
  },
  {
    id: "neighborhoods",
    label: "Neighborhoods",
    words: ["dog", "puppy", "cat", "kitten", "car", "truck"],
    clusters: {
      dog: "class-1",
      puppy: "class-1",
      cat: "class-1",
      kitten: "class-1",
      car: "class-2",
      truck: "class-2",
    },
  },
  { id: "polysemy", label: "Polysemy", words: ["bank", "river", "money", "finance", "shore"] },
  {
    id: "bias",
    label: "Bias",
    words: ["doctor", "nurse", "engineer", "teacher", "man", "woman", "he", "she"],
  },
  { id: "oov", label: "Out of vocabulary", words: ["king", "queen", "blorptastic"] },
]

export type PairKind =
  | "paraphrase"
  | "synonyms"
  | "topic"
  | "different-topics"
  | "negation"
  | "numbers"
  | "opposites"
  | "word-order"
  | "business-intent"

export type SentenceGroup = {
  id: PairKind
  kind: PairKind
  label: string
  sentences: string[]
}

export const SENTENCE_GROUPS: SentenceGroup[] = [
  {
    id: "paraphrase",
    kind: "paraphrase",
    label: "Paraphrase",
    sentences: ["The cat sat on the sofa.", "A feline was resting on the couch."],
  },
  {
    id: "synonyms",
    kind: "synonyms",
    label: "Synonyms",
    sentences: ["The film was fantastic.", "The movie was excellent."],
  },
  {
    id: "topic",
    kind: "topic",
    label: "Same topic",
    sentences: ["The team won the championship.", "The striker scored in the final."],
  },
  {
    id: "different-topics",
    kind: "different-topics",
    label: "Different topics",
    sentences: ["The team won the championship.", "Simmer the sauce for ten minutes."],
  },
  {
    id: "negation",
    kind: "negation",
    label: "Negation",
    sentences: ["I love this phone.", "I do not love this phone."],
  },
  {
    id: "numbers",
    kind: "numbers",
    label: "Numbers",
    sentences: ["The invoice is due in 3 days.", "The invoice is due in 30 days."],
  },
  {
    id: "opposites",
    kind: "opposites",
    label: "Opposites",
    sentences: ["The room was freezing cold.", "The room was boiling hot."],
  },
  {
    id: "word-order",
    kind: "word-order",
    label: "Word order",
    sentences: ["The dog bit the man.", "The man bit the dog."],
  },
  {
    id: "business-intent",
    kind: "business-intent",
    label: "Business intent",
    sentences: ["I want my money back.", "How do I request a refund?"],
  },
]

export const BANK_SENTENCES = {
  river: "We had a picnic on the bank of the river.",
  money: "She deposited the money at the bank.",
}

export const SEARCH_QUERIES = [
  "my laptop won't turn on",
  "How many days can employees work remotely?",
  "refund after a month",
]

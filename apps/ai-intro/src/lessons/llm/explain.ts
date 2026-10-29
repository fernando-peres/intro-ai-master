/** Explanations written from measured values; each takes the translator from `useTranslation`. */

import type { Translate } from "@/i18n/translate"
import { fmt } from "./embeddings-math"
import type { PairKind } from "./embeddings-presets"

/** Cosine from which two MiniLM sentences count as close; calibrated on the presets. */
export const CLOSE = 0.5
/** Cosine from which two sentences count as related but not close. */
export const RELATED = 0.3

const percent = (ratio: number) => `${Math.round(ratio * 100)}%`

/** `rank` is the 1-based place of `expected` among the top `topK`, or null when it is absent. */
export function explainAnalogy(
  t: Translate,
  {
    positive,
    negative,
    expected,
    rank,
    topK,
    top,
  }: {
    positive: string[]
    negative: string[]
    expected: string
    rank: number | null
    topK: number
    top: { word: string; score: number }
  },
) {
  const minus = negative.map((w) => ` − ${w}`).join("")
  const plus = positive
    .slice(1)
    .map((w) => ` + ${w}`)
    .join("")
  const formula = `${positive[0] ?? ""}${minus}${plus}`.trim()
  const found =
    rank === null
      ? t("“{0}” is not in the top {1}; the closest word is “{2}” ({3}).", [
          expected,
          topK,
          top.word,
          fmt(top.score),
        ])
      : t("“{0}” is ranked {1} of {2} (best match “{3}”, cosine {4}).", [
          expected,
          rank,
          topK,
          top.word,
          fmt(top.score),
        ])
  return `${formula}: ${found} ${t("Vector arithmetic is approximate, not an identity.")}`
}

/** `ratios` are the explained-variance ratios of the first two components. */
export function explainPca(
  t: Translate,
  { inputDims, ratios, frozen }: { inputDims: number; ratios: number[]; frozen: boolean },
) {
  const explained = percent(ratios.slice(0, 2).reduce((a, b) => a + b, 0))
  const base = t(
    "{0} dimensions → 2. PC1 + PC2 explain {1} of the variance; distances are distorted.",
    [inputDims, explained],
  )
  return frozen
    ? `${base} ${t("The projection is frozen: new points reuse the earlier axes; the variance figure is from the run that set them.")}`
    : base
}

const SAME_MEANING_EXPECTED: (PairKind | "custom")[] = [
  "negation",
  "numbers",
  "opposites",
  "word-order",
]
const SAME_MEANING_CLOSE: (PairKind | "custom")[] = ["paraphrase", "synonyms", "business-intent"]

/** The note depends on the measured `cosine`, never on the preset alone; "custom" adds none. */
export function explainPair(t: Translate, kind: PairKind | "custom", cosine: number) {
  const value = t("Cosine {0}.", [fmt(cosine)])
  const close = cosine >= CLOSE
  const related = cosine >= RELATED
  let note = ""
  if (SAME_MEANING_EXPECTED.includes(kind)) {
    note = close
      ? t("The meanings differ but the vectors are close: high similarity ≠ same meaning.")
      : t("The model kept these two apart, as their meanings differ.")
  } else if (SAME_MEANING_CLOSE.includes(kind)) {
    note = close
      ? t("Different words, close vectors: the model encodes meaning, not spelling.")
      : related
        ? t("Related, not close: the model only partly matched these two.")
        : t("The model did not match these two this time.")
  } else if (kind === "topic") {
    if (close) note = t("Same topic: related sentences share a neighborhood.")
    else if (related) note = t("Related, not close: the same topic, but not the same neighborhood.")
  } else if (kind === "different-topics") {
    if (close) note = t("Unexpectedly close for unrelated topics.")
    else if (related) note = t("Related, not close: some overlap despite different topics.")
    else note = t("Unrelated topics sit far apart.")
  }
  return note ? `${value} ${note}` : value
}

/** `contextual` compares the two `bank` token vectors from MiniLM; `river`/`money` are GloVe cosines. */
export function explainBank(
  t: Translate,
  { contextual, river, money }: { contextual: number; river: number; money: number },
) {
  return [
    t(
      "The two contextual “bank” vectors have cosine {0}, below 1: the context changed the vector.",
      [fmt(contextual)],
    ),
    t("GloVe keeps one vector for every sense (cosine to “river” {0}, to “money” {1}).", [
      fmt(river),
      fmt(money),
    ]),
    t(
      "The static and contextual vectors live in different spaces, so they are shown, not compared.",
    ),
  ].join(" ")
}

/** `topShared` are the tokens the query and its best semantic hit have in common. */
export function explainSearch(
  t: Translate,
  {
    semanticIds,
    keywordIds,
    topShared,
  }: { semanticIds: string[]; keywordIds: string[]; topShared: string[] },
) {
  const top = semanticIds[0]
  const missed = top !== undefined && !keywordIds.includes(top)
  const shared =
    topShared.length === 0
      ? t("Found with different words: shared tokens Ø.")
      : t("Shared tokens with the best hit: {0}.", [topShared.join(", ")])
  return missed ? `${shared} ${t("The keyword search did not return it.")}` : shared
}

import { request } from "../generative-ai/api"

/** Client for algo-server's `/api/embeddings` routes; field names are the server's, in snake_case. */

type Mode = { model: string; execution_mode: "real" }

export type EmbeddingModel = {
  id: string
  name: string
  family: "word" | "sentence"
  modalities: string[]
  dimensions: number
  pooling: string
  supports_token_inspection: boolean
  supports_analogies: boolean
  embedding_space_id: string
  default_normalization: boolean
  revision: string
  download_mb: number
  loaded: boolean
}
export type ModelsResponse = { models: EmbeddingModel[] }

export type CorpusDocument = { id: string; title: string; category: string; text: string }
export type CorpusResponse = { documents: CorpusDocument[] }

export type FoundWord = { word: string; rank: number; vector: number[]; norm: number }
export type MissingWord = { word: string; suggestions: string[] }
export type WordsResponse = Mode & {
  dimensions: number
  normalized: false
  found: FoundWord[]
  missing: MissingWord[]
}

export type VocabRequest = { vocab_limit?: number }
export type NeighborsRequest = VocabRequest & { word: string; top_k?: number }
export type Neighbor = { word: string; rank: number; score: number }
export type NeighborsResponse = Mode & { word: string; vector: number[]; neighbors: Neighbor[] }

export type AnalogyRequest = VocabRequest & {
  positive: string[]
  negative: string[]
  top_k?: number
}
export type AnalogyResponse = Mode & {
  positive: string[]
  negative: string[]
  vector: number[]
  neighbors: Neighbor[]
}

export type SentencesRequest = { sentences: string[]; normalize?: boolean }
export type SentenceItem = { text: string; vector: number[]; tokens: number; truncated: boolean }
export type SentencesResponse = Mode & {
  dimensions: number
  normalized: boolean
  pooling: "mean"
  items: SentenceItem[]
}

export type InspectResponse = Mode & {
  trained_pooling: string
  tokens: string[]
  ids: number[]
  attention_mask: number[]
  token_vectors: number[][]
  pooled: { mean: number[]; mean_normalized: number[]; cls: number[]; max: number[] }
  truncated: boolean
}

export type PcaRequest = { rows: number[][]; dimensions: 2 | 3 }
export type PcaResponse = {
  model: "numpy-svd"
  points: number[][]
  explained_variance_ratio: number[]
  mean: number[]
  components: number[][]
  input_dimensions: number
  output_dimensions: number
  rows: number
}

export type SemanticHit = { id: string; title: string; category: string; score: number }
export type KeywordHit = SemanticHit & { shared: string[] }
export type SearchResponse = Mode & {
  normalized: true
  query_tokens: string[]
  query_vector: number[]
  semantic: SemanticHit[]
  keyword: KeywordHit[]
}

export const embeddingModels = () => request<ModelsResponse>("/embeddings/models")
export const corpus = () => request<CorpusResponse>("/embeddings/corpus")
export const words = (list: string[]) =>
  request<WordsResponse>("/embeddings/words", { words: list })
export const neighbors = (req: NeighborsRequest) =>
  request<NeighborsResponse>("/embeddings/neighbors", req)

/** The server's 400 for unknown analogy words, so the view can word it itself. */
export class MissingWordsError extends Error {
  constructor(readonly missing: MissingWord[]) {
    super("Not in the vocabulary")
  }
}

function missingOf(error: unknown): MissingWord[] | null {
  try {
    const detail = JSON.parse((error as Error).message)
    return Array.isArray(detail?.missing) ? detail.missing : null
  } catch {
    return null
  }
}

export const analogy = (req: AnalogyRequest) =>
  request<AnalogyResponse>("/embeddings/analogy", req).catch((error) => {
    const missing = missingOf(error)
    throw missing ? new MissingWordsError(missing) : error
  })
export const sentences = (req: SentencesRequest) =>
  request<SentencesResponse>("/embeddings/sentences", req)
export const inspect = (text: string) => request<InspectResponse>("/embeddings/inspect", { text })
export const pca = (req: PcaRequest) => request<PcaResponse>("/embeddings/pca", req)
export const search = (query: string, topK = 5) =>
  request<SearchResponse>("/embeddings/search", { query, top_k: topK })

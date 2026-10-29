import { useQuery } from "@tanstack/react-query"

/** Client for algo-server's Generative AI routes (proxied under `/api` by Vite). */

export type Candidate = { token: string; prob: number }
export type Step = { token: string; prob: number; top_k: Candidate[] }
export type Health = { status: "ok"; base_model: string; assistant_model: string | null }

export type CompleteRequest = {
  prompt: string
  max_tokens?: number
  temperature?: number
  top_k?: number
  seed?: number
}
export type CompleteResponse = { model: string; steps: Step[] }

export type Example = { input: string; output: string }
export type ModelKind = "base" | "assistant"
export type FewShotRequest = {
  instruction: string
  examples: Example[]
  query: string
  input_name: string
  output_name: string
  model: ModelKind
  labels?: string[]
}
export type FewShotResponse = {
  model: string
  prompt: string
  output: string
  label: string | null
  scores: Record<string, number> | null
}

export type AttentionModelId = "gpt2" | "bert-small"
export type AttentionRequest = {
  text: string
  layer: number
  top_k?: number
  /** GPT-2 is the causal decoder (default); BERT small the bidirectional encoder. */
  model?: AttentionModelId
}
export type AttentionResponse = {
  model: string
  causal: boolean
  layers: number
  tokens: string[]
  layer: number
  heads: number
  /** `weights[head][query][key]`; every query row sums to 1 and future keys are 0. */
  weights: number[][][]
  next_tokens: Candidate[]
}

export type Role = "system" | "user" | "assistant"
export type ChatMessage = { role: Role; content: string }
export type ChatResponse = { model: string; reply: string }

export type ToyCorpus = {
  id: string
  title: string
  purpose: string
  sample: string
  documents: number
  duplicates_removed: number
  tokens: number
  vocab_size: number
  train_tokens: number
  val_tokens: number
  context_len: number
  has_checkpoint: boolean
}
export type ToyPoint = { step: number; train_loss: number; val_loss: number }
export type Stage = "pretrained" | "sft" | "rlhf" | "dpo"
export type SftAdapter = "full" | "lora"
export type SftPoint = { step: number; loss: number; held_out_loss: number }
export type RmPoint = { step: number; loss: number; accuracy: number }
export type DpoPoint = { step: number; loss: number; accuracy: number; margin: number }
export type PpoPoint = {
  iteration: number
  reward: number
  kl: number
  policy_loss: number
  clip_fraction: number
  sample_prompt: string
  sample_completion: string
}
export type RunState = {
  run_id: string
  corpus: string
  step: number
  max_steps: number
  params: number
  vocab_size: number
  context_len: number
  random_guess_loss: number
  history: ToyPoint[]
  stage: Stage
  sft_history: SftPoint[]
  rm_history: RmPoint[]
  ppo_history: PpoPoint[]
  dpo_history: DpoPoint[]
  sft_adapter: SftAdapter | null
  sft_trainable_params: number | null
  student_pairs: number
  has_reward_model: boolean
  execution_mode: "real"
}
/** `stage` picks the committed checkpoint when `pretrained` is true. */
export type CreateRunRequest = { corpus: string; seed: number; pretrained: boolean; stage?: Stage }
export type Demo = { prompt: string; completion: string }
export type PreferenceCandidate = { id: string; text: string; note: string }
export type PreferencePrompt = {
  id: string
  prompt: string
  candidates: PreferenceCandidate[]
  /** Candidate ids, best first. */
  honest: string[]
}
export type Alignment = { demonstrations: Demo[]; held_out: Demo[]; prompts: PreferencePrompt[] }
export type Bias = "none" | "length"
export type PpoSettings = { iterations: number; lr: number; clip: number; kl_beta: number }
export type RewardModelResponse = {
  run: RunState
  candidate_scores: Record<string, Record<string, number>>
}
export type ToyPosition = {
  index: number
  context: string[]
  target: string
  prob: number
  loss: number
  top_k: Candidate[]
}
export type ProbeResponse = { tokens: string[]; truncated: boolean; positions: ToyPosition[] }
export type ToyGenerateRequest = {
  prompt: string
  max_tokens: number
  temperature: number
  /** "current" (default) uses the live weights; a stage name uses the weights frozen at its end. */
  stage?: "current" | "pretrained" | "sft"
}

/** The server is down (Vite's proxy answers 5xx with no JSON) or unreachable. */
export const OFFLINE = "offline"

/** The HTTP status a failed request carried, if it reached the server. */
export const statusOf = (error: unknown) => (error as { status?: number } | null)?.status

export async function request<T>(path: string, body?: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new Error(OFFLINE)
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const detail = data?.detail
    const message = typeof detail === "string" ? detail : detail ? JSON.stringify(detail) : OFFLINE
    throw Object.assign(new Error(message), { status: res.status })
  }
  if (data === null) throw new Error(OFFLINE)
  return data as T
}

export const complete = (req: CompleteRequest) => request<CompleteResponse>("/genai/complete", req)
export const fewShot = (req: FewShotRequest) => request<FewShotResponse>("/genai/few-shot", req)
export const chat = (messages: ChatMessage[]) => request<ChatResponse>("/genai/chat", { messages })
export const attention = (req: AttentionRequest) =>
  request<AttentionResponse>("/genai/attention", req)

export const toyCorpora = () => request<ToyCorpus[]>("/genai/toy/corpora")
export const createRun = (req: CreateRunRequest) => request<RunState>("/genai/toy/runs", req)
export const trainRun = (runId: string, steps: number) =>
  request<RunState>(`/genai/toy/runs/${runId}/train`, { steps })
export const probeRun = (runId: string, text: string) =>
  request<ProbeResponse>(`/genai/toy/runs/${runId}/probe`, { text, top_k: 5 })
export const generateRun = (runId: string, req: ToyGenerateRequest) =>
  request<{ model: "toy-gpt"; steps: Step[] }>(`/genai/toy/runs/${runId}/generate`, req)
export const alignment = () => request<Alignment>("/genai/toy/alignment")
export const sftRun = (runId: string, steps: number, adapter: SftAdapter, rank = 4) =>
  request<RunState>(`/genai/toy/runs/${runId}/sft`, { steps, adapter, rank })
export const addPreferences = (runId: string, prompt_id: string, ranking: string[]) =>
  request<RunState>(`/genai/toy/runs/${runId}/preferences`, { prompt_id, ranking })
export const trainRewardModel = (runId: string, steps: number, bias: Bias) =>
  request<RewardModelResponse>(`/genai/toy/runs/${runId}/reward-model`, { steps, bias })
export const ppoRun = (runId: string, settings: PpoSettings) =>
  request<RunState>(`/genai/toy/runs/${runId}/ppo`, settings)
export const dpoRun = (runId: string, steps: number, beta: number) =>
  request<RunState>(`/genai/toy/runs/${runId}/dpo`, { steps, beta })

/** Polls every 5 s while the server is unreachable, so the labs recover once it starts. */
export function useHealth() {
  return useQuery({
    queryKey: ["genai-health"],
    queryFn: () => request<Health>("/health"),
    retry: false,
    refetchInterval: (query) => (query.state.status === "error" ? 5000 : false),
  })
}

/**
 * Mirrors `genai.prompts.few_shot_prompt` on the server, so the lab can preview the prompt live;
 * the server's own copy comes back in every response.
 */
export function fewShotPrompt(
  instruction: string,
  examples: Example[],
  query: string,
  inputName: string,
  outputName: string,
) {
  const blocks = instruction.trim() ? [instruction.trim()] : []
  for (const ex of examples) blocks.push(`${inputName}: ${ex.input}\n${outputName}: ${ex.output}`)
  blocks.push(`${inputName}: ${query}\n${outputName}:`)
  return blocks.join("\n\n")
}

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

export type Role = "system" | "user" | "assistant"
export type ChatMessage = { role: Role; content: string }
export type ChatResponse = { model: string; reply: string }

/** The server is down (Vite's proxy answers 5xx with no JSON) or unreachable. */
export const OFFLINE = "offline"

async function request<T>(path: string, body?: unknown): Promise<T> {
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
    throw new Error(typeof detail === "string" ? detail : detail ? JSON.stringify(detail) : OFFLINE)
  }
  if (data === null) throw new Error(OFFLINE)
  return data as T
}

export const complete = (req: CompleteRequest) => request<CompleteResponse>("/genai/complete", req)
export const fewShot = (req: FewShotRequest) => request<FewShotResponse>("/genai/few-shot", req)
export const chat = (messages: ChatMessage[]) => request<ChatResponse>("/genai/chat", { messages })

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

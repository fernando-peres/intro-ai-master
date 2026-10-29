import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { PostTrainingLesson } from "./post-training"
import { fakeServer, HEALTH, renderLesson } from "./test-utils"

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const button = (name: string | RegExp) => screen.getByRole("button", { name })
const region = (name: string | RegExp) => within(screen.getByRole("region", { name }))

const FRANCE = {
  id: "france",
  prompt: "Question: What is the capital of France? Answer:",
  candidates: [
    { id: "a", text: " Paris.", note: "correct and concise" },
    { id: "b", text: " The capital of France is Paris.", note: "correct but longer than asked" },
    { id: "c", text: " Madrid.", note: "confident but wrong" },
    { id: "d", text: " The dragon ate every apple and smiled.", note: "irrelevant" },
  ],
  honest: ["a", "b", "c", "d"],
}
const ALIGNMENT = {
  demonstrations: [
    { prompt: "Question: What is the capital of France? Answer:", completion: " Paris." },
    { prompt: "Question: What is the capital of Spain? Answer:", completion: " Madrid." },
  ],
  held_out: [{ prompt: "Question: What is the capital of Italy? Answer:", completion: " Rome." }],
  prompts: [FRANCE],
}

function runState(over: Record<string, unknown> = {}) {
  return {
    run_id: "r1",
    corpus: "all",
    step: 800,
    max_steps: 2000,
    params: 48000,
    vocab_size: 560,
    context_len: 32,
    random_guess_loss: 6.3,
    history: [],
    stage: "pretrained",
    sft_history: [],
    rm_history: [],
    ppo_history: [],
    dpo_history: [],
    sft_adapter: null,
    sft_trainable_params: null,
    student_pairs: 0,
    has_reward_model: false,
    execution_mode: "real",
    ...over,
  }
}

/** Mirrors the server tokenizer: words keep their leading space, punctuation stands alone. */
function probeFor(text: string, madrid: number) {
  const tokens = text.match(/ ?\w+| ?[^\w\s]/g) ?? []
  return {
    tokens,
    truncated: false,
    positions: tokens.slice(1).map((target, i) => ({
      index: i + 1,
      context: tokens.slice(0, i + 1),
      target,
      prob: target === " Madrid" ? madrid : 0.3,
      loss: 1,
      top_k: [{ token: target === " Rome" ? " Lisbon" : target, prob: 0.5 }],
    })),
  }
}

function server() {
  let probes = 0
  let sftSteps = 0
  let rm = false
  return fakeServer({
    "/health": () => HEALTH,
    "/genai/toy/alignment": () => ALIGNMENT,
    "/genai/toy/runs": (body) => {
      const { stage } = body as { stage: string }
      sftSteps = stage === "pretrained" ? 0 : 200
      return runState({
        stage,
        sft_history: Array.from({ length: sftSteps }, (_, i) => ({
          step: i + 1,
          loss: 2 - i / 200,
          held_out_loss: 1.5,
        })),
      })
    },
    "/genai/toy/runs/r1/probe": (body) => {
      probes += 1
      const text = (body as { text: string }).text
      return probeFor(text, probes <= 2 ? 0.05 : 0.95)
    },
    "/genai/toy/runs/r1/sft": (body) => {
      const { steps, adapter } = body as { steps: number; adapter: string }
      sftSteps += steps
      return runState({
        stage: "sft",
        has_reward_model: rm,
        sft_adapter: adapter,
        sft_trainable_params: adapter === "lora" ? 4096 : 48000,
        sft_history: Array.from({ length: sftSteps }, (_, i) => ({
          step: i + 1,
          loss: 2 - i / 100,
          held_out_loss: 1.4,
        })),
      })
    },
    "/genai/toy/runs/r1/preferences": () => runState({ student_pairs: 6 }),
    "/genai/toy/runs/r1/reward-model": () => {
      rm = true
      return {
        run: runState({
          stage: sftSteps > 0 ? "sft" : "pretrained",
          sft_history: Array.from({ length: sftSteps }, (_, i) => ({
            step: i + 1,
            loss: 1,
            held_out_loss: 1,
          })),
          has_reward_model: true,
          rm_history: [{ step: 1, loss: 0.7, accuracy: 0.5 }],
        }),
        candidate_scores: { france: { a: 1.2, b: 0.4, c: -0.8, d: -1.5 } },
      }
    },
    "/genai/toy/runs/r1/ppo": (body) => {
      const { iterations } = body as { iterations: number }
      return runState({
        stage: "rlhf",
        has_reward_model: rm,
        ppo_history: Array.from({ length: iterations }, (_, i) => ({
          iteration: i + 1,
          reward: 4 + i / 10,
          kl: i / 20,
          policy_loss: -0.1,
          clip_fraction: 0.1,
          sample_prompt: FRANCE.prompt,
          sample_completion: " Paris Paris Paris.",
        })),
      })
    },
    "/genai/toy/runs/r1/dpo": (body) => {
      const { steps } = body as { steps: number }
      return runState({
        stage: "dpo",
        sft_history: Array.from({ length: sftSteps }, (_, i) => ({
          step: i + 1,
          loss: 1,
          held_out_loss: 1,
        })),
        dpo_history: Array.from({ length: steps }, (_, i) => ({
          step: i + 1,
          loss: 0.7 - i / 200,
          accuracy: 0.5 + i / 100,
          margin: i / 50,
        })),
      })
    },
    "/genai/toy/runs/r1/generate": (body) => {
      const { stage } = body as { stage: string }
      const token = { pretrained: " noite", sft: " Madrid", current: " Paris" }[stage] ?? "?"
      return { model: "toy-gpt", steps: [{ token, prob: 0.6, top_k: [] }] }
    },
  })
}

async function load() {
  const fake = server()
  await renderLesson(PostTrainingLesson)
  await screen.findByText("Question: What is the capital of Spain? Answer:")
  return fake
}

test("loads the pretrained checkpoint, the demonstrations and the before probabilities", async () => {
  const fake = await load()
  expect(fake.posts("/genai/toy/runs")).toEqual([
    { corpus: "all", seed: 0, pretrained: true, stage: "pretrained" },
  ])
  await waitFor(() => expect(fake.posts("/genai/toy/runs/r1/probe")).toHaveLength(2))
  expect(fake.posts("/genai/toy/runs/r1/probe")).toEqual([
    { text: "Question: What is the capital of Spain? Answer: Madrid.", top_k: 5 },
    { text: "Question: What is the capital of Italy? Answer: Rome.", top_k: 5 },
  ])
  const sft = region(/Supervised fine-tuning/)
  expect(await sft.findByText("5%")).toBeTruthy()
  expect(sft.getByText("“Lisbon”")).toBeTruthy()
})

test("running SFT posts the steps, re-probes and charts the losses", async () => {
  const fake = await load()
  fireEvent.click(button("Run 50 SFT steps"))
  await waitFor(() =>
    expect(fake.posts("/genai/toy/runs/r1/sft")).toEqual([{ steps: 50, adapter: "full", rank: 4 }]),
  )
  await waitFor(() => expect(fake.posts("/genai/toy/runs/r1/probe")).toHaveLength(4))
  expect(await region(/Supervised fine-tuning/).findByText("95%")).toBeTruthy()
  expect(region(/Supervised fine-tuning/).getByText(/50 SFT steps so far/)).toBeTruthy()
})

test("ranking the candidates and submitting posts the preference", async () => {
  const fake = await load()
  const prefs = region(/Human preferences/)
  for (const name of [
    "Madrid.",
    "Paris.",
    "The capital of France is Paris.",
    "The dragon ate every apple and smiled.",
  ]) {
    fireEvent.click(prefs.getByRole("button", { name }))
  }
  fireEvent.click(prefs.getByRole("button", { name: "Submit ranking" }))
  await waitFor(() =>
    expect(fake.posts("/genai/toy/runs/r1/preferences")).toEqual([
      { prompt_id: "france", ranking: ["c", "a", "b", "d"] },
    ]),
  )
  expect(await prefs.findByText(/6 pairs from you/)).toBeTruthy()
  expect(prefs.getByText("confident but wrong")).toBeTruthy()
})

test("training the reward model posts the bias and shows the candidate scores", async () => {
  const fake = await load()
  const prefs = region(/Human preferences/)
  fireEvent.click(prefs.getByRole("switch", { name: "Prefer longer answers" }))
  fireEvent.click(prefs.getByRole("button", { name: /Train reward model/ }))
  await waitFor(() =>
    expect(fake.posts("/genai/toy/runs/r1/reward-model")).toEqual([{ steps: 100, bias: "length" }]),
  )
  expect(await prefs.findByText("1.20")).toBeTruthy()
  expect(prefs.getByText("-1.50")).toBeTruthy()
})

test("PPO waits for a reward model, then posts its settings and shows samples", async () => {
  const fake = await load()
  const ppo = region(/RLHF with PPO/)
  const run = () => ppo.getByRole("button", { name: /Run 5 PPO iterations/ }) as HTMLButtonElement
  expect(run().disabled).toBe(true)
  fireEvent.click(region(/Human preferences/).getByRole("button", { name: /Train reward model/ }))
  await waitFor(() => expect(fake.posts("/genai/toy/runs/r1/reward-model")).toHaveLength(1))
  // A reward model alone is not enough: PPO needs the SFT weights as its reference.
  expect(run().disabled).toBe(true)
  fireEvent.click(button("Run 50 SFT steps"))
  await waitFor(() => expect(run().disabled).toBe(false))
  fireEvent.click(run())
  await waitFor(() =>
    expect(fake.posts("/genai/toy/runs/r1/ppo")).toEqual([
      { iterations: 5, lr: 0.0005, clip: 0.2, kl_beta: 0.1 },
    ]),
  )
  expect(await ppo.findAllByText("Paris Paris Paris.")).toHaveLength(5)
  expect(ppo.getByText(/repeats itself/)).toBeTruthy()
})

test("Compare generates the same prompt from every stage the run has passed", async () => {
  const fake = await load()
  // A pretrained run has only itself to show.
  fireEvent.click(button("Generate from all stages"))
  await waitFor(() => expect(fake.posts("/genai/toy/runs/r1/generate")).toHaveLength(1))
  expect(region(/Compare the checkpoints/).getByText("Pretrained (current)")).toBeTruthy()
  // From the RLHF checkpoint, all three.
  fireEvent.click(button("RLHF checkpoint"))
  await waitFor(() => expect(fake.posts("/genai/toy/runs")).toHaveLength(2))
  fireEvent.click(button("Generate from all stages"))
  await waitFor(() => expect(fake.posts("/genai/toy/runs/r1/generate")).toHaveLength(4))
  expect(
    fake
      .posts("/genai/toy/runs/r1/generate")
      .slice(1)
      .map((b) => (b as { stage: string }).stage),
  ).toEqual(["pretrained", "sft", "current"])
  const compare = region(/Compare the checkpoints/)
  expect(await compare.findByText("noite")).toBeTruthy()
  expect(compare.getByText("Madrid")).toBeTruthy()
})

test("training again clears stale compare outputs, and SFT is closed once PPO has run", async () => {
  const fake = await load()
  fireEvent.click(button("Generate from all stages"))
  await waitFor(() => expect(fake.posts("/genai/toy/runs/r1/generate")).toHaveLength(1))
  expect(region(/Compare the checkpoints/).getByText("Paris")).toBeTruthy()
  fireEvent.click(button("Run 50 SFT steps"))
  await waitFor(() => expect(fake.posts("/genai/toy/runs/r1/sft")).toHaveLength(1))
  await waitFor(() => expect(region(/Compare the checkpoints/).queryByText("Paris")).toBeNull())
  fireEvent.click(button("RLHF checkpoint"))
  await waitFor(() => expect(fake.posts("/genai/toy/runs")).toHaveLength(2))
  await waitFor(() => expect((button("Run 50 SFT steps") as HTMLButtonElement).disabled).toBe(true))
})

test("DPO waits for SFT, posts its settings, and closes the PPO branch", async () => {
  const fake = await load()
  const dpoPanel = region(/Direct Preference Optimization/)
  const run = () => dpoPanel.getByRole("button", { name: /Run 50 DPO steps/ }) as HTMLButtonElement
  expect(run().disabled).toBe(true)
  expect(dpoPanel.getByText(/Run SFT first/)).toBeTruthy()
  fireEvent.click(button("Run 50 SFT steps"))
  await waitFor(() => expect(run().disabled).toBe(false))
  fireEvent.click(run())
  await waitFor(() =>
    expect(fake.posts("/genai/toy/runs/r1/dpo")).toEqual([{ steps: 50, beta: 0.1 }]),
  )
  expect(await dpoPanel.findByText(/50 steps · agrees with 99%/)).toBeTruthy()
  const ppoPanel = region(/RLHF with PPO/)
  const ppoButton = ppoPanel.getByRole("button", {
    name: /Run 5 PPO iterations/,
  }) as HTMLButtonElement
  expect(ppoButton.disabled).toBe(true)
  expect(ppoPanel.getByText(/took the DPO branch/)).toBeTruthy()
  expect((button("Run 50 SFT steps") as HTMLButtonElement).disabled).toBe(true)
  fireEvent.click(button("Generate from all stages"))
  await waitFor(() => expect(fake.posts("/genai/toy/runs/r1/generate")).toHaveLength(3))
  expect(region(/Compare the checkpoints/).getByText("After DPO (current)")).toBeTruthy()
})

test("SFT can train a LoRA adapter and reports how little it trains", async () => {
  const fake = await load()
  const sft = region(/Supervised fine-tuning/)
  fireEvent.click(sft.getByRole("button", { name: "LoRA adapter (rank 4)" }))
  fireEvent.click(button("Run 50 SFT steps"))
  await waitFor(() =>
    expect(fake.posts("/genai/toy/runs/r1/sft")).toEqual([{ steps: 50, adapter: "lora", rank: 4 }]),
  )
  expect(await sft.findByText(/4,096 of 48,000 parameters trained \(9%\)/)).toBeTruthy()
  // The choice is fixed for the run: the other option is disabled until Reset.
  expect(
    (sft.getByRole("button", { name: "Full fine-tuning" }) as HTMLButtonElement).disabled,
  ).toBe(true)
})

import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { PretrainingLesson } from "./pretraining"
import { fakeServer, HEALTH, renderLesson } from "./test-utils"

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const button = (name: string | RegExp) => screen.getByRole("button", { name })

const CORPORA = [
  {
    id: "all",
    title: "Everything",
    purpose: "All clean corpora together",
    sample: "The capital of France is Paris. The capital of Japan is Tokyo.",
    documents: 146,
    duplicates_removed: 0,
    tokens: 1500,
    vocab_size: 471,
    train_tokens: 1364,
    val_tokens: 136,
    context_len: 32,
    has_checkpoint: true,
  },
  {
    id: "noisy",
    title: "Noisy text",
    purpose: "Duplicates, typos and inconsistent formatting",
    sample: "The capital of France is Paris.",
    documents: 72,
    duplicates_removed: 5,
    tokens: 600,
    vocab_size: 300,
    train_tokens: 540,
    val_tokens: 60,
    context_len: 32,
    has_checkpoint: false,
  },
]

const point = (step: number) => ({ step, train_loss: 6 - step / 100, val_loss: 6 - step / 200 })

function runState(step: number) {
  return {
    run_id: "r1",
    corpus: "all",
    step,
    max_steps: 2000,
    params: 48000,
    vocab_size: 471,
    context_len: 32,
    random_guess_loss: 6.155,
    history: Array.from({ length: step }, (_, i) => point(i + 1)),
    execution_mode: "real",
  }
}

const TARGETS = [" capital", " of", " France", " is", " Paris", "."]

function probe(parisProb: number) {
  const tokens = ["The", ...TARGETS]
  return {
    tokens,
    truncated: false,
    positions: TARGETS.map((target, i) => {
      const prob = target === " Paris" ? parisProb : 0.2
      return {
        index: i + 1,
        context: tokens.slice(0, i + 1),
        target,
        prob,
        loss: -Math.log(prob),
        top_k: [
          { token: target, prob },
          { token: " the", prob: 0.1 },
        ],
      }
    }),
  }
}

const reject = (status: number, detail: string) =>
  new Response(JSON.stringify({ detail }), {
    status,
    headers: { "content-type": "application/json" },
  })

function server({ loseFirstTrain = false, pretrainedStep = 800, trainFails = false } = {}) {
  let trains = 0
  let probes = 0
  let step = 0
  return fakeServer({
    "/health": () => HEALTH,
    "/genai/toy/corpora": () => CORPORA,
    "/genai/toy/runs": (body) => {
      step = (body as { pretrained: boolean }).pretrained ? pretrainedStep : 0
      return runState(step)
    },
    "/genai/toy/runs/r1/train": (body) => {
      trains += 1
      if (loseFirstTrain && trains === 1) return reject(404, "This training run is gone")
      if (trainFails) return reject(400, "a run stops at 2000 steps")
      step += (body as { steps: number }).steps
      return runState(step)
    },
    "/genai/toy/runs/r1/probe": () => {
      probes += 1
      return probe(probes === 1 ? 0.05 : 0.6)
    },
    "/genai/toy/runs/r1/generate": () => ({
      model: "toy-gpt",
      steps: [
        { token: " Paris", prob: 0.6, top_k: [{ token: " Paris", prob: 0.6 }] },
        { token: ".", prob: 0.9, top_k: [{ token: ".", prob: 0.9 }] },
      ],
    }),
  })
}

const stepStat = () =>
  within(screen.getByRole("region", { name: "Training" })).getByText(/\/ 2000/).textContent

test("creates a run and probes the default sentence on load", async () => {
  const fake = server()
  await renderLesson(PretrainingLesson)
  const table = await screen.findByRole("table", { name: "Training example" })
  expect(within(table).getAllByRole("row")).toHaveLength(TARGETS.length + 1)
  expect(fake.posts("/genai/toy/runs")).toEqual([{ corpus: "all", seed: 0, pretrained: false }])
  expect(fake.posts("/genai/toy/runs/r1/probe")).toEqual([
    { text: "The capital of France is Paris.", top_k: 5 },
  ])
  expect(stepStat()).toBe("0 / 2000")
  // The " Paris" row is selected by default and its top candidates are listed.
  expect(screen.getByRole("button", { name: "Paris", pressed: true })).toBeTruthy()
  expect(screen.getByText("5%")).toBeTruthy()
})

test("Train posts the chosen number of steps, then re-probes", async () => {
  const fake = server()
  await renderLesson(PretrainingLesson)
  await screen.findByRole("table", { name: "Training example" })
  fireEvent.click(button("200 steps"))
  fireEvent.click(button("Train"))
  await waitFor(() => expect(stepStat()).toBe("200 / 2000"))
  expect(fake.posts("/genai/toy/runs/r1/train")).toEqual([{ steps: 200 }])
  await waitFor(() => expect(fake.posts("/genai/toy/runs/r1/probe")).toHaveLength(2))
  expect(await screen.findByText("60%")).toBeTruthy()
})

test("starting from the pretrained checkpoint creates a pretrained run", async () => {
  const fake = server()
  await renderLesson(PretrainingLesson)
  await screen.findByRole("table", { name: "Training example" })
  fireEvent.click(button("Pretrained checkpoint"))
  await waitFor(() => expect(stepStat()).toBe("800 / 2000"))
  expect(fake.posts("/genai/toy/runs")[1]).toEqual({ corpus: "all", seed: 0, pretrained: true })
})

test("a lost run is recreated and the student is told", async () => {
  const fake = server({ loseFirstTrain: true })
  await renderLesson(PretrainingLesson)
  await screen.findByRole("table", { name: "Training example" })
  fireEvent.click(button("Train"))
  expect(await screen.findByText(/previous run was lost/)).toBeTruthy()
  await waitFor(() => expect(fake.posts("/genai/toy/runs")).toHaveLength(2))
})

test("Generate shows the toy model's tokens", async () => {
  server()
  await renderLesson(PretrainingLesson)
  await screen.findByRole("table", { name: "Training example" })
  fireEvent.click(button("Generate"))
  expect((await screen.findByTestId("generated-text")).textContent).toContain("Paris.")
})

test("a training error pauses Auto and is shown", async () => {
  const fake = server({ trainFails: true })
  await renderLesson(PretrainingLesson)
  await screen.findByRole("table", { name: "Training example" })
  fireEvent.click(button("Auto"))
  expect(await screen.findByText("a run stops at 2000 steps")).toBeTruthy()
  await new Promise((r) => setTimeout(r, 150))
  expect(fake.posts("/genai/toy/runs/r1/train")).toHaveLength(1)
  expect(screen.getByRole("button", { name: "Auto", pressed: false })).toBeTruthy()
})

test("near the cap, Train sends only the remaining steps and then disables itself", async () => {
  const fake = server({ pretrainedStep: 1950 })
  await renderLesson(PretrainingLesson)
  await screen.findByRole("table", { name: "Training example" })
  fireEvent.click(button("Pretrained checkpoint"))
  await waitFor(() => expect(stepStat()).toBe("1950 / 2000"))
  fireEvent.click(button("200 steps"))
  fireEvent.click(button("Train"))
  await waitFor(() => expect(stepStat()).toBe("2000 / 2000"))
  expect(fake.posts("/genai/toy/runs/r1/train")).toEqual([{ steps: 50 }])
  expect((button("Train") as HTMLButtonElement).disabled).toBe(true)
  expect(screen.getByText(/reached its step limit/)).toBeTruthy()
})

import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { NextTokenLabLesson } from "./next-token-lab"
import { fakeServer, HEALTH, renderLesson } from "./test-utils"

const step = (token: string, prob: number, others: string[]) => ({
  token,
  prob,
  top_k: [{ token, prob }, ...others.map((t, i) => ({ token: t, prob: prob / (i + 2) }))],
})

const STORY = [
  step(" there", 0.4, [" a", " the"]),
  step(" lived", 0.5, [" was", " stood"]),
  step(" a", 0.6, [" an", " two"]),
]
const AFTER_FORCED = [step(" brave", 0.3, [" small"]), step(" fox", 0.2, [" girl"])]

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const button = (name: string | RegExp) => screen.getByRole("button", { name })
const generated = () => screen.getByTestId("generated-text").textContent

test("generates, then reveals the continuation token by token", async () => {
  const server = fakeServer({
    "/health": () => HEALTH,
    "/genai/complete": () => ({ model: "gpt2", steps: STORY }),
  })
  await renderLesson(NextTokenLabLesson)
  await screen.findByText("gpt2")

  fireEvent.click(button("Generate"))
  await screen.findByTestId("generated-text")
  expect(server.posts("/genai/complete")).toEqual([
    {
      prompt: "Once upon a time, in a small village,",
      max_tokens: 30,
      temperature: 0.7,
      top_k: 5,
      seed: 0,
    },
  ])

  fireEvent.click(button("Pause"))
  fireEvent.click(button("Show all tokens"))
  expect(generated()).toBe("Once upon a time, in a small village, there lived a")
  expect(screen.getByText("3/3")).toBeTruthy()

  fireEvent.click(button("Previous token"))
  expect(generated()).toBe("Once upon a time, in a small village, there lived")
  expect(screen.getByText("token 3 of 3")).toBeTruthy()
})

test("the probabilities panel steps back and forth through every prediction", async () => {
  fakeServer({
    "/health": () => HEALTH,
    "/genai/complete": () => ({ model: "gpt2", steps: STORY }),
  })
  await renderLesson(NextTokenLabLesson)
  fireEvent.click(button("Generate"))
  await screen.findByTestId("generated-text")
  fireEvent.click(button("Show all tokens"))
  expect(button("Next prediction")).toHaveProperty("disabled", true)

  fireEvent.click(button("Previous prediction"))
  fireEvent.click(button("Previous prediction"))
  expect(screen.getByText("token 1 of 3")).toBeTruthy()
  expect(generated()).toBe("Once upon a time, in a small village,")
  expect(button("Previous prediction")).toHaveProperty("disabled", true)

  fireEvent.click(button("Next prediction"))
  fireEvent.click(button("Next prediction"))
  expect(screen.getByText("token 3 of 3")).toBeTruthy()
  expect(generated()).toBe("Once upon a time, in a small village, there lived a")
})

test("choosing another candidate keeps the text before it and continues from it", async () => {
  const server = fakeServer({
    "/health": () => HEALTH,
    "/genai/complete": (body) => ({
      model: "gpt2",
      steps: (body as { prompt: string }).prompt.endsWith(" an") ? AFTER_FORCED : STORY,
    }),
  })
  await renderLesson(NextTokenLabLesson)
  fireEvent.click(button("Generate"))
  await screen.findByTestId("generated-text")
  fireEvent.click(button("Show all tokens"))

  // The last decision is on screen: " a" was the model's pick, " an" a candidate.
  fireEvent.click(button('Choose " an"'))
  await waitFor(() => expect(server.posts("/genai/complete")).toHaveLength(2))
  expect(server.posts("/genai/complete")[1]).toMatchObject({
    prompt: "Once upon a time, in a small village, there lived an",
    max_tokens: 27,
  })
  await waitFor(() => expect(screen.getByText("3/5")).toBeTruthy())
  expect(screen.getByTitle(/your pick/).textContent).toBe(" an")
})

test("explains how to start the server when it is unreachable", async () => {
  fakeServer({})
  await renderLesson(NextTokenLabLesson)
  expect(await screen.findByText(/model server isn't running/)).toBeTruthy()
  expect(screen.getByText(/uv run fastapi dev/)).toBeTruthy()
})

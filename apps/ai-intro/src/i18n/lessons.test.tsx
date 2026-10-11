import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { routeTree } from "@/routeTree.gen"

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null)
  vi.spyOn(window, "scrollTo").mockImplementation(() => {})
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

async function openLesson(path: string) {
  const router = createRouter({
    routeTree,
    defaultPendingMinMs: 0,
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  await router.load()
  render(<RouterProvider router={router} />)
  await screen.findByRole("button", { name: "PT-BR" })
  return router
}

// Rendering the full route tree loads every lesson; under parallel test load this exceeds 5s.
test("switches the trained network's copy without resetting its epoch or inputs", async () => {
  await openLesson("/learn/programming-vs-ml/machine-learning")
  fireEvent.click(screen.getByRole("button", { name: "Step" }))
  expect(screen.getByText("Epoch", { selector: "p" }).parentElement?.textContent).toBe("Epoch1")
  fireEvent.change(screen.getByLabelText("Temperature (°C)"), { target: { value: "90" } })
  fireEvent.click(screen.getByRole("button", { name: "PT-BR" }))
  expect(screen.getByText("Época", { selector: "p" }).parentElement?.textContent).toBe("Época1")
  expect((screen.getByLabelText("Temperatura (°C)") as HTMLInputElement).value).toBe("90")
  fireEvent.click(screen.getByRole("button", { name: "Classificar" }))
  expect(screen.getByText(/Rede:/).textContent).toContain("de risco")
  fireEvent.click(screen.getByRole("button", { name: "EN-US" }))
  expect(screen.getByText("Epoch", { selector: "p" }).parentElement?.textContent).toBe("Epoch1")
}, 15_000)

test("switches the perceptron's copy without resetting its run", async () => {
  await openLesson("/learn/neural-networks/perceptron")
  const epoch = (label: string) =>
    screen.getAllByText(label, { selector: "dt" })[0].parentElement?.querySelector("dd")
      ?.textContent
  fireEvent.click(screen.getByRole("button", { name: /^XOR/ }))
  fireEvent.click(screen.getByRole("button", { name: "Step 1 epoch" }))
  fireEvent.click(screen.getByRole("button", { name: "Show math" }))
  fireEvent.click(screen.getByRole("button", { name: "PT-BR" }))
  expect(epoch("Época")).toBe("1")
  expect(screen.getByRole("button", { name: /^XOR/ }).getAttribute("aria-pressed")).toBe("true")
  expect(screen.getByText("Última atualização do treino")).toBeTruthy()
  fireEvent.click(screen.getByRole("button", { name: "EN-US" }))
  expect(epoch("Epoch")).toBe("1")
}, 15_000)

test("content lessons show no chapter eyebrow in either language", async () => {
  await openLesson("/learn/machine-learning/components")
  expect(screen.queryByText(/Chapter 02/)).toBeNull()
  fireEvent.click(screen.getByRole("button", { name: "PT-BR" }))
  expect(screen.queryByText(/Capítulo 02/)).toBeNull()
})

test("keeps classification points visible when translated", async () => {
  await openLesson("/learn/machine-learning/classification-metrics")
  const plot = screen.getByRole("img", { name: /Scatter plot/ })
  const points = plot.querySelectorAll("circle").length
  const colors = [...plot.querySelectorAll("circle")].map((point) => point.getAttribute("fill"))
  expect(points).toBeGreaterThan(0)
  fireEvent.click(screen.getByRole("button", { name: "PT-BR" }))
  const translated = screen.getByRole("img", { name: /Gráfico de dispersão/ })
  expect(translated.querySelectorAll("circle")).toHaveLength(points)
  expect(
    [...translated.querySelectorAll("circle")].map((point) => point.getAttribute("fill")),
  ).toEqual(colors)
})

test("keeps Portuguese across footer navigation and English for an untranslated lesson", async () => {
  await openLesson("/learn/programming-vs-ml/content")
  fireEvent.click(screen.getByRole("button", { name: "PT-BR" }))
  const next = screen.getByRole("link", { name: "Componentes de ML →" })
  expect(next.getAttribute("href")).toBe("/learn/machine-learning/components")
  fireEvent.click(next)
  await waitFor(() =>
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("ML é formado"),
  )
  expect(localStorage.getItem("ai-intro-language")).toBe("pt-BR")
  fireEvent.click(screen.getByRole("link", { name: "Back-propagation" }))
  await screen.findByRole("heading", { level: 1, name: "Back-propagation" })
  expect(
    screen
      .getByText("This simulation is being built. Check back soon.")
      .closest("[lang]")
      ?.getAttribute("lang"),
  ).toBe("en-US")
})

test("translates fairness groups and rule outcomes", async () => {
  localStorage.setItem("ai-intro-language", "pt-BR")
  await openLesson("/learn/machine-learning/fairness")
  expect(screen.queryAllByText("Group A")).toHaveLength(0)
  expect(screen.queryAllByText("Group B")).toHaveLength(0)
  expect(screen.queryAllByText("passes")).toHaveLength(0)
  expect(screen.queryAllByText("fails")).toHaveLength(0)
  expect(screen.getAllByText("Grupo A").length).toBeGreaterThan(0)
})

test("translates compound ranking summary labels", async () => {
  localStorage.setItem("ai-intro-language", "pt-BR")
  await openLesson("/learn/machine-learning/ranking-metrics")
  expect(screen.getByText("MRR, Ordenador por palavras-chave")).toBeTruthy()
  expect(screen.getByText("MAP, Ordenador aprendido")).toBeTruthy()
})

test("preserves comparison symbols in the English F-beta explanation", async () => {
  await openLesson("/learn/machine-learning/classification-metrics")
  expect(screen.getByText(/Fβ generalizes it:/).textContent).toContain("β > 1")
  expect(screen.getByText(/Fβ generalizes it:/).textContent).toContain("β < 1")
})

// Some lessons train networks as they open (e.g. Generalization); give them room under load.
test.each([
  ["programming-vs-ml/problem", "Podemos prever"],
  ["programming-vs-ml/programming", "Defina as regras"],
  ["programming-vs-ml/machine-learning", "Aprenda as regras"],
  ["programming-vs-ml/content", "Máquinas que aprendem"],
  ["machine-learning/components", "ML é formado"],
  ["machine-learning/generalization", "generalização"],
  ["machine-learning/bias-and-variance", "Viés e"],
  ["machine-learning/fairness", "equidade"],
  ["machine-learning/data-splits", "Divisão"],
  ["machine-learning/classification-metrics", "Classificação"],
  ["machine-learning/clustering-metrics", "Agrupamento"],
  ["machine-learning/regression-metrics", "Regressão"],
  ["machine-learning/reinforcement-learning-metrics", "Reforço"],
  ["machine-learning/ranking-metrics", "Ordenação"],
  ["neural-networks/perceptron", "um neurônio"],
])(
  "restores saved Portuguese for %s",
  async (lesson, title) => {
    localStorage.setItem("ai-intro-language", "pt-BR")
    await openLesson(`/learn/${lesson}`)
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(title),
    )
    expect(screen.getByRole("button", { name: "PT-BR" }).getAttribute("aria-pressed")).toBe("true")
  },
  15_000,
)

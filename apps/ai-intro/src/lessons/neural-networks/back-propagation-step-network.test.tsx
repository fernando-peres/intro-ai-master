import { cleanup, render, screen } from "@testing-library/react"
import { LanguageProvider } from "@/i18n/language"
import { forward } from "@/lib/neural-net"
import { DATASETS, stepByStep } from "./back-propagation-step-by-step-math"
import { StepNetwork, stepNetwork } from "./back-propagation-step-network"

afterEach(cleanup)

const pass = stepByStep(DATASETS.and[0])

test("the drawn network reproduces the pass: ŷ at the observation's input", () => {
  const out = forward(stepNetwork(pass, 0), pass.x)
  expect(out[2][0]).toBeCloseTo(pass.yHat, 10)
  expect(out[1]).toHaveLength(4)
  expect(out[1][0]).toBeCloseTo(pass.a1[0], 10)
})

test("step 5 draws the updated weights", () => {
  expect(stepNetwork(pass, 4).weights[1][0]).toEqual(pass.newV)
  expect(stepNetwork(pass, 3).weights[1][0]).toEqual(pass.v)
})

function renderNetwork(step: number) {
  render(
    <LanguageProvider>
      <StepNetwork pass={pass} step={step} />
    </LanguageProvider>,
  )
  return screen.getByRole("img")
}

test("draws the Training Lab's structure: 7 tiles, 12 edges, three column headers", () => {
  const svg = renderNetwork(0)
  expect(svg.querySelectorAll("rect")).toHaveLength(7)
  expect(svg.querySelectorAll("line")).toHaveLength(12)
  for (const title of ["INPUT", "HIDDEN 1 (4)", "OUTPUT"])
    expect(screen.getByText(title)).toBeTruthy()
})

test("node and edge labels follow the step", () => {
  expect(renderNetwork(0).textContent).toContain("z=1.400")
  cleanup()
  expect(renderNetwork(1).textContent).toContain("a=0.802")
  cleanup()
  expect(renderNetwork(3).textContent).toContain("δ=−0.511")
  cleanup()
  expect(renderNetwork(4).textContent).toContain("L=0.087")
})

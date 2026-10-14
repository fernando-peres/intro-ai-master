import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { forward, type Network } from "@/lib/neural-net"
import { NetworkFunction } from "./network-function"

const network: Network = {
  layerSizes: [2, 1, 1],
  weights: [[[0.5, -1]], [[2]]],
  biases: [[0.25], [-0.5]],
  hiddenActivation: "tanh",
}

describe("NetworkFunction", () => {
  it("writes each neuron with its learned numbers and the example result", () => {
    const input = [0.4, -0.2]
    render(
      <NetworkFunction
        network={network}
        inputLabels={["Temp", "Vib"]}
        input={input}
        exampleLabel="ex"
      />,
    )
    expect(screen.getByText("h¹₁ = tanh(0.50·x₁ − 1.00·x₂ + 0.25)")).toBeTruthy()
    expect(screen.getByText("ŷ = σ(2.00·h¹₁ − 0.50)")).toBeTruthy()
    const y = forward(network, input)[2][0]
    expect(screen.getByText(new RegExp(`ŷ = ${y.toFixed(2)}`))).toBeTruthy()
  })

  it("shows the whole function on one wrapping line in the second tab", () => {
    render(
      <NetworkFunction
        network={network}
        inputLabels={["Temp", "Vib"]}
        input={[0, 0]}
        exampleLabel="ex"
      />,
    )
    fireEvent.click(screen.getByRole("tab", { name: "Entire function" }))
    expect(
      screen.getByText(
        "ŷ = σ(2.00·tanh(0.50·((Temp − 72.5) / 22.5) − 1.00·((Vib − 4.5) / 3) + 0.25) − 0.50)",
      ),
    ).toBeTruthy()
  })
})

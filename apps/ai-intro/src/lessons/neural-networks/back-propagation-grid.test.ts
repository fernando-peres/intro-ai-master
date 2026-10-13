import { createNetwork } from "@/lib/neural-net"
import { divergingColor, sampleLayers } from "./back-propagation-grid"

test("samples every layer, with one value per neuron per grid cell", () => {
  const net = createNetwork([2, 3, 1], 1)
  const domain = { xMin: 0, xMax: 1, yMin: 0, yMax: 1 }
  const grids = sampleLayers(net, (x, y) => [x, y], domain, 4)

  expect(grids).toHaveLength(3) // input, hidden, output
  expect(grids[0]).toHaveLength(2) // 2 input neurons
  expect(grids[1]).toHaveLength(3) // 3 hidden neurons
  expect(grids[2]).toHaveLength(1) // 1 output neuron
  expect(grids[0][0]).toHaveLength(4) // resolution rows
  expect(grids[0][0][0]).toHaveLength(4) // resolution cols
})

test("the input layer's grid is exactly toInput, since it's the identity of the forward pass", () => {
  const net = createNetwork([2, 2, 1], 1)
  const domain = { xMin: 0, xMax: 10, yMin: 0, yMax: 10 }
  const grids = sampleLayers(net, (x, y) => [x / 10, y / 10], domain, 3)

  // Row 0 is the top of the domain (yMax); col 0 is xMin.
  expect(grids[0][0][0][0]).toBeCloseTo(0) // x neuron at (xMin, yMax)
  expect(grids[0][1][0][0]).toBeCloseTo(1) // y neuron at (xMin, yMax)
})

test("diverging color is the negative color at t=0, white at t=0.5, positive at t=1", () => {
  const negative: [number, number, number] = [0, 0, 255]
  const positive: [number, number, number] = [255, 100, 0]

  expect(divergingColor(0, negative, positive)).toEqual(negative)
  expect(divergingColor(1, negative, positive)).toEqual(positive)
  expect(divergingColor(0.5, negative, positive)).toEqual([255, 255, 255])
})

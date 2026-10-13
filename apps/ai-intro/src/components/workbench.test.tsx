import { fireEvent, render, screen } from "@testing-library/react"
import { CompareBars, ConfigRail, RunToolbar, Stepper, Switch } from "./workbench"

test("Switch reports and flips its checked state", () => {
  const onChange = vi.fn()
  render(<Switch label="Show weights" checked={false} onChange={onChange} />)
  const toggle = screen.getByRole("switch", { name: "Show weights" })
  expect(toggle.getAttribute("aria-checked")).toBe("false")
  fireEvent.click(toggle)
  expect(onChange).toHaveBeenCalledWith(true)
})

test("Stepper exposes labelled decrement and increment controls", () => {
  const onDecrement = vi.fn()
  const onIncrement = vi.fn()
  render(
    <Stepper
      label="L1"
      value={4}
      onDecrement={onDecrement}
      onIncrement={onIncrement}
      decrementLabel="Fewer"
      incrementLabel="More"
    />,
  )
  fireEvent.click(screen.getByRole("button", { name: "Fewer" }))
  fireEvent.click(screen.getByRole("button", { name: "More" }))
  expect(onDecrement).toHaveBeenCalledOnce()
  expect(onIncrement).toHaveBeenCalledOnce()
  expect(screen.getByText("4")).toBeTruthy()
})

test("ConfigRail collapses its body and tip", () => {
  render(
    <ConfigRail title="Network configuration" tip="A tip">
      <p>Body</p>
    </ConfigRail>,
  )
  expect(screen.getByText("Body")).toBeTruthy()
  fireEvent.click(screen.getByRole("button", { name: "Hide configuration" }))
  expect(screen.queryByText("Body")).toBeNull()
  expect(screen.queryByText("A tip")).toBeNull()
})

test("RunToolbar lists metrics as label/value pairs", () => {
  render(
    <RunToolbar
      controls={<button type="button">Step</button>}
      architecture="2 → 4 → 1"
      metricsLabel="Run metrics"
      metrics={[
        { label: "Epoch", value: "3" },
        { label: "Loss", value: "0.412" },
      ]}
    />,
  )
  const metrics = screen.getByLabelText("Run metrics")
  expect(metrics.textContent).toBe("Epoch3Loss0.412")
  expect(screen.getByText("2 → 4 → 1")).toBeTruthy()
})

test("CompareBars shows each row's count and percentage", () => {
  render(
    <CompareBars
      rows={[
        { label: "Neural network", count: "24 / 30", percent: 80, tone: "brand" },
        { label: "Hand-written rules", count: "20 / 30", percent: 67, tone: "muted" },
      ]}
    />,
  )
  expect(screen.getByText("24 / 30")).toBeTruthy()
  expect(screen.getByText("80%")).toBeTruthy()
  expect(screen.getByText("67%")).toBeTruthy()
})

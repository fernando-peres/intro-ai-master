import { render, screen } from "@testing-library/react"

import { TreeDiagram } from "./tree-diagram"

test("draws every node label and every branch label", () => {
  const { container } = render(
    <TreeDiagram
      ariaLabel="tree"
      root={{
        label: "A",
        children: [
          { edge: "left", node: { label: "1", color: "blue" } },
          { edge: "right", node: { label: "2", color: "orange" } },
        ],
      }}
    />,
  )

  for (const text of ["A", "1", "2", "left", "right"]) expect(screen.getByText(text)).toBeTruthy()
  expect(container.querySelectorAll("rect")).toHaveLength(3)
  expect(container.querySelectorAll("path")).toHaveLength(2)
})

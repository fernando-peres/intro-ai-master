import { render, waitFor } from "@testing-library/react"

import { CodeBlock } from "./code-block"

test("highlights the code without changing its text content", async () => {
  const code = "def f(x):\n    return x + 1"
  const { container } = render(<CodeBlock code={code} />)

  await waitFor(() => expect(container.querySelector(".shiki")).not.toBeNull())
  expect(container.textContent).toBe(code)
})

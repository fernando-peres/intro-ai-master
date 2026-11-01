// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { Schemas } from "@/api/client"
import { DecideReviewDialog } from "@/components/workspace/review-dialogs"

const publish = vi.fn(async () => ({ versionNumber: 3 }))
vi.mock("@/api/queries", () => ({
  useApproveAndPublish: () => ({ mutateAsync: publish, isPending: false }),
  useDecideReview: () => ({ mutateAsync: vi.fn(), isPending: false }),
  usePublish: () => ({}),
  useSubmitReview: () => ({}),
}))

const review = { id: "rev1", submittedBy: "usr_author" } as Schemas["ReviewListItem"]

describe("review dialog", () => {
  afterEach(cleanup)

  it("needs a change comment, then approves and publishes", async () => {
    const onClose = vi.fn()
    render(<DecideReviewDialog review={review} onClose={onClose} />)
    const button = screen.getByRole("button", { name: "Approve and publish" })
    expect((button as HTMLButtonElement).disabled).toBe(true)
    fireEvent.change(screen.getByLabelText(/Change comment/), { target: { value: "First cut" } })
    fireEvent.click(button)
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(publish).toHaveBeenCalledWith({
      reviewId: "rev1",
      comment: "",
      changeComment: "First cut",
      makeDefault: true,
    })
  })
})

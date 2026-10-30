import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { type FormEvent, type ReactNode, useState } from "react"
import { toast } from "sonner"
import type { Schemas } from "@/api/client"
import { useDecideReview, usePublish, useSubmitReview } from "@/api/queries"
import { ActionButton, Field } from "@/components/shell/form-controls"

type Review = Schemas["ReviewListItem"]

function Frame({
  title,
  description,
  children,
  onClose,
}: {
  title: string
  description: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-[#06060ACC]" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 w-[460px] max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[10px] border border-gc-border bg-gc-raised outline-none">
          <div className="border-b border-gc-border px-[18px] py-4">
            <DialogPrimitive.Title className="text-[15px] font-bold text-gc-text">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-[3px] text-[11.5px] text-gc-ink3">
              {description}
            </DialogPrimitive.Description>
          </div>
          {children}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

const textarea =
  "min-h-20 rounded-md border border-gc-border bg-gc-sunken p-2.5 text-[11.5px] text-gc-text outline-none focus:border-gc-primary"
const footer = "flex justify-end gap-2 border-t border-gc-border bg-gc-sunken px-[18px] py-[13px]"

const message = (error: unknown) => (error instanceof Error ? error.message : "Request failed")

export function SubmitReviewDialog({
  versionId,
  onClose,
}: {
  versionId: string
  onClose: () => void
}) {
  const submit = useSubmitReview()
  const [comment, setComment] = useState("")
  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await submit.mutateAsync({ versionId, comment })
      toast.success("Sent for review")
      onClose()
    } catch (error) {
      toast.error(message(error))
    }
  }
  return (
    <Frame
      title="Submit for review"
      description="A reviewer approves this exact draft. Any edit after approval needs a new review."
      onClose={onClose}
    >
      <form onSubmit={onSubmit}>
        <div className="p-[18px]">
          <Field label="Note for the reviewer (optional)">
            <textarea
              className={textarea}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
          </Field>
        </div>
        <div className={footer}>
          <ActionButton onClick={onClose}>Cancel</ActionButton>
          <ActionButton type="submit" variant="primary" disabled={submit.isPending}>
            Submit for review
          </ActionButton>
        </div>
      </form>
    </Frame>
  )
}

export function DecideReviewDialog({ review, onClose }: { review: Review; onClose: () => void }) {
  const decide = useDecideReview()
  const [comment, setComment] = useState("")
  const act = async (decision: "approve" | "request-changes") => {
    try {
      await decide.mutateAsync({ reviewId: review.id, decision, comment })
      toast.success(decision === "approve" ? "Approved" : "Changes requested")
      onClose()
    } catch (error) {
      toast.error(message(error))
    }
  }
  return (
    <Frame
      title="Review draft"
      description={
        review.submitComment
          ? `Submitter's note: ${review.submitComment}`
          : `Submitted by ${review.submittedBy}.`
      }
      onClose={onClose}
    >
      <div className="p-[18px]">
        <Field label="Feedback (required to request changes)">
          <textarea
            className={textarea}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </Field>
      </div>
      <div className={footer}>
        <ActionButton onClick={onClose}>Cancel</ActionButton>
        <ActionButton
          disabled={decide.isPending || !comment.trim()}
          onClick={() => act("request-changes")}
        >
          Request changes
        </ActionButton>
        <ActionButton variant="primary" disabled={decide.isPending} onClick={() => act("approve")}>
          Approve
        </ActionButton>
      </div>
    </Frame>
  )
}

export function PublishDialog({
  versionId,
  locale,
  onClose,
}: {
  versionId: string
  locale: string
  onClose: () => void
}) {
  const publish = usePublish()
  const [changeComment, setChangeComment] = useState("")
  const [makeDefault, setMakeDefault] = useState(false)
  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const published = await publish.mutateAsync({ versionId, changeComment, makeDefault })
      toast.success(`Published ${locale.toUpperCase()} v${published.versionNumber}`)
      onClose()
    } catch (error) {
      toast.error(message(error))
    }
  }
  return (
    <Frame
      title="Publish version"
      description={`Freezes this draft as the next ${locale.toUpperCase()} version. Flows keep the versions they already pin.`}
      onClose={onClose}
    >
      <form onSubmit={onSubmit}>
        <div className="flex flex-col gap-3 p-[18px]">
          <Field label="Change comment">
            <textarea
              required
              className={textarea}
              placeholder="Clarified the attention example and changed diagram colors"
              value={changeComment}
              onChange={(event) => setChangeComment(event.target.value)}
            />
          </Field>
          <label className="flex items-center gap-2 text-[11.5px] text-gc-ink2">
            <input
              type="checkbox"
              checked={makeDefault}
              onChange={(event) => setMakeDefault(event.target.checked)}
              className="accent-gc-primary"
            />
            Make it the default {locale.toUpperCase()} version
          </label>
        </div>
        <div className={footer}>
          <ActionButton onClick={onClose}>Cancel</ActionButton>
          <ActionButton
            type="submit"
            variant="primary"
            disabled={publish.isPending || !changeComment.trim()}
          >
            Publish
          </ActionButton>
        </div>
      </form>
    </Frame>
  )
}

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { type FormEvent, type ReactNode, useState } from "react"
import { toast } from "sonner"
import type { Schemas } from "@/api/client"
import { useApproveAndPublish, useDecideReview, usePublish, useSubmitReview } from "@/api/queries"
import { ActionButton, Field } from "@/components/shell/form-controls"
import { friendlyError } from "@/lib/errors"

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
            <DialogPrimitive.Title className="text-title font-bold text-gc-text">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-[3px] text-ui text-gc-ink3">
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
  "min-h-20 rounded-md border border-gc-border bg-gc-sunken p-2.5 text-ui text-gc-text outline-none focus:border-gc-primary"
const footer = "flex justify-end gap-2 border-t border-gc-border bg-gc-sunken px-[18px] py-[13px]"

const message = (error: unknown) => friendlyError(error)

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
  const approvePublish = useApproveAndPublish()
  const [comment, setComment] = useState("")
  const [changeComment, setChangeComment] = useState("")
  const [makeDefault, setMakeDefault] = useState(true)
  const busy = decide.isPending || approvePublish.isPending
  const publishNow = async () => {
    try {
      const published = await approvePublish.mutateAsync({
        reviewId: review.id,
        comment,
        changeComment,
        makeDefault,
      })
      toast.success(`Approved and published v${published.versionNumber}`)
      onClose()
    } catch (error) {
      toast.error(message(error))
    }
  }
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
      <div className="flex flex-col gap-3 p-[18px]">
        <Field label="Feedback (required to request changes)">
          <textarea
            className={textarea}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </Field>
        <Field label="Change comment (required to publish)">
          <textarea
            className={textarea}
            value={changeComment}
            onChange={(event) => setChangeComment(event.target.value)}
          />
        </Field>
        <label className="flex items-center gap-2 text-ui text-gc-ink2">
          <input
            type="checkbox"
            checked={makeDefault}
            onChange={(event) => setMakeDefault(event.target.checked)}
            className="accent-gc-primary"
          />
          Make it the default version
        </label>
      </div>
      <div className={footer}>
        <ActionButton onClick={onClose}>Cancel</ActionButton>
        <ActionButton disabled={busy || !comment.trim()} onClick={() => act("request-changes")}>
          Request changes
        </ActionButton>
        <ActionButton disabled={busy} onClick={() => act("approve")}>
          Approve
        </ActionButton>
        <ActionButton
          variant="primary"
          disabled={busy || !changeComment.trim()}
          onClick={publishNow}
        >
          Approve and publish
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
          <label className="flex items-center gap-2 text-ui text-gc-ink2">
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

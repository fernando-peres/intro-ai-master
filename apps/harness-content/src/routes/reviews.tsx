import { createFileRoute, Link } from "@tanstack/react-router"
import { useReviews } from "@/api/queries"
import { typeInfo } from "@/components/artifact-types"
import { Caption, LocaleLabel } from "@/components/labels"
import { ErrorState, ListSkeleton } from "@/components/shell/page-states"
import { usePageTitle } from "@/hooks/use-page-title"
import { relativeTime } from "@/lib/stamps"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/reviews")({ component: ReviewInbox })

/** Pending reviews, oldest first, each linking to the exact draft under review. */
function ReviewInbox() {
  usePageTitle("Review inbox")
  const reviews = useReviews({ status: "pending" })
  const items = [...(reviews.data ?? [])].reverse()
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-12 shrink-0 items-center gap-[9px] border-b border-gc-border px-4">
        <h1 className="text-sm font-bold text-gc-text">Review inbox</h1>
        <Caption className="tracking-[0.6px]">{reviews.data && `${items.length} waiting`}</Caption>
      </header>
      {reviews.isError && !reviews.data && (
        <ErrorState
          title="Could not load the review inbox"
          error={reviews.error}
          onRetry={() => reviews.refetch()}
        />
      )}
      {reviews.isPending && <ListSkeleton label="Loading reviews" rows={5} />}
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {items.map((review) => {
          const info = typeInfo(review.artifactType)
          return (
            <li key={review.id} className="border-b border-gc-divider">
              <Link
                to="/artifacts/$artifactId"
                params={{ artifactId: review.artifactId }}
                search={{ v: review.versionId }}
                className="flex h-[42px] items-center gap-3 px-4 hover:bg-gc-raised"
              >
                <info.icon aria-label={info.label} className={cn("size-[13px]", info.ink)} />
                <span className="min-w-0 flex-1 truncate text-ui text-gc-text">
                  {review.artifactTitle}
                </span>
                <LocaleLabel locale={review.locale} version={null} published={false} />
                <span className="w-48 truncate text-ui text-gc-ink3">
                  {review.submitComment || "No note"}
                </span>
                <span className="w-28 truncate font-mono text-label text-gc-ink3">
                  {review.submittedBy}
                </span>
                <span className="w-16 font-mono text-label text-gc-ink3">
                  {relativeTime(review.createdAt)}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
      {reviews.data && items.length === 0 && (
        <p className="m-auto p-6 text-body text-gc-ink2">Nothing waiting for review.</p>
      )}
    </div>
  )
}

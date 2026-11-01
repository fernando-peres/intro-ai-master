import { type ErrorComponentProps, Link, useRouter } from "@tanstack/react-router"
import { ErrorState } from "@/components/shell/page-states"

/** Rendered in the failed route's outlet, so the studio's navigation keeps working. */
export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  return (
    <ErrorState
      title="This page could not be shown"
      error={error}
      onRetry={() => {
        reset()
        router.invalidate()
      }}
    >
      <Link
        to="/"
        className="inline-flex h-7 items-center rounded-md px-[11px] text-ui text-gc-primary-ink hover:underline"
      >
        Go to artifact search
      </Link>
    </ErrorState>
  )
}

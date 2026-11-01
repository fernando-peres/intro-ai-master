import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"
import { ErrorState } from "@/components/shell/page-states"
import { TOO_NARROW_TO_EDIT, useMediaQuery } from "@/hooks/use-media-query"

/** Authoring needs 1024px; below that the screen explains itself instead of clipping. */
export function DesktopOnly({ children }: { children: ReactNode }) {
  if (!useMediaQuery(TOO_NARROW_TO_EDIT)) return children
  return (
    <ErrorState
      title="Editing needs a larger screen"
      message="Open this on a window at least 1024px wide. You can still browse the library here."
    >
      <Link to="/" className="text-ui text-gc-primary-ink hover:underline">
        Go to artifact search
      </Link>
    </ErrorState>
  )
}

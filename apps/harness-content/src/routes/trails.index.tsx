import { createFileRoute, Link } from "@tanstack/react-router"
import { PlusIcon, RouteIcon } from "lucide-react"
import { useFlows } from "@/api/queries"
import { Caption } from "@/components/labels"
import { ActionButton } from "@/components/shell/form-controls"
import { ErrorState, ListSkeleton } from "@/components/shell/page-states"
import { useStudioDialogs } from "@/components/shell/studio-dialogs"
import { usePageTitle } from "@/hooks/use-page-title"
import { relativeTime } from "@/lib/stamps"
import { formatCount } from "@/lib/utils"

export const Route = createFileRoute("/trails/")({ component: TrailIndex })

function TrailIndex() {
  usePageTitle("Trails")
  const flows = useFlows()
  const { newTrail } = useStudioDialogs()
  const items = flows.data ?? []
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-gc-border px-4">
        <div className="flex items-center gap-[9px]">
          <h1 className="text-sm font-bold text-gc-text">Trails</h1>
          <Caption className="tracking-[0.5px]">
            {flows.data && formatCount(items.length, "trail")}
          </Caption>
        </div>
        <ActionButton variant="primary" onClick={newTrail}>
          <PlusIcon />
          New trail
        </ActionButton>
      </header>
      {flows.isError && !flows.data && (
        <ErrorState
          title="Could not load trails"
          error={flows.error}
          onRetry={() => flows.refetch()}
        />
      )}
      {flows.isPending && <ListSkeleton label="Loading trails" rows={5} />}
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {items.map((flow) => (
          <li key={flow.id} className="border-b border-gc-divider">
            <Link
              to="/trails/$flowId"
              params={{ flowId: flow.id }}
              className="flex h-[42px] items-center gap-3 px-4 hover:bg-gc-raised"
            >
              <RouteIcon aria-hidden className="size-[13px] shrink-0 text-gc-ink3" />
              <span className="min-w-0 flex-1 truncate text-ui text-gc-text">{flow.title}</span>
              <span className="text-ui text-gc-ink2">{formatCount(flow.stepCount, "step")}</span>
              <span className="w-24 text-ui text-gc-ink2 max-sm:hidden">
                {flow.latestRevision ? `Published r${flow.latestRevision}` : "Unpublished"}
              </span>
              <span className="w-20 font-mono text-label text-gc-ink3 max-sm:hidden">
                {relativeTime(flow.updatedAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {flows.data && items.length === 0 && (
        <p className="m-auto p-6 text-body text-gc-ink2">
          No trails yet. Create one to sequence artifacts into a lesson.
        </p>
      )}
    </div>
  )
}

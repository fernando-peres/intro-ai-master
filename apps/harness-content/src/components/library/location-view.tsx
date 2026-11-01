import { Link } from "@tanstack/react-router"
import {
  BoxIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  PencilIcon,
  PlusIcon,
} from "lucide-react"
import { useMemo, useState } from "react"
import type { ArtifactListItem, Location } from "@/api/client"
import { useArtifactSearch, useLocationCounts, useLocations } from "@/api/queries"
import { typeInfo } from "@/components/artifact-types"
import { artifactStatusKind, Caption, StatusLabel } from "@/components/labels"
import { ArtifactThumbnail } from "@/components/library/artifact-thumbnail"
import { LocationNameInput, useAddLocation } from "@/components/library/location-controls"
import { ActionButton } from "@/components/shell/form-controls"
import { ErrorState, ListSkeleton } from "@/components/shell/page-states"
import { useStudioDialogs } from "@/components/shell/studio-dialogs"
import {
  buildLibraryTree,
  CHILD_KIND,
  findNode,
  type LibraryNode,
  locationTrail,
} from "@/lib/library-tree"

/** The search endpoint's page maximum; a larger location says so rather than paging. */
const VIEW_LIMIT = 200

const artifactsLabel = (total: number) => `${total} ${total === 1 ? "artifact" : "artifacts"}`

/** Direct totals come from the server, so they stay right past `VIEW_LIMIT`. */
function useLocationNode(location: Location) {
  const locations = useLocations().data
  const counts = useLocationCounts().data
  const results = useArtifactSearch({ locationId: location.id, limit: VIEW_LIMIT })
  const node = useMemo(
    () =>
      findNode(buildLibraryTree(locations ?? [], results.data?.items ?? [], counts), location.id),
    [locations, results.data, counts, location.id],
  )
  return { node, results }
}

function AddActions({ location }: { location: Location }) {
  const { newArtifact } = useStudioDialogs()
  const add = useAddLocation()
  const childKind = CHILD_KIND[location.kind]
  return (
    <>
      {childKind && (
        <ActionButton onClick={() => add(childKind, location.id)}>
          <PlusIcon />
          New {childKind}
        </ActionButton>
      )}
      <ActionButton variant="primary" onClick={() => newArtifact(location.id)}>
        <PlusIcon />
        New artifact
      </ActionButton>
    </>
  )
}

export function LocationHeader({ location }: { location: Location }) {
  const locations = useLocations().data ?? []
  const { node } = useLocationNode(location)
  const [editing, setEditing] = useState(false)
  const Icon = location.kind === "box" ? BoxIcon : FolderIcon
  const above = locationTrail(locations, location.id).slice(0, -1)
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-gc-border px-4">
      <div className="flex min-w-0 flex-1 items-center gap-[9px]">
        <Icon aria-hidden className="size-3.5 shrink-0 text-gc-ink3" />
        {above.length > 0 && (
          <Caption className="truncate tracking-[0.5px] max-sm:hidden">
            {above.join(" › ")} ›
          </Caption>
        )}
        {editing ? (
          <LocationNameInput
            key={location.id}
            location={location}
            onDone={() => setEditing(false)}
            className="max-w-xs"
          />
        ) : (
          <>
            <h1 className="truncate text-sm font-bold text-gc-text">{location.title}</h1>
            <button
              type="button"
              aria-label={`Rename ${location.title}`}
              title="Rename"
              onClick={() => setEditing(true)}
              className="flex size-6 shrink-0 items-center justify-center rounded text-gc-ink3 hover:text-gc-text"
            >
              <PencilIcon aria-hidden className="size-3" />
            </button>
          </>
        )}
        {node && (
          <Caption className="shrink-0 tracking-[0.5px]">{artifactsLabel(node.total)}</Caption>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <AddActions location={location} />
      </div>
    </header>
  )
}

/** A box shows its whole hierarchy; a unit or section shows only its direct content. */
export function LocationContent({ location }: { location: Location }) {
  const { node, results } = useLocationNode(location)
  if (results.isError && !results.data) {
    return (
      <ErrorState
        title="Could not load this location"
        error={results.error}
        onRetry={() => results.refetch()}
      />
    )
  }
  if (results.isPending || !node) return <ListSkeleton label="Loading content" />
  if (node.children.length === 0 && node.artifacts.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
        <p className="text-body font-semibold text-gc-text">{location.title} is empty</p>
        <div className="flex items-center gap-2">
          <AddActions location={location} />
        </div>
      </div>
    )
  }
  const total = results.data?.total ?? 0
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <ul aria-label={`Content of ${location.title}`}>
        <NodeContent node={node} level={0} nested={location.kind === "box"} />
      </ul>
      {total > VIEW_LIMIT && (
        <p className="px-4 py-3 text-ui text-gc-ink3">
          Showing the first {VIEW_LIMIT} of {total} artifacts. Search or filter to find the rest.
        </p>
      )}
    </div>
  )
}

function NodeContent({
  node,
  level,
  nested,
}: {
  node: LibraryNode
  level: number
  nested: boolean
}) {
  return (
    <>
      {node.children.map((child) => (
        <FolderRow key={child.location.id} node={child} level={level} nested={nested} />
      ))}
      {node.artifacts.map((artifact) => (
        <ArtifactRow key={artifact.id} artifact={artifact} level={level} />
      ))}
    </>
  )
}

const rowIndent = (level: number) => ({ paddingLeft: 16 + level * 20 })

function FolderRow({ node, level, nested }: { node: LibraryNode; level: number; nested: boolean }) {
  const [open, setOpen] = useState(true)
  const Chevron = open ? ChevronDownIcon : ChevronRightIcon
  const hasContent = node.children.length > 0 || node.artifacts.length > 0
  return (
    <li>
      <div
        className="flex h-10 items-center gap-2 border-b border-gc-divider pr-4 hover:bg-gc-raised"
        style={rowIndent(level)}
      >
        {nested && (
          <button
            type="button"
            aria-label={`${open ? "Collapse" : "Expand"} ${node.location.title}`}
            aria-expanded={open}
            disabled={!hasContent}
            onClick={() => setOpen(!open)}
            className="flex size-6 shrink-0 items-center justify-center rounded text-gc-ink3 hover:text-gc-text disabled:invisible"
          >
            <Chevron aria-hidden className="size-3" />
          </button>
        )}
        <Link
          to="/"
          search={{ location: node.location.id }}
          title={node.location.title}
          className="flex h-full min-w-0 flex-1 items-center gap-2 text-gc-ink2 hover:text-gc-text"
        >
          <FolderIcon aria-hidden className="size-3.5 shrink-0 text-gc-ink3" />
          <span className="truncate text-ui font-semibold">{node.location.title}</span>
        </Link>
        <Caption className="shrink-0">{artifactsLabel(node.total)}</Caption>
      </div>
      {nested && open && hasContent && (
        <ul>
          <NodeContent node={node} level={level + 1} nested />
        </ul>
      )}
    </li>
  )
}

function ArtifactRow({ artifact, level }: { artifact: ArtifactListItem; level: number }) {
  const info = typeInfo(artifact.type)
  return (
    <li
      className="relative flex items-center gap-3 border-b border-gc-divider py-2 pr-4 text-gc-ink2 hover:bg-gc-raised hover:text-gc-text"
      style={rowIndent(level)}
    >
      {/* Outside the link, which stretches over the row: previews can contain links of their own. */}
      <ArtifactThumbnail artifact={artifact} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Link
          to="/artifacts/$artifactId"
          params={{ artifactId: artifact.id }}
          title={artifact.title}
          className="truncate text-ui after:absolute after:inset-0"
        >
          {artifact.title}
        </Link>
        <Caption>{info.label}</Caption>
      </span>
      <StatusLabel kind={artifactStatusKind(artifact.status)} quietPublished />
    </li>
  )
}

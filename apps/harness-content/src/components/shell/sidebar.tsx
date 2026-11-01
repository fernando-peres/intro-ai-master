import { Link, useParams, useSearch } from "@tanstack/react-router"
import {
  BoxIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  InboxIcon,
  type LucideIcon,
  PaletteIcon,
  PencilIcon,
  PlusIcon,
  RouteIcon,
  SearchIcon,
  SunMoonIcon,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useArtifactSearch, useLocationCounts, useLocations, useReviews } from "@/api/queries"
import { typeInfo } from "@/components/artifact-types"
import {
  LocationAddButton,
  LocationNameInput,
  useAddLocation,
} from "@/components/library/location-controls"
import { Skeleton } from "@/components/shell/page-states"
import { useStudioDialogs } from "@/components/shell/studio-dialogs"
import {
  ancestorsOf,
  buildLibraryTree,
  filterTree,
  type LibraryNode,
  locationAncestors,
} from "@/lib/library-tree"
import { cn } from "@/lib/utils"

/** Sidebar tree shows up to this many artifacts; search covers the rest. */
const TREE_LIMIT = 200
const OPEN_KEY = "harness.treeOpen"

function readOpen(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(OPEN_KEY) ?? "[]")
    return new Set(Array.isArray(raw) ? raw : [])
  } catch {
    return new Set()
  }
}

function writeOpen(open: Set<string>) {
  try {
    localStorage.setItem(OPEN_KEY, JSON.stringify([...open]))
  } catch {
    // Storage blocked: the tree state lasts until reload.
  }
}

/** Global destinations stay pinned; only the library tree scrolls. */
export function Sidebar({ className }: { className?: string }) {
  const pending = useReviews({ status: "pending" }).data?.length
  return (
    <div
      className={cn(
        "flex w-[224px] shrink-0 flex-col border-r border-gc-border bg-gc-raised",
        className,
      )}
    >
      <nav
        aria-label="Studio"
        className="flex shrink-0 flex-col gap-0.5 border-b border-gc-border p-2"
      >
        <NavRow to="/" exact icon={SearchIcon} label="Artifacts" />
        <NavRow to="/reviews" icon={InboxIcon} label="Reviews" count={pending} />
        <NavRow to="/trails" icon={RouteIcon} label="Trails" />
        <NavRow to="/artifacts-design" icon={PaletteIcon} label="Design" />
        <NavRow to="/configuration" icon={SunMoonIcon} label="Appearance" />
      </nav>
      <LibraryTree />
    </div>
  )
}

function NavRow({
  to,
  exact,
  icon: Icon,
  label,
  count,
}: {
  to: "/" | "/reviews" | "/trails" | "/artifacts-design" | "/configuration"
  exact?: boolean
  icon: LucideIcon
  label: string
  count?: number
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact, includeSearch: false }}
      className="flex h-7 items-center gap-2 rounded-md px-2 text-ui text-gc-ink2 hover:bg-gc-sunken hover:text-gc-text [&.active]:bg-gc-row-bg [&.active]:font-semibold [&.active]:text-gc-nav-ink"
    >
      <Icon aria-hidden className="size-3.5 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="rounded-[3px] bg-gc-nav-bg px-1.5 font-mono text-label text-gc-nav-ink">
          <span className="sr-only">Pending: </span>
          {count}
        </span>
      )}
    </Link>
  )
}

function LibraryTree() {
  const locations = useLocations()
  const artifacts = useArtifactSearch({ limit: TREE_LIMIT })
  const counts = useLocationCounts().data
  const { renamingId } = useStudioDialogs()
  const addLocation = useAddLocation()
  const params = useParams({ strict: false }) as { artifactId?: string }
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(readOpen)

  const tree = useMemo(
    () => buildLibraryTree(locations.data ?? [], artifacts.data?.items ?? [], counts),
    [locations.data, artifacts.data, counts],
  )
  const shown = useMemo(() => filterTree(tree, query), [tree, query])

  // A row being named must be on screen, whatever was collapsed or filtered out.
  useEffect(() => {
    if (!renamingId) return
    setQuery("")
    const path = locationAncestors(locations.data ?? [], renamingId)
    setOpen((previous) => {
      if (path.every((id) => previous.has(id))) return previous
      const next = new Set([...previous, ...path])
      writeOpen(next)
      return next
    })
  }, [renamingId, locations.data])

  // The open artifact is always visible, whatever was collapsed.
  useEffect(() => {
    if (!params.artifactId) return
    const path = ancestorsOf(tree, params.artifactId)
    setOpen((previous) => {
      if (path.every((id) => previous.has(id))) return previous
      const next = new Set([...previous, ...path])
      writeOpen(next)
      return next
    })
  }, [tree, params.artifactId])

  const toggle = (id: string) =>
    setOpen((previous) => {
      const next = new Set(previous)
      if (!next.delete(id)) next.add(id)
      writeOpen(next)
      return next
    })

  const expand = (id: string) =>
    setOpen((previous) => {
      if (previous.has(id)) return previous
      const next = new Set(previous).add(id)
      writeOpen(next)
      return next
    })

  const loading = locations.isPending
  const filtering = query.trim().length > 0
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-9 shrink-0 items-center justify-between gap-2 pr-2 pl-3">
        <span className="font-mono text-label tracking-[0.5px] text-gc-ink3 uppercase">
          Library
        </span>
        <button
          type="button"
          aria-label="New box"
          title="New box"
          onClick={() => addLocation("box")}
          className="flex size-6 items-center justify-center rounded border border-gc-border bg-gc-sunken text-gc-ink2 hover:text-gc-text"
        >
          <PlusIcon aria-hidden className="size-3" />
        </button>
      </div>
      <div className="shrink-0 px-2 pb-2">
        <input
          type="search"
          aria-label="Filter the library"
          placeholder="Filter library"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-7 w-full rounded-md border border-gc-border bg-gc-sunken px-2 text-ui text-gc-text"
        />
      </div>
      <nav aria-label="Library" className="flex min-h-0 flex-1 flex-col overflow-y-auto px-1 pb-2">
        {loading && (
          <div role="status" aria-label="Loading library" className="flex flex-col gap-2 p-2">
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        )}
        {locations.isError && !locations.data && (
          <p role="alert" className="p-2 text-ui text-gc-ink2">
            The library could not be loaded.{" "}
            <button
              type="button"
              className="text-gc-primary-ink underline"
              onClick={() => locations.refetch()}
            >
              Try again
            </button>
          </p>
        )}
        {locations.data && shown.length === 0 && (
          <p className="p-2 text-ui text-gc-ink3">
            {filtering ? "Nothing matches this filter." : "No boxes yet. Add one to get started."}
          </p>
        )}
        {shown.map((node) => (
          <LocationBranch
            key={node.location.id}
            node={node}
            activeArtifact={params.artifactId}
            isOpen={(id) => filtering || open.has(id)}
            onToggle={toggle}
            onExpand={expand}
          />
        ))}
      </nav>
    </div>
  )
}

function LocationBranch({
  node,
  activeArtifact,
  isOpen,
  onToggle,
  onExpand,
}: {
  node: LibraryNode
  activeArtifact: string | undefined
  isOpen: (id: string) => boolean
  onToggle: (id: string) => void
  onExpand: (id: string) => void
}) {
  const search = useSearch({ strict: false }) as { location?: string }
  const { renamingId, setRenamingId } = useStudioDialogs()
  const open = isOpen(node.location.id)
  const indent = node.depth * 10
  const selected = search.location === node.location.id
  const renaming = renamingId === node.location.id
  const Chevron = open ? ChevronDownIcon : ChevronRightIcon
  const hasChildren = node.children.length > 0 || node.artifacts.length > 0
  const Icon = node.location.kind === "box" ? BoxIcon : FolderIcon

  return (
    <>
      <div
        className={cn(
          "group flex h-7 shrink-0 items-center rounded-md pr-1",
          selected && "bg-gc-row-bg",
        )}
        style={{ paddingLeft: indent }}
      >
        <button
          type="button"
          aria-label={`${open ? "Collapse" : "Expand"} ${node.location.title}`}
          aria-expanded={open}
          disabled={!hasChildren}
          onClick={() => onToggle(node.location.id)}
          className="flex size-6 shrink-0 items-center justify-center rounded text-gc-ink3 hover:text-gc-text disabled:invisible"
        >
          <Chevron aria-hidden className="size-3" />
        </button>
        {renaming ? (
          <LocationNameInput
            key={node.location.id}
            location={node.location}
            onDone={() => setRenamingId(null)}
          />
        ) : (
          <>
            <Link
              to="/"
              search={{ location: node.location.id }}
              title={node.location.title}
              onClick={() => onExpand(node.location.id)}
              onDoubleClick={() => setRenamingId(node.location.id)}
              className="flex h-full min-w-0 flex-1 items-center gap-1.5"
            >
              <Icon aria-hidden className="size-3 shrink-0 text-gc-ink3" />
              <span
                className={cn(
                  "truncate text-ui",
                  selected ? "font-semibold text-gc-nav-ink" : "text-gc-ink2 hover:text-gc-text",
                )}
              >
                {node.location.title}
              </span>
            </Link>
            <span
              title={`${node.total} artifacts`}
              className={cn(
                "shrink-0 pl-1 font-mono text-label group-focus-within:hidden group-hover:hidden group-has-[[data-popup-open]]:hidden",
                selected ? "text-gc-nav-ink" : "text-gc-ink3",
              )}
            >
              {node.total}
            </span>
            {/* Collapsed by width, never unmounted: keyboard focus and the open menu's anchor depend on it. */}
            <span className="flex w-0 shrink-0 overflow-hidden group-focus-within:w-auto group-hover:w-auto group-has-[[data-popup-open]]:w-auto">
              <button
                type="button"
                aria-label={`Rename ${node.location.title}`}
                title="Rename"
                onClick={() => setRenamingId(node.location.id)}
                className="flex size-6 shrink-0 items-center justify-center rounded text-gc-ink3 hover:text-gc-text"
              >
                <PencilIcon aria-hidden className="size-3" />
              </button>
              <LocationAddButton location={node.location} />
            </span>
          </>
        )}
      </div>
      {open && (
        <>
          {node.children.map((child) => (
            <LocationBranch
              key={child.location.id}
              node={child}
              activeArtifact={activeArtifact}
              isOpen={isOpen}
              onToggle={onToggle}
              onExpand={onExpand}
            />
          ))}
          {node.artifacts.map((artifact) => {
            const info = typeInfo(artifact.type)
            const active = activeArtifact === artifact.id
            return (
              <Link
                key={artifact.id}
                to="/artifacts/$artifactId"
                params={{ artifactId: artifact.id }}
                title={artifact.title}
                className={cn(
                  "flex h-7 shrink-0 items-center gap-1.5 rounded-md pr-2",
                  active && "bg-gc-row-bg",
                )}
                style={{ paddingLeft: indent + 34 }}
              >
                <info.icon aria-label={info.label} className={cn("size-3 shrink-0", info.ink)} />
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-ui",
                    active ? "font-semibold text-gc-nav-ink" : "text-gc-ink2 hover:text-gc-text",
                  )}
                >
                  {artifact.title}
                </span>
                {artifact.reuseCount > 0 && (
                  <span
                    title={`Used in ${artifact.reuseCount} trails`}
                    className={cn(
                      "font-mono text-label",
                      active ? "text-gc-nav-ink" : "text-gc-ink3",
                    )}
                  >
                    ×{artifact.reuseCount}
                  </span>
                )}
              </Link>
            )
          })}
        </>
      )}
    </>
  )
}

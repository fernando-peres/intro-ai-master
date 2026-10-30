import { Link, useParams, useSearch } from "@tanstack/react-router"
import {
  BoxIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  GlobeIcon,
  InboxIcon,
  LayersIcon,
  type LucideIcon,
  PlusIcon,
  RouteIcon,
  ShieldIcon,
  WaypointsIcon,
} from "lucide-react"
import { type ReactNode, useState } from "react"
import { useArtifactSearch, useFlows, useLocations, useReviews } from "@/api/queries"
import { typeInfo } from "@/components/artifact-types"
import { useStudioDialogs } from "@/components/shell/studio-dialogs"
import { buildLibraryTree, type LibraryNode } from "@/lib/library-tree"
import { type StudioTheme, useStudioTheme } from "@/lib/studio-theme"
import { cn } from "@/lib/utils"

/** Sidebar tree shows up to this many artifacts; search covers the rest. */
const TREE_LIMIT = 200
const KIND_LABEL = { box: "BOX", unit: "UNIT", section: "SEC" } as const
const STUDIO_THEMES: { id: StudioTheme; label: string; swatches: string[] }[] = [
  { id: "graphite-dark", label: "Graphite Dark", swatches: ["#14131C", "#6D5BD0", "#F4F2FB"] },
  { id: "graphite-light", label: "Graphite Light", swatches: ["#FFFFFF", "#3A3263", "#18181B"] },
]

export function Sidebar() {
  const locations = useLocations().data ?? []
  const artifacts = useArtifactSearch({ limit: TREE_LIMIT }).data?.items ?? []
  const flows = useFlows().data ?? []
  const pending = useReviews({ status: "pending" }).data?.length ?? 0
  const tree = buildLibraryTree(locations, artifacts)
  const { newLocation, newTrail } = useStudioDialogs()
  const { theme, setTheme } = useStudioTheme()

  return (
    <nav
      aria-label="Library"
      className="flex w-[224px] shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-gc-border bg-gc-raised py-2"
    >
      <SectionHeader label="Artifacts" onAdd={() => newLocation()} addLabel="New box" />
      {tree.length === 0 && <EmptyRow>No boxes yet</EmptyRow>}
      {tree.map((node) => (
        <LocationBranch key={node.location.id} node={node} />
      ))}

      <Spacer />
      <SectionHeader label="Reviews" />
      <Link to="/reviews" className="rounded-md [&.active]:bg-gc-row-bg">
        <Row icon={InboxIcon} label="Review inbox" right={String(pending)} />
      </Link>

      <Spacer />
      <SectionHeader label="Trails" onAdd={newTrail} addLabel="New trail" />
      {flows.length === 0 && <EmptyRow>No trails yet</EmptyRow>}
      {flows.map((flow) => (
        <Link
          key={flow.id}
          to="/trails/$flowId"
          params={{ flowId: flow.id }}
          className="rounded-md [&.active]:bg-gc-row-bg"
        >
          <Row icon={RouteIcon} label={flow.title} right={String(flow.stepCount)} />
        </Link>
      ))}

      <Spacer />
      <SectionHeader label="Themes" />
      {STUDIO_THEMES.map((option) => {
        const selected = theme === option.id
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => setTheme(option.id)}
            className={cn(
              "flex h-[23px] items-center gap-2 rounded-md px-2 text-left",
              selected && "bg-gc-row-bg",
            )}
          >
            <span className="flex items-center gap-0.5 pl-2.5">
              {option.swatches.map((color) => (
                <span
                  key={color}
                  className="h-3 w-[5px] rounded-[1.5px]"
                  style={{ background: color }}
                />
              ))}
            </span>
            <span
              className={cn(
                "text-[11px]",
                selected ? "font-semibold text-gc-nav-ink" : "text-gc-ink2",
              )}
            >
              {option.label}
            </span>
          </button>
        )
      })}

      <Spacer />
      <SectionHeader label="Configuration" />
      <Row icon={LayersIcon} label="Component registry" disabled />
      <Row icon={GlobeIcon} label="Locales & versions" disabled />
      <Row icon={ShieldIcon} label="Roles & access" disabled />
    </nav>
  )
}

function LocationBranch({ node }: { node: LibraryNode }) {
  const [open, setOpen] = useState(true)
  const search = useSearch({ strict: false }) as { location?: string }
  const params = useParams({ strict: false }) as { artifactId?: string }
  const indent = 8 + node.depth * 11
  const selected = search.location === node.location.id
  const Chevron = open ? ChevronDownIcon : ChevronRightIcon
  const hasChildren = node.children.length > 0 || node.artifacts.length > 0

  return (
    <>
      <div
        className={cn(
          "group flex h-[23px] items-center justify-between rounded-md pr-2",
          selected && "bg-gc-row-bg",
        )}
        style={{ paddingLeft: indent }}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <button
            type="button"
            aria-label={open ? "Collapse" : "Expand"}
            aria-expanded={open}
            disabled={!hasChildren}
            onClick={() => setOpen(!open)}
            className="text-gc-ink3 disabled:opacity-0"
          >
            <Chevron className="size-2.5" />
          </button>
          <Link
            to="/"
            search={{ location: node.location.id }}
            className="flex min-w-0 items-center gap-1.5"
          >
            {node.location.kind === "box" ? (
              <BoxIcon className="size-[11px] shrink-0 text-gc-ink3" />
            ) : (
              <FolderIcon className="size-[11px] shrink-0 text-gc-ink3" />
            )}
            <span
              className={cn(
                "truncate text-[11px]",
                selected ? "font-semibold text-gc-nav-ink" : "text-gc-ink2",
              )}
            >
              {node.location.title}
            </span>
          </Link>
        </span>
        <span className="font-mono text-[8.5px] text-gc-ink3">
          {KIND_LABEL[node.location.kind]}
        </span>
      </div>
      {open && (
        <>
          {node.children.map((child) => (
            <LocationBranch key={child.location.id} node={child} />
          ))}
          {node.artifacts.map((artifact) => {
            const info = typeInfo(artifact.type)
            const active = params.artifactId === artifact.id
            return (
              <Link
                key={artifact.id}
                to="/artifacts/$artifactId"
                params={{ artifactId: artifact.id }}
                className={cn(
                  "flex h-[23px] items-center justify-between rounded-md pr-2",
                  active && "bg-gc-row-bg",
                )}
                style={{ paddingLeft: indent + 11 }}
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="size-2.5 shrink-0" />
                  <info.icon className={cn("size-[11px] shrink-0", info.ink)} />
                  <span
                    className={cn(
                      "truncate text-[11px]",
                      active ? "font-semibold text-gc-nav-ink" : "text-gc-ink2",
                    )}
                  >
                    {artifact.title}
                  </span>
                </span>
                <span
                  className={cn(
                    "font-mono text-[8.5px]",
                    active ? "text-gc-nav-ink" : "text-gc-ink3",
                  )}
                >
                  ×{artifact.reuseCount}
                </span>
              </Link>
            )
          })}
        </>
      )}
    </>
  )
}

function SectionHeader({
  label,
  onAdd,
  addLabel,
}: {
  label: string
  onAdd?: () => void
  addLabel?: string
}) {
  return (
    <div className="flex h-[22px] items-center justify-between px-2">
      <span className="font-mono text-[9px] tracking-[1px] text-gc-ink3 uppercase">{label}</span>
      {onAdd && (
        <button
          type="button"
          aria-label={addLabel}
          title={addLabel}
          onClick={onAdd}
          className="flex size-4 items-center justify-center rounded border border-gc-border bg-gc-sunken text-gc-ink2 hover:text-gc-text"
        >
          <PlusIcon className="size-[9px]" />
        </button>
      )}
    </div>
  )
}

type RowProps = { icon: LucideIcon; label: string; right?: string; disabled?: boolean }

function Row({ icon: Icon, label, right, disabled }: RowProps) {
  return (
    <div
      title={disabled ? "Coming later" : undefined}
      className={cn(
        "flex h-[23px] items-center justify-between rounded-md px-2",
        disabled && "opacity-60",
      )}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="size-2.5 shrink-0" />
        <Icon className="size-[11px] shrink-0 text-gc-ink3" />
        <span className="truncate text-[11px] text-gc-ink2">{label}</span>
      </span>
      {right && <span className="font-mono text-[8.5px] text-gc-ink3">{right}</span>}
    </div>
  )
}

function EmptyRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[23px] items-center gap-1.5 px-2 text-[11px] text-gc-ink3 italic">
      <WaypointsIcon className="ml-4 size-[11px]" />
      {children}
    </div>
  )
}

function Spacer() {
  return <div className="h-1.5 shrink-0" />
}

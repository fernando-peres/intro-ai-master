import { Link } from "@tanstack/react-router"
import type { ArtifactListItem } from "@/api/client"
import { typeInfo } from "@/components/artifact-types"
import { artifactStatusKind, Caption, LocaleLabel, StatusLabel, TagChip } from "@/components/labels"
import { relativeTime } from "@/lib/stamps"
import { cn } from "@/lib/utils"

// Lowest-priority columns drop first as the window narrows.
const COLUMNS = {
  tags: "w-[190px] max-xl:hidden",
  location: "w-[170px] max-lg:hidden",
  versions: "w-[150px] max-md:hidden",
  status: "w-[118px] max-sm:hidden",
  reuse: "w-[56px] max-md:hidden",
  updated: "w-[84px] max-sm:hidden",
}

type Props = { items: ArtifactListItem[]; now?: Date }

export function ResultsTable({ items, now }: Props) {
  // An empty column is noise: it only earns its width once something is tagged.
  const hasTags = items.some((item) => item.tags.length > 0)
  const headings: [string, string][] = [
    ...(hasTags ? ([["Tags", COLUMNS.tags]] as [string, string][]) : []),
    ["Location", COLUMNS.location],
    ["Versions", COLUMNS.versions],
    ["Status", COLUMNS.status],
    ["Reuse", COLUMNS.reuse],
    ["Updated", COLUMNS.updated],
  ]
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <table aria-label="Artifacts" className="w-full table-fixed border-separate border-spacing-0">
        <thead>
          <tr>
            <Heading className="pl-4">Name</Heading>
            {headings.map(([heading, width]) => (
              <Heading key={heading} className={width}>
                {heading}
              </Heading>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <Row key={item.id} item={item} hasTags={hasTags} now={now} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Heading({ className, children }: { className?: string; children: string }) {
  return (
    <th
      scope="col"
      className={cn(
        "sticky top-0 z-10 h-8 border-b border-gc-border bg-gc-sunken px-2 text-left font-normal",
        className,
      )}
    >
      <Caption>{children}</Caption>
    </th>
  )
}

const cell = "h-[42px] border-b border-gc-divider px-2"

function Row({ item, hasTags, now }: { item: ArtifactListItem; hasTags: boolean; now?: Date }) {
  const info = typeInfo(item.type)
  const [box, ...rest] = item.locationPath
  const place = rest.at(-1)?.title
  return (
    <tr className="hover:bg-gc-raised">
      <td className={cn(cell, "pl-4")}>
        <Link
          to="/artifacts/$artifactId"
          params={{ artifactId: item.id }}
          title={item.title}
          className="flex h-7 min-w-0 items-center gap-[7px] text-gc-ink2 hover:text-gc-text"
        >
          <info.icon aria-label={info.label} className={cn("size-[13px] shrink-0", info.ink)} />
          <span className="truncate text-ui">{item.title}</span>
        </Link>
      </td>
      {hasTags && (
        <td className={cn(cell, COLUMNS.tags)}>
          <div className="flex gap-1.5 overflow-hidden whitespace-nowrap">
            {item.tags.slice(0, 3).map((tag) => (
              <TagChip key={tag}>{tag}</TagChip>
            ))}
          </div>
        </td>
      )}
      <td className={cn(cell, COLUMNS.location)}>
        <div className="flex min-w-0 flex-col">
          {place && <span className="truncate text-ui text-gc-ink2">{place}</span>}
          <span className={cn("truncate text-gc-ink3", place ? "text-label" : "text-ui")}>
            {box?.title}
          </span>
        </div>
      </td>
      <td className={cn(cell, COLUMNS.versions)}>
        <div className="flex gap-1.5 overflow-hidden">
          {item.localeVersions.map((entry) => (
            <LocaleLabel
              key={entry.locale}
              locale={entry.locale}
              version={entry.defaultNumber ?? entry.latestNumber}
              published={entry.defaultNumber !== null || entry.latestNumber !== null}
            />
          ))}
        </div>
      </td>
      <td className={cn(cell, COLUMNS.status)}>
        <StatusLabel kind={artifactStatusKind(item.status)} quietPublished />
      </td>
      <td className={cn(cell, COLUMNS.reuse, "font-mono text-label text-gc-text")}>
        ×{item.reuseCount}
      </td>
      <td className={cn(cell, COLUMNS.updated, "font-mono text-label text-gc-ink3")}>
        {relativeTime(item.updatedAt, now)}
      </td>
    </tr>
  )
}

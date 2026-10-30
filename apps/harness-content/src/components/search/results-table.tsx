import { Link } from "@tanstack/react-router"
import { ArrowDownIcon, CheckIcon } from "lucide-react"
import type { ArtifactListItem } from "@/api/client"
import { typeInfo } from "@/components/artifact-types"
import { artifactStatusKind, Caption, LocaleLabel, StatusLabel, TagChip } from "@/components/labels"
import { relativeTime } from "@/lib/stamps"
import { cn } from "@/lib/utils"

const COLUMNS = "grid grid-cols-[14px_minmax(0,1fr)_150px_140px_124px_80px_44px_72px] gap-2.5"

type Props = {
  items: ArtifactListItem[]
  selected: ReadonlySet<string>
  onToggle: (artifactId: string) => void
  onToggleAll: () => void
  now?: Date
}

export function ResultsTable({ items, selected, onToggle, onToggleAll, now }: Props) {
  const allSelected = items.length > 0 && items.every((item) => selected.has(item.id))
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <table aria-label="Artifacts" className="block w-full">
        <thead className="sticky top-0 block">
          <tr
            className={cn(COLUMNS, "h-8 items-center border-b border-gc-border bg-gc-sunken px-4")}
          >
            <th className="flex">
              <Checkbox checked={allSelected} onChange={onToggleAll} label="Select all" />
            </th>
            {["Name", "Tags", "Location", "Versions", "Status", "Reuse"].map((heading) => (
              <th key={heading} className="text-left font-normal">
                <Caption>{heading}</Caption>
              </th>
            ))}
            <th className="text-left font-normal">
              <Caption className="flex items-center gap-1.5">
                Updated
                <ArrowDownIcon aria-hidden className="size-[9px] text-gc-ink2" />
              </Caption>
            </th>
          </tr>
        </thead>
        <tbody className="block">
          {items.map((item) => (
            <Row
              key={item.id}
              item={item}
              selected={selected.has(item.id)}
              onToggle={() => onToggle(item.id)}
              now={now}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Row({
  item,
  selected,
  onToggle,
  now,
}: {
  item: ArtifactListItem
  selected: boolean
  onToggle: () => void
  now?: Date
}) {
  const info = typeInfo(item.type)
  const [box, ...rest] = item.locationPath
  const place = rest.at(-1)?.title ?? "Box level"
  return (
    <tr
      className={cn(
        COLUMNS,
        "h-[42px] items-center border-b border-gc-divider px-4",
        selected ? "bg-gc-row-bg" : "hover:bg-gc-raised",
      )}
    >
      <td className="flex">
        <Checkbox checked={selected} onChange={onToggle} label={`Select ${item.title}`} />
      </td>
      <td className="min-w-0">
        <Link
          to="/artifacts/$artifactId"
          params={{ artifactId: item.id }}
          className="flex min-w-0 items-center gap-[7px]"
        >
          <info.icon aria-label={info.label} className={cn("size-[13px] shrink-0", info.ink)} />
          <span
            className={cn(
              "truncate text-[11.5px]",
              selected ? "font-semibold text-gc-text" : "text-gc-ink2 hover:text-gc-text",
            )}
          >
            {item.title}
          </span>
        </Link>
      </td>
      <td className="flex min-w-0 gap-[7px] overflow-hidden">
        {item.tags.slice(0, 3).map((tag) => (
          <TagChip key={tag}>{tag}</TagChip>
        ))}
      </td>
      <td className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate font-mono text-[8px] tracking-[0.5px] text-gc-ink3 uppercase">
          {box?.title}
        </span>
        <span className="truncate text-[10.5px] text-gc-ink2">{place}</span>
      </td>
      <td className="flex gap-[7px] overflow-hidden">
        {item.localeVersions.map((entry) => (
          <LocaleLabel
            key={entry.locale}
            locale={entry.locale}
            version={entry.defaultNumber ?? entry.latestNumber}
            published={entry.defaultNumber !== null || entry.latestNumber !== null}
          />
        ))}
      </td>
      <td>
        <StatusLabel kind={artifactStatusKind(item.status)} />
      </td>
      <td className="font-mono text-[10px] text-gc-text">×{item.reuseCount}</td>
      <td className="font-mono text-[9px] text-gc-ink3">{relativeTime(item.updatedAt, now)}</td>
    </tr>
  )
}

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <span className="relative flex size-3.5">
      <input
        type="checkbox"
        aria-label={label}
        checked={checked}
        onChange={onChange}
        className="peer size-3.5 cursor-pointer appearance-none rounded border border-gc-border checked:border-0 checked:bg-gc-primary focus-visible:ring-2 focus-visible:ring-gc-primary/50"
      />
      <CheckIcon
        aria-hidden
        className="pointer-events-none absolute inset-0 m-auto hidden size-[9px] text-gc-on-solid peer-checked:block"
      />
    </span>
  )
}

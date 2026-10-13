import { cn } from "@/lib/utils"

export type Stat = { label: string; value: string; highlight?: boolean }

/** One bordered bar of label/value cells split by hairlines. */
export function StatStrip({ stats, label }: { stats: Stat[]; label: string }) {
  return (
    <dl
      aria-label={label}
      className="grid grid-cols-2 divide-x divide-y divide-divider rounded-[2px] border border-divider bg-surface sm:flex sm:divide-y-0"
    >
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-1 flex-col gap-0.5 px-3 py-2">
          <dt className="label-ui text-fg-muted">{stat.label}</dt>
          <dd className={cn("font-display text-lg", stat.highlight ? "text-brand" : "text-fg")}>
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { SearchIcon } from "lucide-react"
import { useState } from "react"
import type { ArtifactType } from "@/api/client"
import { useArtifactSearch } from "@/api/queries"
import { typeInfo } from "@/components/artifact-types"
import { PanelHeading } from "@/components/workspace/inspector"
import { type EmbedRef, embedTarget } from "@/lib/embeds"
import { cn } from "@/lib/utils"

const VISIBLE = 6

type Props = {
  excludeId: string
  locale: string
  /** Only these types are offered; all when absent. */
  types?: readonly ArtifactType[]
  onPick: (embed: EmbedRef) => void
}

/** The picker in a modal, for shortcuts and slash commands away from the Insert panel. */
export function EmbedPickerDialog({
  title,
  onClose,
  ...picker
}: Props & { title: string; onClose: () => void }) {
  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-[#06060ACC]" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 flex w-[420px] max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-[10px] border border-gc-border bg-gc-raised p-[18px] outline-none">
          <DialogPrimitive.Title className="text-title font-bold text-gc-text">
            {title}
          </DialogPrimitive.Title>
          <EmbedPicker {...picker} />
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export function EmbedPicker({ excludeId, locale, types, onPick }: Props) {
  const [query, setQuery] = useState("")
  const results = useArtifactSearch({
    query: query || undefined,
    status: "has-published",
    type: types?.length === 1 ? types[0] : undefined,
    // The API filters by one type at most, so a wider filter runs over a larger page.
    limit: types && types.length > 1 ? VISIBLE * 4 : VISIBLE,
  })
  const items = (results.data?.items ?? [])
    .filter((item) => item.id !== excludeId && (!types || types.includes(item.type)))
    .slice(0, VISIBLE)
  return (
    <section className="flex flex-col gap-1.5">
      <PanelHeading label="Embed artifact" right="pins a version" />
      <label className="flex h-[30px] items-center gap-2 rounded-md border border-gc-border bg-gc-sunken px-2.5 focus-within:border-gc-primary">
        <SearchIcon aria-hidden className="size-3 text-gc-ink3" />
        <input
          aria-label="Search published artifacts"
          placeholder="Search published artifacts"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-ui text-gc-text outline-none placeholder:text-gc-ink3"
        />
      </label>
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const target = embedTarget(item, locale)
          const info = typeInfo(item.type)
          if (!target) return null
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() =>
                  onPick({
                    artifactId: item.id,
                    versionId: target.versionId,
                    locale: target.locale,
                    title: item.title,
                    artifactType: item.type,
                    versionNumber: target.versionNumber,
                  })
                }
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-gc-sunken"
              >
                <info.icon className={cn("size-3 shrink-0", info.ink)} />
                <span className="min-w-0 flex-1 truncate text-ui text-gc-ink2">{item.title}</span>
                <span className="font-mono text-label text-gc-ink3 uppercase">
                  {target.locale} v{target.versionNumber}
                </span>
              </button>
            </li>
          )
        })}
        {results.isSuccess && items.length === 0 && (
          <li className="px-2 text-ui text-gc-ink3">No published artifacts match.</li>
        )}
      </ul>
    </section>
  )
}

import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { BookmarkIcon, PlusIcon, SearchIcon, SlidersHorizontalIcon, XIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useArtifactSearch, useLocations, useTags } from "@/api/queries"
import { Caption, FilterTag } from "@/components/labels"
import { FilterPill } from "@/components/search/filter-pill"
import { ResultsTable } from "@/components/search/results-table"
import { ActionButton } from "@/components/shell/form-controls"
import { useStudioDialogs } from "@/components/shell/studio-dialogs"
import { LOCALES } from "@/lib/locales"
import { type LibrarySearch, PAGE_SIZE, parseLibrarySearch, toApiQuery } from "@/lib/search-params"

export const Route = createFileRoute("/")({
  validateSearch: parseLibrarySearch,
  component: ArtifactSearchPage,
})

const VISIBLE_TAGS = 7

function ArtifactSearchPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: "/" })
  const results = useArtifactSearch(toApiQuery(search))
  const locations = useLocations().data ?? []
  const tags = useTags().data ?? []
  const { newArtifact } = useStudioDialogs()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showAllTags, setShowAllTags] = useState(false)

  const update = (patch: Partial<LibrarySearch>) =>
    navigate({ search: (previous) => ({ ...previous, page: undefined, ...patch }) })

  const items = results.data?.items ?? []
  const total = results.data?.total ?? 0
  const page = search.page ?? 1
  const first = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const boxes = locations.filter((location) => location.kind === "box")
  const scoped = locations.find((location) => location.id === search.location)
  const activeTags = new Set(search.tags ?? [])
  const tagNames = tags.map((entry) => entry.tag)
  const shownTags = showAllTags
    ? tagNames
    : [...new Set([...activeTags, ...tagNames])].slice(0, VISIBLE_TAGS)

  const toggleTag = (tag: string) => {
    const next = new Set(activeTags)
    if (next.has(tag)) next.delete(tag)
    else next.add(tag)
    update({ tags: next.size ? [...next] : undefined })
  }

  const toggle = (artifactId: string) =>
    setSelected((previous) => {
      const next = new Set(previous)
      if (next.has(artifactId)) next.delete(artifactId)
      else next.add(artifactId)
      return next
    })

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gc-page">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-gc-border px-4">
        <div className="flex items-center gap-[9px]">
          <h1 className="text-sm font-bold text-gc-text">Artifact search</h1>
          <Caption className="tracking-[0.6px]">
            {total} reusable artifacts · {boxes.length} boxes
          </Caption>
        </div>
        <div className="flex items-center gap-2">
          <ActionButton disabled title="Saved searches arrive later">
            <BookmarkIcon />
            Save search
          </ActionButton>
          <ActionButton variant="primary" onClick={() => newArtifact(search.location)}>
            <PlusIcon />
            New artifact
          </ActionButton>
        </div>
      </header>

      <div className="flex shrink-0 flex-col gap-2.5 border-b border-gc-border px-4 py-3">
        <div className="flex items-center gap-2">
          <SearchBox value={search.q ?? ""} onChange={(q) => update({ q: q || undefined })} />
          <FilterPill
            label="Type"
            value={search.type}
            options={[
              { value: "slide", label: "Slide" },
              { value: "doc", label: "Document" },
              { value: "animation", label: "Animation" },
            ]}
            onChange={(type) => update({ type: type as LibrarySearch["type"] })}
          />
          <FilterPill
            label="Status"
            value={search.status}
            options={[
              { value: "has-published", label: "Published" },
              { value: "draft-only", label: "Draft" },
              { value: "archived-only", label: "Archived" },
            ]}
            onChange={(status) => update({ status: status as LibrarySearch["status"] })}
          />
          <FilterPill
            label="Locale"
            value={search.locale}
            options={LOCALES.map((code) => ({ value: code, label: code.toUpperCase() }))}
            onChange={(locale) => update({ locale })}
          />
          <FilterPill
            label={
              scoped && scoped.kind !== "box"
                ? scoped.kind.replace(/^./, (c) => c.toUpperCase())
                : "Box"
            }
            value={search.location}
            options={[
              ...boxes.map((box) => ({ value: box.id, label: box.title })),
              ...(scoped && scoped.kind !== "box"
                ? [{ value: scoped.id, label: scoped.title }]
                : []),
            ]}
            onChange={(location) => update({ location })}
          />
          <ActionButton className="h-[30px] px-2.5" disabled title="More filters arrive later">
            <SlidersHorizontalIcon />
            More
          </ActionButton>
        </div>
        {tagNames.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Caption className="mr-0.5">Tags · any of</Caption>
            {shownTags.map((tag) => (
              <FilterTag
                key={tag}
                label={tag}
                selected={activeTags.has(tag)}
                onClick={() => toggleTag(tag)}
              />
            ))}
            {tagNames.length > VISIBLE_TAGS && (
              <button
                type="button"
                onClick={() => setShowAllTags(!showAllTags)}
                className="font-mono text-[8.5px] tracking-[0.5px] text-gc-ink3 uppercase hover:text-gc-ink2"
              >
                {showAllTags ? "Fewer" : `+${tagNames.length - VISIBLE_TAGS} more`}
              </button>
            )}
            {activeTags.size > 0 && (
              <button
                type="button"
                onClick={() => update({ tags: undefined })}
                className="ml-1 flex items-center gap-[5px] text-[10.5px] text-gc-ink3 hover:text-gc-ink2"
              >
                <XIcon className="size-2.5" />
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {results.isError ? (
        <p role="alert" className="p-6 text-[11.5px] text-gc-fail-ink">
          Could not load artifacts: {results.error.message}. Is harness-content-api running?
        </p>
      ) : (
        <ResultsTable
          items={items}
          selected={selected}
          onToggle={toggle}
          onToggleAll={() =>
            setSelected(
              items.every((item) => selected.has(item.id))
                ? new Set()
                : new Set(items.map((item) => item.id)),
            )
          }
        />
      )}
      {!results.isError && !results.isPending && items.length === 0 && (
        <p className="px-4 py-6 text-[11.5px] text-gc-ink3">
          No artifacts match. Clear a filter or create one with “New artifact”.
        </p>
      )}

      <footer className="flex h-9 shrink-0 items-center justify-between border-t border-gc-border bg-gc-raised px-4">
        <Caption className="tracking-[0.6px]">
          Showing {first}–{first === 0 ? 0 : first + items.length - 1} of {total}
          {selected.size > 0 && ` · ${selected.size} selected`}
        </Caption>
        <div className="flex items-center gap-2">
          <ActionButton
            className="h-6"
            disabled={page <= 1}
            onClick={() => navigate({ search: (prev) => ({ ...prev, page: page - 1 }) })}
          >
            Previous
          </ActionButton>
          <ActionButton
            className="h-6"
            disabled={page * PAGE_SIZE >= total}
            onClick={() => navigate({ search: (prev) => ({ ...prev, page: page + 1 }) })}
          >
            Next
          </ActionButton>
        </div>
      </footer>
    </div>
  )
}

/** Debounced so typing does not fire a request per keystroke; ⌘K / Ctrl+K focuses it. */
function SearchBox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [draft, setDraft] = useState(value)
  const input = useRef<HTMLInputElement>(null)
  const latest = useRef(onChange)
  latest.current = onChange

  useEffect(() => setDraft(value), [value])
  useEffect(() => {
    if (draft === value) return
    const timer = setTimeout(() => latest.current(draft), 250)
    return () => clearTimeout(timer)
  }, [draft, value])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        input.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <label className="flex h-[30px] min-w-0 flex-1 items-center justify-between gap-2 rounded-md border border-gc-border bg-gc-sunken px-2.5 focus-within:border-gc-primary">
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <SearchIcon aria-hidden className="size-3 shrink-0 text-gc-ink3" />
        <input
          ref={input}
          type="search"
          aria-label="Search artifacts"
          placeholder="Search by name, tag or description"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[11.5px] text-gc-text caret-gc-primary outline-none placeholder:text-gc-ink3"
        />
      </span>
      <kbd className="rounded-[3px] border border-gc-border bg-gc-raised px-[5px] py-0.5 font-mono text-[8.5px] text-gc-ink3">
        ⌘K
      </kbd>
    </label>
  )
}

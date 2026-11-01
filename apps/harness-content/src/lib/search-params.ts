import type { ArtifactType } from "@/api/client"
import type { ArtifactSearchParams } from "@/api/queries"

export const PAGE_SIZE = 25
const TYPES = ["slide", "doc", "animation", "diagram"] as const
const STATUSES = ["has-published", "draft-only", "archived-only"] as const
export type StatusFilter = (typeof STATUSES)[number]

/** The artifact search page's URL state; every field is optional. */
export type LibrarySearch = {
  q?: string
  type?: ArtifactType
  status?: StatusFilter
  locale?: string
  location?: string
  tags?: string[]
  page?: number
}

const text = (value: unknown) => (typeof value === "string" && value ? value : undefined)

function oneOf<T extends string>(options: readonly T[], value: unknown): T | undefined {
  return options.find((option) => option === value)
}

/** Drops unknown or malformed values instead of failing, so stale links still open. */
export function parseLibrarySearch(raw: Record<string, unknown>): LibrarySearch {
  const tags = Array.isArray(raw.tags) ? raw.tags.filter((tag) => typeof tag === "string") : []
  const page = Number(raw.page)
  return {
    q: text(raw.q),
    type: oneOf(TYPES, raw.type),
    status: oneOf(STATUSES, raw.status),
    locale: text(raw.locale),
    location: text(raw.location),
    tags: tags.length ? tags : undefined,
    page: Number.isInteger(page) && page > 1 ? page : undefined,
  }
}

export function toApiQuery(search: LibrarySearch): ArtifactSearchParams {
  return {
    query: search.q,
    type: search.type,
    status: search.status,
    locale: search.locale,
    locationId: search.location,
    tag: search.tags,
    limit: PAGE_SIZE,
    offset: ((search.page ?? 1) - 1) * PAGE_SIZE,
  }
}

import type { ArtifactListItem, Location } from "@/api/client"

export function location(overrides: Partial<Location> & Pick<Location, "id">): Location {
  return {
    kind: "box",
    parentId: null,
    title: overrides.id,
    position: 0,
    isArchived: false,
    createdAt: "2026-10-29-10-00-00",
    updatedAt: "2026-10-29-10-00-00",
    ...overrides,
  }
}

export function artifact(
  overrides: Partial<ArtifactListItem> & Pick<ArtifactListItem, "id">,
): ArtifactListItem {
  return {
    type: "slide",
    title: overrides.id,
    slug: overrides.id,
    description: "",
    locationId: "box",
    tags: [],
    metadata: {},
    instructionalDesign: {},
    resources: [],
    createdBy: "usr_author",
    createdAt: "2026-10-29-10-00-00",
    updatedAt: "2026-10-29-12-00-00",
    status: "draft-only",
    defaults: {},
    locationPath: [{ id: "box", kind: "box", title: "Intro to AI" }],
    localeVersions: [{ locale: "en", latestNumber: null, defaultNumber: null, hasDraft: true }],
    reuseCount: 0,
    ...overrides,
  }
}

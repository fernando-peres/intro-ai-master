import { describe, expect, it } from "vitest"
import type { Schemas } from "@/api/client"
import {
  canEditDraft,
  formatDuration,
  nextReviewAction,
  parseDuration,
  pickVersion,
  scriptStats,
} from "@/lib/workflow"

type VersionSummary = Schemas["VersionSummary"]
type Review = Schemas["ReviewListItem"]

function version(overrides: Partial<VersionSummary>): VersionSummary {
  return {
    id: "rav_1",
    artifactId: "ra_1",
    locale: "en",
    versionNumber: null,
    state: "draft",
    isActive: false,
    isDefault: false,
    parentVersionId: null,
    sourceVersionId: null,
    changeComment: null,
    revision: 1,
    createdBy: "usr_author",
    createdAt: "2026-10-29-10-00-00",
    updatedAt: "2026-10-29-10-00-00",
    publishedAt: null,
    publishedBy: null,
    ...overrides,
  }
}

function review(overrides: Partial<Review>): Review {
  return {
    id: "rev_1",
    versionId: "rav_1",
    submittedBy: "usr_author",
    reviewerId: null,
    status: "pending",
    contentHash: "h",
    submitComment: "",
    decisionComment: null,
    decidedBy: null,
    createdAt: "2026-10-29-10-00-00",
    decidedAt: null,
    artifactId: "ra_1",
    artifactTitle: "Harness scoring",
    artifactType: "slide",
    locale: "en",
    ...overrides,
  }
}

const author = { id: "usr_author", name: "Author", role: "author" } as const
const reviewer = { id: "usr_reviewer", name: "Reviewer", role: "reviewer" } as const
const admin = { id: "usr_admin", name: "Admin", role: "admin" } as const
const viewer = { id: "usr_viewer", name: "Viewer", role: "viewer" } as const

describe("pickVersion", () => {
  const published = version({
    id: "v1",
    state: "published",
    versionNumber: 1,
    isDefault: true,
    updatedAt: "2026-10-29-09-00-00",
  })
  const draft = version({ id: "v2", updatedAt: "2026-10-29-11-00-00" })

  it("honours the requested id, then prefers the newest draft, then the default", () => {
    expect(pickVersion([published, draft], "v1")?.id).toBe("v1")
    expect(pickVersion([published, draft], "missing")?.id).toBe("v2")
    expect(pickVersion([published], undefined)?.id).toBe("v1")
    expect(pickVersion([], undefined)).toBeUndefined()
  })
})

describe("nextReviewAction", () => {
  const draft = version({})

  it("lets editors submit a fresh or changes-requested draft", () => {
    expect(nextReviewAction(draft, undefined, author)).toEqual({ kind: "submit", resubmit: false })
    expect(nextReviewAction(draft, review({ status: "changes_requested" }), author)).toEqual({
      kind: "submit",
      resubmit: true,
    })
  })

  it("lets another reviewer decide a pending review, never the submitter", () => {
    const pending = review({})
    expect(nextReviewAction(draft, pending, reviewer).kind).toBe("decide")
    expect(nextReviewAction(draft, pending, author)).toMatchObject({ kind: "awaiting" })
    const own = review({ submittedBy: "usr_reviewer" })
    expect(nextReviewAction(draft, own, reviewer)).toMatchObject({ kind: "awaiting" })
    expect(nextReviewAction(draft, own, admin).kind).toBe("decide")
    const assigned = review({ reviewerId: "usr_reviewer2" })
    expect(nextReviewAction(draft, assigned, reviewer)).toMatchObject({ kind: "awaiting" })
  })

  it("offers publish to publishers once approved", () => {
    const approved = review({ status: "approved" })
    expect(nextReviewAction(draft, approved, reviewer).kind).toBe("publish")
    expect(nextReviewAction(draft, approved, author)).toMatchObject({ kind: "awaiting" })
  })

  it("offers a new draft from published versions, nothing to viewers", () => {
    expect(nextReviewAction(version({ state: "published" }), undefined, author).kind).toBe("edit")
    expect(nextReviewAction(draft, undefined, viewer).kind).toBe("none")
    expect(nextReviewAction(version({ state: "archived" }), undefined, admin).kind).toBe("none")
  })
})

describe("canEditDraft", () => {
  it("allows owners and publishers on drafts only", () => {
    expect(canEditDraft(version({}), author)).toBe(true)
    expect(canEditDraft(version({ createdBy: "usr_other" }), author)).toBe(false)
    expect(canEditDraft(version({ createdBy: "usr_other" }), reviewer)).toBe(true)
    expect(canEditDraft(version({ state: "published" }), admin)).toBe(false)
    expect(canEditDraft(version({}), viewer)).toBe(false)
  })
})

describe("script timing", () => {
  it("counts spoken words, ignoring [[cues]]", () => {
    expect(scriptStats("First we replay that trace. [[pause 0.4s]] Then the rubric.")).toEqual({
      words: 8,
      seconds: 4,
    })
    expect(scriptStats("   ")).toEqual({ words: 0, seconds: 0 })
  })

  it("formats and parses mm:ss", () => {
    expect(formatDuration(42)).toBe("00:42")
    expect(formatDuration(125)).toBe("02:05")
    expect(parseDuration("00:45")).toBe(45)
    expect(parseDuration("2:05")).toBe(125)
    expect(parseDuration("45")).toBe(45)
    expect(parseDuration("soon")).toBeNull()
  })
})

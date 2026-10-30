import type { Schemas } from "@/api/client"

type VersionSummary = Schemas["VersionSummary"]
type Review = Schemas["ReviewListItem"]
type User = Schemas["UserOut"]

/**
 * The version a workspace opens: the requested id if it exists, else the newest draft,
 * else the default published version of the first locale, else the newest version.
 */
export function pickVersion(
  versions: VersionSummary[],
  requested: string | undefined,
): VersionSummary | undefined {
  const byNewest = [...versions].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  return (
    versions.find((version) => version.id === requested) ??
    byNewest.find((version) => version.state === "draft") ??
    versions.find((version) => version.isDefault) ??
    byNewest[0]
  )
}

export type ReviewAction =
  | { kind: "submit"; resubmit: boolean }
  | { kind: "awaiting"; reason: string }
  | { kind: "decide"; review: Review }
  | { kind: "publish"; review: Review }
  | { kind: "edit" }
  | { kind: "none" }

const PUBLISHERS = new Set(["admin", "reviewer"])

/** The one review/publication step `user` can take next on `version` (PRD §6.1). */
export function nextReviewAction(
  version: VersionSummary,
  latestReview: Review | undefined,
  user: User | undefined,
): ReviewAction {
  if (!user || user.role === "viewer") return { kind: "none" }
  if (version.state === "published") return { kind: "edit" }
  if (version.state === "archived") return { kind: "none" }
  const publisher = PUBLISHERS.has(user.role)
  const admin = user.role === "admin"
  if (latestReview?.status === "pending") {
    const own = latestReview.submittedBy === user.id
    const assignedElsewhere =
      latestReview.reviewerId !== null && latestReview.reviewerId !== user.id
    if (publisher && (admin || (!own && !assignedElsewhere))) {
      return { kind: "decide", review: latestReview }
    }
    return { kind: "awaiting", reason: own ? "Waiting for a reviewer" : "In review" }
  }
  if (latestReview?.status === "approved") {
    if (publisher) return { kind: "publish", review: latestReview }
    return { kind: "awaiting", reason: "Approved · waiting to publish" }
  }
  return { kind: "submit", resubmit: latestReview?.status === "changes_requested" }
}

/** Whether `user` may change this version's content (drafts only; authors their own). */
export function canEditDraft(version: VersionSummary, user: User | undefined): boolean {
  if (!user || version.state !== "draft" || user.role === "viewer") return false
  return user.role !== "author" || version.createdBy === user.id
}

/** Speaking rate used for script durations, in words per minute. */
export const WORDS_PER_MINUTE = 125

export function scriptStats(script: string): { words: number; seconds: number } {
  const spoken = script.replace(/\[\[[^\]]*\]\]/g, " ")
  const words = spoken.split(/\s+/).filter(Boolean).length
  return { words, seconds: Math.round((words / WORDS_PER_MINUTE) * 60) }
}

/** 42 → "00:42", 125 → "02:05". */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
}

/** "00:45" or "45" → 45; `null` when unreadable. */
export function parseDuration(text: string): number | null {
  const match = /^(?:(\d+):)?(\d{1,2})$/.exec(text.trim())
  if (!match) return null
  return Number(match[1] ?? 0) * 60 + Number(match[2])
}

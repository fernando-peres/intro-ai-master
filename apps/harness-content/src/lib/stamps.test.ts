import { describe, expect, it } from "vitest"
import { parseStamp, relativeTime } from "@/lib/stamps"

const NOW = new Date(Date.UTC(2026, 9, 29, 14, 22, 0))

describe("parseStamp", () => {
  it("reads the API's UTC stamp", () => {
    expect(parseStamp("2026-10-29-07-04-09")?.toISOString()).toBe("2026-10-29T07:04:09.000Z")
  })

  it("rejects other spellings", () => {
    expect(parseStamp("2026-10-29T07:04:09Z")).toBeNull()
  })
})

describe("relativeTime", () => {
  it.each([
    ["2026-10-29-14-21-40", "just now"],
    ["2026-10-29-14-10-00", "12m ago"],
    ["2026-10-29-12-00-00", "2h ago"],
    ["2026-10-28-23-59-00", "Yesterday"],
    ["2026-10-24-09-00-00", "Oct 24"],
  ])("%s → %s", (stamp, expected) => {
    expect(relativeTime(stamp, NOW)).toBe(expected)
  })
})

import { describe, expect, it } from "vitest"
import { ApiError } from "@/api/client"
import { friendlyError } from "@/lib/errors"

describe("friendlyError", () => {
  it("keeps the API's explanation for a rejected request", () => {
    expect(friendlyError(new ApiError(422, "invalid", "Title is required", {}))).toBe(
      "Title is required",
    )
  })

  it.each([
    [new ApiError(404, undefined, "Not Found", {}), "no longer exists"],
    [new ApiError(403, undefined, "Forbidden", {}), "permission"],
    [new ApiError(500, undefined, "Internal Server Error", {}), "server ran into a problem"],
    [new TypeError("Failed to fetch"), "Can't reach the server"],
    [new Error("x is not a function"), "Something went wrong"],
  ])("does not expose raw messages: %s", (error, expected) => {
    expect(friendlyError(error)).toContain(expected)
  })
})

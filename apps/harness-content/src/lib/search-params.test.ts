import { describe, expect, it } from "vitest"
import { PAGE_SIZE, parseLibrarySearch, toApiQuery } from "@/lib/search-params"

describe("parseLibrarySearch", () => {
  it("keeps valid values", () => {
    expect(
      parseLibrarySearch({
        q: "eval",
        type: "doc",
        status: "draft-only",
        locale: "en",
        location: "loc_1",
        tags: ["eval", "core"],
        page: 3,
      }),
    ).toEqual({
      q: "eval",
      type: "doc",
      status: "draft-only",
      locale: "en",
      location: "loc_1",
      tags: ["eval", "core"],
      page: 3,
    })
  })

  it("drops unknown or malformed values", () => {
    expect(
      parseLibrarySearch({ q: "", type: "video", status: "live", tags: [1, "ok"], page: "x" }),
    ).toEqual({
      q: undefined,
      type: undefined,
      status: undefined,
      locale: undefined,
      location: undefined,
      tags: ["ok"],
      page: undefined,
    })
  })
})

describe("toApiQuery", () => {
  it("maps URL state to API parameters with paging", () => {
    expect(toApiQuery({ q: "harness", location: "loc_1", tags: ["eval"], page: 2 })).toEqual({
      query: "harness",
      type: undefined,
      status: undefined,
      locale: undefined,
      locationId: "loc_1",
      tag: ["eval"],
      limit: PAGE_SIZE,
      offset: PAGE_SIZE,
    })
  })
})

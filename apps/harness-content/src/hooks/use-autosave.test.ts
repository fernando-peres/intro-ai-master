import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ApiError } from "@/api/client"
import { useAutosave } from "@/hooks/use-autosave"

type Props = { value: { text: string }; etag: string | undefined; enabled: boolean }

function setup(save: (value: { text: string }, etag: string) => Promise<string>) {
  return renderHook((props: Props) => useAutosave({ ...props, save, delayMs: 500 }), {
    initialProps: { value: { text: "a" }, etag: '"1"', enabled: true },
  })
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe("useAutosave", () => {
  it("debounces, sends If-Match, and adopts the new ETag", async () => {
    const save = vi.fn(async (_value, etag: string) => `"${Number(etag.slice(1, -1)) + 1}"`)
    const { result, rerender } = setup(save)
    expect(result.current.status).toBe("idle")

    rerender({ value: { text: "ab" }, etag: '"1"', enabled: true })
    rerender({ value: { text: "abc" }, etag: '"1"', enabled: true })
    expect(result.current.status).toBe("dirty")
    await act(() => vi.advanceTimersByTimeAsync(500))
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenLastCalledWith({ text: "abc" }, '"1"')
    expect(result.current.status).toBe("saved")

    rerender({ value: { text: "abcd" }, etag: '"1"', enabled: true })
    await act(() => vi.advanceTimersByTimeAsync(500))
    expect(save).toHaveBeenLastCalledWith({ text: "abcd" }, '"2"')
  })

  it("does nothing while disabled or unchanged", async () => {
    const save = vi.fn(async () => '"2"')
    const { rerender } = setup(save)
    await act(() => vi.advanceTimersByTimeAsync(1000))
    rerender({ value: { text: "b" }, etag: '"1"', enabled: false })
    await act(() => vi.advanceTimersByTimeAsync(1000))
    expect(save).not.toHaveBeenCalled()
  })

  it("flush saves immediately", async () => {
    const save = vi.fn(async () => '"2"')
    const { result, rerender } = setup(save)
    rerender({ value: { text: "now" }, etag: '"1"', enabled: true })
    await act(() => result.current.flush())
    expect(save).toHaveBeenCalledWith({ text: "now" }, '"1"')
    expect(result.current.savedAt).not.toBeNull()
  })

  it("stops on a 412 conflict until a new ETag arrives", async () => {
    const save = vi
      .fn()
      .mockRejectedValueOnce(new ApiError(412, "revision_mismatch", "Draft is at revision 3", {}))
      .mockResolvedValue('"4"')
    const { result, rerender } = setup(save)
    rerender({ value: { text: "mine" }, etag: '"1"', enabled: true })
    await act(() => vi.advanceTimersByTimeAsync(500))
    expect(result.current.status).toBe("conflict")

    rerender({ value: { text: "mine again" }, etag: '"1"', enabled: true })
    await act(() => vi.advanceTimersByTimeAsync(1000))
    expect(save).toHaveBeenCalledTimes(1)

    rerender({ value: { text: "reloaded" }, etag: '"3"', enabled: true })
    expect(result.current.status).toBe("idle")
    rerender({ value: { text: "reloaded + edit" }, etag: '"3"', enabled: true })
    await act(() => vi.advanceTimersByTimeAsync(500))
    expect(save).toHaveBeenLastCalledWith({ text: "reloaded + edit" }, '"3"')
  })

  it("reports other failures as errors and retries on the next change", async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue('"2"')
    const { result, rerender } = setup(save)
    rerender({ value: { text: "x" }, etag: '"1"', enabled: true })
    await act(() => vi.advanceTimersByTimeAsync(500))
    expect(result.current).toMatchObject({ status: "error", error: "offline" })
    rerender({ value: { text: "xy" }, etag: '"1"', enabled: true })
    await act(() => vi.advanceTimersByTimeAsync(500))
    expect(result.current.status).toBe("saved")
  })
})

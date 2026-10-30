import { useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { getDevUser, setDevUser } from "@/api/client"
import { useUsers } from "@/api/queries"
import { useSlotTargets } from "@/components/shell/top-bar-slots"
import { useStudioTheme } from "@/lib/studio-theme"
import { cn } from "@/lib/utils"

export const STUDIO_VERSION = "v0.1"

export function TopBar() {
  const { theme } = useStudioTheme()
  const slots = useSlotTargets()
  const users = useUsers().data ?? []
  const queryClient = useQueryClient()
  const [user, setUser] = useState(getDevUser)
  const dark = theme !== "graphite-light"

  const switchUser = (userId: string) => {
    setDevUser(userId)
    setUser(userId)
    queryClient.resetQueries()
  }

  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between gap-4 border-b border-gc-border px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-[22px] items-center justify-center rounded-md bg-gc-text">
            <span className="size-2 rounded-[2px] bg-gc-page" />
          </span>
          <span className="text-[13px] font-bold text-gc-text">Harness</span>
          <span className="rounded border border-gc-border bg-gc-sunken px-1.5 py-0.5 font-mono text-[9.5px] text-gc-ink3">
            {STUDIO_VERSION}
          </span>
        </Link>
        <div ref={slots.start} className="flex min-w-0 items-center gap-2.5" />
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <div ref={slots.end} className="flex items-center gap-2" />
        <label className="flex items-center gap-2 font-mono text-[9.5px] tracking-[0.6px] text-gc-ink3">
          DEV USER
          <select
            value={user}
            onChange={(event) => switchUser(event.target.value)}
            className="h-6 rounded border border-gc-border bg-gc-sunken px-1.5 font-sans text-[11px] tracking-normal text-gc-ink2"
          >
            {users.length === 0 && <option value={user}>{user}</option>}
            {users.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} · {option.role}
              </option>
            ))}
          </select>
        </label>
        <span className="flex items-center gap-[7px] font-mono text-[9.5px] tracking-[0.6px] text-gc-ink3">
          <span
            aria-hidden
            className={cn(
              "size-1.5 rounded-full",
              users.length ? "bg-gc-pass-base" : "bg-gc-fail-base",
            )}
          />
          {dark ? "DARK" : "LIGHT"}
        </span>
      </div>
    </header>
  )
}

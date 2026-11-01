import { useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { MenuIcon } from "lucide-react"
import { useState } from "react"
import { getDevUser, setDevUser } from "@/api/client"
import { useUsers } from "@/api/queries"
import { useSlotTargets } from "@/components/shell/top-bar-slots"

export const STUDIO_VERSION = "v0.1"

/** `onMenu` is set while the sidebar is a drawer. */
export function TopBar({ onMenu }: { onMenu?: () => void }) {
  const slots = useSlotTargets()
  const users = useUsers()
  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between gap-4 border-b border-gc-border px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {onMenu && (
          <button
            type="button"
            aria-label="Open navigation"
            onClick={onMenu}
            className="flex size-7 shrink-0 items-center justify-center rounded-md border border-gc-border bg-gc-sunken text-gc-ink2 hover:text-gc-text"
          >
            <MenuIcon aria-hidden className="size-3.5" />
          </button>
        )}
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="flex size-[22px] items-center justify-center rounded-md bg-gc-text">
            <span className="size-2 rounded-[2px] bg-gc-page" />
          </span>
          <span className="text-body font-bold text-gc-text max-xl:sr-only">Harness</span>
          <span className="rounded border border-gc-border bg-gc-sunken px-1.5 py-0.5 font-mono text-label text-gc-ink3 max-xl:hidden">
            {STUDIO_VERSION}
          </span>
        </Link>
        <div ref={slots.start} className="flex min-w-0 flex-1 items-center gap-2.5" />
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <div ref={slots.end} className="flex items-center gap-2" />
        {users.isError && !users.data && (
          <span role="alert" className="text-ui text-gc-fail-ink">
            Can't reach the server
          </span>
        )}
        {import.meta.env.DEV && <DevUserPicker />}
      </div>
    </header>
  )
}

function DevUserPicker() {
  const users = useUsers().data ?? []
  const queryClient = useQueryClient()
  const [user, setUser] = useState(getDevUser)
  const switchUser = (userId: string) => {
    setDevUser(userId)
    setUser(userId)
    queryClient.resetQueries()
  }
  return (
    <select
      aria-label="Dev user"
      title="Dev user (development builds only)"
      value={user}
      onChange={(event) => switchUser(event.target.value)}
      className="h-6 max-w-32 rounded border border-gc-border bg-gc-sunken px-1.5 text-ui text-gc-ink2"
    >
      {users.length === 0 && <option value={user}>{user}</option>}
      {users.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name} · {option.role}
        </option>
      ))}
    </select>
  )
}

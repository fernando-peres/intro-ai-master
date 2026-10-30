const STAMP = /^(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})$/

/** Parses the API's UTC `YYYY-MM-DD-HH-mm-ss` stamp; `null` for anything else. */
export function parseStamp(stamp: string): Date | null {
  const match = STAMP.exec(stamp)
  if (!match) return null
  const [year, month, day, hour, minute, second] = match.slice(1).map(Number)
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second))
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** "just now", "5m ago", "2h ago", "Yesterday", then "Oct 24" (UTC calendar days). */
export function relativeTime(stamp: string, now: Date = new Date()): string {
  const then = parseStamp(stamp)
  if (!then) return stamp
  const minutes = Math.floor((now.getTime() - then.getTime()) / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const dayStart = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  const days = Math.round((dayStart(now) - dayStart(then)) / 86_400_000)
  if (days === 0) return `${Math.floor(minutes / 60)}h ago`
  if (days === 1) return "Yesterday"
  return `${MONTHS[then.getUTCMonth()]} ${then.getUTCDate()}`
}

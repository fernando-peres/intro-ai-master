import { ApiError } from "@/api/client"

/** What went wrong and what to do next, in words a user can act on. */
export function friendlyError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return "You don't have permission to do this."
    if (error.status === 404) return "This item no longer exists. It may have been deleted."
    if (error.status < 500) return error.message
    return "The server ran into a problem. Try again in a moment."
  }
  if (error instanceof TypeError) return "Can't reach the server. Check your connection and retry."
  return "Something went wrong. Try again in a moment."
}

import createClient from "openapi-fetch"
import type { components, paths } from "./schema"

export type Schemas = components["schemas"]
export type ArtifactType = Schemas["ArtifactType"]
export type ArtifactListItem = Schemas["ArtifactListItem"]
export type Location = Schemas["LocationOut"]

const DEV_USER_KEY = "harness.devUser"
export const DEFAULT_DEV_USER = "usr_author"

/** The dev user sent as `X-User-Id` (see harness-content-api's README); kept per browser. */
export function getDevUser(): string {
  try {
    return localStorage.getItem(DEV_USER_KEY) ?? DEFAULT_DEV_USER
  } catch {
    return DEFAULT_DEV_USER
  }
}

export function setDevUser(userId: string): void {
  try {
    localStorage.setItem(DEV_USER_KEY, userId)
  } catch {
    // Storage blocked: the choice lasts until reload.
  }
}

export const api = createClient<paths>({ baseUrl: "" })
api.use({
  onRequest({ request }) {
    request.headers.set("X-User-Id", getDevUser())
    return request
  },
})

/** A non-2xx response; `code` is the API's machine-readable error code when it sent one. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    message: string,
    readonly body: unknown,
  ) {
    super(message)
  }
}

type Result<T> = { data?: T; error?: unknown; response: Response }

export async function unwrap<T>(request: Promise<Result<T>>): Promise<T> {
  const { data, error, response } = await request
  if (!response.ok || data === undefined) {
    const body = (error ?? {}) as { detail?: unknown; code?: string }
    const message = typeof body.detail === "string" ? body.detail : response.statusText
    throw new ApiError(response.status, body.code, message, error)
  }
  return data
}

import type { ArtifactType } from "@/api/client"

const TYPES: ArtifactType[] = ["slide", "doc", "animation"]

export type ImportIssue = { path: string; message: string }

export type ReadImport =
  | { ok: true; type: ArtifactType; content: Record<string, unknown>; title?: string }
  | { ok: false; issues: ImportIssue[] }

/**
 * Reads pasted or uploaded JSON: bare content (`{schemaVersion, type, ...}`) or a version
 * envelope (`{title?, content: {...}}`, PRD §7.1). Only syntax and the type are checked here;
 * the API validates components and fields against the registry.
 */
export function readImport(text: string): ReadImport {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (error) {
    return { ok: false, issues: [{ path: "(json)", message: (error as Error).message }] }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, issues: [{ path: "(root)", message: "Expected a JSON object" }] }
  }
  const record = parsed as Record<string, unknown>
  const wrapped = !("schemaVersion" in record) && typeof record.content === "object"
  const content = (wrapped ? record.content : record) as Record<string, unknown> | null
  if (!content || Array.isArray(content)) {
    return { ok: false, issues: [{ path: "content", message: "Expected a JSON object" }] }
  }
  const type = content.type
  if (!TYPES.includes(type as ArtifactType)) {
    return {
      ok: false,
      issues: [
        {
          path: "type",
          message: `Expected one of ${TYPES.join(", ")}, got ${JSON.stringify(type)}`,
        },
      ],
    }
  }
  const title = wrapped && typeof record.title === "string" ? record.title : undefined
  return { ok: true, type: type as ArtifactType, content, title }
}

/** The `issues` list of an API 422, or the error's message as a single issue. */
export function issuesOf(error: unknown): ImportIssue[] {
  const body = (error as { body?: { issues?: ImportIssue[] } } | null)?.body
  if (body?.issues?.length) return body.issues
  return [{ path: "", message: error instanceof Error ? error.message : String(error) }]
}

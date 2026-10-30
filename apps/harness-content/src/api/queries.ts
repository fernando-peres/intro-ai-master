import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, type Schemas, unwrap } from "./client"
import type { paths } from "./schema"

export type ArtifactSearchParams = NonNullable<
  paths["/api/v1/artifacts"]["get"]["parameters"]["query"]
>

export const keys = {
  locations: ["locations"] as const,
  artifacts: ["artifacts"] as const,
  search: (params: ArtifactSearchParams) => ["artifacts", "search", params] as const,
  artifact: (id: string) => ["artifacts", id] as const,
  versions: (id: string) => ["versions", "of", id] as const,
  tags: ["tags"] as const,
  flows: ["flows"] as const,
  users: ["users"] as const,
  me: ["me"] as const,
}

export function useLocations() {
  return useQuery({
    queryKey: keys.locations,
    queryFn: () => unwrap(api.GET("/api/v1/locations")),
  })
}

export function useArtifactSearch(params: ArtifactSearchParams) {
  return useQuery({
    queryKey: keys.search(params),
    queryFn: () => unwrap(api.GET("/api/v1/artifacts", { params: { query: params } })),
    placeholderData: keepPreviousData,
  })
}

export function useArtifact(artifactId: string) {
  return useQuery({
    queryKey: keys.artifact(artifactId),
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/artifacts/{artifact_id}", {
          params: { path: { artifact_id: artifactId } },
        }),
      ),
  })
}

export function useArtifactVersions(artifactId: string) {
  return useQuery({
    queryKey: keys.versions(artifactId),
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/artifacts/{artifact_id}/versions", {
          params: { path: { artifact_id: artifactId } },
        }),
      ),
  })
}

export function useTags() {
  return useQuery({ queryKey: keys.tags, queryFn: () => unwrap(api.GET("/api/v1/tags")) })
}

export function useFlows() {
  return useQuery({ queryKey: keys.flows, queryFn: () => unwrap(api.GET("/api/v1/flows")) })
}

export function useUsers() {
  return useQuery({ queryKey: keys.users, queryFn: () => unwrap(api.GET("/api/v1/users")) })
}

export function useCreateLocation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: Schemas["LocationCreate"]) =>
      unwrap(api.POST("/api/v1/locations", { body })),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.locations }),
  })
}

export function useCreateArtifact() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: Schemas["ArtifactCreate"]) =>
      unwrap(api.POST("/api/v1/artifacts", { body })),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: keys.artifacts })
      client.invalidateQueries({ queryKey: keys.tags })
    },
  })
}

export type Version = Schemas["VersionOut"]
export type VersionWithEtag = { version: Version; etag: string }

const versionKey = (versionId: string) => ["versions", versionId] as const

/** A version plus the ETag that draft saves must send back as If-Match. */
export function useVersion(versionId: string | undefined) {
  return useQuery({
    queryKey: versionKey(versionId ?? ""),
    enabled: Boolean(versionId),
    queryFn: async (): Promise<VersionWithEtag> => {
      const request = api.GET("/api/v1/artifact-versions/{version_id}", {
        params: { path: { version_id: versionId as string } },
      })
      const { response } = await request
      const version = await unwrap(request)
      return { version, etag: response.headers.get("ETag") ?? "" }
    },
  })
}

/** PATCHes a draft; resolves to the new ETag. Does not invalidate, so typing stays local. */
export async function saveDraft(
  versionId: string,
  etag: string,
  body: Schemas["VersionUpdate"],
): Promise<string> {
  const request = api.PATCH("/api/v1/artifact-versions/{version_id}", {
    params: { path: { version_id: versionId }, header: { "if-match": etag } },
    body,
  })
  const { response } = await request
  await unwrap(request)
  return response.headers.get("ETag") ?? etag
}

export function useReviews(params: { versionId?: string; status?: Schemas["ReviewStatus"] }) {
  return useQuery({
    queryKey: ["reviews", params],
    queryFn: () => unwrap(api.GET("/api/v1/reviews", { params: { query: params } })),
  })
}

export function useFlow(flowId: string | undefined) {
  return useQuery({
    queryKey: ["flows", flowId],
    enabled: Boolean(flowId),
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/flows/{flow_id}", { params: { path: { flow_id: flowId as string } } }),
      ),
  })
}

/** After any review or publication step, refetch everything that shows version state. */
function useRefreshVersions() {
  const client = useQueryClient()
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: ["versions"] }),
      client.invalidateQueries({ queryKey: ["reviews"] }),
      client.invalidateQueries({ queryKey: keys.artifacts }),
    ])
}

export function useUpdateArtifact(artifactId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: Schemas["ArtifactUpdate"]) =>
      unwrap(
        api.PATCH("/api/v1/artifacts/{artifact_id}", {
          params: { path: { artifact_id: artifactId } },
          body,
        }),
      ),
    onSuccess: (artifact) => {
      client.setQueryData(keys.artifact(artifactId), artifact)
      client.invalidateQueries({ queryKey: ["artifacts", "search"] })
      client.invalidateQueries({ queryKey: keys.tags })
    },
  })
}

export function useSubmitReview() {
  const refresh = useRefreshVersions()
  return useMutation({
    mutationFn: ({ versionId, comment }: { versionId: string; comment: string }) =>
      unwrap(
        api.POST("/api/v1/artifact-versions/{version_id}/submit-review", {
          params: { path: { version_id: versionId } },
          body: { comment },
        }),
      ),
    onSuccess: refresh,
  })
}

export function useDecideReview() {
  const refresh = useRefreshVersions()
  return useMutation({
    mutationFn: ({
      reviewId,
      decision,
      comment,
    }: {
      reviewId: string
      decision: "approve" | "request-changes"
      comment: string
    }) => {
      const options = { params: { path: { review_id: reviewId } }, body: { comment } }
      return unwrap(
        decision === "approve"
          ? api.POST("/api/v1/reviews/{review_id}/approve", options)
          : api.POST("/api/v1/reviews/{review_id}/request-changes", options),
      )
    },
    onSuccess: refresh,
  })
}

export function usePublish() {
  const refresh = useRefreshVersions()
  return useMutation({
    mutationFn: ({
      versionId,
      changeComment,
      makeDefault,
    }: {
      versionId: string
      changeComment: string
      makeDefault: boolean
    }) =>
      unwrap(
        api.POST("/api/v1/artifact-versions/{version_id}/publish", {
          params: { path: { version_id: versionId } },
          body: { changeComment, makeDefault },
        }),
      ),
    onSuccess: refresh,
  })
}

export function useForkDraft(artifactId: string) {
  const refresh = useRefreshVersions()
  return useMutation({
    mutationFn: (fromVersionId: string) =>
      unwrap(
        api.POST("/api/v1/artifacts/{artifact_id}/drafts", {
          params: { path: { artifact_id: artifactId }, query: { fromVersionId } },
        }),
      ),
    onSuccess: refresh,
  })
}

export function useMe() {
  return useQuery({ queryKey: keys.me, queryFn: () => unwrap(api.GET("/api/v1/me")) })
}

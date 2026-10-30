import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, type Schemas, unwrap } from "./client"
import { keys } from "./queries"

export type Revision = Schemas["RevisionOut"]
export type RevisionWithEtag = { revision: Revision; etag: string }

const draftKey = (flowId: string) => ["flows", flowId, "draft"] as const

async function withEtag(
  request: Promise<{ data?: Revision; error?: unknown; response: Response }>,
): Promise<RevisionWithEtag> {
  const { response } = await request
  const revision = await unwrap(request)
  return { revision, etag: response.headers.get("ETag") ?? "" }
}

/** The flow's draft, created from the latest published revision when there is none. */
export function useFlowDraft(flowId: string, enabled: boolean) {
  return useQuery({
    queryKey: draftKey(flowId),
    enabled,
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: () =>
      withEtag(
        api.POST("/api/v1/flows/{flow_id}/draft", { params: { path: { flow_id: flowId } } }),
      ),
  })
}

/** Replaces the draft's steps and outline; resolves to the new ETag. */
export async function saveFlowSteps(
  flowId: string,
  etag: string,
  body: Schemas["DraftSteps"],
): Promise<string> {
  const saved = await withEtag(
    api.PATCH("/api/v1/flows/{flow_id}/draft", {
      params: { path: { flow_id: flowId }, header: { "if-match": etag } },
      body,
    }),
  )
  return saved.etag
}

export function useCreateFlow() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: Schemas["FlowCreate"]) => unwrap(api.POST("/api/v1/flows", { body })),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.flows }),
  })
}

export function useUpdateFlow(flowId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: Schemas["FlowUpdate"]) =>
      unwrap(api.PATCH("/api/v1/flows/{flow_id}", { params: { path: { flow_id: flowId } }, body })),
    onSuccess: (flow) => {
      client.setQueryData(["flows", flowId], flow)
      client.invalidateQueries({ queryKey: keys.flows, exact: true })
    },
  })
}

export function useBehind(flowId: string, revisionId: string | undefined) {
  return useQuery({
    queryKey: ["flows", flowId, "behind", revisionId],
    enabled: Boolean(revisionId),
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/flows/{flow_id}/behind", {
          params: { path: { flow_id: flowId }, query: { revisionId } },
        }),
      ),
  })
}

export function useRevisions(flowId: string) {
  return useQuery({
    queryKey: ["flows", flowId, "revisions"],
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/flows/{flow_id}/revisions", { params: { path: { flow_id: flowId } } }),
      ),
  })
}

export function useCurrentDefaults(flowId: string) {
  return useMutation({
    mutationFn: (etag: string) =>
      withEtag(
        api.POST("/api/v1/flows/{flow_id}/draft/use-current-defaults", {
          params: { path: { flow_id: flowId }, header: { "if-match": etag } },
        }),
      ),
  })
}

export function usePublishFlow(flowId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (changeComment: string) =>
      unwrap(
        api.POST("/api/v1/flows/{flow_id}/publish", {
          params: { path: { flow_id: flowId } },
          body: { changeComment },
        }),
      ),
    onSuccess: () => client.invalidateQueries({ queryKey: ["flows"] }),
  })
}

export function usePlayback(flowId: string, revisionId: string) {
  return useQuery({
    queryKey: ["flows", flowId, "play", revisionId],
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/flows/{flow_id}/revisions/{revision_id}/play", {
          params: { path: { flow_id: flowId, revision_id: revisionId } },
        }),
      ),
  })
}

export function useRevision(flowId: string, revisionId: string | null | undefined) {
  return useQuery({
    queryKey: ["flows", flowId, "revisions", revisionId],
    enabled: Boolean(revisionId),
    queryFn: () =>
      withEtag(
        api.GET("/api/v1/flows/{flow_id}/revisions/{revision_id}", {
          params: { path: { flow_id: flowId, revision_id: revisionId as string } },
        }),
      ),
  })
}

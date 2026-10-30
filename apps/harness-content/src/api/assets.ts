import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { api, unwrap } from "./client"

const assetKeys = {
  list: (artifactId: string) => ["assets", "of", artifactId] as const,
  content: (assetId: string, revision: number) => ["assets", assetId, revision] as const,
}
const etag = (revision: number) => `"${revision}"`

export function useAssets(artifactId: string) {
  return useQuery({
    queryKey: assetKeys.list(artifactId),
    queryFn: () =>
      unwrap(
        api.GET("/api/v1/artifacts/{artifact_id}/assets", {
          params: { path: { artifact_id: artifactId } },
        }),
      ),
  })
}

async function fetchContent(assetId: string, parseAs: "text" | "blob") {
  const { data, error, response } = await api.GET("/api/v1/assets/{asset_id}/content", {
    params: { path: { asset_id: assetId } },
    parseAs,
  })
  // openapi-fetch gives no `data` for an empty body, which is a valid (new) note.
  if (response.ok && data === undefined) return parseAs === "text" ? "" : new Blob()
  return unwrap(Promise.resolve({ data: data as unknown, error, response }))
}

/** A text resource's content at `revision` (the cache key, so saves refetch nothing stale). */
export function useAssetText(assetId: string, revision: number, enabled = true) {
  return useQuery({
    queryKey: assetKeys.content(assetId, revision),
    enabled,
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: async () => (await fetchContent(assetId, "text")) as string,
  })
}

/** An object URL for a binary resource, revoked on change and unmount. */
export function useAssetUrl(assetId: string, revision: number, enabled = true): string | null {
  const blob = useQuery({
    queryKey: [...assetKeys.content(assetId, revision), "blob"],
    enabled,
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: async () => (await fetchContent(assetId, "blob")) as Blob,
  }).data
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!blob) return
    const next = URL.createObjectURL(blob)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [blob])
  return blob ? url : null
}

export async function downloadAsset(assetId: string, name: string) {
  const blob = (await fetchContent(assetId, "blob")) as Blob
  const url = URL.createObjectURL(blob)
  const link = Object.assign(document.createElement("a"), { href: url, download: name })
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function useAssetMutations(artifactId: string) {
  const client = useQueryClient()
  const refresh = () => client.invalidateQueries({ queryKey: assetKeys.list(artifactId) })
  const upload = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append("artifactId", artifactId)
      form.append("file", file)
      return unwrap(
        api.POST("/api/v1/assets", {
          body: { artifactId, file: file.name },
          bodySerializer: () => form,
        }),
      )
    },
    onSuccess: refresh,
  })
  const write = useMutation({
    mutationFn: ({ id, revision, text }: { id: string; revision: number; text: string }) =>
      unwrap(
        api.PUT("/api/v1/assets/{asset_id}/content", {
          params: { path: { asset_id: id }, header: { "if-match": etag(revision) } },
          body: { text },
        }),
      ),
    onSuccess: (asset, { text }) => {
      client.setQueryData(assetKeys.content(asset.id, asset.revision), text)
      return refresh()
    },
  })
  const rename = useMutation({
    mutationFn: ({ id, revision, name }: { id: string; revision: number; name: string }) =>
      unwrap(
        api.PATCH("/api/v1/assets/{asset_id}", {
          params: { path: { asset_id: id }, header: { "if-match": etag(revision) } },
          body: { name },
        }),
      ),
    onSuccess: refresh,
  })
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error, response } = await api.DELETE("/api/v1/assets/{asset_id}", {
        params: { path: { asset_id: id } },
      })
      if (!response.ok) await unwrap(Promise.resolve({ error, response }))
    },
    onSuccess: refresh,
  })
  return { upload, write, rename, remove }
}

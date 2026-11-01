import { toast } from "sonner"
import { useArtifactTrails, useSetArtifactTrail } from "@/api/flows"
import { PanelHeading, Placeholder } from "@/components/workspace/inspector"
import { friendlyError } from "@/lib/errors"

/** Puts the artifact in or out of each trail's draft; publishing the trail makes it final. */
export function ArtifactTrails({
  artifactId,
  published,
  readOnly,
}: {
  artifactId: string
  published: boolean
  readOnly: boolean
}) {
  const trails = useArtifactTrails(artifactId).data ?? []
  const set = useSetArtifactTrail(artifactId)
  return (
    <section className="flex flex-col gap-1.5">
      <PanelHeading label="Trails" />
      {!published && <Placeholder>Publish this artifact to add it to a trail.</Placeholder>}
      {trails.length === 0 && <Placeholder>No trails yet.</Placeholder>}
      <ul className="flex flex-col gap-1">
        {trails.map((trail) => (
          <li key={trail.flowId}>
            <label className="flex items-center gap-2 text-ui text-gc-ink2">
              <input
                type="checkbox"
                checked={trail.inDraft}
                disabled={readOnly || set.isPending || (!published && !trail.inDraft)}
                onChange={(event) =>
                  set.mutate(
                    { flowId: trail.flowId, member: event.target.checked },
                    { onError: (error) => toast.error(friendlyError(error)) },
                  )
                }
              />
              <span className="min-w-0 flex-1 truncate">{trail.flowTitle}</span>
              {trail.publishedRevisions.length > 0 && (
                <span className="shrink-0 font-mono text-label text-gc-ink3">
                  in {trail.publishedRevisions.map((revision) => `r${revision}`).join(", ")}
                </span>
              )}
            </label>
          </li>
        ))}
      </ul>
      {trails.length > 0 && !readOnly && <Placeholder>Publish the trail to apply.</Placeholder>}
    </section>
  )
}

import type { Schemas } from "@/api/client"
import { typeInfo } from "@/components/artifact-types"
import { Caption } from "@/components/labels"
import { formatClock } from "@/lib/trail"

/** Read-only summary of an artifact: type, status, description, duration, tags and metadata. */
export function ArtifactMetadata({ artifact }: { artifact: Schemas["ArtifactOut"] }) {
  const planned = artifact.instructionalDesign?.durationSeconds
  const entries = Object.entries(artifact.metadata ?? {}).filter(
    ([, value]) => value !== null && value !== "",
  )
  return (
    <div className="flex flex-col gap-2 text-ui">
      <h3 className="font-semibold text-gc-text">{artifact.title}</h3>
      <Caption className="uppercase">
        {typeInfo(artifact.type).label} · {artifact.status}
        {typeof planned === "number" && planned > 0 && ` · ${formatClock(planned)}`}
      </Caption>
      {artifact.description && <p className="text-gc-ink2">{artifact.description}</p>}
      {artifact.tags.length > 0 && (
        <ul aria-label="Tags" className="flex flex-wrap gap-1">
          {artifact.tags.map((tag) => (
            <li
              key={tag}
              className="rounded border border-gc-border bg-gc-sunken px-1.5 py-0.5 font-mono text-label text-gc-ink2"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}
      {entries.length > 0 && (
        <dl aria-label="Metadata" className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          {entries.map(([key, value]) => (
            <div key={key} className="contents">
              <dt className="font-mono text-label text-gc-ink3">{key}</dt>
              <dd className="min-w-0 break-words text-gc-ink2">
                {typeof value === "string" ? value : JSON.stringify(value)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

import { Component, type ReactNode } from "react"
import type { ArtifactListItem } from "@/api/client"
import { useArtifactVersions, useVersion } from "@/api/queries"
import { typeInfo } from "@/components/artifact-types"
import { WhenVisible } from "@/components/shell/when-visible"
import { StepRenderer, themedContent } from "@/components/trail/themed-content"
import { cn } from "@/lib/utils"

// Content lays out at STAGE_WIDTH and is scaled down, so it looks like the real thing.
const STAGE_WIDTH = 640
const THUMB_WIDTH = 96

/** A rendered preview of `artifact`; the type icon stands in when it cannot render. */
export function ArtifactThumbnail({ artifact }: { artifact: ArtifactListItem }) {
  const published = Object.values(artifact.defaults)[0]
  return (
    <div
      aria-hidden
      inert
      style={{ width: THUMB_WIDTH }}
      className="pointer-events-none relative aspect-video shrink-0 overflow-hidden rounded border border-gc-border bg-gc-sunken"
    >
      <TypeIcon type={artifact.type} />
      <WhenVisible>
        <ThumbnailBoundary>
          {published ? (
            <VersionStage type={artifact.type} versionId={published} />
          ) : (
            <LatestDraftStage artifact={artifact} />
          )}
        </ThumbnailBoundary>
      </WhenVisible>
    </div>
  )
}

function LatestDraftStage({ artifact }: { artifact: ArtifactListItem }) {
  const versions = useArtifactVersions(artifact.id).data ?? []
  const latest = versions.find((version) => version.isActive) ?? versions[0]
  return <VersionStage type={artifact.type} versionId={latest?.id} />
}

function VersionStage({
  type,
  versionId,
}: {
  type: ArtifactListItem["type"]
  versionId: string | undefined
}) {
  const version = useVersion(versionId).data?.version
  if (!version || "error" in themedContent(type, version.content, null, null)) return null
  return (
    <div
      style={{ width: STAGE_WIDTH, transform: `scale(${THUMB_WIDTH / STAGE_WIDTH})` }}
      className="absolute top-0 left-0 aspect-video origin-top-left overflow-hidden bg-gc-sunken"
    >
      <StepRenderer
        type={type}
        content={version.content}
        override={null}
        trailTheme={null}
        showControls={false}
        still
      />
    </div>
  )
}

function TypeIcon({ type }: { type: ArtifactListItem["type"] }) {
  const info = typeInfo(type)
  return (
    <span className="absolute inset-0 flex items-center justify-center">
      <info.icon className={cn("size-4", info.ink)} />
    </span>
  )
}

/** One artifact that fails to render must not take the whole list down. */
class ThumbnailBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

import { useEffect, useState } from "react"
import { api } from "@/api/client"
import { useArtifactVersions, useVersion } from "@/api/queries"
import { getPlugin, validateContent } from "@/artifacts"
import { ActionButton } from "@/components/shell/form-controls"
import { StepRenderer } from "@/components/trail/themed-content"
import { type EmbedRef, repinned } from "@/lib/embeds"

export type Playback = "static" | "auto"

/** Types drawn live in their box; the others stay a chip. */
const LIVE_TYPES = new Set<EmbedRef["artifactType"]>(["diagram", "animation"])

export const isLiveEmbed = (embed: EmbedRef) => LIVE_TYPES.has(embed.artifactType)

/** Offers "Update to vN" when the artifact's default in this locale has moved past the pin. */
export function EmbedRepin({
  embed,
  onRepin,
}: {
  embed: EmbedRef
  onRepin: (next: EmbedRef) => void
}) {
  const versions = useArtifactVersions(embed.artifactId).data
  const next = versions ? repinned(embed, versions) : null
  if (!next) return null
  return (
    <ActionButton title="Update to current default" onClick={() => onRepin(next)}>
      Update to v{next.versionNumber}
    </ActionButton>
  )
}

export function EmbedChip({
  embed,
  onRepin,
}: {
  embed: EmbedRef
  onRepin?: (next: EmbedRef) => void
}) {
  const { artifactId, artifactType, locale, title, versionNumber } = embed
  const [usage, setUsage] = useState<number | null>(null)
  useEffect(() => {
    if (!artifactId) return
    let live = true
    api
      .GET("/api/v1/artifacts/{artifact_id}/usages", {
        params: { path: { artifact_id: artifactId } },
      })
      .then(({ data }) => {
        if (live && data) setUsage(new Set(data.map((entry) => entry.flowId)).size)
      })
    return () => {
      live = false
    }
  }, [artifactId])
  return (
    <div
      contentEditable={false}
      className="flex w-full items-center gap-[11px] rounded-[7px] border border-gc-border bg-gc-sunken p-2.5"
    >
      <div className="flex h-9 w-16 shrink-0 items-center justify-center rounded border border-gc-border bg-gradient-to-br from-[#2E2750] to-[#14131C] font-mono text-label text-[#9D93C9] uppercase">
        {artifactType}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-body font-semibold text-gc-text">
          {title || "Missing artifact"}
        </span>
        <span className="font-mono text-label tracking-[0.6px] text-gc-ink3 uppercase">
          Embedded {artifactType} · {locale} v{versionNumber}
          {usage !== null && ` · used in ${usage} flow${usage === 1 ? "" : "s"}`}
        </span>
      </div>
      {onRepin && artifactId && <EmbedRepin embed={embed} onRepin={onRepin} />}
    </div>
  )
}

function Notice({ children }: { children: string }) {
  return (
    <div
      role="alert"
      className="flex size-full items-center justify-center rounded-md border border-gc-border bg-gc-sunken p-3 text-center text-ui text-gc-fail-ink"
    >
      {children}
    </div>
  )
}

type Props = {
  embed: EmbedRef
  /** The host's theme; the embed keeps its own when absent. */
  hostTheme?: string
  playback?: Playback
}

/** Renders the pinned version to fill its parent; the parent sets the size. */
export function EmbeddedArtifact({ embed, hostTheme, playback = "static" }: Props) {
  if (!LIVE_TYPES.has(embed.artifactType)) return <EmbedChip embed={embed} />
  return <LiveEmbed embed={embed} hostTheme={hostTheme} playback={playback} />
}

function LiveEmbed({ embed, hostTheme, playback }: Required<Omit<Props, "hostTheme">> & Props) {
  const query = useVersion(embed.versionId)
  if (query.isPending && embed.versionId) {
    return (
      <div
        role="status"
        aria-label={`Loading ${embed.title}`}
        className="size-full animate-pulse rounded-md bg-gc-sunken"
      />
    )
  }
  const version = query.data?.version
  if (!version || version.artifactId !== embed.artifactId) {
    return <Notice>{`"${embed.title}" v${embed.versionNumber} is no longer available.`}</Notice>
  }
  if (!validateContent(getPlugin(embed.artifactType), version.content).ok) {
    return <Notice>{`"${embed.title}" can't be shown: its content is not valid.`}</Notice>
  }
  return (
    <div className="size-full overflow-hidden">
      <StepRenderer
        type={embed.artifactType}
        content={version.content}
        override={null}
        trailTheme={hostTheme}
        showControls={false}
        presenting
        still={playback === "static"}
      />
    </div>
  )
}

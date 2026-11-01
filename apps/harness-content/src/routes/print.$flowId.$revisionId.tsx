import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import type { Schemas } from "@/api/client"
import { useRevision } from "@/api/flows"
import { useFlow, useVersion } from "@/api/queries"
import { ActionButton } from "@/components/shell/form-controls"
import { StepRenderer } from "@/components/trail/themed-content"
import { usePageTitle } from "@/hooks/use-page-title"
import { friendlyError } from "@/lib/errors"
import { selectedSteps } from "@/lib/trail"

export const Route = createFileRoute("/print/$flowId/$revisionId")({
  component: TrailPrint,
  validateSearch: (search: Record<string, unknown>) => ({ steps: String(search.steps ?? "") }),
})

/** Canvas images and lazy renderers report no completion; this is their time to settle. */
const SETTLE_MS = 1500
/** Slides draw on canvas: a higher ratio keeps them sharp at PDF zoom. */
const CANVAS_PIXEL_RATIO = 3

function TrailPrint() {
  const { flowId, revisionId } = Route.useParams()
  const { steps: selected } = Route.useSearch()
  const flow = useFlow(flowId).data
  const revision = useRevision(flowId, revisionId)
  usePageTitle(flow?.title ?? "Trail")
  const [canvasReady, setCanvasReady] = useState(false)
  useEffect(() => {
    import("konva").then(({ default: Konva }) => {
      Konva.pixelRatio = CANVAS_PIXEL_RATIO
      setCanvasReady(true)
    })
  }, [])
  const steps = selectedSteps(revision.data?.revision.steps ?? [], selected)
  const [loaded, setLoaded] = useState<ReadonlySet<number>>(new Set())
  const markLoaded = (position: number) =>
    setLoaded((current) => (current.has(position) ? current : new Set(current).add(position)))
  const ready = Boolean(flow) && steps.length > 0 && loaded.size === steps.length

  useEffect(() => {
    if (!ready) return
    let timer: ReturnType<typeof setTimeout>
    document.fonts.ready.then(() => {
      timer = setTimeout(() => window.print(), SETTLE_MS)
    })
    return () => clearTimeout(timer)
  }, [ready])

  if (revision.error) return <p className="p-6 text-ui">{friendlyError(revision.error)}</p>
  return (
    <div className="bg-white">
      <div className="flex items-center justify-between gap-3 bg-gc-raised p-3 text-ui text-gc-text print:hidden">
        <span>{ready ? "Ready to save as PDF." : "Preparing pages…"}</span>
        <ActionButton variant="primary" disabled={!ready} onClick={() => window.print()}>
          Print
        </ActionButton>
      </div>
      {flow &&
        canvasReady &&
        steps.map(({ step, position }) => (
          <PrintStep
            key={step.id}
            step={step}
            trailTheme={flow.theme}
            onLoaded={() => markLoaded(position)}
          />
        ))}
    </div>
  )
}

function PrintStep({
  step,
  trailTheme,
  onLoaded,
}: {
  step: Schemas["StepOut"]
  trailTheme: string | null | undefined
  onLoaded: () => void
}) {
  const version = useVersion(step.artifactVersionId ?? undefined).data?.version
  const hasVersion = Boolean(version)
  // biome-ignore lint/correctness/useExhaustiveDependencies: onLoaded only records the position
  useEffect(() => {
    if (hasVersion) onLoaded()
  }, [hasVersion])
  const isDoc = step.artifactType === "doc"
  return (
    <section
      aria-label={step.label || step.artifactTitle}
      // Docs print on paper colours whatever the studio theme; other types paint their own.
      data-theme={isDoc ? "graphite-light" : "graphite-dark"}
      className={
        isDoc
          ? "min-h-[720px] w-[1280px] break-after-page last:break-after-auto bg-gc-page p-12 text-gc-text"
          : "h-[720px] w-[1280px] break-after-page last:break-after-auto overflow-hidden"
      }
    >
      {version && (
        <StepRenderer
          type={step.artifactType}
          content={version.content}
          override={step.themeOverride}
          trailTheme={trailTheme}
          showControls={false}
          presenting={!isDoc}
          still
        />
      )}
    </section>
  )
}

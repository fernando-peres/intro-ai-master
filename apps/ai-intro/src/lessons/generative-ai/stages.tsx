import { ServerOffIcon } from "lucide-react"
import { useTranslation } from "@/i18n/use-translation"
import { cn } from "@/lib/utils"
import { OFFLINE, useHealth } from "./api"

export type StageId = "foundation" | "adaptation" | "assistant"

/** Stages are a method comparison, not data classes: misc colors per docs/branding.md. */
export const STAGES: {
  id: StageId
  number: string
  title: string
  color: string
  /** Top-edge accent, for panels that keep their neutral frame. */
  top: string
  text: string
}[] = [
  {
    id: "foundation",
    number: "01",
    title: "Foundation",
    color: "var(--color-chart-warm)",
    top: "border-t-chart-warm",
    text: "text-chart-warm",
  },
  {
    id: "adaptation",
    number: "02",
    title: "Adaptation",
    color: "var(--color-chart-amber)",
    top: "border-t-chart-amber",
    text: "text-chart-amber",
  },
  {
    id: "assistant",
    number: "03",
    title: "Assistant",
    color: "var(--color-fg-secondary)",
    top: "border-t-fg-secondary",
    text: "text-fg-secondary",
  },
]

export const stage = (id: StageId) => STAGES.find((s) => s.id === id) ?? STAGES[0]

const START_COMMAND = "uv run fastapi dev apps/algo-server/src/algo_server/main.py"

/** Says which models answer, or how to start the server when it is unreachable; `quiet` only warns. */
export function ServerNotice({
  needsAssistant = false,
  quiet = false,
}: {
  needsAssistant?: boolean
  quiet?: boolean
}) {
  const { t } = useTranslation()
  const health = useHealth()
  if (health.isPending || (quiet && !health.isError)) return null
  if (health.isError) {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-[3px] border border-error/60 bg-surface px-4 py-3"
      >
        <ServerOffIcon className="mt-0.5 size-4 shrink-0 text-error" aria-hidden />
        <div className="flex min-w-0 flex-col gap-1.5 text-sm text-fg-secondary">
          <p>{t("The model server isn't running. Start it from the repository root:")}</p>
          <code className="overflow-x-auto font-ui text-xs text-fg">{START_COMMAND}</code>
        </div>
      </div>
    )
  }
  const { base_model, assistant_model } = health.data
  return (
    <p role="status" className="label-ui flex flex-wrap gap-x-5 gap-y-1 text-fg-muted">
      <span>
        {t("Base model")}: <span className="text-chart-warm">{base_model}</span>
      </span>
      <span>
        {t("Assistant model")}:{" "}
        {assistant_model ? (
          <span className="text-fg-secondary">{assistant_model}</span>
        ) : (
          <span className="text-error">
            {needsAssistant ? t("unavailable: set OPENAI_API_KEY in .env") : t("unavailable")}
          </span>
        )}
      </span>
    </p>
  )
}

/** A failed request, worded for students. */
export function RequestError({ error }: { error: Error | null }) {
  const { t } = useTranslation()
  if (!error) return null
  return (
    <p role="alert" className="text-sm text-error">
      {error.message === OFFLINE
        ? t("Could not reach the model server. Is it running?")
        : error.message}
    </p>
  )
}

export type ExecutionMode = "real" | "simulation" | "historical" | "conceptual"

/** Says where a panel's numbers come from: a live model, toy numbers, or an authored illustration. */
export function ModeBadge({ mode, note }: { mode: ExecutionMode; note?: string }) {
  const { t } = useTranslation()
  const copy = {
    real: { label: t("real"), className: "border-chart-warm text-chart-warm" },
    simulation: { label: t("simulation"), className: "border-chart-amber text-chart-amber" },
    historical: { label: t("historical illustration"), className: "border-line text-fg-muted" },
    conceptual: { label: t("conceptual illustration"), className: "border-line text-fg-muted" },
  }[mode]
  return (
    <span className={cn("label-ui rounded-[2px] border px-1.5 py-0.5", copy.className)}>
      {note ? `${copy.label} · ${note}` : copy.label}
    </span>
  )
}

/** A generated token as students see it: whitespace kept, line breaks drawn as ↵. */
export function tokenLabel(token: string) {
  return token.replace(/\n/g, "↵")
}

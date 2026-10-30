import {
  AudioLinesIcon,
  FileTextIcon,
  type LucideIcon,
  PresentationIcon,
  SparklesIcon,
  TableIcon,
  WorkflowIcon,
} from "lucide-react"
import type { ArtifactType } from "@/api/client"

export type ArtifactTypeInfo = {
  /** `null` for types shown in the picker but not yet available. */
  type: ArtifactType | null
  label: string
  description: string
  icon: LucideIcon
  /** Classes for the type's icon chip (tint background, ink foreground). */
  chip: string
  /** Class for the bare icon in rows and the tree. */
  ink: string
}

export const ARTIFACT_TYPES: ArtifactTypeInfo[] = [
  {
    type: "slide",
    label: "Slide",
    description: "A single deck slide with title, body and diagram blocks.",
    icon: PresentationIcon,
    chip: "bg-gc-nav-bg text-gc-nav-ink",
    ink: "text-gc-primary",
  },
  {
    type: "doc",
    label: "Document",
    description: "Long-form markdown page with headings and callouts.",
    icon: FileTextIcon,
    chip: "bg-gc-done-tint text-gc-done-ink",
    ink: "text-gc-done-base",
  },
  {
    type: "animation",
    label: "Animation",
    description: "Timed sequence rendered to video with narration.",
    icon: SparklesIcon,
    chip: "bg-gc-risk-tint text-gc-risk-ink",
    ink: "text-gc-risk-base",
  },
  {
    type: null,
    label: "Diagram",
    description: "Standalone node graph reusable across artifacts.",
    icon: WorkflowIcon,
    chip: "bg-gc-pass-tint text-gc-pass-ink",
    ink: "text-gc-pass-base",
  },
  {
    type: null,
    label: "Dataset",
    description: "Tabular fixture used by runs and evaluations.",
    icon: TableIcon,
    chip: "bg-gc-warn-tint text-gc-warn-ink",
    ink: "text-gc-warn-base",
  },
  {
    type: null,
    label: "Audio clip",
    description: "Voice track generated from a written script.",
    icon: AudioLinesIcon,
    chip: "bg-gc-fail-tint text-gc-fail-ink",
    ink: "text-gc-fail-base",
  },
]

export function typeInfo(type: ArtifactType): ArtifactTypeInfo {
  const info = ARTIFACT_TYPES.find((entry) => entry.type === type)
  if (!info) throw new Error(`Unknown artifact type: ${type}`)
  return info
}

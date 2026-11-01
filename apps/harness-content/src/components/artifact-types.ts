import {
  FileTextIcon,
  type LucideIcon,
  PresentationIcon,
  SparklesIcon,
  WorkflowIcon,
} from "lucide-react"
import type { ArtifactType } from "@/api/client"

export type ArtifactTypeInfo = {
  type: ArtifactType
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
    description: "A single deck slide with text, shapes, charts and embedded diagrams.",
    icon: PresentationIcon,
    chip: "bg-gc-nav-bg text-gc-nav-ink",
    ink: "text-gc-primary-ink",
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
    description: "A template-driven animation with editable text, data, colours and timing.",
    icon: SparklesIcon,
    chip: "bg-gc-risk-tint text-gc-risk-ink",
    ink: "text-gc-risk-base",
  },
  {
    type: "diagram",
    label: "Diagram",
    description: "A node graph you drag and connect, or a diagram written in Mermaid.",
    icon: WorkflowIcon,
    chip: "bg-gc-nav-bg text-gc-nav-ink",
    ink: "text-gc-primary-ink",
  },
]

export function typeInfo(type: ArtifactType): ArtifactTypeInfo {
  const info = ARTIFACT_TYPES.find((entry) => entry.type === type)
  if (!info) throw new Error(`Unknown artifact type: ${type}`)
  return info
}

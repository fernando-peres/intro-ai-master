import type { ComponentType } from "react"
import type { z } from "zod"

/** Keyframes per CSS/transform property; index 0 is the state before the segment starts. */
export type Keyframes = Record<string, (string | number)[]>

/** One Motion sequence segment: a `[data-anim]` name inside the scene, its keyframes, timing. */
export type Segment = {
  target: string
  keyframes: Keyframes
  at: number
  duration: number
  ease: string
}

export type SceneProps<P> = {
  props: P
  /** True before playback starts: animated parts render in their first keyframe. */
  hidden: boolean
}

/**
 * A registered animation template. `Scene` lays out a 1920×1080 frame whose animated parts carry
 * `data-anim` names; `sequence` animates exactly those names from the same props.
 */
export type AnimationTemplate<S extends z.ZodObject = z.ZodObject, I extends string = string> = {
  id: I
  label: string
  description: string
  props: S
  Scene: ComponentType<SceneProps<z.output<S>>>
  sequence: (props: z.output<S>) => Segment[]
  searchText: (props: z.output<S>) => string
}

export function sequenceDuration(segments: Segment[]): number {
  return Math.max(0, ...segments.map((s) => s.at + s.duration))
}

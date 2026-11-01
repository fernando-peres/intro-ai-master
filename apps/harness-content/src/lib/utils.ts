import { type ClassValue, clsx } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Without this, tailwind-merge reads `text-label` as a color and drops the real one.
const twMerge = extendTailwindMerge({
  extend: { theme: { text: ["label", "ui", "body", "title"] } },
})

/** "1 step", "3 steps". */
export const formatCount = (count: number, noun: string) =>
  `${count} ${noun}${count === 1 ? "" : "s"}`

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

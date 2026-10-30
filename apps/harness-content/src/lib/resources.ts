import type { Schemas } from "@/api/client"

export type Asset = Schemas["AssetOut"]
export type ResourceKind = "note" | "text" | "image" | "pdf"

/** Mirrors harness-content-api's `services/assets.py` TYPES and MAX_BYTES. */
const EXTENSIONS: Record<string, { mime: string; kind: ResourceKind; chip: string }> = {
  ".md": { mime: "text/markdown", kind: "note", chip: "MD" },
  ".txt": { mime: "text/plain", kind: "text", chip: "TXT" },
  ".csv": { mime: "text/csv", kind: "text", chip: "CSV" },
  ".pdf": { mime: "application/pdf", kind: "pdf", chip: "PDF" },
  ".png": { mime: "image/png", kind: "image", chip: "PNG" },
  ".jpg": { mime: "image/jpeg", kind: "image", chip: "JPG" },
  ".jpeg": { mime: "image/jpeg", kind: "image", chip: "JPG" },
  ".gif": { mime: "image/gif", kind: "image", chip: "GIF" },
  ".webp": { mime: "image/webp", kind: "image", chip: "WEBP" },
}
export const MAX_BYTES = 20 * 1024 * 1024
export const ACCEPT = Object.keys(EXTENSIONS).join(",")

function extension(name: string): string {
  const dot = name.lastIndexOf(".")
  return dot > 0 ? name.slice(dot).toLowerCase() : ""
}

export function resourceKind(asset: Pick<Asset, "mimeType">): ResourceKind {
  const match = Object.values(EXTENSIONS).find((entry) => entry.mime === asset.mimeType)
  return match?.kind ?? "pdf"
}

export function typeChip(asset: Pick<Asset, "name">): string {
  return EXTENSIONS[extension(asset.name)]?.chip ?? "FILE"
}

export const isEditable = (asset: Pick<Asset, "mimeType">) =>
  ["note", "text"].includes(resourceKind(asset))

/** Why `file` cannot be attached, or `null`; the API re-checks type and bytes. */
export function fileProblem(file: { name: string; size: number }): string | null {
  if (!EXTENSIONS[extension(file.name)]) {
    return `${file.name}: unsupported type (use ${[...new Set(Object.values(EXTENSIONS).map((e) => e.chip))].join(", ")})`
  }
  if (file.size > MAX_BYTES) return `${file.name} is larger than 20 MB`
  return null
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** `untitled-note.md`, then `untitled-note-2.md`, … avoiding names already taken. */
export function uniqueName(base: string, taken: Iterable<string>): string {
  const names = new Set(taken)
  const ext = extension(base)
  const stem = ext ? base.slice(0, -ext.length) : base
  let candidate = base
  for (let n = 2; names.has(candidate); n++) candidate = `${stem}-${n}${ext}`
  return candidate
}

export function filterResources(assets: Asset[], query: string): Asset[] {
  const needle = query.trim().toLowerCase()
  return needle ? assets.filter((asset) => asset.name.toLowerCase().includes(needle)) : assets
}

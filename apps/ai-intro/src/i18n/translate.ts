import type { Language } from "./language"
import { ptBR } from "./pt-br"

export type Translate = (source: string, values?: readonly (string | number)[]) => string

export function translator(language: Language): Translate {
  return (source, values = []) => {
    const key = source.replace(/\s+/g, " ").trim()
    const copy = language === "pt-BR" ? ptBR[key] : undefined
    const text =
      copy === undefined
        ? source
        : `${source.match(/^\s*/)?.[0] ?? ""}${copy}${source.match(/\s*$/)?.[0] ?? ""}`
    return text.replace(/\{(\d+)\}/g, (placeholder, index) =>
      String(values[Number(index)] ?? placeholder),
    )
  }
}

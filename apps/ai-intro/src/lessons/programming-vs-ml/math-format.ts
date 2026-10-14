export const fmt = (v: number) => (v < 0 ? `−${Math.abs(v).toFixed(2)}` : v.toFixed(2))
export const term = (w: number, a: number) => `(${fmt(w)})(${fmt(a)})`
export const plus = (v: number) => (v < 0 ? ` − ${Math.abs(v).toFixed(2)}` : ` + ${v.toFixed(2)}`)
export const SUPERSCRIPT = "¹²³⁴⁵⁶⁷⁸⁹"

/** Layer names in the equations: x for the input, h¹, h², … for hidden layers, ŷ for the output. */
export function symbol(layer: number, lastLayer: number) {
  if (layer === 0) return "x"
  if (layer === lastLayer) return "ŷ"
  return `h${SUPERSCRIPT[layer - 1]}`
}

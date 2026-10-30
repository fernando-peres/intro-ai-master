/** WCAG 2.x contrast ratio of two `#rrggbb` colours (1–21). */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const value = Number.parseInt(hex.slice(i, i + 2), 16) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** `--name: #hex` declarations of the first `[data-…theme="name"]` block per theme in `css`. */
export function themeTokens(css: string): Record<string, Record<string, string>> {
  const themes: Record<string, Record<string, string>> = {}
  for (const match of css.matchAll(/^\[data-(?:content-)?theme="([^"]+)"\]\s*\{([^}]*)\}/gm)) {
    const tokens = [...match[2].matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\b/gi)]
    themes[match[1]] ??= Object.fromEntries(tokens.map((token) => [token[1], token[2]]))
  }
  return themes
}

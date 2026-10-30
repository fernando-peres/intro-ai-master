import { useSyncExternalStore } from "react"

export type SlideBackground =
  | { kind: "flat"; color: string }
  | { kind: "gradient"; from: string; to: string; angle: number }

export type SlideTheme = {
  label: string
  background: SlideBackground
  accent: string
  /** Chart colours after `accent`. */
  series: readonly string[]
  text: string
  body: string
  muted: string
  surface: string
  line: string
}

const SERIES = ["#2DD4A7", "#F2A65A", "#E0607E"]

/** Offline fallback and the animation `scheme` list; saved themes come from the API. */
export const SLIDE_THEMES = {
  dark: {
    label: "Dark",
    background: { kind: "gradient", from: "#2E2750", to: "#14131C", angle: 125 },
    // Lighter than the .pen #6D5BD0, which is under 3:1 on the gradient's top stop.
    accent: "#8B7BE0",
    series: SERIES,
    text: "#F4F2FB",
    body: "#C3BCDC",
    muted: "#9D93C9",
    surface: "#FFFFFF14",
    line: "#FFFFFF2E",
  },
  light: {
    label: "Light",
    background: { kind: "flat", color: "#FFFFFF" },
    accent: "#3A3263",
    series: SERIES,
    text: "#18181B",
    body: "#52525B",
    muted: "#71717A",
    surface: "#18181B0D",
    line: "#18181B2E",
  },
  violet: {
    label: "Violet",
    background: { kind: "flat", color: "#110F1A" },
    accent: "#8B5CF6",
    series: SERIES,
    text: "#F2F0FA",
    body: "#C9C4DD",
    muted: "#837E9B",
    surface: "#FFFFFF14",
    line: "#FFFFFF2E",
  },
  mint: {
    label: "Mint",
    background: { kind: "flat", color: "#0E1313" },
    accent: "#2DD4A7",
    series: SERIES,
    text: "#E9F4EF",
    body: "#BFD4CC",
    muted: "#7C8F89",
    surface: "#FFFFFF14",
    line: "#FFFFFF2E",
  },
  cobalt: {
    label: "Cobalt",
    background: { kind: "flat", color: "#0C111C" },
    accent: "#4F7CFF",
    series: SERIES,
    text: "#EAEFF9",
    body: "#BCC7DC",
    muted: "#7B879E",
    surface: "#FFFFFF14",
    line: "#FFFFFF2E",
  },
  ivory: {
    label: "Ivory",
    background: { kind: "flat", color: "#140D08" },
    accent: "#DF753E",
    series: SERIES,
    text: "#F5ECE0",
    body: "#D9CAC1",
    muted: "#8C8378",
    surface: "#FFFFFF14",
    line: "#FFFFFF2E",
  },
} as const satisfies Record<string, SlideTheme>

export type SlideThemeId = keyof typeof SLIDE_THEMES

export const THEME_GROUPS = [
  {
    label: "Surface",
    slots: [
      ["background", "Background"],
      ["surface", "Surface"],
      ["elevated", "Elevated"],
      ["overlay", "Overlay"],
    ],
  },
  {
    label: "Text",
    slots: [
      ["title", "Title"],
      ["body", "Body"],
      ["muted", "Muted"],
      ["inverse", "Inverse"],
    ],
  },
  {
    label: "Accent",
    slots: [
      ["accent1", "Accent 1"],
      ["accent2", "Accent 2"],
      ["accent3", "Accent 3"],
      ["accent4", "Accent 4"],
    ],
  },
  {
    label: "Diagram",
    slots: [
      ["nodeFill", "Node fill"],
      ["nodeStroke", "Node stroke"],
      ["connector", "Connector"],
      ["nodeLabel", "Node label"],
    ],
  },
] as const

export type ThemeSlot = (typeof THEME_GROUPS)[number]["slots"][number][0]
export type ThemeTokens = Record<ThemeSlot, string> & { backgroundGradient?: boolean }

/** The fields a slide reads, from a saved theme's slots. */
export function tokensToSlideTheme(name: string, tokens: ThemeTokens): SlideTheme {
  return {
    label: name,
    background: tokens.backgroundGradient
      ? { kind: "gradient", from: tokens.elevated, to: tokens.background, angle: 125 }
      : { kind: "flat", color: tokens.background },
    accent: tokens.accent1,
    series: [tokens.accent2, tokens.accent3, tokens.accent4],
    text: tokens.title,
    body: tokens.body,
    muted: tokens.muted,
    surface: tokens.surface,
    line: tokens.connector,
  }
}

function mix(from: string, to: string, amount: number): string {
  const channel = (hex: string, i: number) => Number.parseInt(hex.slice(i, i + 2), 16)
  const parts = [1, 3, 5].map((i) => {
    const value = channel(from, i) + (channel(to, i) - channel(from, i)) * amount
    return Math.round(value).toString(16).padStart(2, "0")
  })
  return `#${parts.join("").toUpperCase()}`
}

export const BUILTIN_NAMES: Record<SlideThemeId, string> = {
  dark: "Graphite Dark",
  light: "Graphite Light",
  violet: "Violet Lab",
  mint: "Mint Clinic",
  cobalt: "Cobalt Deep",
  ivory: "Ivory Press",
}

/** Slots seeded for a built-in theme; the ones slides don't read yet are derived from it. */
function builtinTokens(theme: SlideTheme): ThemeTokens {
  const gradient = theme.background.kind === "gradient"
  const background = gradient
    ? (theme.background as { to: string }).to
    : (theme.background as { color: string }).color
  return {
    background,
    surface: theme.surface,
    elevated: gradient
      ? (theme.background as { from: string }).from
      : mix(background, theme.text, 0.08),
    overlay: mix(background, "#000000", 0.4),
    title: theme.text,
    body: theme.body,
    muted: theme.muted,
    inverse: background,
    accent1: theme.accent,
    accent2: theme.series[0],
    accent3: theme.series[1],
    accent4: theme.series[2],
    nodeFill: mix(background, theme.accent, 0.15),
    nodeStroke: mix(background, theme.accent, 0.4),
    connector: theme.line,
    nodeLabel: theme.text,
    backgroundGradient: gradient,
  }
}

export const BUILTIN_TOKENS = Object.fromEntries(
  Object.entries(SLIDE_THEMES).map(([id, theme]) => [id, builtinTokens(theme)]),
) as Record<SlideThemeId, ThemeTokens>

export type ListedTheme = SlideTheme & { id: string }

const builtins: ListedTheme[] = Object.entries(SLIDE_THEMES).map(([id, theme]) => ({
  ...theme,
  id,
  label: BUILTIN_NAMES[id as SlideThemeId],
}))
let themes = builtins
const listeners = new Set<() => void>()

/** Replaces the known themes with the API's list; the built-ins stay if it lacks one. */
export function registerThemes(saved: { id: string; name: string; tokens: ThemeTokens }[]) {
  const incoming = saved.map((theme) => ({
    ...tokensToSlideTheme(theme.name, theme.tokens),
    id: theme.id,
  }))
  const ids = new Set(incoming.map((theme) => theme.id))
  themes = [...builtins.filter((theme) => !ids.has(theme.id)), ...incoming]
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const list = () => themes

export function listSlideThemes(): ListedTheme[] {
  return themes
}

export function hasSlideTheme(id: string): boolean {
  return themes.some((theme) => theme.id === id)
}

/** Never fails: an unknown ID renders as the dark theme. */
export function getSlideTheme(id: string): SlideTheme {
  return themes.find((theme) => theme.id === id) ?? SLIDE_THEMES.dark
}

export function useSlideThemes(): ListedTheme[] {
  return useSyncExternalStore(subscribe, list)
}

export function useSlideTheme(id: string): SlideTheme {
  useSlideThemes()
  return getSlideTheme(id)
}

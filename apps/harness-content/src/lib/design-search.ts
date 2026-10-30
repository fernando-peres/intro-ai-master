export const SETTINGS_TABS = [
  { id: "system-themes", label: "System themes" },
  { id: "component-registry", label: "Component registry" },
  { id: "locales-versions", label: "Locales & versions" },
  { id: "roles-access", label: "Roles & access" },
] as const
export type SettingsTab = (typeof SETTINGS_TABS)[number]["id"]

/** Unknown values fall back to the first tab, so stale links still open. */
export function parseSettingsSearch(raw: Record<string, unknown>): { tab: SettingsTab } {
  return { tab: SETTINGS_TABS.find((tab) => tab.id === raw.tab)?.id ?? "system-themes" }
}

export type DesignTab = "themes" | "templates"
export type DesignSearch = { tab: DesignTab; theme?: string }

export function parseDesignSearch(raw: Record<string, unknown>): DesignSearch {
  return {
    tab: raw.tab === "templates" ? "templates" : "themes",
    theme: typeof raw.theme === "string" && raw.theme ? raw.theme : undefined,
  }
}

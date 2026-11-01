export type DesignTab = "themes" | "templates"
export type DesignSearch = { tab: DesignTab; theme?: string }

export function parseDesignSearch(raw: Record<string, unknown>): DesignSearch {
  return {
    tab: raw.tab === "templates" ? "templates" : "themes",
    theme: typeof raw.theme === "string" && raw.theme ? raw.theme : undefined,
  }
}

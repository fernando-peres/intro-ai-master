import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { PlusIcon } from "lucide-react"
import { Caption } from "@/components/labels"
import { AreaTabs } from "@/components/shell/area-tabs"
import { parseSettingsSearch, SETTINGS_TABS, type SettingsTab } from "@/lib/design-search"
import { type StudioMode, type StudioTheme, useStudioTheme } from "@/lib/studio-theme"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/configuration")({
  validateSearch: parseSettingsSearch,
  component: Configuration,
})

function Configuration() {
  const { tab } = Route.useSearch()
  const navigate = useNavigate()
  const onChange = (next: SettingsTab) =>
    navigate({ to: "/configuration", search: { tab: next }, replace: true })
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-12 shrink-0 items-center gap-[9px] border-b border-gc-border px-5">
        <h1 className="text-sm font-bold text-gc-text">Configuration</h1>
        <Caption className="tracking-[0.6px]">WORKSPACE SETTINGS</Caption>
      </header>
      <div className="h-10 shrink-0 border-b border-gc-border px-5">
        <AreaTabs label="Settings" tabs={[...SETTINGS_TABS]} value={tab} onChange={onChange} />
      </div>
      <div
        id={`area-${tab}`}
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-5"
      >
        {tab === "system-themes" ? (
          <SystemThemes />
        ) : (
          <p className="text-[11.5px] text-gc-ink3">Coming later.</p>
        )}
      </div>
    </div>
  )
}

const MODES: { id: StudioMode; label: string }[] = [
  { id: "system", label: "Match system" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
]

type Card = {
  id: StudioTheme
  label: string
  page: string
  rail: string
  line: string
  primary: string
}

// Literal previews: each card shows its own theme, whichever one is active.
const CARDS: Card[] = [
  {
    id: "graphite-dark",
    label: "Graphite Dark",
    page: "#121214",
    rail: "#171719",
    line: "#2A2A2F",
    primary: "#6D5BD0",
  },
  {
    id: "graphite-light",
    label: "Graphite Light",
    page: "#FFFFFF",
    rail: "#FAFAFA",
    line: "#E4E4E7",
    primary: "#3A3263",
  },
  {
    id: "graphite-violet",
    label: "Violet",
    page: "#0B0A10",
    rail: "#110F1A",
    line: "#352F4C",
    primary: "#8B5CF6",
  },
  {
    id: "graphite-mint",
    label: "Mint",
    page: "#080A0A",
    rail: "#0E1313",
    line: "#2A3B36",
    primary: "#2DD4A7",
  },
  {
    id: "graphite-cobalt",
    label: "Cobalt",
    page: "#060910",
    rail: "#0C111C",
    line: "#28334C",
    primary: "#4F7CFF",
  },
  {
    id: "graphite-ivory",
    label: "Ivory",
    page: "#0D0A06",
    rail: "#140D08",
    line: "#554C42",
    primary: "#FFFFFF",
  },
]

function SystemThemes() {
  const { theme, mode, setMode, pickTheme } = useStudioTheme()
  return (
    <>
      <Caption className="tracking-[1px]">APPEARANCE</Caption>
      <fieldset className="flex h-[30px] w-[324px] gap-0.5 rounded-md border border-gc-border bg-gc-sunken p-0.5">
        <legend className="sr-only">Appearance mode</legend>
        {MODES.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={mode === option.id}
            onClick={() => setMode(option.id)}
            className={cn(
              "flex-1 rounded text-[11px]",
              mode === option.id
                ? "bg-gc-nav-bg font-semibold text-gc-nav-ink"
                : "text-gc-ink3 hover:text-gc-ink2",
            )}
          >
            {option.label}
          </button>
        ))}
      </fieldset>
      <p className="text-[11px] text-gc-ink3">
        System themes style the console itself. Artifact themes are managed under Artifacts Design.
      </p>
      <div className="flex items-center justify-between pt-1">
        <Caption className="tracking-[1px]">SYSTEM THEMES</Caption>
        <button
          type="button"
          disabled
          title="Coming later"
          className="flex h-6 items-center gap-1.5 rounded-md border border-gc-border bg-gc-sunken px-2.5 text-[11px] text-gc-ink3 disabled:cursor-not-allowed"
        >
          <PlusIcon aria-hidden className="size-[11px]" />
          New theme
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {CARDS.map((card) => (
          <ThemeCard
            key={card.id}
            card={card}
            selected={theme === card.id}
            onPick={() => pickTheme(card.id)}
          />
        ))}
      </div>
    </>
  )
}

function ThemeCard({
  card,
  selected,
  onPick,
}: {
  card: Card
  selected: boolean
  onPick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onPick}
      className={cn(
        "flex flex-col overflow-hidden rounded-lg bg-gc-raised text-left",
        selected ? "border-[1.5px] border-gc-primary" : "border border-gc-border",
      )}
    >
      <span aria-hidden className="flex h-[72px] w-full" style={{ background: card.page }}>
        <span
          className="flex h-full w-[30px] flex-col gap-[5px] p-2"
          style={{ background: card.rail }}
        >
          {[15, 19, 13].map((width) => (
            <span
              key={width}
              className="h-[3px] rounded-[1.5px]"
              style={{ width: Math.min(width, 14), background: card.line }}
            />
          ))}
        </span>
        <span className="flex flex-1 flex-col gap-[5px] p-2">
          <span className="h-1.5 w-[62px] rounded-sm" style={{ background: card.primary }} />
          <span className="h-1 rounded-sm" style={{ background: card.line }} />
          <span className="h-1 rounded-sm" style={{ background: card.line }} />
        </span>
      </span>
      <span className="flex items-center justify-between border-t border-gc-border px-3 py-2.5">
        <span className="flex flex-col gap-1">
          <span className="text-[11.5px] font-semibold text-gc-text">{card.label}</span>
          <span className="font-mono text-[8px] tracking-[0.4px] text-gc-ink3">SYSTEM</span>
        </span>
        {selected ? (
          <span className="rounded-[3px] bg-gc-nav-bg px-1.5 py-0.5 font-mono text-[7.5px] tracking-[0.5px] text-gc-nav-ink">
            ACTIVE
          </span>
        ) : (
          <span aria-hidden className="size-[13px] rounded-full border border-gc-border" />
        )}
      </span>
    </button>
  )
}

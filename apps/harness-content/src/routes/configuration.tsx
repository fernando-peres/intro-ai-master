import { createFileRoute } from "@tanstack/react-router"
import { Caption } from "@/components/labels"
import { usePageTitle } from "@/hooks/use-page-title"
import { type StudioMode, type StudioTheme, useStudioTheme } from "@/lib/studio-theme"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/configuration")({ component: Appearance })

function Appearance() {
  usePageTitle("Appearance")
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-12 shrink-0 items-center border-b border-gc-border px-5">
        <h1 className="text-sm font-bold text-gc-text">Appearance</h1>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-5">
        <SystemThemes />
      </div>
    </div>
  )
}

const MODES: { id: StudioMode; label: string }[] = [
  { id: "system", label: "Match system" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
]

const CARDS: { id: StudioTheme; label: string }[] = [
  { id: "graphite-dark", label: "Graphite Dark" },
  { id: "graphite-light", label: "Graphite Light" },
  { id: "graphite-violet", label: "Violet" },
  { id: "graphite-mint", label: "Mint" },
  { id: "graphite-cobalt", label: "Cobalt" },
  { id: "graphite-ivory", label: "Ivory" },
]

function SystemThemes() {
  const { theme, mode, setMode, pickTheme } = useStudioTheme()
  return (
    <>
      <Caption className="tracking-[0.5px]">APPEARANCE</Caption>
      <fieldset className="flex h-9 w-full max-w-[324px] gap-1 rounded-md border border-gc-border bg-gc-sunken p-1">
        <legend className="sr-only">Appearance mode</legend>
        {MODES.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={mode === option.id}
            onClick={() => setMode(option.id)}
            className={cn(
              "flex-1 rounded text-ui",
              mode === option.id
                ? "bg-gc-nav-bg font-semibold text-gc-nav-ink"
                : "text-gc-ink3 hover:text-gc-ink2",
            )}
          >
            {option.label}
          </button>
        ))}
      </fieldset>
      <p className="text-ui text-gc-ink3">
        System themes style the console itself. Artifact themes are managed under Artifacts Design.
      </p>
      <Caption className="pt-1 tracking-[0.5px]">SYSTEM THEMES</Caption>
      <div className="grid grid-cols-3 gap-3 max-md:grid-cols-2">
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
  card: (typeof CARDS)[number]
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
      {/* The preview sets its own data-theme, so it always shows the real tokens. */}
      <span aria-hidden data-theme={card.id} className="flex h-[72px] w-full bg-gc-page">
        <span className="flex h-full w-[30px] flex-col gap-[5px] bg-gc-raised p-2">
          {[14, 14, 13].map((width, index) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed decorative bars
              key={index}
              className="h-[3px] rounded-[1.5px] bg-gc-border"
              style={{ width }}
            />
          ))}
        </span>
        <span className="flex flex-1 flex-col gap-[5px] p-2">
          <span className="h-1.5 w-[62px] rounded-sm bg-gc-primary" />
          <span className="h-1 rounded-sm bg-gc-border" />
          <span className="h-1 rounded-sm bg-gc-border" />
        </span>
      </span>
      <span className="flex items-center justify-between border-t border-gc-border px-3 py-2.5">
        <span className="flex flex-col gap-1">
          <span className="text-ui font-semibold text-gc-text">{card.label}</span>
          <span className="font-mono text-label tracking-[0.4px] text-gc-ink3">SYSTEM</span>
        </span>
        {selected ? (
          <span className="rounded-[3px] bg-gc-nav-bg px-1.5 py-0.5 font-mono text-label tracking-[0.5px] text-gc-nav-ink">
            ACTIVE
          </span>
        ) : (
          <span aria-hidden className="size-[13px] rounded-full border border-gc-border" />
        )}
      </span>
    </button>
  )
}

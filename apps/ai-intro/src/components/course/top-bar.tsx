import { Link } from "@tanstack/react-router"

import { ThemeChip } from "./theme-chip"

export function TopBar() {
  return (
    <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-divider bg-surface px-9">
      <Link to="/" className="flex items-center gap-2.5" aria-label="AI explained, home">
        <span className="size-[9px] rounded-full bg-brand" aria-hidden />
        <span className="flex items-baseline gap-[9px] font-display text-[30px] tracking-[-0.8px]">
          <span className="text-fg">AI</span>
          <span className="text-brand italic">explained</span>
        </span>
      </Link>
      <div className="flex items-center gap-7">
        <span className="label-ui hidden text-fg-muted sm:inline">Course</span>
        <span className="label-ui hidden text-fg-muted sm:inline">Glossary</span>
        <span className="label-ui hidden text-fg-muted sm:inline">Resources</span>
        <ThemeChip />
      </div>
    </header>
  )
}

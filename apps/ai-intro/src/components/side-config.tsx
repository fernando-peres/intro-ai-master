import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react"
import { type ReactNode, useState } from "react"
import { useTranslation } from "@/i18n/use-translation"
import { cn } from "@/lib/utils"

/**
 * Collapsible left rail beside `children` (stacked above it on narrow screens). Sections are
 * separated by hairlines: `config`, then `display` toggles, then `actions` pinned to the bottom.
 */
export function SideConfig({
  title,
  config,
  display,
  actions,
  children,
}: {
  title: string
  config: ReactNode
  display?: ReactNode
  actions?: ReactNode
  children: ReactNode
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(true)

  return (
    <div className="grid items-start gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
      <section
        aria-label={title}
        className={cn(
          "flex flex-col rounded-[2px] border border-divider bg-surface md:sticky md:top-4",
          open && "md:w-72",
        )}
      >
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <h2 className={cn("label-ui text-fg-muted", !open && "md:sr-only")}>{title}</h2>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? t("Hide configuration") : t("Show configuration")}
            className="text-fg-muted transition-colors hover:text-brand"
          >
            {open ? (
              <PanelLeftCloseIcon className="size-4" aria-hidden />
            ) : (
              <PanelLeftOpenIcon className="size-4" aria-hidden />
            )}
          </button>
        </div>
        {open && (
          <div className="flex flex-col divide-y divide-divider border-t border-divider">
            <div className="flex flex-col gap-4 p-3">{config}</div>
            {display && <div className="flex flex-col items-start gap-2 p-3">{display}</div>}
            {actions && <div className="flex flex-wrap items-center gap-2 p-3">{actions}</div>}
          </div>
        )}
      </section>
      <div className="flex min-w-0 flex-col gap-4">{children}</div>
    </div>
  )
}

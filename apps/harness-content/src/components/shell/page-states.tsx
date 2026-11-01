import { RotateCwIcon } from "lucide-react"
import type { ComponentProps, ReactNode } from "react"
import { ActionButton } from "@/components/shell/form-controls"
import { friendlyError } from "@/lib/errors"
import { cn } from "@/lib/utils"

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded bg-gc-border/60 motion-reduce:animate-none", className)}
      {...props}
    />
  )
}

/** Announces the wait to screen readers; `label` names what is loading. */
export function Loading({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status" aria-label={label} className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {children}
    </div>
  )
}

/** The artifact and trail screens' layout: a stage beside the inspector. */
export function WorkspaceSkeleton({ label }: { label: string }) {
  return (
    <Loading label={label}>
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-10 shrink-0 items-center gap-4 border-b border-gc-border px-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center bg-gc-sunken p-6">
            <Skeleton className="aspect-video w-full max-w-3xl" />
          </div>
        </div>
        <div className="flex w-[300px] shrink-0 flex-col gap-3 border-l border-gc-border bg-gc-raised p-3 max-[1279px]:hidden">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-[30px]" />
          <Skeleton className="h-[30px]" />
          <Skeleton className="h-24" />
        </div>
      </div>
    </Loading>
  )
}

export function ListSkeleton({ label, rows = 8 }: { label: string; rows?: number }) {
  return (
    <Loading label={label}>
      {Array.from({ length: rows }, (_, row) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: identical placeholders that never reorder
        <div key={row} className="flex h-[42px] items-center gap-4 border-b border-gc-divider px-4">
          <Skeleton className="size-4" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </Loading>
  )
}

type ErrorStateProps = {
  title: string
  error?: unknown
  /** Shown instead of a description derived from `error`. */
  message?: string
  onRetry?: () => void
  children?: ReactNode
}

export function ErrorState({ title, error, message, onRetry, children }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-10 text-center"
    >
      <h2 className="text-body font-semibold text-gc-text">{title}</h2>
      <p className="max-w-md text-ui text-gc-ink2">{message ?? friendlyError(error)}</p>
      <div className="flex items-center gap-2">
        {onRetry && (
          <ActionButton onClick={onRetry}>
            <RotateCwIcon />
            Try again
          </ActionButton>
        )}
        {children}
      </div>
    </div>
  )
}

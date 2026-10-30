import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { ChevronRightIcon, CopyIcon, PencilIcon } from "lucide-react"
import { type FormEvent, useState } from "react"
import { toast } from "sonner"
import {
  type ArtifactTheme,
  useArtifactThemes,
  useCreateTheme,
  useDuplicateTheme,
  useMe,
  useUpdateTheme,
} from "@/api/queries"
import { THEME_GROUPS, type ThemeSlot, type ThemeTokens } from "@/artifacts/plugins/slide/themes"
import { Caption } from "@/components/labels"
import { ActionButton, Field, Select, TextInput } from "@/components/shell/form-controls"
import { contrastRatio } from "@/lib/contrast"
import { cn } from "@/lib/utils"

const HEX = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/
const MIN_TEXT_CONTRAST = 4.5

type Props = {
  selectedId: string | undefined
  onSelect: (themeId: string) => void
  /** Set after New theme: opens this theme for editing once it is listed. */
  editingId: string | null
  onEditing: (themeId: string | null) => void
}

export function themeChips(theme: ArtifactTheme): string[] {
  return [theme.tokens.background, theme.tokens.accent1, theme.tokens.title]
}

/** Theme list and the selected theme's slots (design dgK9B). */
export function ArtifactThemes({ selectedId, onSelect, editingId, onEditing }: Props) {
  const query = useArtifactThemes()
  const themes = query.data ?? []
  const selected = themes.find((theme) => theme.id === selectedId) ?? themes[0]
  if (query.isError) {
    return (
      <p role="alert" className="p-5 text-[11.5px] text-gc-fail-ink">
        {query.error.message}
      </p>
    )
  }
  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex w-[240px] shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-gc-border p-3">
        <div className="flex h-[22px] items-center justify-between px-1">
          <Caption className="tracking-[1px]">ARTIFACT THEMES</Caption>
          <Caption>{themes.length}</Caption>
        </div>
        {themes.map((theme) => {
          const active = theme.id === selected?.id
          return (
            <button
              key={theme.id}
              type="button"
              aria-current={active || undefined}
              onClick={() => onSelect(theme.id)}
              className={cn(
                "flex h-10 shrink-0 items-center gap-2.5 rounded-md px-2 text-left",
                active && "bg-gc-row-bg",
              )}
            >
              <Chips colors={themeChips(theme)} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span
                  className={cn(
                    "truncate text-[11.5px]",
                    active ? "font-semibold text-gc-nav-ink" : "text-gc-ink2",
                  )}
                >
                  {theme.name}
                </span>
                <span className="font-mono text-[8px] tracking-[0.4px] text-gc-ink3">
                  {usage(theme.usedBy)}
                </span>
              </span>
              {active && <ChevronRightIcon aria-hidden className="size-3 text-gc-nav-ink" />}
            </button>
          )
        })}
      </div>
      {selected && (
        <ThemeDetail
          key={selected.id}
          theme={selected}
          editing={editingId === selected.id}
          onEditing={(on) => onEditing(on ? selected.id : null)}
          onDuplicated={onSelect}
        />
      )}
    </div>
  )
}

function usage(count = 0): string {
  return `${count} ARTIFACT${count === 1 ? "" : "S"}`
}

export function Chips({ colors, size = "md" }: { colors: string[]; size?: "sm" | "md" }) {
  return (
    <span aria-hidden className="flex shrink-0 items-center gap-0.5">
      {colors.map((color, index) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: three fixed swatch slots
          key={index}
          className={cn(
            "rounded-[1.5px] border border-gc-border",
            size === "md" ? "h-5 w-1.5" : "h-3.5 w-[5px]",
          )}
          style={{ background: color }}
        />
      ))}
    </span>
  )
}

function ThemeDetail({
  theme,
  editing,
  onEditing,
  onDuplicated,
}: {
  theme: ArtifactTheme
  editing: boolean
  onEditing: (editing: boolean) => void
  onDuplicated: (themeId: string) => void
}) {
  const me = useMe().data
  const duplicate = useDuplicateTheme()
  const update = useUpdateTheme(theme.id)
  const [name, setName] = useState(theme.name)
  const [tokens, setTokens] = useState<ThemeTokens>(theme.tokens as ThemeTokens)
  const canEdit = me !== undefined && me.role !== "viewer"
  const slots = THEME_GROUPS.flatMap((group) => group.slots.map(([slot]) => slot))
  const valid = name.trim() !== "" && slots.every((slot) => HEX.test(tokens[slot]))

  const startEditing = () => {
    setName(theme.name)
    setTokens(theme.tokens as ThemeTokens)
    onEditing(true)
  }
  const onDuplicate = () =>
    duplicate.mutate(theme.id, {
      onSuccess: (copy) => onDuplicated(copy.id),
      onError: (error) => toast.error(error.message),
    })
  const onSave = () =>
    update.mutate(
      { name: name.trim(), tokens },
      {
        onSuccess: () => onEditing(false),
        onError: (error) => toast.error(error.message),
      },
    )

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2.5 overflow-y-auto p-5">
      <div className="flex min-h-[34px] shrink-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {editing ? (
            <TextInput
              aria-label="Theme name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          ) : (
            <h2 className="truncate text-[13px] font-bold text-gc-text">{theme.name}</h2>
          )}
          <Caption className="shrink-0 tracking-[0.4px]">
            {slots.length} COLOR SLOTS · USED BY {usage(theme.usedBy)}
          </Caption>
        </div>
        {canEdit && (
          <div className="flex shrink-0 items-center gap-2">
            {editing ? (
              <>
                <ActionButton onClick={() => onEditing(false)}>Cancel</ActionButton>
                <ActionButton
                  variant="primary"
                  disabled={!valid || update.isPending}
                  onClick={onSave}
                >
                  Save
                </ActionButton>
              </>
            ) : (
              <>
                <ActionButton disabled={duplicate.isPending} onClick={onDuplicate}>
                  <CopyIcon aria-hidden />
                  Duplicate
                </ActionButton>
                {!theme.builtin && (
                  <ActionButton onClick={startEditing}>
                    <PencilIcon aria-hidden />
                    Edit theme
                  </ActionButton>
                )}
              </>
            )}
          </div>
        )}
      </div>
      {editing && <EditNotes tokens={tokens} usedBy={theme.usedBy ?? 0} />}
      {editing && (
        <label className="flex items-center gap-2 text-[11px] text-gc-ink2">
          <input
            type="checkbox"
            checked={tokens.backgroundGradient ?? false}
            onChange={(event) =>
              setTokens((current) => ({ ...current, backgroundGradient: event.target.checked }))
            }
          />
          Gradient background (Elevated to Background)
        </label>
      )}
      {theme.builtin && (
        <p className="text-[11px] text-gc-ink3">
          Built-in themes are read-only. Duplicate to edit.
        </p>
      )}
      {THEME_GROUPS.map((group) => (
        <section key={group.label} className="flex flex-col gap-2 pt-1.5">
          <Caption className="tracking-[1px] uppercase">{group.label}</Caption>
          <div className="grid grid-cols-4 gap-2.5">
            {group.slots.map(([slot, label]) => (
              <Slot
                key={slot}
                label={label}
                value={editing ? tokens[slot] : (theme.tokens as ThemeTokens)[slot]}
                onChange={
                  editing
                    ? (value) => setTokens((current) => ({ ...current, [slot]: value }))
                    : undefined
                }
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function EditNotes({ tokens, usedBy }: { tokens: ThemeTokens; usedBy: number }) {
  const low = (["title", "body"] as ThemeSlot[]).filter(
    (slot) =>
      HEX.test(tokens[slot]) &&
      HEX.test(tokens.background) &&
      contrastRatio(tokens[slot], tokens.background) < MIN_TEXT_CONTRAST,
  )
  return (
    <div className="flex flex-col gap-1 text-[11px]">
      {usedBy > 0 && (
        <p className="text-gc-warn-ink">
          Saving changes how {usedBy} artifact{usedBy === 1 ? "" : "s"} using this theme look,
          including published versions.
        </p>
      )}
      {low.length > 0 && (
        <p role="status" className="text-gc-risk-ink">
          Low contrast on Background: {low.join(" and ")} is under {MIN_TEXT_CONTRAST}:1.
        </p>
      )}
    </div>
  )
}

function Slot({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange?: (value: string) => void
}) {
  const invalid = !HEX.test(value)
  return (
    <div className="flex min-w-0 flex-col gap-1">
      {onChange ? (
        <input
          type="color"
          aria-label={`${label} color`}
          // A color input has no alpha, so translucent slots keep theirs when picked.
          value={invalid ? "#000000" : value.slice(0, 7)}
          onChange={(event) => onChange(`${event.target.value}${value.slice(7)}`)}
          className="h-[26px] w-full cursor-pointer rounded-[5px] border border-gc-border bg-transparent"
        />
      ) : (
        <span
          aria-hidden
          className="h-[26px] rounded-[5px] border border-gc-border"
          style={{ background: value }}
        />
      )}
      <span className="truncate text-[10.5px] text-gc-ink2">{label}</span>
      {onChange ? (
        <input
          aria-label={`${label} hex`}
          aria-invalid={invalid}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "h-5 w-full rounded border bg-gc-sunken px-1 font-mono text-[9px] text-gc-text outline-none",
            invalid ? "border-gc-fail-base" : "border-gc-border",
          )}
        />
      ) : (
        <span className="font-mono text-[8.5px] text-gc-ink3 uppercase">{value.slice(1)}</span>
      )}
    </div>
  )
}

/** Name and starting theme; the new theme then opens for editing. */
export function NewThemeDialog({
  fromThemeId,
  onClose,
  onCreated,
}: {
  fromThemeId: string | undefined
  onClose: () => void
  onCreated: (themeId: string) => void
}) {
  const themes = useArtifactThemes().data ?? []
  const create = useCreateTheme()
  const [name, setName] = useState("")
  const [from, setFrom] = useState(fromThemeId ?? "dark")
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const theme = await create.mutateAsync({ name: name.trim(), fromThemeId: from })
      onCreated(theme.id)
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the theme")
    }
  }
  return (
    <FormDialog
      title="New theme"
      description="Starts as a copy of another theme, then opens for editing."
      submitLabel="Create theme"
      disabled={create.isPending || !name.trim()}
      onClose={onClose}
      onSubmit={submit}
    >
      <Field label="Name">
        <TextInput
          required
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>
      <Field label="Start from theme">
        <Select value={from} onChange={(event) => setFrom(event.target.value)}>
          {themes.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.name}
            </option>
          ))}
        </Select>
      </Field>
    </FormDialog>
  )
}

export function FormDialog({
  title,
  description,
  submitLabel,
  disabled,
  onClose,
  onSubmit,
  children,
}: {
  title: string
  description: string
  submitLabel: string
  disabled: boolean
  onClose: () => void
  onSubmit: (event: FormEvent) => void
  children: React.ReactNode
}) {
  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-[#06060ACC]" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 w-[420px] max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[10px] border border-gc-border bg-gc-raised outline-none">
          <form onSubmit={onSubmit}>
            <div className="border-b border-gc-border px-[18px] py-4">
              <DialogPrimitive.Title className="text-[15px] font-bold text-gc-text">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-[3px] text-[11.5px] text-gc-ink3">
                {description}
              </DialogPrimitive.Description>
            </div>
            <div className="flex flex-col gap-3 p-[18px]">{children}</div>
            <div className="flex justify-end gap-2 border-t border-gc-border bg-gc-sunken px-[18px] py-[13px]">
              <ActionButton onClick={onClose}>Cancel</ActionButton>
              <ActionButton type="submit" variant="primary" disabled={disabled}>
                {submitLabel}
              </ActionButton>
            </div>
          </form>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

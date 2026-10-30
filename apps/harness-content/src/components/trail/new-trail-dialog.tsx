import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { useNavigate } from "@tanstack/react-router"
import { type FormEvent, useState } from "react"
import { toast } from "sonner"
import { useCreateFlow } from "@/api/flows"
import { ActionButton, Field, Select, TextInput } from "@/components/shell/form-controls"
import { LOCALES } from "@/lib/locales"
import { TRAIL_THEMES } from "@/lib/trail"

export function NewTrailDialog({ onClose }: { onClose: () => void }) {
  const create = useCreateFlow()
  const navigate = useNavigate()
  const [title, setTitle] = useState("")
  const [locale, setLocale] = useState<string>(LOCALES[0])
  const [theme, setTheme] = useState("")

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const flow = await create.mutateAsync({ title, locale, theme: theme || null })
      onClose()
      navigate({ to: "/trails/$flowId", params: { flowId: flow.id } })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the trail")
    }
  }

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-[#06060ACC]" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 w-[420px] max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[10px] border border-gc-border bg-gc-raised outline-none">
          <form onSubmit={submit}>
            <div className="border-b border-gc-border px-[18px] py-4">
              <DialogPrimitive.Title className="text-[15px] font-bold text-gc-text">
                New trail
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-[3px] text-[11.5px] text-gc-ink3">
                A trail plays existing artifacts in order. Each step pins one published version.
              </DialogPrimitive.Description>
            </div>
            <div className="flex flex-col gap-3 p-[18px]">
              <Field label="Title">
                <TextInput
                  required
                  autoFocus
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Onboarding path"
                />
              </Field>
              <Field label="Locale">
                <Select value={locale} onChange={(event) => setLocale(event.target.value)}>
                  {LOCALES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Trail theme">
                <Select value={theme} onChange={(event) => setTheme(event.target.value)}>
                  <option value="">None — each artifact keeps its own</option>
                  {TRAIL_THEMES.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="flex justify-end gap-2 border-t border-gc-border bg-gc-sunken px-[18px] py-[13px]">
              <ActionButton onClick={onClose}>Cancel</ActionButton>
              <ActionButton
                type="submit"
                variant="primary"
                disabled={create.isPending || !title.trim()}
              >
                Create trail
              </ActionButton>
            </div>
          </form>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

import { PlusIcon, XIcon } from "lucide-react"
import type { FieldSpec } from "@/artifacts/plugins/animation/form-fields"
import { Field, Select, TextInput } from "@/components/shell/form-controls"

type Values = Record<string, unknown>

type Props = {
  fields: FieldSpec[]
  value: Values
  onChange: (next: Values) => void
  readOnly: boolean
  /** Prefix for accessible names of nested controls, e.g. "Steps 2". */
  context?: string
}

/** Renders `fields` (from `describeFields`) against `value`; every edit returns the whole object. */
export function SchemaForm({ fields, value, onChange, readOnly, context }: Props) {
  const set = (key: string, next: unknown) => onChange({ ...value, [key]: next })
  return (
    <div className="flex flex-col gap-3">
      {fields.map((spec) => (
        <FieldControl
          key={spec.key}
          spec={spec}
          value={value[spec.key]}
          name={context ? `${context} ${spec.label}` : spec.label}
          readOnly={readOnly}
          onChange={(next) => set(spec.key, next)}
        />
      ))}
    </div>
  )
}

type ControlProps = {
  spec: FieldSpec
  value: unknown
  name: string
  readOnly: boolean
  onChange: (next: unknown) => void
}

function FieldControl({ spec, value, name, readOnly, onChange }: ControlProps) {
  switch (spec.kind) {
    case "text":
      return (
        <Field label={spec.label}>
          {spec.multiline ? (
            <textarea
              aria-label={name}
              disabled={readOnly}
              maxLength={spec.maxLength}
              value={String(value ?? "")}
              onChange={(event) => onChange(event.target.value)}
              className="min-h-16 rounded-md border border-gc-border bg-gc-sunken px-2.5 py-2 text-ui text-gc-text outline-none focus-visible:border-gc-primary"
            />
          ) : (
            <TextInput
              aria-label={name}
              disabled={readOnly}
              maxLength={spec.maxLength}
              value={String(value ?? "")}
              onChange={(event) => onChange(event.target.value)}
            />
          )}
        </Field>
      )
    case "color":
      return (
        <Field label={spec.label}>
          <span className="flex items-center gap-2">
            <input
              type="color"
              aria-label={name}
              disabled={readOnly}
              value={String(value)}
              onChange={(event) => onChange(event.target.value.toUpperCase())}
              className="size-[30px] shrink-0 cursor-pointer rounded-md border border-gc-border bg-gc-sunken p-0.5"
            />
            <span className="font-mono text-ui text-gc-ink2">{String(value)}</span>
          </span>
        </Field>
      )
    case "range":
      return (
        <Field label={spec.label}>
          <span className="flex items-center gap-2">
            <input
              type="range"
              aria-label={name}
              disabled={readOnly}
              min={spec.min}
              max={spec.max}
              step={spec.step}
              value={Number(value)}
              onChange={(event) => onChange(Number(event.target.value))}
              className="min-w-0 flex-1 accent-gc-primary"
            />
            <span className="w-12 text-right font-mono text-ui text-gc-ink2">
              {Number(value)}
              {spec.unit}
            </span>
          </span>
        </Field>
      )
    case "number":
      return (
        <Field label={spec.label}>
          <TextInput
            type="number"
            aria-label={name}
            disabled={readOnly}
            min={spec.min}
            max={spec.max}
            value={Number(value)}
            onChange={(event) => {
              const next = Number(event.target.value)
              if (event.target.value !== "" && Number.isFinite(next)) onChange(next)
            }}
          />
        </Field>
      )
    case "enum":
      return (
        <Field label={spec.label}>
          <Select
            aria-label={name}
            disabled={readOnly}
            value={String(value)}
            onChange={(event) => onChange(event.target.value)}
          >
            {spec.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      )
    case "toggle":
      return (
        <label className="flex items-center gap-2 text-ui text-gc-ink2">
          <input
            type="checkbox"
            aria-label={name}
            disabled={readOnly}
            checked={Boolean(value)}
            onChange={(event) => onChange(event.target.checked)}
            className="accent-gc-primary"
          />
          {spec.label}
        </label>
      )
    case "list":
      return <ListControl spec={spec} value={value} readOnly={readOnly} onChange={onChange} />
  }
}

function ListControl({
  spec,
  value,
  readOnly,
  onChange,
}: Omit<ControlProps, "spec" | "name"> & { spec: Extract<FieldSpec, { kind: "list" }> }) {
  const items = (Array.isArray(value) ? value : []) as Values[]
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 flex w-full items-center justify-between font-mono text-label tracking-[0.5px] text-gc-ink3 uppercase">
        {spec.label}
        <span className="text-label">
          {items.length} / {spec.maxItems}
        </span>
      </legend>
      {items.map((item, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: list entries are positional
        <div key={i} className="relative rounded-md border border-gc-border bg-gc-raised p-2.5">
          <SchemaForm
            fields={spec.item}
            value={item}
            readOnly={readOnly}
            context={`${spec.label} ${i + 1}`}
            onChange={(next) => onChange(items.map((entry, j) => (j === i ? next : entry)))}
          />
          {!readOnly && items.length > spec.minItems && (
            <button
              type="button"
              aria-label={`Remove ${spec.label} ${i + 1}`}
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="absolute top-2 right-2 text-gc-ink3 hover:text-gc-fail-ink"
            >
              <XIcon className="size-3" />
            </button>
          )}
        </div>
      ))}
      {!readOnly && items.length < spec.maxItems && (
        <button
          type="button"
          onClick={() => onChange([...items, { ...spec.itemDefault }])}
          className="flex h-6 items-center justify-center gap-1 rounded-[5px] border border-dashed border-gc-border text-label text-gc-ink2 hover:text-gc-text"
        >
          <PlusIcon className="size-3" />
          Add {spec.label.toLowerCase().replace(/s$/, "")}
        </button>
      )}
    </fieldset>
  )
}

import {
  ArrowRightIcon,
  BarChart3Icon,
  CircleIcon,
  ImageIcon,
  ListIcon,
  LockIcon,
  type LucideIcon,
  MinusIcon,
  PilcrowIcon,
  SquareIcon,
  TypeIcon,
  UnlockIcon,
} from "lucide-react"
import { type ReactNode, useState } from "react"
import { toast } from "sonner"
import { useVersion } from "@/api/queries"
import type { EditorProps } from "@/artifacts/plugin"
import { ChartEditor } from "@/artifacts/plugins/slide/chart-editor"
import { INSERT_MIME } from "@/artifacts/plugins/slide/editor"
import { useSlideActions, useSlideEditor } from "@/artifacts/plugins/slide/editor-context"
import { AlignPanel, LayersPanel } from "@/artifacts/plugins/slide/layers-panel"
import {
  createElement,
  createEmbed,
  type EmbeddedElement,
  FONTS,
  fitEmbedToAspect,
  type InsertKind,
  resolveBackground,
  resolveShape,
  resolveText,
  SLIDE_EMBED_TYPES,
  type SlideContent,
  type SlideElement,
} from "@/artifacts/plugins/slide/model"
import {
  addElement,
  resetToTheme,
  setBackground,
  setTheme,
  updateElement,
  updateStyle,
} from "@/artifacts/plugins/slide/ops"
import { TemplatePicker } from "@/artifacts/plugins/slide/template-picker"
import { THEME_PALETTES, useSlideTheme, useSlideThemes } from "@/artifacts/plugins/slide/themes"
import { embedAspect } from "@/components/embed/embed-aspect"
import { EmbedPicker } from "@/components/embed/embed-picker"
import { EmbedRepin } from "@/components/embed/embedded-artifact"
import { ActionButton } from "@/components/shell/form-controls"
import { PanelHeading, Placeholder } from "@/components/workspace/inspector"
import { cn } from "@/lib/utils"

type PaletteEntry = {
  kind?: InsertKind
  label: string
  icon: LucideIcon
  key?: string
  hint?: string
}

const PALETTE: { group: string; entries: PaletteEntry[] }[] = [
  {
    group: "Text",
    entries: [
      { kind: "title", label: "Title", icon: TypeIcon, key: "T" },
      { kind: "body", label: "Body copy", icon: PilcrowIcon, key: "B" },
      { kind: "bullets", label: "Bullet list", icon: ListIcon, key: "L" },
      { kind: "eyebrow", label: "Eyebrow", icon: TypeIcon },
    ],
  },
  {
    group: "Media",
    entries: [
      { kind: "image", label: "Image", icon: ImageIcon, key: "I" },
      { kind: "chart", label: "Chart", icon: BarChart3Icon, key: "C" },
    ],
  },
  {
    group: "Shapes & lines",
    entries: [
      { kind: "rect", label: "Rectangle", icon: SquareIcon },
      { kind: "ellipse", label: "Ellipse", icon: CircleIcon },
      { kind: "line", label: "Line", icon: MinusIcon },
      { kind: "arrow", label: "Arrow", icon: ArrowRightIcon },
    ],
  },
]

export function SlideInsertPanel({
  content,
  onChange,
  readOnly,
  artifactId,
  locale,
}: EditorProps<SlideContent>) {
  const actions = useSlideActions(content, onChange)
  const { setSelected } = useSlideEditor()
  if (readOnly) return <Placeholder>Elements can be added to drafts you can edit.</Placeholder>
  const insert = (kind: InsertKind) => {
    const element = createElement(kind)
    actions.apply(addElement(content, element))
    setSelected([element.id])
  }
  return (
    <>
      <TemplatePicker content={content} onChange={onChange} />
      {PALETTE.map(({ group, entries }) => (
        <section key={group} className="flex flex-col gap-1.5">
          <PanelHeading label={group} />
          {entries.map((entry) => (
            <button
              key={entry.label}
              type="button"
              draggable={Boolean(entry.kind)}
              disabled={!entry.kind}
              title={entry.hint}
              onDragStart={(event) =>
                entry.kind && event.dataTransfer.setData(INSERT_MIME, entry.kind)
              }
              onClick={() => entry.kind && insert(entry.kind)}
              className="flex h-8 items-center gap-2 rounded-md border border-gc-border bg-gc-sunken px-2.5 text-left text-ui text-gc-ink2 hover:text-gc-text disabled:cursor-not-allowed disabled:opacity-45"
            >
              <entry.icon className="size-3.5 text-gc-ink3" />
              <span className="flex-1">{entry.label}</span>
              {entry.key && (
                <kbd className="rounded-[3px] border border-gc-border bg-gc-raised px-1 font-mono text-label text-gc-ink3">
                  {entry.key}
                </kbd>
              )}
            </button>
          ))}
        </section>
      ))}
      <EmbedPicker
        excludeId={artifactId}
        locale={locale}
        types={SLIDE_EMBED_TYPES}
        onPick={(ref) => {
          const element = createEmbed(ref)
          actions.apply(addElement(content, element))
          setSelected([element.id])
        }}
      />
      <Placeholder>Press D on the canvas to embed from anywhere.</Placeholder>
      <Placeholder>
        Click a block to drop it at the centre of the slide, or drag it onto the canvas.
      </Placeholder>
    </>
  )
}

const fieldClass =
  "h-7 w-full min-w-0 rounded-[5px] border border-gc-border bg-gc-sunken px-2 text-ui text-gc-text outline-none focus:border-gc-primary disabled:opacity-50"

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is passed in as children
    <label className="flex min-w-0 flex-col gap-1">
      <span className="font-mono text-label tracking-[0.5px] text-gc-ink3 uppercase">{label}</span>
      {children}
    </label>
  )
}

function NumberField({
  label,
  value,
  onChange,
  disabled,
  min,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  min?: number
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        className={cn(fieldClass, "font-mono")}
        value={Math.round(value * 100) / 100}
        min={min}
        disabled={disabled}
        onChange={(event) => {
          const next = Number(event.target.value)
          if (event.target.value !== "" && Number.isFinite(next)) onChange(next)
        }}
      />
    </Field>
  )
}

function ColorField({
  label,
  value,
  onChange,
  disabled,
  swatches,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  swatches?: string[]
}) {
  const hex = value.slice(0, 7)
  return (
    <Field label={label}>
      <span className="flex h-7 items-center gap-1.5 rounded-[5px] border border-gc-border bg-gc-sunken px-1.5">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={hex}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="size-4 shrink-0 cursor-pointer border-0 bg-transparent p-0"
        />
        <span className="font-mono text-label text-gc-text">
          {hex.replace("#", "").toUpperCase()}
        </span>
      </span>
      {swatches && (
        <Swatches label={label} colors={swatches} disabled={disabled} onPick={onChange} />
      )}
    </Field>
  )
}

function Swatches({
  label,
  colors,
  disabled,
  onPick,
}: {
  label: string
  colors: string[]
  disabled?: boolean
  onPick: (color: string) => void
}) {
  return (
    <span className="grid grid-cols-4 gap-0.5">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`${label} ${color}`}
          title={color}
          disabled={disabled}
          onClick={() => onPick(color)}
          className="h-3.5 rounded-[2px] border border-gc-border"
          style={{ background: color }}
        />
      ))}
    </span>
  )
}

function EmbedFields({
  element,
  disabled,
  onPatch,
}: {
  element: EmbeddedElement
  disabled: boolean
  onPatch: (patch: Partial<EmbeddedElement>) => void
}) {
  const version = useVersion(element.ref.versionId).data?.version
  const [fitting, setFitting] = useState(false)
  const fit = async () => {
    if (!version) return
    setFitting(true)
    try {
      const aspect = await embedAspect(element.ref.artifactType, version.content)
      onPatch(fitEmbedToAspect(element, aspect))
    } catch {
      toast.error("This embed couldn't be measured.")
    } finally {
      setFitting(false)
    }
  }
  return (
    <>
      <PanelHeading label="Embed" right={`${element.ref.locale} v${element.ref.versionNumber}`} />
      <label className="flex items-center gap-2 text-ui text-gc-ink2">
        <input
          type="checkbox"
          disabled={disabled}
          checked={element.lockAspect}
          onChange={(event) => onPatch({ lockAspect: event.target.checked })}
        />
        Lock aspect
      </label>
      <Field label="Playback">
        <select
          className={fieldClass}
          disabled={disabled}
          value={element.playback}
          onChange={(event) =>
            onPatch({ playback: event.target.value as EmbeddedElement["playback"] })
          }
        >
          <option value="static">Static</option>
          <option value="auto">Plays automatically</option>
        </select>
      </Field>
      <ActionButton disabled={disabled || element.locked || !version || fitting} onClick={fit}>
        Fit to content
      </ActionButton>
      {!disabled && (
        <EmbedRepin
          embed={element.ref}
          onRepin={(ref) => onPatch({ ref: ref as EmbeddedElement["ref"] })}
        />
      )}
    </>
  )
}

const WEIGHTS = [
  [300, "Light"],
  [400, "Regular"],
  [500, "Medium"],
  [600, "Semibold"],
  [700, "Bold"],
] as const

export function SlideFormatPanel({ content, onChange, readOnly }: EditorProps<SlideContent>) {
  const actions = useSlideActions(content, onChange)
  const { selected } = useSlideEditor()
  const theme = useSlideTheme(content.theme)
  const themes = useSlideThemes()
  const elements = content.elements.filter((el) => selected.includes(el.id))
  const single: SlideElement | undefined = elements.length === 1 ? elements[0] : undefined
  const background = resolveBackground(content)
  const ids = elements.map((el) => el.id)
  const disabled = readOnly
  const palette = THEME_PALETTES[content.theme]
  const style = (patch: Record<string, unknown>, group: string) =>
    actions.apply(updateStyle(content, ids, patch), group)

  return (
    <>
      <PanelHeading label="Theme" right={theme.label} />
      <div className="grid grid-cols-3 gap-1.5 rounded-[7px] border border-gc-border bg-gc-sunken p-2">
        {themes.map((option) => {
          const { id } = option
          const swatchBg =
            option.background.kind === "flat" ? option.background.color : option.background.to
          return (
            <button
              key={id}
              type="button"
              aria-pressed={id === content.theme}
              disabled={disabled}
              onClick={() => actions.apply(setTheme(content, id))}
              className={cn(
                "flex flex-col items-center gap-1 rounded-[5px] border bg-gc-raised p-1",
                id === content.theme ? "border-[1.5px] border-gc-primary" : "border-gc-border",
              )}
            >
              <span className="flex h-[13px] w-full overflow-hidden rounded-[3px]">
                {[swatchBg, option.accent, option.text].map((color, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: three fixed swatch slots
                  <span key={index} className="flex-1" style={{ background: color }} />
                ))}
              </span>
              <span
                className={cn(
                  "w-full truncate text-center font-mono text-label tracking-[0.4px] uppercase",
                  id === content.theme ? "text-gc-text" : "text-gc-ink3",
                )}
              >
                {option.label}
              </span>
            </button>
          )
        })}
      </div>

      <LayersPanel content={content} onChange={onChange} readOnly={readOnly} />
      <AlignPanel content={content} onChange={onChange} readOnly={readOnly} />

      {elements.length === 0 && (
        <Placeholder>Select an element on the canvas to arrange and style it.</Placeholder>
      )}

      {single && (
        <>
          <PanelHeading
            label="Arrange"
            right={
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  actions.apply(updateElement(content, single.id, { locked: !single.locked }))
                }
                className="flex items-center gap-1 normal-case"
              >
                {single.locked ? (
                  <LockIcon className="size-3" />
                ) : (
                  <UnlockIcon className="size-3" />
                )}
                {single.locked ? "Locked" : "Unlocked"}
              </button>
            }
          />
          <div className="grid grid-cols-3 gap-2">
            {(["x", "y", "rotation", "width", "height"] as const).map((key) => (
              <NumberField
                key={key}
                label={key === "rotation" ? "Rotate°" : key.toUpperCase()}
                value={single[key]}
                min={key === "width" || key === "height" ? 1 : undefined}
                disabled={disabled || single.locked}
                onChange={(value) =>
                  actions.apply(
                    updateElement(content, single.id, { [key]: value }),
                    `arrange:${key}`,
                  )
                }
              />
            ))}
          </div>
        </>
      )}

      {single?.type === "text" && (
        <TypographyFields
          element={single}
          content={content}
          disabled={disabled}
          onStyle={style}
          onText={(text) => actions.apply(updateElement(content, single.id, { text }), "text")}
        />
      )}

      {single?.type === "chart" && (
        <ChartEditor chart={single} content={content} onChange={onChange} readOnly={disabled} />
      )}

      {single?.type === "embed" && (
        <EmbedFields
          element={single}
          disabled={disabled}
          onPatch={(patch) => actions.apply(updateElement(content, single.id, patch))}
        />
      )}

      {single &&
        single.type !== "text" &&
        single.type !== "image" &&
        single.type !== "chart" &&
        single.type !== "embed" && (
          <>
            <PanelHeading
              label={single.type === "line" || single.type === "arrow" ? "Stroke" : "Shape"}
            />
            <div className="grid grid-cols-2 gap-2">
              {single.type !== "line" && single.type !== "arrow" && (
                <ColorField
                  label="Fill"
                  value={resolveShape(single, theme).fill}
                  disabled={disabled}
                  swatches={palette?.colors}
                  onChange={(fill) => style({ fill }, "style:fill")}
                />
              )}
              <ColorField
                label="Stroke"
                value={resolveShape(single, theme).stroke}
                disabled={disabled}
                swatches={palette?.colors}
                onChange={(stroke) => style({ stroke }, "style:stroke")}
              />
              <NumberField
                label="Stroke width"
                min={0}
                value={resolveShape(single, theme).strokeWidth}
                disabled={disabled}
                onChange={(strokeWidth) => style({ strokeWidth }, "style:strokeWidth")}
              />
              {single.type === "rect" && (
                <NumberField
                  label="Radius"
                  min={0}
                  value={resolveShape(single, theme).cornerRadius}
                  disabled={disabled}
                  onChange={(cornerRadius) => style({ cornerRadius }, "style:radius")}
                />
              )}
            </div>
          </>
        )}

      {single?.type === "image" && (
        <>
          <PanelHeading label="Image" />
          <Field label="URL">
            <input
              className={fieldClass}
              disabled={disabled}
              placeholder="https://…"
              value={single.src}
              onChange={(event) =>
                actions.apply(
                  updateElement(content, single.id, { src: event.target.value }),
                  "image:src",
                )
              }
            />
          </Field>
          <Field label="Alt text">
            <input
              className={fieldClass}
              disabled={disabled}
              value={single.alt}
              onChange={(event) =>
                actions.apply(
                  updateElement(content, single.id, { alt: event.target.value }),
                  "image:alt",
                )
              }
            />
          </Field>
          <Field label="Fit">
            <select
              className={fieldClass}
              disabled={disabled}
              value={single.fit}
              onChange={(event) =>
                actions.apply(updateElement(content, single.id, { fit: event.target.value }))
              }
            >
              <option value="cover">Cover (crop)</option>
              <option value="contain">Contain</option>
            </select>
          </Field>
        </>
      )}

      <div className="h-px shrink-0 bg-gc-divider" />
      <PanelHeading label="Background" />
      <div className="grid grid-cols-3 gap-1 rounded-md border border-gc-border bg-gc-sunken p-0.5">
        {(
          [
            ["theme", "Theme default"],
            ["flat", "Flat"],
            ["gradient", "Gradient"],
          ] as const
        ).map(([kind, label]) => {
          const active = kind === "theme" ? !content.background : content.background?.kind === kind
          return (
            <button
              key={kind}
              type="button"
              aria-pressed={active}
              disabled={disabled}
              onClick={() => {
                if (kind === "theme") actions.apply(setBackground(content, undefined))
                else if (kind === "flat") {
                  const color = background.kind === "flat" ? background.color : background.to
                  actions.apply(setBackground(content, { kind: "flat", color }))
                } else {
                  const from = background.kind === "gradient" ? background.from : theme.accent
                  const to = background.kind === "gradient" ? background.to : background.color
                  actions.apply(setBackground(content, { kind: "gradient", from, to, angle: 125 }))
                }
              }}
              className={cn(
                "h-6 rounded-[5px] text-label",
                active ? "bg-gc-row-bg font-semibold text-gc-nav-ink" : "text-gc-ink3",
              )}
            >
              {label}
            </button>
          )
        })}
      </div>
      {palette && (
        <Swatches
          label="Background"
          colors={palette.backgrounds}
          disabled={disabled}
          onPick={(color) => actions.apply(setBackground(content, { kind: "flat", color }), "bg")}
        />
      )}
      {background.kind === "flat" && content.background && (
        <ColorField
          label="Color"
          value={background.color}
          disabled={disabled}
          onChange={(color) => actions.apply(setBackground(content, { kind: "flat", color }), "bg")}
        />
      )}
      {background.kind === "gradient" && content.background && (
        <div className="grid grid-cols-3 gap-2">
          <ColorField
            label="From"
            value={background.from}
            disabled={disabled}
            onChange={(from) =>
              actions.apply(setBackground(content, { ...background, from }), "bg")
            }
          />
          <ColorField
            label="To"
            value={background.to}
            disabled={disabled}
            onChange={(to) => actions.apply(setBackground(content, { ...background, to }), "bg")}
          />
          <NumberField
            label="Angle°"
            value={background.angle}
            disabled={disabled}
            onChange={(angle) =>
              actions.apply(setBackground(content, { ...background, angle }), "bg")
            }
          />
        </div>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => actions.apply(resetToTheme(content, ids.length ? ids : undefined))}
        className="h-7 rounded-md border border-gc-border bg-gc-sunken text-ui text-gc-ink2 hover:text-gc-text disabled:opacity-50"
      >
        {ids.length ? "Reset selection to theme" : "Reset to theme defaults"}
      </button>
    </>
  )
}

function TypographyFields({
  element,
  content,
  disabled,
  onStyle,
  onText,
}: {
  element: Extract<SlideElement, { type: "text" }>
  content: SlideContent
  disabled: boolean
  onStyle: (patch: Record<string, unknown>, group: string) => void
  onText: (text: string) => void
}) {
  const resolved = resolveText(element, useSlideTheme(content.theme))
  return (
    <>
      <PanelHeading label="Typography" right={element.variant} />
      <Field label="Text">
        <textarea
          className={cn(fieldClass, "h-16 py-1.5")}
          disabled={disabled}
          value={element.text}
          onChange={(event) => onText(event.target.value)}
        />
      </Field>
      <Field label="Font name">
        <select
          className={fieldClass}
          disabled={disabled}
          value={resolved.fontFamily}
          onChange={(event) => onStyle({ fontFamily: event.target.value }, "style:font")}
        >
          {Object.values(FONTS).map((font) => (
            <option key={font} value={font}>
              {font.replace(" Variable", "")}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <NumberField
          label="Size px"
          min={8}
          value={resolved.fontSize}
          disabled={disabled}
          onChange={(fontSize) => onStyle({ fontSize }, "style:size")}
        />
        <Field label="Weight">
          <select
            className={fieldClass}
            disabled={disabled}
            value={resolved.fontWeight}
            onChange={(event) =>
              onStyle({ fontWeight: Number(event.target.value) }, "style:weight")
            }
          >
            {WEIGHTS.map(([weight, label]) => (
              <option key={weight} value={weight}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <ColorField
          label="Color"
          value={resolved.color}
          disabled={disabled}
          swatches={THEME_PALETTES[content.theme]?.colors}
          onChange={(color) => onStyle({ color }, "style:color")}
        />
      </div>
      <Field label="Align">
        <select
          className={fieldClass}
          disabled={disabled}
          value={resolved.align}
          onChange={(event) => onStyle({ align: event.target.value }, "style:align")}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </Field>
    </>
  )
}

import { useState } from "react"
import type { EditorProps } from "@/artifacts/plugin"
import { useDiagramEditor } from "@/artifacts/plugins/diagram/editor-context"
import {
  DIRECTIONS,
  type DiagramContent,
  type DiagramEdge,
  type DiagramNode,
  ENGINE_LABELS,
  ENGINES,
  type Engine,
  type FlowDiagram,
  NODE_SHAPES,
  NODE_TONES,
  nextNodeId,
  switchEngine,
} from "@/artifacts/plugins/diagram/model"
import { useSlideTheme, useSlideThemes } from "@/artifacts/plugins/slide/themes"
import { ActionButton, Field, Select, TextInput } from "@/components/shell/form-controls"
import { PanelHeading, Placeholder } from "@/components/workspace/inspector"
import { cn } from "@/lib/utils"

const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

function ThemePicker({ content, onChange, readOnly }: EditorProps<DiagramContent>) {
  const theme = useSlideTheme(content.theme)
  const themes = useSlideThemes()
  return (
    <>
      <PanelHeading label="Theme" right={theme.label} />
      <div className="grid grid-cols-3 gap-1.5 rounded-[7px] border border-gc-border bg-gc-sunken p-2">
        {themes.map((option) => {
          const active = option.id === content.theme
          const swatch =
            option.background.kind === "flat" ? option.background.color : option.background.to
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              disabled={readOnly}
              onClick={() => onChange({ ...content, theme: option.id })}
              className={cn(
                "flex flex-col items-center gap-1 rounded-[5px] border bg-gc-raised p-1",
                active ? "border-[1.5px] border-gc-primary" : "border-gc-border",
              )}
            >
              <span className="flex h-[13px] w-full overflow-hidden rounded-[3px]">
                {[swatch, option.accent, option.text].map((color) => (
                  <span key={color} className="flex-1" style={{ background: color }} />
                ))}
              </span>
              <span
                className={cn(
                  "w-full truncate text-center font-mono text-label tracking-[0.4px] uppercase",
                  active ? "text-gc-text" : "text-gc-ink3",
                )}
              >
                {option.label}
              </span>
            </button>
          )
        })}
      </div>
    </>
  )
}

function FlowFormat({ content, onChange, readOnly }: EditorProps<FlowDiagram>) {
  const { selection } = useDiagramEditor()
  const node = content.nodes.find((n) => selection.nodes.includes(n.id))
  const edge = content.edges.find((e) => selection.edges.includes(e.id))
  const patchNode = (id: string, patch: Partial<DiagramNode>) =>
    onChange({
      ...content,
      nodes: content.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    })
  const patchEdge = (id: string, patch: Partial<DiagramEdge>) =>
    onChange({
      ...content,
      edges: content.edges.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })
  return (
    <>
      <PanelHeading label="Layout" />
      <Field label="Direction">
        <Select
          disabled={readOnly}
          value={content.direction}
          onChange={(event) =>
            onChange({ ...content, direction: event.target.value as FlowDiagram["direction"] })
          }
        >
          {DIRECTIONS.map((direction) => (
            <option key={direction} value={direction}>
              {direction === "LR" ? "Left to right" : "Top to bottom"}
            </option>
          ))}
        </Select>
      </Field>
      {node && (
        <>
          <PanelHeading label="Node" right={node.id} />
          <Field label="Label">
            <TextInput
              disabled={readOnly}
              maxLength={80}
              value={node.label}
              onChange={(event) => patchNode(node.id, { label: event.target.value })}
            />
          </Field>
          <Field label="Shape">
            <Select
              disabled={readOnly}
              value={node.shape}
              onChange={(event) =>
                patchNode(node.id, { shape: event.target.value as DiagramNode["shape"] })
              }
            >
              {NODE_SHAPES.map((shape) => (
                <option key={shape} value={shape}>
                  {titleCase(shape)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Colour">
            <Select
              disabled={readOnly}
              value={node.tone}
              onChange={(event) =>
                patchNode(node.id, { tone: event.target.value as DiagramNode["tone"] })
              }
            >
              {NODE_TONES.map((tone) => (
                <option key={tone} value={tone}>
                  {titleCase(tone)}
                </option>
              ))}
            </Select>
          </Field>
        </>
      )}
      {edge && (
        <>
          <PanelHeading label="Connection" right={edge.id} />
          <Field label="Label">
            <TextInput
              disabled={readOnly}
              maxLength={60}
              value={edge.label}
              onChange={(event) => patchEdge(edge.id, { label: event.target.value })}
            />
          </Field>
          <label className="flex items-center gap-2 text-ui text-gc-ink2">
            <input
              type="checkbox"
              disabled={readOnly}
              checked={edge.animated}
              onChange={(event) => patchEdge(edge.id, { animated: event.target.checked })}
            />
            Animated
          </label>
        </>
      )}
      {!node && !edge && (
        <Placeholder>
          Select a node or connection to edit it. Drag between handles to connect; press Delete to
          remove.
        </Placeholder>
      )}
    </>
  )
}

export function DiagramFormatPanel(props: EditorProps<DiagramContent>) {
  const { content } = props
  return (
    <>
      <ThemePicker {...props} />
      {content.engine === "flow" ? (
        <FlowFormat {...(props as EditorProps<FlowDiagram>)} />
      ) : (
        <Placeholder>
          Edit the Mermaid source beside the preview; errors appear under it.
        </Placeholder>
      )}
    </>
  )
}

/** Adds a node below the existing ones, so it never lands on top of another. */
export function addNode(content: FlowDiagram, shape: DiagramNode["shape"]): FlowDiagram {
  const y = content.nodes.length ? Math.max(...content.nodes.map((n) => n.y)) + 140 : 0
  const node: DiagramNode = {
    id: nextNodeId(content),
    label: "New node",
    x: 0,
    y,
    shape,
    tone: "neutral",
  }
  return { ...content, nodes: [...content.nodes, node] }
}

export function DiagramInsertPanel(props: EditorProps<DiagramContent>) {
  const { content, onChange, readOnly } = props
  const [replacing, setReplacing] = useState<Engine | null>(null)
  const other = ENGINES.filter((engine) => engine !== content.engine)
  return (
    <>
      {content.engine === "flow" && (
        <>
          <PanelHeading label="Nodes" />
          <div className="flex flex-col gap-1.5">
            {NODE_SHAPES.map((shape) => (
              <ActionButton
                key={shape}
                disabled={readOnly}
                onClick={() => onChange(addNode(content, shape))}
              >
                Add {shape}
              </ActionButton>
            ))}
          </div>
        </>
      )}
      <PanelHeading label="Engine" right={ENGINE_LABELS[content.engine].label} />
      {other.map((engine) =>
        replacing === engine ? (
          <ActionButton
            key={engine}
            variant="primary"
            disabled={readOnly}
            onClick={() => {
              setReplacing(null)
              onChange(switchEngine(content, engine))
            }}
          >
            Replace this diagram with a {ENGINE_LABELS[engine].label} starter
          </ActionButton>
        ) : (
          <ActionButton key={engine} disabled={readOnly} onClick={() => setReplacing(engine)}>
            Switch to {ENGINE_LABELS[engine].label}
          </ActionButton>
        ),
      )}
    </>
  )
}

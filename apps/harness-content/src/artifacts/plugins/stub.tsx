import { useEffect, useState } from "react"
import { z } from "zod"
import type { ArtifactType } from "@/api/client"
import type { ArtifactPlugin } from "@/artifacts/plugin"

/** Placeholder until each type's editor lands: any object tagged with the type, edited as JSON. */
export function createStubPlugin(type: ArtifactType): ArtifactPlugin<StubContent> {
  const schema = z.looseObject({ schemaVersion: z.literal(1), type: z.literal(type) })
  return {
    type,
    schemaVersion: 1,
    schema,
    createEmpty: () => ({ schemaVersion: 1, type }),
    migrate: (_from, content) => content,
    extractAssets: () => [],
    getSearchText: (content) => JSON.stringify(content),
    Editor: ({ content, onChange, readOnly }) => (
      <JsonEditor
        value={content}
        readOnly={readOnly}
        onChange={(next) => {
          const parsed = schema.safeParse(next)
          if (parsed.success) onChange(parsed.data)
          return parsed.success ? null : (parsed.error.issues[0]?.message ?? "Invalid content")
        }}
      />
    ),
    Renderer: ({ content }) => (
      <pre className="max-h-full overflow-auto rounded-md bg-gc-raised p-4 font-mono text-[11px] text-gc-ink2">
        {JSON.stringify(content, null, 2)}
      </pre>
    ),
    stageLabel: "JSON",
  }
}

export type StubContent = { schemaVersion: 1; type: ArtifactType; [key: string]: unknown }

type JsonEditorProps = {
  value: unknown
  readOnly: boolean
  /** Returns an error message, or `null` once the value was accepted. */
  onChange: (next: unknown) => string | null
}

function JsonEditor({ value, readOnly, onChange }: JsonEditorProps) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setText((current) => {
      try {
        if (JSON.stringify(JSON.parse(current)) === JSON.stringify(value)) return current
      } catch {
        // The draft text is mid-edit; keep it.
        return current
      }
      return JSON.stringify(value, null, 2)
    })
  }, [value])

  const edit = (next: string) => {
    setText(next)
    try {
      setError(onChange(JSON.parse(next)))
    } catch {
      setError("Not valid JSON yet")
    }
  }

  return (
    <div className="flex h-full w-full max-w-3xl flex-col gap-2">
      <textarea
        aria-label="Content JSON"
        spellCheck={false}
        readOnly={readOnly}
        value={text}
        onChange={(event) => edit(event.target.value)}
        className="min-h-0 flex-1 resize-none rounded-md border border-gc-border bg-gc-raised p-4 font-mono text-[11px] leading-relaxed text-gc-text outline-none focus:border-gc-primary"
      />
      <p
        role="status"
        className={error ? "text-[11px] text-gc-fail-ink" : "text-[11px] text-gc-ink3"}
      >
        {error ?? "Structured content, edited as JSON until this type's visual editor arrives."}
      </p>
    </div>
  )
}

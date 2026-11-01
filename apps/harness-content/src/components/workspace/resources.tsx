import {
  DownloadIcon,
  FileIcon,
  FileTextIcon,
  ImageIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react"
import { type ReactNode, useEffect, useId, useRef, useState } from "react"
import Markdown from "react-markdown"
import { toast } from "sonner"
import "@fontsource/cormorant-garamond/600.css"
import { downloadAsset, useAssetMutations, useAssetText, useAssetUrl } from "@/api/assets"
import { Caption } from "@/components/labels"
import { ActionButton } from "@/components/shell/form-controls"
import {
  ACCEPT,
  type Asset,
  fileProblem,
  filterResources,
  formatBytes,
  isEditable,
  resourceKind,
  typeChip,
  uniqueName,
} from "@/lib/resources"
import { relativeTime } from "@/lib/stamps"
import { cn } from "@/lib/utils"

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error))

type ListProps = {
  artifactId: string
  assets: Asset[]
  selectedId: string | null
  onSelect: (id: string) => void
  readOnly: boolean
  onCollapse: (collapsed: boolean) => void
  collapsed: boolean
}

/** The inspector side of the Resources tab: search, notes, files and the drop zone. */
export function ResourcesInspector({
  artifactId,
  assets,
  selectedId,
  onSelect,
  readOnly,
  collapsed,
  onCollapse,
}: ListProps) {
  const [query, setQuery] = useState("")
  const { upload } = useAssetMutations(artifactId)
  const shown = filterResources(assets, query)
  const notes = shown.filter((asset) => resourceKind(asset) === "note")
  const files = shown.filter((asset) => resourceKind(asset) !== "note")

  const attach = async (list: FileList | File[]) => {
    for (const file of Array.from(list)) {
      const problem = fileProblem(file)
      if (problem) {
        toast.error(problem)
        continue
      }
      try {
        const created = await upload.mutateAsync(file)
        onSelect(created.id)
        toast.success(`Attached ${created.name}`)
      } catch (error) {
        toast.error(errorText(error))
      }
    }
  }
  const newNote = () => {
    const name = uniqueName(
      "untitled-note.md",
      assets.map((asset) => asset.name),
    )
    attach([new File([""], name, { type: "text/markdown" })])
  }

  if (collapsed) {
    return (
      <aside
        aria-label="Resources"
        className="flex w-11 shrink-0 flex-col items-center border-l border-gc-border bg-gc-raised py-2.5"
      >
        <IconButton label="Expand resources" onClick={() => onCollapse(false)}>
          <PanelRightOpenIcon />
        </IconButton>
      </aside>
    )
  }
  return (
    <aside
      aria-label="Resources"
      className="flex w-[300px] shrink-0 flex-col border-l border-gc-border bg-gc-raised"
    >
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-gc-border px-3">
        <span className="font-mono text-label tracking-[0.5px] text-gc-ink3">RESOURCES</span>
        <IconButton label="Collapse resources" onClick={() => onCollapse(true)}>
          <PanelRightCloseIcon />
        </IconButton>
      </div>
      <div className="flex h-9 shrink-0 items-center border-b border-gc-border px-2.5">
        <label className="flex h-6 w-full items-center gap-[7px] rounded-[5px] border border-gc-border bg-gc-sunken px-2 focus-within:border-gc-primary">
          <SearchIcon aria-hidden className="size-[11px] shrink-0 text-gc-ink3" />
          <span className="sr-only">Search notes and files</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search notes and files"
            className="min-w-0 flex-1 bg-transparent text-ui text-gc-text outline-none placeholder:text-gc-ink3"
          />
        </label>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-[9px] overflow-y-auto p-3 *:shrink-0">
        <ResourceGroup
          title="Notes"
          count={notes.length}
          action={
            readOnly ? undefined : (
              <IconButton label="New note" onClick={newNote} disabled={upload.isPending}>
                <PlusIcon />
              </IconButton>
            )
          }
        >
          {notes.map((asset) => (
            <ResourceRow
              key={asset.id}
              asset={asset}
              selected={asset.id === selectedId}
              onSelect={onSelect}
            />
          ))}
          {notes.length === 0 && <Empty>{query ? "No matching notes" : "No notes yet"}</Empty>}
        </ResourceGroup>
        <ResourceGroup title="Files" count={files.length}>
          {files.map((asset) => (
            <ResourceRow
              key={asset.id}
              asset={asset}
              selected={asset.id === selectedId}
              onSelect={onSelect}
            />
          ))}
          {files.length === 0 && <Empty>{query ? "No matching files" : "No files yet"}</Empty>}
        </ResourceGroup>
        {!readOnly && <DropZone busy={upload.isPending} onFiles={attach} />}
      </div>
    </aside>
  )
}

function ResourceGroup({
  title,
  count,
  action,
  children,
}: {
  title: string
  count: number
  action?: ReactNode
  children: ReactNode
}) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="flex flex-col gap-1">
      <div className="flex items-center justify-between pb-1">
        <span className="flex items-center gap-[7px]">
          <h2 id={id} className="font-mono text-label tracking-[0.5px] text-gc-ink3 uppercase">
            {title}
          </h2>
          <span className="rounded-[3px] bg-gc-sunken px-[5px] font-mono text-label text-gc-ink2">
            {count}
          </span>
        </span>
        {action}
      </div>
      <ul className="flex flex-col gap-1">{children}</ul>
    </section>
  )
}

const KIND_ICON = { note: FileTextIcon, text: FileTextIcon, image: ImageIcon, pdf: FileIcon }

function ResourceRow({
  asset,
  selected,
  onSelect,
}: {
  asset: Asset
  selected: boolean
  onSelect: (id: string) => void
}) {
  const Icon = KIND_ICON[resourceKind(asset)]
  return (
    <li>
      <button
        type="button"
        aria-current={selected ? "true" : undefined}
        onClick={() => onSelect(asset.id)}
        className={cn(
          "flex h-[38px] w-full items-center gap-[9px] rounded-md border px-2 text-left",
          selected
            ? "border-gc-primary bg-gc-row-bg"
            : "border-transparent hover:bg-gc-row-bg focus-visible:border-gc-primary",
        )}
      >
        <span
          className={cn(
            "flex size-[22px] shrink-0 items-center justify-center rounded-[5px]",
            selected ? "bg-gc-done-tint text-gc-done-ink" : "bg-gc-sunken text-gc-ink2",
          )}
        >
          <Icon aria-hidden className="size-[11px]" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span
            className={cn(
              "truncate text-ui",
              selected ? "font-semibold text-gc-text" : "text-gc-ink2",
            )}
          >
            {asset.name}
          </span>
          <span className="truncate font-mono text-label tracking-[0.4px] text-gc-ink3">
            {typeChip(asset)} · {formatBytes(asset.sizeBytes)} · {relativeTime(asset.updatedAt)}
          </span>
        </span>
      </button>
    </li>
  )
}

function DropZone({ busy, onFiles }: { busy: boolean; onFiles: (files: FileList) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => input.current?.click()}
      onDragOver={(event) => {
        event.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault()
        setOver(false)
        onFiles(event.dataTransfer.files)
      }}
      className={cn(
        "flex h-[62px] flex-col items-center justify-center gap-[5px] rounded-[7px] border border-dashed bg-gc-sunken disabled:opacity-60",
        over ? "border-gc-primary" : "border-gc-border",
      )}
    >
      <span className="flex items-center gap-1.5 text-ui text-gc-ink2">
        <UploadIcon aria-hidden className="size-[11px]" />
        {busy ? "Uploading…" : "Drop a file to attach"}
      </span>
      <span className="font-mono text-label tracking-[0.4px] text-gc-ink3">
        MD · PDF · PNG — MAX 20 MB
      </span>
      <input
        ref={input}
        type="file"
        multiple
        accept={ACCEPT}
        aria-label="Attach files"
        className="hidden"
        onChange={(event) => {
          if (event.target.files) onFiles(event.target.files)
          event.target.value = ""
        }}
      />
    </button>
  )
}

type StageProps = {
  artifactId: string
  asset: Asset | undefined
  readOnly: boolean
  onDeleted: () => void
}

type OpenProps = Omit<StageProps, "asset"> & { asset: Asset }

/** The centre of the Resources tab: the open note (Write / Preview) or a file preview. */
export function ResourceStage({ artifactId, asset, readOnly, onDeleted }: StageProps) {
  if (!asset) {
    return (
      <StageFrame>
        <p className="m-auto max-w-sm text-center text-ui leading-relaxed text-gc-ink3">
          Notes and files here belong to the artifact, in every locale and version. Pick one on the
          right{readOnly ? "." : ", or add a note or drop a file."}
        </p>
      </StageFrame>
    )
  }
  return isEditable(asset) ? (
    <NoteStage
      key={asset.id}
      artifactId={artifactId}
      asset={asset}
      readOnly={readOnly}
      onDeleted={onDeleted}
    />
  ) : (
    <FileStage artifactId={artifactId} asset={asset} readOnly={readOnly} onDeleted={onDeleted} />
  )
}

function StageFrame({ bar, children }: { bar?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {bar}
      <div className="flex min-h-0 flex-1 flex-col gap-3 bg-gc-sunken p-[18px]">{children}</div>
    </div>
  )
}

function NoteStage({ artifactId, asset, readOnly, onDeleted }: OpenProps) {
  const text = useAssetText(asset.id, asset.revision)
  const { write } = useAssetMutations(artifactId)
  const [draft, setDraft] = useState<string | null>(null)
  const [mode, setMode] = useState<"write" | "preview">(readOnly ? "preview" : "write")
  const saved = text.data ?? ""
  const value = draft ?? saved
  const dirty = draft !== null && draft !== saved
  const isNote = resourceKind(asset) === "note"

  const save = async () => {
    if (!dirty || write.isPending) return
    try {
      await write.mutateAsync({ id: asset.id, revision: asset.revision, text: value })
      setDraft(null)
    } catch (error) {
      toast.error(`Could not save ${asset.name}: ${errorText(error)}`)
    }
  }
  const saveRef = useRef(save)
  saveRef.current = save
  // Leaving a note (switching resources or tabs) keeps its edits.
  useEffect(() => () => void saveRef.current(), [])

  const bar = (
    <div className="flex h-10 shrink-0 items-center justify-end gap-1.5 border-b border-gc-border px-4">
      {isNote && (
        <fieldset className="flex h-6 items-center gap-0.5 rounded-md border border-gc-border bg-gc-sunken p-0.5">
          <legend className="sr-only">View mode</legend>
          {(["write", "preview"] as const).map((entry) => (
            <button
              key={entry}
              type="button"
              aria-pressed={mode === entry}
              aria-label={`${entry} note`}
              disabled={readOnly && entry === "write"}
              onClick={() => setMode(entry)}
              className={cn(
                "h-full rounded px-[9px] text-label capitalize disabled:opacity-40",
                mode === entry ? "bg-gc-raised font-semibold text-gc-text" : "text-gc-ink3",
              )}
            >
              {entry}
            </button>
          ))}
        </fieldset>
      )}
      {!readOnly && (
        <ActionButton onClick={save} disabled={!dirty || write.isPending}>
          {write.isPending ? "Saving…" : "Save note"}
        </ActionButton>
      )}
    </div>
  )
  return (
    <StageFrame bar={bar}>
      <StageHeader
        artifactId={artifactId}
        asset={asset}
        readOnly={readOnly}
        onDeleted={onDeleted}
        status={dirty ? "UNSAVED" : undefined}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-lg border border-gc-border bg-gc-raised">
        {text.isPending ? (
          <Caption className="p-5">Loading…</Caption>
        ) : text.error ? (
          <p role="alert" className="p-5 text-ui text-gc-fail-ink">
            {errorText(text.error)}
          </p>
        ) : mode === "preview" && isNote ? (
          <MarkdownPreview text={value} />
        ) : (
          <textarea
            aria-label={`${asset.name} content`}
            readOnly={readOnly}
            value={value}
            spellCheck
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "s") {
                event.preventDefault()
                save()
              }
            }}
            placeholder={isNote ? "## Heading\n\nWrite markdown…" : ""}
            className="min-h-0 flex-1 resize-none bg-transparent p-5 font-mono text-body leading-[1.6] text-gc-text outline-none placeholder:text-gc-ink3"
          />
        )}
      </div>
    </StageFrame>
  )
}

function FileStage({ artifactId, asset, readOnly, onDeleted }: OpenProps) {
  const kind = resourceKind(asset)
  const url = useAssetUrl(asset.id, asset.revision, kind === "image")
  return (
    <StageFrame>
      <StageHeader
        artifactId={artifactId}
        asset={asset}
        readOnly={readOnly}
        onDeleted={onDeleted}
      />
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-lg border border-gc-border bg-gc-raised p-5">
        {kind === "image" ? (
          url ? (
            <img src={url} alt={asset.name} className="max-h-full max-w-full object-contain" />
          ) : (
            <Caption>Loading preview…</Caption>
          )
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <FileIcon aria-hidden className="size-8 text-gc-ink3" />
            <p className="text-ui text-gc-ink2">{typeChip(asset)} files open in your own viewer.</p>
            <ActionButton onClick={() => downloadAsset(asset.id, asset.name)}>
              <DownloadIcon aria-hidden />
              Download {asset.name}
            </ActionButton>
          </div>
        )}
      </div>
    </StageFrame>
  )
}

function StageHeader({
  artifactId,
  asset,
  readOnly,
  onDeleted,
  status,
}: OpenProps & { status?: string }) {
  const { rename, remove } = useAssetMutations(artifactId)
  const [name, setName] = useState(asset.name)
  const [confirming, setConfirming] = useState(false)
  useEffect(() => setName(asset.name), [asset.name])

  const commitName = async () => {
    const next = name.trim()
    if (!next || next === asset.name) {
      setName(asset.name)
      return
    }
    try {
      await rename.mutateAsync({ id: asset.id, revision: asset.revision, name: next })
    } catch (error) {
      toast.error(errorText(error))
      setName(asset.name)
    }
  }
  const destroy = async () => {
    try {
      await remove.mutateAsync(asset.id)
      onDeleted()
      toast.success(`Deleted ${asset.name}`)
    } catch (error) {
      toast.error(errorText(error))
    }
    setConfirming(false)
  }
  const kindLabel = resourceKind(asset) === "note" ? "MARKDOWN" : typeChip(asset)

  return (
    <div className="flex shrink-0 items-center gap-[9px]">
      {readOnly ? (
        <span className="text-body font-semibold text-gc-text">{asset.name}</span>
      ) : (
        <input
          aria-label="Resource name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={commitName}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur()
            if (event.key === "Escape") setName(asset.name)
          }}
          className="min-w-0 rounded border border-transparent bg-transparent px-1 text-body font-semibold text-gc-text outline-none [field-sizing:content] hover:border-gc-border focus:border-gc-primary"
        />
      )}
      <span className="rounded-[3px] bg-gc-done-tint px-1.5 py-0.5 font-mono text-label tracking-[0.5px] text-gc-done-ink">
        {kindLabel}
      </span>
      <Caption className="tracking-[0.4px]">
        {status ?? `EDITED ${relativeTime(asset.updatedAt).toUpperCase()}`} ·{" "}
        {formatBytes(asset.sizeBytes)}
      </Caption>
      {!readOnly && (
        <span className="ml-auto flex items-center gap-1.5">
          {confirming ? (
            <>
              <span className="text-ui text-gc-ink2">Delete {asset.name}?</span>
              <ActionButton onClick={destroy} disabled={remove.isPending}>
                Delete
              </ActionButton>
              <ActionButton onClick={() => setConfirming(false)}>Keep</ActionButton>
            </>
          ) : (
            <IconButton label={`Delete ${asset.name}`} onClick={() => setConfirming(true)}>
              <Trash2Icon />
            </IconButton>
          )}
        </span>
      )}
    </div>
  )
}

const md = {
  h1: "font-display text-[26px] font-semibold text-gc-text",
  h2: "font-display text-[22px] font-semibold text-gc-text",
  h3: "text-[14px] font-semibold text-gc-text",
  p: "text-body leading-[1.6] text-gc-ink2",
  li: "text-body leading-[1.6] text-gc-ink2",
}

/** Markdown without raw HTML (react-markdown's default), so notes cannot inject markup. */
export function MarkdownPreview({ text }: { text: string }) {
  return (
    <article aria-label="Note preview" className="flex flex-col gap-3 p-5">
      {text.trim() ? (
        <Markdown
          components={{
            h1: (props) => <h1 className={md.h1}>{props.children}</h1>,
            h2: (props) => <h2 className={md.h2}>{props.children}</h2>,
            h3: (props) => <h3 className={md.h3}>{props.children}</h3>,
            p: (props) => <p className={md.p}>{props.children}</p>,
            ul: (props) => (
              <ul className="flex list-disc flex-col gap-[7px] pl-5">{props.children}</ul>
            ),
            ol: (props) => (
              <ol className="flex list-decimal flex-col gap-[7px] pl-5">{props.children}</ol>
            ),
            li: (props) => <li className={md.li}>{props.children}</li>,
            a: (props) => (
              <a
                href={props.href}
                target="_blank"
                rel="noreferrer"
                className="text-gc-primary-ink underline"
              >
                {props.children}
              </a>
            ),
            pre: (props) => (
              <pre className="overflow-x-auto rounded-md border border-gc-border bg-gc-sunken p-3 font-mono text-label leading-[1.5] text-gc-ink2">
                {props.children}
              </pre>
            ),
            code: (props) => <code className="font-mono text-[0.92em]">{props.children}</code>,
            blockquote: (props) => (
              <blockquote className="border-l-2 border-gc-primary pl-[11px] font-display text-title text-gc-ink2 italic">
                {props.children}
              </blockquote>
            ),
          }}
        >
          {text}
        </Markdown>
      ) : (
        <Caption>Nothing written yet</Caption>
      )}
    </article>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return <li className="px-2 py-1 text-label text-gc-ink3">{children}</li>
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-[22px] items-center justify-center rounded-md border border-gc-border bg-gc-sunken text-gc-ink2 hover:text-gc-text disabled:opacity-50 [&_svg]:size-3"
    >
      {children}
    </button>
  )
}

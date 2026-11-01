import type { DocEditor, DocPartialBlock } from "@/artifacts/plugins/doc/blocks"

/** Inserts after the block holding the cursor, replacing it when it is an empty paragraph. */
export function insertBlock(editor: DocEditor, block: DocPartialBlock): void {
  const current = editor.getTextCursorPosition().block
  const empty =
    current.type === "paragraph" && Array.isArray(current.content) && current.content.length === 0
  const [inserted] = empty
    ? [editor.updateBlock(current, block)]
    : editor.insertBlocks([block], current, "after")
  if (inserted && inserted.content !== undefined) editor.setTextCursorPosition(inserted, "end")
  editor.focus()
}

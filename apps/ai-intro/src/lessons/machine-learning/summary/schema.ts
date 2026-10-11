import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core"

export const summarySchema = BlockNoteSchema.create({
  blockSpecs: {
    paragraph: defaultBlockSpecs.paragraph,
    heading: defaultBlockSpecs.heading,
    bulletListItem: defaultBlockSpecs.bulletListItem,
    numberedListItem: defaultBlockSpecs.numberedListItem,
    checkListItem: defaultBlockSpecs.checkListItem,
    table: defaultBlockSpecs.table,
    quote: defaultBlockSpecs.quote,
  },
})

export type SummaryBlock = typeof summarySchema.PartialBlock

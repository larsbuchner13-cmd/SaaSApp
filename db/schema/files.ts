import { index, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { idColumn, timestampColumns } from "./_shared";
import { offers } from "./offers";
import { companies } from "./tenancy";

export const attachmentOwnerTypeValues = [
  "offer",
  "customer",
  "voice_note",
] as const;
export type AttachmentOwnerType = (typeof attachmentOwnerTypeValues)[number];

export const attachments = pgTable(
  "attachments",
  {
    id: idColumn(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    ownerType: text("owner_type", {
      enum: attachmentOwnerTypeValues,
    }).notNull(),
    ownerId: uuid("owner_id").notNull(),
    blobUrl: text("blob_url").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    ...timestampColumns,
  },
  (table) => [
    index("attachments_company_id_idx").on(table.companyId),
    index("attachments_owner_idx").on(table.ownerType, table.ownerId),
  ],
);

export const voiceNotes = pgTable(
  "voice_notes",
  {
    id: idColumn(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    offerId: uuid("offer_id").references(() => offers.id),
    blobUrl: text("blob_url").notNull(),
    transcript: text("transcript"),
    durationSeconds: integer("duration_seconds"),
    ...timestampColumns,
  },
  (table) => [
    index("voice_notes_company_id_idx").on(table.companyId),
    index("voice_notes_offer_id_idx").on(table.offerId),
  ],
);

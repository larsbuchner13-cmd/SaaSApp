import {
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { idColumn, timestampColumns } from "./_shared";
import { customers } from "./customers";
import { materials } from "./materials";
import { companies } from "./tenancy";

export const offerStatusValues = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
] as const;
export type OfferStatus = (typeof offerStatusValues)[number];

export const offers = pgTable(
  "offers",
  {
    id: idColumn(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    offerNumber: text("offer_number").notNull(),
    status: text("status", { enum: offerStatusValues })
      .notNull()
      .default("draft"),
    totalNet: numeric("total_net", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    totalGross: numeric("total_gross", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    vatRate: numeric("vat_rate", { precision: 5, scale: 2 })
      .notNull()
      .default("19.00"),
    validUntil: date("valid_until"),
    notes: text("notes"),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex("offers_company_offer_number_idx").on(
      table.companyId,
      table.offerNumber,
    ),
    index("offers_company_id_idx").on(table.companyId),
    index("offers_customer_id_idx").on(table.customerId),
  ],
);

export const offerItemSourceValues = ["ai", "manual"] as const;
export type OfferItemSource = (typeof offerItemSourceValues)[number];

export const offerItems = pgTable(
  "offer_items",
  {
    id: idColumn(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    offerId: uuid("offer_id")
      .notNull()
      .references(() => offers.id, { onDelete: "cascade" }),
    materialId: uuid("material_id").references(() => materials.id),
    description: text("description").notNull(),
    quantity: numeric("quantity", { precision: 12, scale: 2 })
      .notNull()
      .default("1"),
    unit: text("unit").notNull().default("Stk"),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    position: integer("position").notNull().default(0),
    source: text("source", { enum: offerItemSourceValues })
      .notNull()
      .default("manual"),
    ...timestampColumns,
  },
  (table) => [index("offer_items_offer_id_idx").on(table.offerId)],
);

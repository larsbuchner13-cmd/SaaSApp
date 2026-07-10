import { index, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { idColumn, timestampColumns } from "./_shared";
import { companies } from "./tenancy";

export const customers = pgTable(
  "customers",
  {
    id: idColumn(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    name: text("name").notNull(),
    contactPerson: text("contact_person"),
    email: text("email"),
    phone: text("phone"),
    address: jsonb("address").$type<{
      street?: string;
      zip?: string;
      city?: string;
      country?: string;
    }>(),
    notes: text("notes"),
    ...timestampColumns,
  },
  (table) => [index("customers_company_id_idx").on(table.companyId)],
);

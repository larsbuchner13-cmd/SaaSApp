import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { idColumn, timestampColumns } from "./_shared";
import { companies } from "./tenancy";

export const settings = pgTable(
  "settings",
  {
    id: idColumn(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    key: text("key").notNull(),
    value: jsonb("value").$type<unknown>(),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex("settings_company_key_idx").on(table.companyId, table.key),
  ],
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: idColumn(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    name: text("name"),
    hashedKey: text("hashed_key").notNull(),
    scopes: jsonb("scopes").$type<string[]>(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    ...timestampColumns,
  },
  (table) => [uniqueIndex("api_keys_hashed_key_idx").on(table.hashedKey)],
);

export const webhooks = pgTable("webhooks", {
  id: idColumn(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  url: text("url").notNull(),
  secret: text("secret").notNull(),
  events: jsonb("events").$type<string[]>().notNull(),
  isActive: boolean("is_active").notNull().default(true),
  ...timestampColumns,
});

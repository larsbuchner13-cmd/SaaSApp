import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { idColumn } from "./_shared";
import { companies, users } from "./tenancy";

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: idColumn(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    actorId: uuid("actor_id").references(() => users.id),
    action: text("action").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("activity_logs_company_id_idx").on(table.companyId),
    index("activity_logs_entity_idx").on(table.entityType, table.entityId),
  ],
);

/**
 * Rechtssichere Audit-Trail. Bewusst ohne `deletedAt` — Audit-Logs werden
 * nie geloescht, nur retention-basiert archiviert (spaeteres Modul).
 */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: idColumn(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    actorId: uuid("actor_id").references(() => users.id),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_logs_company_id_idx").on(table.companyId),
    index("audit_logs_company_created_idx").on(
      table.companyId,
      table.createdAt,
    ),
  ],
);

import {
  boolean,
  pgTable,
  primaryKey,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { idColumn, timestampColumns } from "./_shared";

/**
 * Systemrollen. Bewusst als globale Referenzdaten modelliert (nicht pro
 * Tenant anpassbar) — deckt den Scope aus ARCHITECTURE.md ab: Owner,
 * Administrator, Buero, Mitarbeiter, Steuerberater.
 */
export const roleKeyValues = [
  "owner",
  "administrator",
  "buero",
  "mitarbeiter",
  "steuerberater",
] as const;
export type RoleKey = (typeof roleKeyValues)[number];

export const roles = pgTable(
  "roles",
  {
    id: idColumn(),
    key: text("key", { enum: roleKeyValues }).notNull(),
    label: text("label").notNull(),
    isSystem: boolean("is_system").notNull().default(true),
    ...timestampColumns,
  },
  (table) => [uniqueIndex("roles_key_idx").on(table.key)],
);

export const permissions = pgTable(
  "permissions",
  {
    id: idColumn(),
    key: text("key").notNull(),
    description: text("description"),
    ...timestampColumns,
  },
  (table) => [uniqueIndex("permissions_key_idx").on(table.key)],
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })],
);

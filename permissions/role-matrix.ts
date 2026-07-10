import type { RoleKey } from "@/db/schema";

import { permissionKeyValues, type PermissionKey } from "./keys";

const allPermissions: PermissionKey[] = [...permissionKeyValues];

/**
 * Default-Berechtigungen je Systemrolle. Quelle der Wahrheit für den
 * Seed-Vorgang (db/seed.ts) — Aenderungen hier erfordern ein Re-Seed.
 */
export const rolePermissionMatrix: Record<RoleKey, PermissionKey[]> = {
  owner: allPermissions,
  administrator: allPermissions.filter((key) => key !== "users:manage"),
  buero: [
    "offers:create",
    "offers:read",
    "offers:update",
    "offers:delete",
    "offers:send",
    "customers:create",
    "customers:read",
    "customers:update",
    "customers:delete",
    "materials:manage",
    "pricing:manage",
  ],
  mitarbeiter: [
    "offers:create",
    "offers:read",
    "offers:update",
    "customers:read",
  ],
  steuerberater: [
    "offers:read",
    "customers:read",
    "billing:read",
    "audit:read",
  ],
};

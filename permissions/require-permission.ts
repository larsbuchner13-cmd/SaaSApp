import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { memberships, permissions, rolePermissions } from "@/db/schema";

import type { PermissionKey } from "./keys";

export class PermissionDeniedError extends Error {
  constructor(public readonly permission: PermissionKey) {
    super(`Fehlende Berechtigung: ${permission}`);
    this.name = "PermissionDeniedError";
  }
}

/**
 * Zentraler serverseitiger RBAC-Guard. Wird von Server Actions/Route
 * Handlers aufgerufen, niemals nur im Frontend geprueft. `companyId` und
 * `userId` stammen aus dem serverseitig verifizierten Tenant-Context
 * (server/tenant-context.ts, folgt sobald Clerk verdrahtet ist) — niemals
 * aus Client-Payloads.
 */
export async function requirePermission(params: {
  companyId: string;
  userId: string;
  permission: PermissionKey;
}): Promise<void> {
  if (!(await hasPermission(params))) {
    throw new PermissionDeniedError(params.permission);
  }
}

/**
 * Boolesche Variante von requirePermission fuer bedingtes UI-Rendering
 * (z. B. einen Button ausblenden statt ihn anzuzeigen und erst beim Klick
 * scheitern zu lassen). Ersetzt requirePermission nicht — mutierende
 * Server Actions pruefen weiterhin ueber requirePermission serverseitig,
 * dies ist nur fuer Darstellungsentscheidungen gedacht.
 */
export async function hasPermission(params: {
  companyId: string;
  userId: string;
  permission: PermissionKey;
}): Promise<boolean> {
  const { companyId, userId, permission } = params;

  const rows = await db
    .select({ key: permissions.key })
    .from(memberships)
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, memberships.roleId))
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(
      and(
        eq(memberships.companyId, companyId),
        eq(memberships.userId, userId),
        eq(memberships.status, "active"),
        eq(permissions.key, permission),
      ),
    )
    .limit(1);

  return rows.length > 0;
}

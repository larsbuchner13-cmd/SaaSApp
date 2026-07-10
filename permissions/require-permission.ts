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

  if (rows.length === 0) {
    throw new PermissionDeniedError(permission);
  }
}

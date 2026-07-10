import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { memberships, roles } from "@/db/schema";
import type { RoleKey } from "@/db/schema";

export async function getMembership(tenantId: string, userId: string) {
  return db.query.memberships.findFirst({
    where: and(
      eq(memberships.companyId, tenantId),
      eq(memberships.userId, userId),
    ),
    with: { role: true },
  });
}

export async function listMemberships(tenantId: string) {
  return db.query.memberships.findMany({
    where: eq(memberships.companyId, tenantId),
    with: { role: true, user: true },
  });
}

export async function createMembership(
  tenantId: string,
  data: { userId?: string; roleKey: RoleKey; invitedEmail?: string },
) {
  const role = await db.query.roles.findFirst({
    where: eq(roles.key, data.roleKey),
  });
  if (!role) {
    throw new Error(`Unbekannte Rolle: ${data.roleKey}`);
  }

  const [membership] = await db
    .insert(memberships)
    .values({
      companyId: tenantId,
      userId: data.userId,
      roleId: role.id,
      invitedEmail: data.invitedEmail,
      status: data.userId ? "active" : "invited",
    })
    .returning();
  return membership;
}

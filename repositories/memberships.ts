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

/**
 * Idempotenter Sync aus Clerk (Organization Membership). Wird sowohl vom
 * Clerk-Webhook als auch von `getTenantContext()` als
 * Just-in-time-Fallback aufgerufen — siehe upsertCompanyFromClerkOrg fuer
 * die Begruendung. Aktualisiert bewusst NICHT die Rolle bei jedem Sync,
 * damit eine in unseren Einstellungen manuell angepasste Rolle nicht durch
 * Clerks Org-Rolle (nur admin/member) ueberschrieben wird — nur beim
 * allerersten Anlegen wird sie aus Clerk uebernommen.
 */
export async function upsertMembershipFromClerk(
  tenantId: string,
  data: { userId: string; roleKey: RoleKey },
) {
  const existing = await getMembership(tenantId, data.userId);
  if (existing) return existing;

  const role = await db.query.roles.findFirst({
    where: eq(roles.key, data.roleKey),
  });
  if (!role) {
    throw new Error(`Unbekannte Rolle: ${data.roleKey}`);
  }

  await db
    .insert(memberships)
    .values({
      companyId: tenantId,
      userId: data.userId,
      roleId: role.id,
      status: "active",
    })
    .onConflictDoNothing({
      target: [memberships.companyId, memberships.userId],
    });

  const membership = await getMembership(tenantId, data.userId);
  if (!membership) {
    throw new Error("Mitgliedschaft konnte nicht angelegt werden.");
  }
  return membership;
}

/**
 * Entfernt eine Mitgliedschaft, wenn Clerk ein
 * `organizationMembership.deleted`-Event meldet. Bewusst ein Soft-Disable
 * (Status statt Hard-Delete), damit z. B. Audit-Log-Eintraege des
 * ehemaligen Mitglieds ihren `actorId` behalten.
 */
export async function disableMembership(tenantId: string, userId: string) {
  await db
    .update(memberships)
    .set({ status: "disabled" })
    .where(
      and(eq(memberships.companyId, tenantId), eq(memberships.userId, userId)),
    );
}

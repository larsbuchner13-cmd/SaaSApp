import "server-only";

import { clerkClient } from "@clerk/nextjs/server";

import type { RoleKey } from "@/db/schema";
import { upsertCompanyFromClerkOrg } from "@/repositories/companies";
import { upsertMembershipFromClerk } from "@/repositories/memberships";
import { upsertUserFromClerk } from "@/repositories/users";

/**
 * Clerk-Organisationsrollen sind standardmaessig nur `org:admin`/`org:member`
 * (siehe Clerk-Dashboard, Organizations-Rollen) — feinere Abstufungen
 * (Administrator, Buero, Steuerberater) gibt es dort nicht. Der
 * Org-Ersteller wird deshalb als "owner" gemappt, alle uebrigen Mitglieder
 * default auf "mitarbeiter"; die genauere Rolle wird danach in unseren
 * eigenen Einstellungen vergeben (nicht in Clerk).
 */
export function mapClerkOrgRoleToRoleKey(
  orgRole: string | null | undefined,
): RoleKey {
  return orgRole?.includes("admin") ? "owner" : "mitarbeiter";
}

export async function syncCompanyFromClerkOrg(clerkOrgId: string) {
  const client = await clerkClient();
  const org = await client.organizations.getOrganization({
    organizationId: clerkOrgId,
  });

  return upsertCompanyFromClerkOrg({
    clerkOrgId: org.id,
    name: org.name,
    slug: org.slug || org.id,
  });
}

export async function syncUserFromClerk(clerkUserId: string) {
  const client = await clerkClient();
  const user = await client.users.getUser(clerkUserId);

  const primaryEmail =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ?? user.emailAddresses[0]?.emailAddress;
  if (!primaryEmail) {
    throw new Error(`Clerk-User ${clerkUserId} hat keine E-Mail-Adresse.`);
  }

  return upsertUserFromClerk({
    clerkUserId: user.id,
    email: primaryEmail,
    name:
      [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined,
    avatarUrl: user.imageUrl,
  });
}

export async function syncMembershipFromClerk(
  companyId: string,
  userId: string,
  roleKey: RoleKey,
) {
  return upsertMembershipFromClerk(companyId, { userId, roleKey });
}

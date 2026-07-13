import "server-only";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import {
  mapClerkOrgRoleToRoleKey,
  syncCompanyFromClerkOrg,
  syncMembershipFromClerk,
  syncUserFromClerk,
} from "@/auth/sync-clerk";
import { getCompanyByClerkOrgId } from "@/repositories/companies";
import { getMembership } from "@/repositories/memberships";
import { ensureSubscription } from "@/repositories/subscriptions";
import { getUserByClerkUserId } from "@/repositories/users";

export type TenantContext = {
  companyId: string;
  userId: string;
};

/**
 * Company = Clerk Organization, User = Clerk User (siehe ARCHITECTURE.md
 * Abschnitt 5). `middleware.ts` stellt sicher, dass jede Dashboard-Route
 * nur mit aktiver Session UND aktiver Organisation erreichbar ist — die
 * Faelle unten sind daher nur ein Sicherheitsnetz, kein Normalfall.
 *
 * Company/User/Membership werden Just-in-time aus Clerk synchronisiert
 * (nur beim allerersten Zugriff, danach reine DB-Lookups) statt bei jedem
 * Request Clerks Backend-API zu befragen — der `clerk`-Webhook
 * (webhooks/clerk-handler.ts) haelt Aenderungen (Umbenennung, neue
 * Mitglieder, Rollenwechsel) danach aktuell.
 */
export async function getTenantContext(): Promise<TenantContext> {
  const { userId: clerkUserId, orgId: clerkOrgId, orgRole } = await auth();

  if (!clerkUserId || !clerkOrgId) {
    redirect("/sign-in");
  }

  let company = await getCompanyByClerkOrgId(clerkOrgId);
  if (!company) {
    company = await syncCompanyFromClerkOrg(clerkOrgId);
    await ensureSubscription(company.id);
  }

  let user = await getUserByClerkUserId(clerkUserId);
  if (!user) {
    user = await syncUserFromClerk(clerkUserId);
  }

  const membership = await getMembership(company.id, user.id);
  if (!membership) {
    await syncMembershipFromClerk(
      company.id,
      user.id,
      mapClerkOrgRoleToRoleKey(orgRole),
    );
  }

  return { companyId: company.id, userId: user.id };
}

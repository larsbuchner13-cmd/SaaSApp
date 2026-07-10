import "server-only";

import {
  getCompanyByClerkOrgId,
  createCompany,
} from "@/repositories/companies";
import { createMembership, getMembership } from "@/repositories/memberships";
import { createUser, getUserByClerkUserId } from "@/repositories/users";

export type TenantContext = {
  companyId: string;
  userId: string;
};

const PLACEHOLDER_CLERK_ORG_ID = "placeholder-demo-org";
const PLACEHOLDER_CLERK_USER_ID = "placeholder-demo-user";

/**
 * TEMPORAERER Platzhalter, solange Clerk noch nicht angebunden ist (siehe
 * ARCHITECTURE.md Meilenstein 2). Bootstrapt einen einzelnen Demo-Tenant
 * mit Owner-Mitgliedschaft, damit Features gebaut und gezeigt werden
 * koennen, bevor Login existiert.
 *
 * Das ist der EINZIGE Ort, der ausgetauscht wird, sobald Clerk-Keys
 * vorliegen: companyId/userId kommen dann aus der verifizierten
 * Clerk-Session statt aus den Platzhalter-Konstanten. Aufrufer kennen nur
 * diese Funktion und muessen dafuer nicht angepasst werden.
 */
export async function getTenantContext(): Promise<TenantContext> {
  let company = await getCompanyByClerkOrgId(PLACEHOLDER_CLERK_ORG_ID);
  if (!company) {
    company = await createCompany({
      name: "Demo-Betrieb",
      slug: "demo-betrieb",
      clerkOrgId: PLACEHOLDER_CLERK_ORG_ID,
    });
  }

  let user = await getUserByClerkUserId(PLACEHOLDER_CLERK_USER_ID);
  if (!user) {
    user = await createUser({
      clerkUserId: PLACEHOLDER_CLERK_USER_ID,
      email: "demo@example.com",
      name: "Demo Owner",
    });
  }

  const membership = await getMembership(company.id, user.id);
  if (!membership) {
    await createMembership(company.id, { userId: user.id, roleKey: "owner" });
  }

  return { companyId: company.id, userId: user.id };
}

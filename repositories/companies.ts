import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { companies } from "@/db/schema";

export async function getCompanyById(companyId: string) {
  return db.query.companies.findFirst({
    where: eq(companies.id, companyId),
  });
}

export async function getCompanyByClerkOrgId(clerkOrgId: string) {
  return db.query.companies.findFirst({
    where: eq(companies.clerkOrgId, clerkOrgId),
  });
}

export async function createCompany(data: {
  name: string;
  slug: string;
  clerkOrgId?: string;
}) {
  const [company] = await db.insert(companies).values(data).returning();
  return company;
}

/**
 * Idempotenter Sync aus Clerk (Organization = Company, siehe
 * ARCHITECTURE.md Abschnitt 5). Wird sowohl vom Clerk-Webhook als auch von
 * `getTenantContext()` als Just-in-time-Fallback aufgerufen — beide duerfen
 * gefahrlos gleichzeitig laufen (kein Duplikat/Crash bei Race Condition).
 */
export async function upsertCompanyFromClerkOrg(data: {
  clerkOrgId: string;
  name: string;
  slug: string;
}) {
  const [company] = await db
    .insert(companies)
    .values(data)
    .onConflictDoUpdate({
      target: companies.clerkOrgId,
      set: { name: data.name, slug: data.slug },
    })
    .returning();
  return company;
}

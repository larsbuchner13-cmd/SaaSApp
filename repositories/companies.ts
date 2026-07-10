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

import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { pricingRules } from "@/db/schema";

export async function listActivePricingRules(tenantId: string) {
  return db.query.pricingRules.findMany({
    where: and(
      eq(pricingRules.companyId, tenantId),
      eq(pricingRules.isActive, true),
    ),
  });
}

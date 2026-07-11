import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/db/client";
import { pricingRules } from "@/db/schema";
import type { PricingRuleType, PricingRuleValueType } from "@/db/schema";

export async function listActivePricingRules(tenantId: string) {
  return db.query.pricingRules.findMany({
    where: and(
      eq(pricingRules.companyId, tenantId),
      eq(pricingRules.isActive, true),
      isNull(pricingRules.deletedAt),
    ),
  });
}

export async function listPricingRules(tenantId: string) {
  return db.query.pricingRules.findMany({
    where: and(
      eq(pricingRules.companyId, tenantId),
      isNull(pricingRules.deletedAt),
    ),
    orderBy: desc(pricingRules.createdAt),
  });
}

export async function createPricingRule(
  tenantId: string,
  data: {
    type: PricingRuleType;
    label: string;
    value: string;
    valueType: PricingRuleValueType;
  },
) {
  const [rule] = await db
    .insert(pricingRules)
    .values({ companyId: tenantId, ...data })
    .returning();
  return rule;
}

export async function softDeletePricingRule(tenantId: string, ruleId: string) {
  await db
    .update(pricingRules)
    .set({ deletedAt: new Date() })
    .where(
      and(eq(pricingRules.companyId, tenantId), eq(pricingRules.id, ruleId)),
    );
}

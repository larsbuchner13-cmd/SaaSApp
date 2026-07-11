import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { usageMetrics } from "@/db/schema";
import type { UsageMetricKey } from "@/db/schema";

function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Erhoeht einen monatlichen Nutzungszaehler (offers_created, ai_requests,
 * uploads, storage_bytes). Bewusst fehlertolerant wie recordAuditLog —
 * ein ungenauer Zaehler ist unkritisch, eine deswegen fehlschlagende
 * Nutzeraktion waere es nicht.
 */
export async function incrementUsageMetric(
  tenantId: string,
  metricKey: UsageMetricKey,
  amount = 1,
): Promise<void> {
  try {
    const period = currentPeriod();
    await db
      .insert(usageMetrics)
      .values({ companyId: tenantId, metricKey, period, value: amount })
      .onConflictDoUpdate({
        target: [
          usageMetrics.companyId,
          usageMetrics.metricKey,
          usageMetrics.period,
        ],
        set: { value: sql`${usageMetrics.value} + ${amount}` },
      });
  } catch (error) {
    console.error("incrementUsageMetric failed:", error);
  }
}

export async function getUsageMetric(
  tenantId: string,
  metricKey: UsageMetricKey,
  period: string = currentPeriod(),
): Promise<number> {
  const row = await db.query.usageMetrics.findFirst({
    where: and(
      eq(usageMetrics.companyId, tenantId),
      eq(usageMetrics.metricKey, metricKey),
      eq(usageMetrics.period, period),
    ),
  });
  return row?.value ?? 0;
}

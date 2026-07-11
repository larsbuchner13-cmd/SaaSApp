import { sql } from "drizzle-orm";

import { db } from "@/db/client";
import { rateLimitCounters } from "@/db/schema";

/**
 * Erhoeht den Fixed-Window-Zaehler fuer (tenantId, action, windowStart) und
 * gibt den neuen Zaehlerstand zurueck. Atomar via `onConflictDoUpdate`, damit
 * parallele Requests sich nicht gegenseitig ueberschreiben.
 */
export async function incrementRateLimitCounter(
  tenantId: string,
  action: string,
  windowStart: Date,
): Promise<number> {
  const [row] = await db
    .insert(rateLimitCounters)
    .values({ companyId: tenantId, action, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [
        rateLimitCounters.companyId,
        rateLimitCounters.action,
        rateLimitCounters.windowStart,
      ],
      set: { count: sql`${rateLimitCounters.count} + 1` },
    })
    .returning({ count: rateLimitCounters.count });

  return row.count;
}

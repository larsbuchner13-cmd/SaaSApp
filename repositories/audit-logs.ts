import { desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { auditLogs } from "@/db/schema";

export async function createAuditLog(data: {
  companyId: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(auditLogs).values(data);
}

export async function listAuditLogs(tenantId: string, limit = 50) {
  return db.query.auditLogs.findMany({
    where: eq(auditLogs.companyId, tenantId),
    orderBy: desc(auditLogs.createdAt),
    limit,
    with: { actor: true },
  });
}

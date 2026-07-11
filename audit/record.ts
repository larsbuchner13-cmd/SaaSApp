import "server-only";

import { logError } from "@/lib/log-error";
import { createAuditLog } from "@/repositories/audit-logs";

/**
 * Schreibt einen Audit-Log-Eintrag. Bewusst fehlertolerant: ein
 * Audit-Logging-Fehler darf niemals eine ansonsten erfolgreiche
 * Nutzeraktion scheitern lassen. Fehler werden geloggt, nicht geworfen.
 */
export async function recordAuditLog(params: {
  companyId: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await createAuditLog(params);
  } catch (error) {
    logError("recordAuditLog failed:", error);
  }
}

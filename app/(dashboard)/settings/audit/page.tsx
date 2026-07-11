import { AuditLogList } from "@/features/audit/components/audit-log-list";
import {
  PermissionDeniedError,
  requirePermission,
} from "@/permissions/require-permission";
import { listAuditLogs } from "@/repositories/audit-logs";
import { getTenantContext } from "@/server/tenant-context";

export const dynamic = "force-dynamic";

export default async function AuditLogPage() {
  const { companyId, userId } = await getTenantContext();

  try {
    await requirePermission({ companyId, userId, permission: "audit:read" });
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return (
        <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8">
          <h1 className="text-2xl font-semibold tracking-tight">Audit-Log</h1>
          <p className="text-muted-foreground text-sm">
            Du hast keine Berechtigung, das Audit-Log einzusehen.
          </p>
        </main>
      );
    }
    throw error;
  }

  const entries = await listAuditLogs(companyId);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Audit-Log</h1>
      <AuditLogList entries={entries} />
    </main>
  );
}

import { PlanCard } from "@/features/billing/components/plan-card";
import { PortalButton } from "@/features/billing/components/portal-button";
import {
  formatPlanLimit,
  planLabels,
  planLimits,
  planValues,
} from "@/config/plans";
import {
  PermissionDeniedError,
  hasPermission,
  requirePermission,
} from "@/permissions/require-permission";
import { getSubscriptionByCompanyId } from "@/repositories/subscriptions";
import { getUsageMetric } from "@/repositories/usage-metrics";
import { getTenantContext } from "@/server/tenant-context";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SubscriptionStatus } from "@/db/schema";

export const dynamic = "force-dynamic";

const statusLabels: Record<SubscriptionStatus, string> = {
  trialing: "Testphase",
  active: "Aktiv",
  past_due: "Zahlung überfällig",
  canceled: "Gekündigt",
  incomplete: "Unvollständig",
};

export default async function BillingPage() {
  const { companyId, userId } = await getTenantContext();

  try {
    await requirePermission({ companyId, userId, permission: "billing:read" });
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return (
        <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8">
          <h1 className="text-2xl font-semibold tracking-tight">Abrechnung</h1>
          <p className="text-muted-foreground text-sm">
            Du hast keine Berechtigung, die Abrechnung einzusehen.
          </p>
        </main>
      );
    }
    throw error;
  }

  const [subscription, canManage, offersUsed, aiRequestsUsed] =
    await Promise.all([
      getSubscriptionByCompanyId(companyId),
      hasPermission({ companyId, userId, permission: "billing:manage" }),
      getUsageMetric(companyId, "offers_created"),
      getUsageMetric(companyId, "ai_requests"),
    ]);

  const plan = subscription?.plan ?? "starter";
  const limits = planLimits[plan];

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Abrechnung</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Aktueller Tarif: {planLabels[plan]}</CardTitle>
            {subscription && (
              <Badge
                variant={
                  subscription.status === "active" ? "default" : "secondary"
                }
              >
                {statusLabels[subscription.status]}
              </Badge>
            )}
          </div>
          <CardDescription>
            {limits.priceEuroPerMonth} € / Monat
            {subscription?.currentPeriodEnd &&
              ` · nächste Abrechnung am ${subscription.currentPeriodEnd.toLocaleDateString("de-DE")}`}
            {subscription?.cancelAtPeriodEnd &&
              " · wird zum Periodenende gekündigt"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="text-muted-foreground flex flex-col gap-1 text-sm">
            <li>
              Angebote diesen Monat: {offersUsed} /{" "}
              {formatPlanLimit(limits.offersPerMonth)}
            </li>
            <li>
              KI-Anfragen diesen Monat: {aiRequestsUsed} /{" "}
              {formatPlanLimit(limits.aiRequestsPerMonth)}
            </li>
            <li>bis zu {formatPlanLimit(limits.employees)} Mitarbeiter</li>
          </ul>
          {canManage && subscription?.stripeCustomerId && <PortalButton />}
        </CardContent>
      </Card>

      {canManage && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-medium tracking-tight">Tarif wechseln</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {planValues.map((value) => (
              <PlanCard
                key={value}
                plan={value}
                label={planLabels[value]}
                limits={planLimits[value]}
                isCurrent={value === plan}
                canManage={canManage}
              />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

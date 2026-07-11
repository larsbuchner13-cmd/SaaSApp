import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPlanLimit, type Plan, type PlanLimits } from "@/config/plans";

import { CheckoutButton } from "./checkout-button";

export function PlanCard({
  plan,
  label,
  limits,
  isCurrent,
  canManage,
}: {
  plan: Plan;
  label: string;
  limits: PlanLimits;
  isCurrent: boolean;
  canManage: boolean;
}) {
  return (
    <Card className={isCurrent ? "border-primary" : undefined}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{label}</CardTitle>
          {isCurrent && <Badge>Aktuell</Badge>}
        </div>
        <CardDescription>{limits.priceEuroPerMonth} € / Monat</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ul className="text-muted-foreground flex flex-col gap-1 text-sm">
          <li>{formatPlanLimit(limits.offersPerMonth)} Angebote/Monat</li>
          <li>
            {formatPlanLimit(limits.aiRequestsPerMonth)} KI-Anfragen/Monat
          </li>
          <li>bis zu {formatPlanLimit(limits.employees)} Mitarbeiter</li>
        </ul>
        {!isCurrent && canManage && (
          <CheckoutButton plan={plan} label="Auswählen" />
        )}
      </CardContent>
    </Card>
  );
}
